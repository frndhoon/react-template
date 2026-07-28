import { PostgrestError, StorageApiError, isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';

import * as commonTypes from '@/types/common.types';
import * as supabaseErrorTypes from '@/types/supabase-error.types';
import { AppError, isAppError } from '@/utils/app-error';
import { Logger } from '@/utils/logger';

/**
 * supabase-js 는 throw 하지 않고 `{ data, error }` 를 반환하기 때문에 인터셉터를 걸 자리가 없다.
 * 대신 서비스 함수가 응답을 `getDataOrThrow` / `getDataOrNull` / `throwOnError` 에 통과시키면
 * 그 지점에서 SDK 에러가 AppError 로 변환되고 로그가 한 번 남는다.
 *
 * 변환의 원칙: 버리지 않는다.
 * 서버가 보낸 status / statusText / 응답 바디는 `response` 에 원문 그대로 실어 보내고,
 * 그 위에 UI 가 분기할 코드(AppErrorCode)와 사용자용 문구만 얹는다.
 * 그래서 콘솔에 찍힌 AppError 와 Network 탭 Response 를 필드 단위로 대조할 수 있다.
 */

/**
 * PostgREST / Postgres 에러코드 → AppErrorCode.
 *
 * 여기 없는 코드는 응답의 HTTP status 로 넘어가서 분류된다(`getCodeFromStatus`).
 * PostgREST 가 코드마다 status 를 정해두고 있으므로, 매핑을 빠뜨려도 'unknown' 으로 뭉개지지 않는다.
 */
const POSTGREST_CODE_MAP: Record<string, commonTypes.AppErrorCode> = {
	/* PostgREST */
	PGRST116: 'not_found', // .single() 인데 행이 0개
	PGRST301: 'unauthorized', // JWT 만료/무효
	/* 스키마 불일치 — 마이그레이션 누락이거나 database.types.ts 가 낡음 */
	PGRST200: 'schema_mismatch', // 관계(embed)를 찾을 수 없음
	PGRST202: 'schema_mismatch', // RPC 함수가 스키마 캐시에 없음
	PGRST204: 'schema_mismatch', // 컬럼이 스키마 캐시에 없음
	'42703': 'schema_mismatch', // undefined_column
	'42P01': 'schema_mismatch', // undefined_table
	'42883': 'schema_mismatch', // undefined_function
	/* PostgreSQL SQLSTATE */
	'23505': 'conflict', // unique_violation
	'23503': 'conflict', // foreign_key_violation
	'23502': 'validation', // not_null_violation
	'23514': 'validation', // check_violation
	'22P02': 'validation', // invalid_text_representation
	'42501': 'forbidden', // insufficient_privilege (RLS 정책에 막힘)
	'40001': 'conflict', // serialization_failure
};

/**
 * auth-js 에러코드 → AppErrorCode.
 * status 만으로는 구분이 안 되는 것들을 여기서 처리한다
 * (잘못된 비밀번호도, 세션 만료도 status 는 400/401 로 섞여 온다).
 */
const AUTH_CODE_MAP: Record<string, commonTypes.AppErrorCode> = {
	invalid_credentials: 'unauthorized',
	email_not_confirmed: 'unauthorized',
	session_not_found: 'unauthorized',
	session_expired: 'unauthorized',
	refresh_token_not_found: 'unauthorized',
	refresh_token_already_used: 'unauthorized',
	bad_jwt: 'unauthorized',
	no_authorization: 'unauthorized',
	user_not_found: 'not_found',
	user_already_exists: 'conflict',
	email_exists: 'conflict',
	phone_exists: 'conflict',
	weak_password: 'validation',
	validation_failed: 'validation',
	over_request_rate_limit: 'rate_limited',
	over_email_send_rate_limit: 'rate_limited',
	over_sms_send_rate_limit: 'rate_limited',
};

const getCodeFromStatus = (status: number | undefined): commonTypes.AppErrorCode => {
	if (status === undefined) return 'unknown';
	if (status === 401) return 'unauthorized';
	if (status === 403) return 'forbidden';
	if (status === 404) return 'not_found';
	if (status === 409) return 'conflict';
	if (status === 422 || status === 400) return 'validation';
	if (status === 429) return 'rate_limited';
	return 'unknown';
};

/** 사용자에게 보여줄 기본 문구. 서버 원문은 UI 에 노출하지 않고 response 로만 남긴다 */
const DEFAULT_ERROR_MESSAGE: Record<commonTypes.AppErrorCode, string> = {
	unauthorized: '로그인이 필요합니다.',
	forbidden: '권한이 없습니다.',
	not_found: '요청한 데이터를 찾을 수 없습니다.',
	conflict: '이미 존재하거나 변경된 데이터입니다.',
	validation: '입력값을 다시 확인해주세요.',
	network: '네트워크 연결을 확인해주세요.',
	rate_limited: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
	// 사용자 잘못이 아니라 배포 사고다. 원인은 UI 가 아니라 로그에서 확인한다
	schema_mismatch: '일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
	unknown: '알 수 없는 에러가 발생했습니다.',
};

const isNetworkFailure = (error: unknown): boolean => error instanceof TypeError && /fetch|network/i.test(error.message);

/** supabase 응답 봉투. postgrest 응답에는 status 가 붙어 있고 auth 응답에는 없다 */
type ResponseEnvelope = { status?: number; statusText?: string };

const getEnvelope = (response: unknown): ResponseEnvelope => {
	if (typeof response !== 'object' || response === null) return {};

	const { status, statusText } = response as { status?: unknown; statusText?: unknown };

	return {
		status: typeof status === 'number' ? status : undefined,
		statusText: typeof statusText === 'string' ? statusText : undefined,
	};
};

/**
 * 어떤 형태의 에러든 AppError 로 변환한다. 로그는 남기지 않는다 —
 * "행이 없음"처럼 에러가 아닌 것으로 처리할지는 호출부가 정하기 때문 (→ getDataOrNull).
 *
 * @param envelope 응답 봉투. PostgrestError 자체에는 HTTP status 가 없어서 여기로 받아야 한다.
 */
export const toAppError = (error: unknown, envelope: ResponseEnvelope = {}): AppError => {
	if (isAppError(error)) return error;

	if (error instanceof PostgrestError) {
		// PostgrestError 에는 status 가 없다 — 봉투(PostgrestResponseFailure)에서 온다
		const code = POSTGREST_CODE_MAP[error.code] ?? getCodeFromStatus(envelope.status);
		const body: supabaseErrorTypes.PostgrestErrorBody = {
			code: error.code,
			message: error.message,
			details: error.details,
			hint: error.hint,
		};

		return new AppError({
			code,
			message: DEFAULT_ERROR_MESSAGE[code],
			response: { service: 'postgrest', status: envelope.status, statusText: envelope.statusText, body },
			cause: error,
		});
	}

	if (isAuthRetryableFetchError(error)) {
		return new AppError({
			code: 'network',
			message: DEFAULT_ERROR_MESSAGE.network,
			response: { service: 'network', status: error.status, body: { message: error.message } },
			cause: error,
		});
	}

	if (isAuthError(error)) {
		// AuthSessionMissingError 는 code 없이 status 400 으로만 와서 name 으로 잡아야 한다
		const code = error.name === 'AuthSessionMissingError' ? 'unauthorized' : (AUTH_CODE_MAP[error.code ?? ''] ?? getCodeFromStatus(error.status));
		const body: supabaseErrorTypes.AuthErrorBody = {
			code: error.code,
			message: error.message,
			status: error.status,
		};

		return new AppError({
			code,
			message: error.code === 'invalid_credentials' ? '이메일 또는 비밀번호가 올바르지 않습니다.' : DEFAULT_ERROR_MESSAGE[code],
			response: { service: 'auth', status: error.status, body },
			cause: error,
		});
	}

	// supabase-js 가 공개하는 스토리지 에러는 StorageApiError 뿐이다 (상위 StorageError 는 export 안 됨)
	if (error instanceof StorageApiError) {
		const code = getCodeFromStatus(error.status);
		const body: supabaseErrorTypes.StorageErrorBody = {
			statusCode: error.statusCode,
			message: error.message,
			status: error.status,
		};

		return new AppError({
			code,
			message: DEFAULT_ERROR_MESSAGE[code],
			response: { service: 'storage', status: error.status, body },
			cause: error,
		});
	}

	if (isNetworkFailure(error)) {
		return new AppError({
			code: 'network',
			message: DEFAULT_ERROR_MESSAGE.network,
			response: { service: 'network', body: { message: (error as Error).message } },
			cause: error,
		});
	}

	return new AppError({
		code: 'unknown',
		message: DEFAULT_ERROR_MESSAGE.unknown,
		cause: error,
	});
};

/**
 * @param context 어디서 난 에러인지 — `'post.getPostList'` 처럼 서비스 함수명을 넘긴다.
 *
 * response 와 cause 를 문자열로 이어붙이지 않고 객체 그대로 넘긴다.
 * 이어붙이면 devtools 에서 펼쳐볼 수 없고, PostgREST 가 hint 에 넣어준 실제 해결책
 * (42501 이면 실행할 GRANT 문이 그대로 들어온다)도 눈에 안 들어온다.
 */
export const logAppError = (appError: AppError, context: string): AppError => {
	Logger.error(context, `[${appError.code}] ${appError.response?.status ?? '-'} ${appError.response?.statusText ?? ''}`.trim(), {
		response: appError.response,
		cause: appError.cause,
	});

	return appError;
};

type SupabaseResponse = { data: unknown; error: unknown };

/** 응답 유니온에서 성공 쪽(error 가 null 인 멤버)만 골라낸다 */
type SuccessMember<R> = Extract<R, { error: null }>;

/**
 * `{ data, error }` 유니온에서 "에러가 아닐 때의 data" 타입만 뽑는다.
 *
 * supabase-js 의 반환값은 판별 유니온이라 `{ data: T; error: E | null }` 형태로 받으면
 * T 가 성공/실패 양쪽의 합집합이 되어 전부 nullable 로 넓어진다.
 * 그래서 error 로 판별해 성공 멤버의 data 만 남긴다.
 *
 * 판별 유니온이 아닌 형태(`{ data: T | null; error: E | null }`)면 두 번째 갈래로 떨어져 NonNullable<T> 가 된다.
 */
type SuccessData<R> = [SuccessMember<R>] extends [never]
	? NonNullable<R extends { data: infer D } ? D : never>
	: SuccessMember<R> extends { data: infer D }
		? D
		: never;

/**
 * 응답에서 data 를 꺼내고, error 가 있으면 로그를 남긴 뒤 AppError 를 던진다.
 *
 * 응답을 구조분해해서 받지 않고 통째로 받는 이유: status / statusText 가 봉투에 붙어 있어서,
 * `{ data, error }` 만 꺼내면 Network 탭에 보이는 HTTP status 를 잃는다.
 *
 * @example
 * const { session } = getDataOrThrow(await supabase.auth.getSession(), 'auth.getSession');
 * const posts = getDataOrThrow(await supabase.from('posts').select(), 'post.getPostList');
 */
export const getDataOrThrow = <R extends SupabaseResponse>(response: R, context: string): SuccessData<R> => {
	const { data, error } = response;
	if (error) throw logAppError(toAppError(error, getEnvelope(response)), context);

	return data as SuccessData<R>;
};

/**
 * getDataOrThrow 와 같지만, "행이 없음(not_found)"만 에러가 아니라 null 로 돌려준다.
 * 없을 수도 있는 걸 조회할 때 쓴다. 없는 건 정상 흐름이므로 이 경우 로그도 남기지 않는다.
 *
 * @example
 * const profile = getDataOrNull(await supabase.from('profiles').select().eq('id', id).single(), 'profile.getProfileById');
 */
export const getDataOrNull = <R extends SupabaseResponse>(response: R, context: string): SuccessData<R> | null => {
	const { data, error } = response;

	if (error) {
		const appError = toAppError(error, getEnvelope(response));
		if (appError.code === 'not_found') return null;
		throw logAppError(appError, context);
	}

	return data as SuccessData<R>;
};

/** data 가 없는 호출(signOut, delete 등)에서 error 만 검사한다 */
export const throwOnError = (response: { error: unknown }, context: string): void => {
	const { error } = response;
	if (error) throw logAppError(toAppError(error, getEnvelope(response)), context);
};

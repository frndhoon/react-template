import type { AppErrorCode, AppErrorInit } from '@/types/common.types';
import type { SupabaseErrorResponse } from '@/types/supabase-error.types';

/**
 * 앱 전체에서 던지는 단일 에러 타입.
 *
 * 서비스 함수는 `{ status, message, data }` 같은 래퍼를 반환하지 않고 이 에러를 throw 한다.
 * 로딩/에러/재시도 상태는 TanStack Query 가 이미 관리하므로,
 * 반환값까지 감싸면 두 곳에서 같은 일을 하게 된다.
 *
 * 경계가 명확하다:
 * - `code` / `message` : 우리가 얹은 것. UI 분기와 사용자 문구용.
 * - `response`         : 서버가 말한 것 전부. Network 탭과 1:1로 대조된다.
 * - `cause`            : SDK 가 던진 에러 객체 원본.
 *
 * @example UI 분기
 * const { error } = useQuery(...);
 * if (error instanceof AppError && error.code === 'unauthorized') redirectToLogin();
 *
 * @example 디버깅 — message 가 아니라 response 를 본다
 * console.log(error.response);
 * if (error.response?.service === 'postgrest') console.log(error.response.body.hint);
 */
export class AppError extends Error {
	readonly code: AppErrorCode;
	readonly response?: SupabaseErrorResponse;

	constructor({ code, message, response, cause }: AppErrorInit) {
		super(message, { cause });
		this.name = 'AppError';
		this.code = code;
		this.response = response;
	}

	/** 자주 쓰는 값이라 한 단계 줄여둔 편의 getter */
	get status(): number | undefined {
		return this.response?.status;
	}

	/** 재시도해봤자 결과가 같은 에러 — TanStack Query 의 `retry` 판단에 쓴다 */
	get isRetryable(): boolean {
		return this.code === 'network' || this.code === 'rate_limited';
	}

	/** 로그·에러리포팅에 넘길 평평한 객체 */
	toJSON() {
		return {
			name: this.name,
			code: this.code,
			message: this.message,
			response: this.response,
		};
	}
}

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;

/**
 * Supabase 각 서비스가 실제로 응답에 실어 보내는 에러 형태.
 *
 * 이 파일은 "프론트에서 다루기 편한 모양"이 아니라 백엔드(PostgREST / GoTrue / Storage)의 계약을
 * 그대로 옮겨 적은 것이다. 개발자도구 Network 탭 Response 와 필드가 1:1로 맞아야 한다.
 * SDK 를 올렸는데 형태가 달라졌다면 여기서 컴파일 에러가 나는 게 정상이고, 그때 계약을 다시 맞춘다.
 *
 * AppError 는 이걸 `response` 에 통째로 들고 다닌다. 경계는 한 줄로 설명된다 —
 * **`response` 안은 서버가 말한 것, 밖은 우리가 얹은 것(code / message).**
 */

/** 모든 서비스 공통. auth 응답처럼 status 를 안 주는 경우가 있어 optional 이다 */
type ResponseMeta = {
	status?: number;
	statusText?: string;
};

/**
 * PostgREST 에러 응답 바디.
 *
 * @see https://postgrest.org/en/stable/references/errors.html
 */
export type PostgrestErrorBody = {
	/** PostgREST 코드(`PGRST###`) 또는 Postgres SQLSTATE(`23505` 등) */
	code: string;
	/** 사람이 읽는 요약. 디버깅 근거로는 약하다 — code/hint 를 먼저 본다 */
	message: string;
	/** 문제가 된 값·키·행 같은 추가 맥락 */
	details: string | null;
	/**
	 * Postgres 가 알려주는 해결책. 가장 쓸모 있는 필드다.
	 * 권한 오류(`42501`)면 실행할 GRANT 문이 문자열로 그대로 들어온다.
	 */
	hint: string | null;
};

/** GoTrue(auth) 에러 응답 바디 */
export type AuthErrorBody = {
	/** `invalid_credentials` 등. 응답을 받기 전에 난 에러면 없다 */
	code: string | undefined;
	message: string;
	status: number | undefined;
};

/** Storage 에러 응답 바디 */
export type StorageErrorBody = {
	/** `NoSuchBucket` 같은 스토리지 전용 문자열 코드. HTTP status 와 다른 값이다 */
	statusCode: string | undefined;
	message: string;
	status: number | undefined;
};

/** 요청이 서버에 닿지 못한 경우 — 응답 자체가 없어서 바디도 없다 */
export type NetworkErrorBody = {
	message: string;
};

/**
 * 에러를 만든 응답 전체. axios 의 `error.response` 와 같은 자리다.
 *
 * `service` 가 판별자라서 바디가 좁혀진다:
 * `if (error.response?.service === 'postgrest') error.response.body.hint`
 *
 * service 와 body 를 AppError 의 별도 필드로 펼치지 않는 이유가 이것이다 —
 * 펼치면 TS 가 둘을 연결하지 못해 body 가 4개 유니온으로 남는다.
 */
export type SupabaseErrorResponse = ResponseMeta &
	(
		| { service: 'postgrest'; body: PostgrestErrorBody }
		| { service: 'auth'; body: AuthErrorBody }
		| { service: 'storage'; body: StorageErrorBody }
		| { service: 'network'; body: NetworkErrorBody }
	);

export type SupabaseService = SupabaseErrorResponse['service'];

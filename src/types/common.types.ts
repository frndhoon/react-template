import type * as supabaseErrorTypes from '@/types/supabase-error.types';

/**
 * 앱 전역 공용 타입. (Supabase 기반)
 *
 * 여기에는 "어떤 백엔드를 쓰든 똑같이 성립하는" 타입만 둔다.
 * - DB 스키마에서 파생되는 타입 → `@/types/database.types` (supabase CLI 생성물)
 * - Supabase 고유 타입(Session, User, PostgrestError …) → `@supabase/supabase-js` 에서 직접 import
 *
 * HTTP status / request option 계열 타입은 두지 않는다.
 * supabase-js 가 URL·헤더·토큰 갱신을 전부 내부에서 처리하므로
 * 앱 코드가 그 레이어를 알 필요가 없다.
 */

export type Nullable<T> = T | null;

/**
 * SDK 별로 제각각인 에러(PostgrestError, AuthError, StorageApiError, 네트워크 예외 …)를
 * UI가 분기할 수 있는 최소 집합으로 좁힌 코드.
 *
 * 변환은 `@/services/supabase/error` 의 `toAppError` 가 담당하고,
 * 실제로 던져지는 값은 `@/utils/app-error` 의 `AppError` 인스턴스다.
 */
export type AppErrorCode =
	/** 로그인이 필요하거나 세션이 만료됨 (재로그인 유도) */
	| 'unauthorized'
	/** 로그인은 했지만 권한 없음 — RLS 정책에 막힌 경우 포함 */
	| 'forbidden'
	/** 대상 리소스 없음 */
	| 'not_found'
	/** 중복 키 등 현재 상태와 충돌 */
	| 'conflict'
	/** 입력값이 제약조건을 위반 (폼 에러로 표시) */
	| 'validation'
	/** 요청이 서버에 닿지 못함 — 오프라인, CORS, timeout */
	| 'network'
	/** 요청 제한 초과 */
	| 'rate_limited'
	/**
	 * 요청과 서버 스키마가 어긋남 — 없는 컬럼/테이블/함수를 참조했다.
	 * 사용자가 뭘 잘못한 게 아니라 마이그레이션이 안 돌았거나 database.types 가 낡은 것이다.
	 * 즉 배포 사고다. 조용히 넘기지 말고 로그에서 바로 눈에 띄어야 한다.
	 */
	| 'schema_mismatch'
	/** 위 어디에도 해당하지 않음 */
	| 'unknown';

export type AppErrorInit = {
	code: AppErrorCode;
	/** 사용자에게 그대로 노출해도 되는 메시지. 서버 원문이 아니라 우리가 정한 문구다 */
	message: string;
	/**
	 * 에러를 만든 응답 원문 — status / statusText / 바디가 전부 여기 들어간다.
	 * Network 탭과 대조할 땐 이것만 보면 된다.
	 */
	response?: supabaseErrorTypes.SupabaseErrorResponse;
	/** SDK 가 던진 에러 객체 원본 */
	cause?: unknown;
};

export type SortOrder = 'asc' | 'desc';

/** `TColumn` 에 테이블의 컬럼 유니온을 넘기면 정렬 키를 타입 레벨에서 고정할 수 있다 */
export type SortParams<TColumn extends string = string> = {
	column: TColumn;
	order?: SortOrder;
};

export type PageParams = {
	/** 1부터 시작 */
	page?: number;
	pageSize?: number;
};

export type ListParams<TColumn extends string = string> = PageParams & {
	sort?: SortParams<TColumn>;
	search?: string;
};

export type PageResult<T> = {
	items: T[];
	/** 전체 행 수 — supabase 의 `count` 옵션으로 받아온 값 */
	total: number;
	page: number;
	pageSize: number;
	hasNextPage: boolean;
};

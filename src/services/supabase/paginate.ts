import { getDataOrThrow } from '@/services/supabase/error';
import * as commonTypes from '@/types/common.types';
import { Logger } from '@/utils/logger';

/**
 * "page/size" 방언과 PostgREST 의 "offset/limit" 방언 사이를 옮기는 어댑터.
 *
 * ── 왜 이 파일이 필요한가 ────────────────────────────────────────
 *
 * 흔한 REST 백엔드(Spring Data 등)는 페이지네이션을 이렇게 받는다:
 *
 *   GET /comments?page=2&size=20&sort=createdAt,desc
 *   → { totalElements: 137, content: [...] }
 *
 * 그래서 프론트는 변환할 게 없었다. page 를 그대로 쿼리스트링에 실어 보내면 끝이었다.
 *
 * PostgREST 는 그 방언을 모른다. page 라는 개념 자체가 없고 offset/limit 만 있다.
 * supabase-js 의 `.range(from, to)` 가 실제로 만드는 URL 은 이렇다:
 *
 *   .range(20, 39)  →  ?offset=20&limit=20
 *
 * 게다가 전체 개수는 응답 바디가 아니라 헤더로 온다:
 *
 *   Content-Range: 20-39/137
 *
 * 즉 요청·응답 양쪽 모두 UI 가 쓰는 모양과 다르다. 이 파일이 그 사이를 메운다.
 * - `getPageRange`    : page/pageSize → from/to   (요청 방향)
 * - `createPageResult`: 헤더에서 온 count → PageResult (응답 방향)
 *
 * 이게 없으면 `usePostList({ offset: 20, limit: 20 })` 같은 시그니처가 되고,
 * `offset = (page - 1) * size` 계산이 목록을 그리는 컴포넌트마다 흩어진다.
 */

export const DEFAULT_PAGE_SIZE = 20;

/**
 * 페이지 번호·크기로 쓸 수 있는 값인지 확인하고, 아니면 기본값으로 되돌린다.
 *
 * 이 검증이 여기 있는 이유:
 * 직접 만든 백엔드였다면 서버가 `?page=abc` 를 막아줬다(400을 던지든 기본값을 쓰든).
 * Supabase 에는 우리가 짠 서버 코드가 없어서 PostgREST 로 `offset=NaN` 이 그대로 나간다.
 * 백엔드가 하던 입력 검증이 통째로 이쪽으로 넘어온 셈이고, 그 자리가 여기다.
 *
 * `Math.max(1, value)` 로는 안 된다 — `Math.max(1, NaN)` 은 NaN 이다.
 * page 는 보통 URL 쿼리스트링(문자열)에서 오므로 NaN 이 가장 흔한 잘못된 입력이다.
 */
const toPositiveInt = (value: number, fallback: number): number => {
	const int = Math.trunc(value);

	return Number.isFinite(int) && int >= 1 ? int : fallback;
};

/**
 * 1-base 페이지 번호를 supabase 의 `.range(from, to)` 인자로 변환한다.
 *
 * range 는 **0-base 이고 양끝을 포함**한다. 둘 다 틀리기 쉬운 지점이라 손으로 계산하지 않는다:
 * `to` 를 `from + pageSize` 로 쓰면 매 페이지마다 한 건씩 더 딸려온다.
 *
 * 보정된 page/pageSize 를 함께 돌려주는 이유는 응답에도 그 값이 실려야 하기 때문이다.
 * (`page: 0` 으로 들어와도 UI 에는 `page: 1` 이라고 알려줘야 한다 → createPageResult)
 *
 * @example
 * const { from, to, page, pageSize } = getPageRange({ page: 2, pageSize: 20 }); // from 20, to 39
 * const response = await supabase.from('posts').select('*', { count: 'exact' }).range(from, to);
 */
export const getPageRange = ({ page = 1, pageSize = DEFAULT_PAGE_SIZE }: commonTypes.PageParams = {}) => {
	const safePage = toPositiveInt(page, 1);
	const safePageSize = toPositiveInt(pageSize, DEFAULT_PAGE_SIZE);
	const from = (safePage - 1) * safePageSize;

	return { from, to: from + safePageSize - 1, page: safePage, pageSize: safePageSize };
};

/**
 * 조회한 목록과 총 개수를 합쳐 PageResult 를 만든다.
 *
 * `count` 는 `select('*', { count: 'exact' })` 를 줬을 때만 채워진다.
 * supabase-js 가 `Content-Range` 헤더(`20-39/137`)의 뒷부분을 파싱해 넣어주는 값이라,
 * count 옵션을 빼먹으면 null 이 온다. 그때는 이번 페이지 길이로 대신한다
 * (전체 개수를 모르니 hasNextPage 는 false 가 된다 — 다음 페이지가 없다는 뜻이 아니라 "모른다"에 가깝다).
 */
export const createPageResult = <T>(items: T[], count: number | null, { page, pageSize }: { page: number; pageSize: number }): commonTypes.PageResult<T> => {
	const total = count ?? items.length;

	return { items, total, page, pageSize, hasNextPage: page * pageSize < total };
};

/**
 * 목록 응답 전용 게이트웨이. `getDataOrThrow` + `createPageResult` 를 한 번에 한다.
 *
 * 이게 없으면 호출부가 같은 응답을 두 번 만져야 한다 —
 * `getDataOrThrow(response, ...)` 로 items 를 꺼내고, count 는 게이트웨이를 우회해
 * `response.count` 로 따로 집는 모양이 된다. 봉투를 두 군데서 읽는 셈이라 추상화가 샌다.
 *
 * @example
 * const response = await query.order('created_at').range(from, to);
 * return getPageOrThrow(response, { page, pageSize }, 'post.getPostList');
 */
export const getPageOrThrow = <T>(
	response: { data: T[] | null; error: unknown; count: number | null },
	{ page, pageSize }: { page: number; pageSize: number },
	context: string,
): commonTypes.PageResult<T> => {
	const items = getDataOrThrow(response, context);

	// count 가 없으면 총 개수를 모른 채 hasNextPage 가 false 로 굳는다.
	// 조용히 "다음 페이지 없음"이 되는 버그라 원인을 찾기 어려워서 여기서 한 번 짚어준다.
	if (response.count === null) {
		Logger.warn(context, "count 가 없습니다 — select() 에 { count: 'exact' } 를 넣었는지 확인하세요.");
	}

	return createPageResult(items, response.count, { page, pageSize });
};

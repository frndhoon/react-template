import { supabase } from '@/services/supabase/client';
import { getDataOrNull, getDataOrThrow, throwOnError } from '@/services/supabase/error';
import { getPageOrThrow, getPageRange } from '@/services/supabase/paginate';
import * as commonTypes from '@/types/common.types';
import * as databaseTypes from '@/types/database.types';
import * as postTypes from '@/types/post.types';

/**
 * 테이블 CRUD 서비스 예시. 새 도메인을 추가할 때 이 파일을 복사해서 시작한다.
 * (auth 는 스키마와 무관해 이런 패턴이 전혀 안 나오므로, 컨벤션 기준은 이쪽이다)
 *
 * 스키마를 실제 것으로 교체하면 이 파일과 post.query.ts, post.types.ts 는 지운다.
 */

// * 게시글 목록 조회
export const getPostList = async ({ publishedOnly, search, sort, ...pageParams }: postTypes.PostListParams = {}): Promise<
	commonTypes.PageResult<postTypes.Post>
> => {
	const { from, to, page, pageSize } = getPageRange(pageParams);

	// order/range 는 반환 타입이 바뀌므로(FilterBuilder → TransformBuilder)
	// 조건부 필터를 먼저 다 붙이고 마지막에 한 번에 이어야 한다
	let query = supabase.from('posts').select('*', { count: 'exact' });
	if (publishedOnly) query = query.eq('published', true);
	if (search) query = query.ilike('title', `%${search}%`);

	const response = await query.order(sort?.column ?? 'created_at', { ascending: sort?.order === 'asc' }).range(from, to);

	return getPageOrThrow(response, { page, pageSize }, 'post.getPostList');
};

// * 게시글 상세 조회
/** 없으면 에러가 아니라 null. 상세 페이지에서 404 를 직접 그리고 싶을 때 쓴다 */
export const getPostById = async (id: string): Promise<postTypes.Post | null> =>
	getDataOrNull(await supabase.from('posts').select('*').eq('id', id).single(), 'post.getPostById');

// * 게시글 생성
export const createPost = async (input: databaseTypes.InsertRow<'posts'>): Promise<postTypes.Post> =>
	getDataOrThrow(await supabase.from('posts').insert(input).select('*').single(), 'post.createPost');

// * 게시글 수정
export const updatePost = async ({ id, ...patch }: databaseTypes.UpdateRow<'posts'> & { id: string }): Promise<postTypes.Post> =>
	getDataOrThrow(await supabase.from('posts').update(patch).eq('id', id).select('*').single(), 'post.updatePost');

// * 게시글 삭제
export const deletePost = async (id: string): Promise<void> => {
	throwOnError(await supabase.from('posts').delete().eq('id', id), 'post.deletePost');
};

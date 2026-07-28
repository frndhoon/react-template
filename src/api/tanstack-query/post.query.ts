import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as postAction from '@/api/action/post.action';
import * as postTypes from '@/types/post.types';

/**
 * 이 폴더에는 `use...` 훅만 둔다. 타입은 `@/types`, 실제 호출은 `@/api/action` 이 맡는다.
 *
 * queryKey 팩토리만 예외로 여기 남는다 — 훅 바깥으로 빼면 무효화 대상을 찾으러
 * 파일을 오가야 해서 오히려 흩어진다.
 *
 * 계층을 `all → lists → list(params)` 로 두면 무효화 범위를 골라 쓸 수 있다:
 * - `invalidateQueries({ queryKey: postKeys.lists() })` → 필터/페이지 무관하게 목록 전부
 * - `invalidateQueries({ queryKey: postKeys.detail(id) })` → 그 글 하나만
 */
export const postKeys = {
	all: ['posts'] as const,
	lists: () => [...postKeys.all, 'list'] as const,
	list: (params: postTypes.PostListParams) => [...postKeys.lists(), params] as const,
	details: () => [...postKeys.all, 'detail'] as const,
	detail: (id: string) => [...postKeys.details(), id] as const,
};

// * 게시글 목록 조회
export const usePostList = (params: postTypes.PostListParams = {}) =>
	useQuery(
		queryOptions({
			queryKey: postKeys.list(params),
			queryFn: () => postAction.getPostList(params),
		}),
	);

// * 게시글 상세 조회
export const usePostDetail = (id: string) =>
	useQuery(
		queryOptions({
			queryKey: postKeys.detail(id),
			queryFn: () => postAction.getPostById(id),
		}),
	);

// * 게시글 생성
export const useCreatePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: postAction.createPost,
		onSuccess: () => {
			// 새 글이 어느 페이지에 끼어들지 알 수 없으므로 목록은 통째로 무효화한다
			queryClient.invalidateQueries({ queryKey: postKeys.lists() });
		},
	});
};

// * 게시글 수정
export const useUpdatePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: postAction.updatePost,
		onSuccess: (post: postTypes.Post) => {
			queryClient.setQueryData(postKeys.detail(post.id), post);
			queryClient.invalidateQueries({ queryKey: postKeys.lists() });
		},
	});
};

// * 게시글 삭제
export const useDeletePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: postAction.deletePost,
		onSuccess: (_data: void, id: string) => {
			queryClient.removeQueries({ queryKey: postKeys.detail(id) });
			queryClient.invalidateQueries({ queryKey: postKeys.lists() });
		},
	});
};

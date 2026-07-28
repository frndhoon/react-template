import type { Session } from '@supabase/supabase-js';

import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getSession, signInWithPassword, signOut, signUp } from '@/api/action/auth.action';

export const authKeys = {
	all: ['auth'] as const,
	session: () => [...authKeys.all, 'session'] as const,
};

export const useSession = () =>
	useQuery(
		queryOptions({
			queryKey: authKeys.session(),
			queryFn: getSession,
			// SDK 가 토큰을 알아서 갱신하므로 짧은 주기로 다시 물어볼 필요가 없다
			staleTime: 1000 * 60 * 5,
			retry: false,
		}),
	);

export const useSignIn = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: signInWithPassword,
		onSuccess: (session: Session) => {
			queryClient.setQueryData(authKeys.session(), session);
		},
	});
};

export const useSignUp = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: signUp,
		onSuccess: (session: Session | null) => {
			queryClient.setQueryData(authKeys.session(), session);
		},
	});
};

export const useSignOut = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: signOut,
		onSuccess: () => {
			// 로그아웃 후에는 이전 사용자 데이터가 캐시에 남아 있으면 안 된다
			queryClient.clear();
		},
	});
};

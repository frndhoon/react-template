import { Query, defaultShouldDehydrateQuery, keepPreviousData } from '@tanstack/react-query';

import { isAppError } from '@/utils/app-error';

/**
 * 재시도해서 결과가 달라질 수 있는 에러만 재시도한다.
 * 인증 실패(unauthorized)나 유효성 에러(validation)는 몇 번을 더 보내도 같은 응답이라
 * 사용자가 에러를 보기까지의 시간만 늘어난다.
 */
const shouldRetry = (failureCount: number, error: Error): boolean => {
	if (isAppError(error)) return error.isRetryable && failureCount < 2;
	return failureCount < 1;
};

export const queryClientOptions = {
	defaultOptions: {
		queries: {
			staleTime: 0,
			gcTime: 1000 * 60 * 1,
			retry: shouldRetry,
			refetchOnMount: true,
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
			placeholderData: keepPreviousData,
		},
		dehydrate: {
			shouldDehydrateQuery: (query: Query) => defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
		},
	},
};

import { QueryClient } from '@tanstack/react-query';

import { queryClientOptions } from '@/configs/tanstack-query/query-client-options';

const makeQueryClient = () => {
	return new QueryClient(queryClientOptions);
};

let browserQueryClient: QueryClient | undefined;
export const getQueryClient = () => {
	if (typeof window === 'undefined') {
		return makeQueryClient();
	}
	if (!browserQueryClient) browserQueryClient = makeQueryClient();
	return browserQueryClient;
};

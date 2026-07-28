import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { type PropsWithChildren, useState } from 'react';

import { getQueryClient } from '@/configs/tanstack-query/get-query-client';

const TanstackQueryProvider = ({ children }: PropsWithChildren) => {
	const [queryClient] = useState(() => getQueryClient());
	return (
		<QueryClientProvider client={queryClient}>
			{children}
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
};

export default TanstackQueryProvider;

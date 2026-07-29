import { type ReactNode } from 'react';

import { Toaster, TooltipProvider } from '@/components/ui';
import TanstackQueryProvider from '@/provider/TanstackQueryProvider';

const Provider = ({ children }: { children: ReactNode }) => {
	return (
		<TanstackQueryProvider>
			<Toaster>
				<TooltipProvider>{children}</TooltipProvider>
			</Toaster>
		</TanstackQueryProvider>
	);
};

export default Provider;

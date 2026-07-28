import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';

import Provider from '@/provider/Provider';
import { router } from '@/routes/router';
import '@/styles/global.css';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Provider>
			<RouterProvider router={router} />
		</Provider>
	</StrictMode>,
);

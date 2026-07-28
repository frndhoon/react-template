import { createBrowserRouter } from 'react-router';

import ErrorPage from '@/pages/ErrorPage';
import HomePage from '@/pages/HomePage';
import { PATH } from '@/routes/paths';

// element 가 없는 부모 라우트는 Outlet 만 렌더한다. errorElement 를 여기 두면 하위 전체를 덮는다
export const router = createBrowserRouter([
	{
		path: PATH.HOME,
		errorElement: <ErrorPage />,
		children: [
			{ index: true, element: <HomePage /> },
			{ path: '*', element: <ErrorPage /> },
		],
	},
]);

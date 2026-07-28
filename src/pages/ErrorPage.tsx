import { isRouteErrorResponse, useRouteError } from 'react-router';

import { Button } from '@/components/ui/button';

const getMessage = (error: unknown) => {
	if (!error) return '존재하지 않는 페이지입니다.';
	if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`;
	if (error instanceof Error) return error.message;
	return '알 수 없는 에러가 발생했습니다.';
};

const ErrorPage = () => {
	const error = useRouteError();

	return (
		<div className="flex h-screen flex-col items-center justify-center gap-4">
			<h1 className="text-3xl font-semibold">문제가 발생했습니다</h1>
			<p className="text-lg text-muted-foreground">{getMessage(error)}</p>
			<Button variant="outline" onClick={() => window.location.replace('/')}>
				홈으로
			</Button>
		</div>
	);
};

export default ErrorPage;

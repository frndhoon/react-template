import { toast, Button } from '@/components/ui';
import { useTestStore } from '@/store/useTestStore';

const HomePage = () => {
	const count = useTestStore(state => state.count);
	const increaseCount = useTestStore(state => state.increaseCount);

	return (
		<div className="flex h-screen flex-col items-center justify-center gap-6">
			<h1 className="text-3xl font-semibold">react-template</h1>
			<div className="flex items-center gap-3">
				<span className="text-2xl tabular-nums">{count}</span>
				<Button
					onClick={() => {
						toast.add({
							type: 'success',
							description: 'Event has been created.',
						});
						increaseCount(1);
					}}
				>
					+1
				</Button>
			</div>
		</div>
	);
};

export default HomePage;

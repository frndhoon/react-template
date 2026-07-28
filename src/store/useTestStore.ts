import { create } from 'zustand';

type TestStore = {
	count: number;
	increaseCount: (amount: number) => void;
};

export const useTestStore = create<TestStore>()(set => ({
	count: 1,
	increaseCount: amount => set(state => ({ count: state.count + amount })),
}));

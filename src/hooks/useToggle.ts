import { useState } from 'react';

/**
 * @function useToggle
 *
 * @description 토글 상태 관리 훅
 *
 * @param {boolean} initialValue - 초기값
 * @returns {value: boolean, setValue: (value: boolean) => void, toggle: () => void} - 토글된 값
 *
 * @example
 *
 * const { value, setValue, toggle } = useToggle(false);
 */
export const useToggle = (initialValue = false) => {
	const [value, setValue] = useState(initialValue);

	return { value, setValue, toggle: () => setValue(prev => !prev) };
};

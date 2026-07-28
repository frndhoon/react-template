import { useEffect, useState } from 'react';

/**
 * @function useDebounce
 *
 * @description 입력값을 일정 시간 동안 추가 입력이 없을 때만 업데이트
 *
 * @param {T} value - 입력값
 * @param {number} delay - 딜레이 시간
 * @returns {T} - 디바운스된 값
 *
 * @example
 *
 * const [debouncedValue, setDebouncedValue] = useState('');
 */
export const useDebounce = <T>(value: T, delay = 300) => {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedValue(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);

	return debouncedValue;
};

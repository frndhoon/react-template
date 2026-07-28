import { defineConfig } from 'oxfmt';

export default defineConfig({
	trailingComma: 'all', // 여러 줄일 때 마지막 요소 뒤에도 쉼표 (git diff 노이즈 감소)
	tabWidth: 4,
	semi: true, // 세미콜론 사용
	singleQuote: true, // 문자열은 작은따옴표
	jsxSingleQuote: false, // JSX 속성값은 큰따옴표 (HTML 관례와 통일)
	printWidth: 160, // 한 줄 최대 길이
	sortPackageJson: false, // package.json 필드 순서는 손대지 않음
	useTabs: true, // 들여쓰기는 탭
	arrowParens: 'avoid', // 인자 하나짜리 화살표 함수는 괄호 생략 (x => x)

	// import 문 순서 강제 정렬 (그룹 사이에 빈 줄 자동 삽입)
	sortImports: {
		groups: [
			'type-import', // import type { ... }
			['value-builtin', 'value-external'], // node: 내장 모듈 + node_modules 패키지
			'type-internal', // 절대경로(@/) type import
			'value-internal', // 절대경로(@/) value import
			['type-parent', 'type-sibling', 'type-index'], // 상대경로 type import
			['value-parent', 'value-sibling', 'value-index'], // 상대경로 value import
			'unknown', // 위 어디에도 안 걸리는 것
		],
	},

	// Tailwind 클래스 문자열 안의 유틸리티 순서 자동 정렬
	sortTailwindcss: {
		stylesheet: './src/styles/global.css', // Tailwind 설정을 읽어올 스타일시트
		functions: ['clsx', 'cn'], // 이 함수들의 인자 안 클래스 문자열도 정렬 대상
		preserveWhitespace: true, // 정렬 시 기존 공백/줄바꿈 유지
	},
});

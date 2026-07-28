/**
 * `import.meta.env` 타입 보강.
 *
 * Vite 는 `VITE_` 접두사가 붙은 변수만 클라이언트 번들에 주입한다.
 * 여기 선언한 값은 전부 브라우저에 그대로 노출되므로,
 * service_role 키처럼 비밀이어야 하는 값은 넣지 않는다.
 *
 * tsconfig.app.json 에 `"types": ["vite/client"]` 가 이미 있어서
 * triple-slash reference 는 필요 없다.
 */
interface ImportMetaEnv {
	readonly VITE_SUPABASE_URL: string;
	readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

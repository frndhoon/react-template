import { createClient } from '@supabase/supabase-js';

import * as DatabaseType from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error('[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 없습니다. .env.example 을 .env.local 로 복사해 채워주세요.');
}

/**
 * 앱 전역 Supabase 클라이언트.
 *
 * 싱글톤 패턴을 따로 구현하지 않는다 — ES 모듈이 한 번만 평가되므로 이 상수 자체가 싱글톤이다.
 * 여러 인스턴스를 만들면 auth 상태가 갈라져서 `onAuthStateChange` 가 어긋난다.
 *
 */
export const supabase = createClient<DatabaseType.Database>(supabaseUrl, supabaseAnonKey, {
	auth: {
		persistSession: true,
		autoRefreshToken: true,
		/** OAuth 리디렉트로 돌아왔을 때 URL 의 토큰을 자동으로 세션에 반영 */
		detectSessionInUrl: true,
		/** 브라우저에서는 implicit 대신 PKCE 를 쓴다 (토큰이 URL 프래그먼트에 남지 않음) */
		flowType: 'pkce',
	},
	global: {
		headers: { 'x-client-info': 'react-template' },
	},
});

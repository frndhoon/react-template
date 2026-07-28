import type { Session, User } from '@supabase/supabase-js';

import type { SignInParams } from '@/types/auth.types';

import { supabase } from '@/services/supabase/client';
import { getDataOrThrow, throwOnError } from '@/services/supabase/error';

/**
 * 서비스 함수 컨벤션 (다른 도메인 파일도 이 모양을 따른다):
 * 1. React 를 import 하지 않는다 — 순수 async 함수라 훅 밖에서도, 테스트에서도 그대로 쓴다.
 * 2. 성공하면 데이터를 그대로 반환하고, 실패하면 AppError 를 던진다. 결과를 래퍼 객체로 감싸지 않는다.
 * 3. 캐싱·재시도·로딩 상태는 여기서 다루지 않는다. `@/api/tanstack-query` 쪽 책임이다.
 */

export const getSession = async (): Promise<Session | null> => {
	const { session } = getDataOrThrow(await supabase.auth.getSession(), 'auth.getSession');
	return session;
};

/**
 * 서버에 실제로 물어봐서 사용자를 검증한다(getSession 은 로컬 스토리지의 세션을 그대로 돌려줌).
 * 세션이 없으면 null 이 아니라 `unauthorized` AppError 를 던진다.
 */
export const getUser = async (): Promise<User> => {
	const { user } = getDataOrThrow(await supabase.auth.getUser(), 'auth.getUser');
	return user;
};

export const signInWithPassword = async ({ email, password }: SignInParams): Promise<Session> => {
	const { session } = getDataOrThrow(await supabase.auth.signInWithPassword({ email, password }), 'auth.signInWithPassword');
	return session;
};

export const signUp = async ({ email, password }: SignInParams): Promise<Session | null> => {
	// 이메일 인증이 켜져 있으면 session 은 null 이고, 인증 메일을 확인해야 로그인이 완료된다
	const { session } = getDataOrThrow(await supabase.auth.signUp({ email, password }), 'auth.signUp');
	return session;
};

export const signOut = async (): Promise<void> => {
	throwOnError(await supabase.auth.signOut(), 'auth.signOut');
};

/**
 * 다른 탭에서의 로그아웃, 자동 토큰 갱신 등 SDK 내부에서 발생하는 세션 변경 구독.
 * 반환된 함수를 호출하면 구독이 해제된다.
 */
export const subscribeAuthState = (onChange: (session: Session | null) => void): (() => void) => {
	const { data } = supabase.auth.onAuthStateChange((_event, session) => onChange(session));
	return () => data.subscription.unsubscribe();
};

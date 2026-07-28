/**
 * ⚠️ 이 파일은 손으로 고치지 않는다. Supabase CLI 생성물이다.
 *
 * 스키마를 바꿀 때마다 아래 명령으로 다시 뽑는다:
 *
 *   pnpm dlx supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.types.ts
 *
 * 로컬 개발(supabase start)일 때:
 *
 *   pnpm dlx supabase gen types typescript --local > src/types/database.types.ts
 *
 * 아래 `posts` 는 서비스 레이어 예시(`@/api/action/post.action`)를 컴파일 가능한 상태로 두기 위한
 * 샘플 테이블이다. 실제 스키마로 덮어쓰는 순간 사라지므로, 그때 예시 파일 2개도 같이 지운다:
 *   - src/api/action/post.action.ts
 *   - src/api/tanstack-query/post.query.ts
 *
 * 덮어쓰고 나면 `supabase.from('...')` 의 테이블명·컬럼·반환 타입이 전부 자동으로 좁혀진다.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	public: {
		Tables: {
			posts: {
				Row: {
					id: string;
					created_at: string;
					title: string;
					content: string | null;
					author_id: string;
					published: boolean;
				};
				Insert: {
					id?: string;
					created_at?: string;
					title: string;
					content?: string | null;
					author_id: string;
					published?: boolean;
				};
				Update: {
					id?: string;
					created_at?: string;
					title?: string;
					content?: string | null;
					author_id?: string;
					published?: boolean;
				};
				Relationships: [];
			};
		};
		Views: { [_ in never]: never };
		Functions: { [_ in never]: never };
		Enums: { [_ in never]: never };
		CompositeTypes: { [_ in never]: never };
	};
};

/** 테이블 행 타입 단축키 — `Row<'posts'>` 처럼 쓴다 */
export type Row<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

export type InsertRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];

export type UpdateRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

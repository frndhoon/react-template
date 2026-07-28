import * as commonTypes from '@/types/common.types';
import * as databaseTypes from '@/types/database.types';

/** 스키마를 실제 것으로 교체하면 이 파일도 같이 지운다 (posts 는 예시 테이블) */
export type Post = databaseTypes.Row<'posts'>;

/** 정렬 가능한 컬럼을 타입으로 못박아 두면 오타가 런타임이 아니라 컴파일에서 잡힌다 */
export type PostSortColumn = 'created_at' | 'title';

export type PostListParams = commonTypes.ListParams<PostSortColumn> & {
	publishedOnly?: boolean;
};

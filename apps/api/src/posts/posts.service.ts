import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../database/database.constants.js';
import {
  comments,
  postLikes,
  postTags,
  posts,
  tags,
  users,
} from '../database/schema.js';
import { TagsService, type TagRow } from '../tags/tags.service.js';
import { toHandle } from '../users/handle.js';
import type { CreatePostDto } from './dto/create-post.dto.js';

export interface PostSummary {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  createdAt: Date;
  author: { id: string; name: string; handle: string };
  tags: TagRow[];
  likeCount: number;
  commentCount: number;
  viewerHasLiked: boolean;
}

export interface PostDetail extends PostSummary {
  body: string;
}

export interface ListPostsParams {
  q?: string;
  tagSlugs: string[];
  sort: 'recent' | 'popular';
  page: number;
  limit: number;
  viewerId?: string;
}

export interface PostListResult {
  items: PostSummary[];
  total: number;
}

@Injectable()
export class PostsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly tagsService: TagsService,
  ) {}

  /**
   * 'portuguese' is written as a literal, not a bound parameter: the first
   * argument of websearch_to_tsquery is a `regconfig` and Postgres will not
   * infer it from a text placeholder. It is a constant in our code, never
   * user input. `q` and the tag slugs ARE bound (`$1`, `$2`, ...).
   */
  private filter(q: string | undefined, tagSlugs: string[]): SQL | undefined {
    const conditions: SQL[] = [];

    if (q) {
      conditions.push(
        sql`${posts.searchVector} @@ websearch_to_tsquery('portuguese', ${q})`,
      );
    }

    if (tagSlugs.length > 0) {
      // AND-intersection: the post must carry EVERY requested tag. One grouped
      // pass over post_tags instead of N correlated EXISTS subqueries.
      const postsWithEveryTag = this.db
        .select({ postId: postTags.postId })
        .from(postTags)
        .innerJoin(tags, eq(tags.id, postTags.tagId))
        .where(inArray(tags.slug, tagSlugs))
        .groupBy(postTags.postId)
        .having(sql`count(distinct ${tags.slug}) = ${tagSlugs.length}`);

      conditions.push(inArray(posts.id, postsWithEveryTag));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  /**
   * Scalar subqueries, not joins + group by: joining post_likes and comments
   * at once would multiply rows and force a DISTINCT over the whole
   * projection. They run once per returned row, at most `limit` rows.
   */
  private counters(viewerId: string | undefined) {
    const likeCount =
      sql<number>`(select count(*) from ${postLikes} where ${postLikes.postId} = ${posts.id})`.mapWith(
        Number,
      );
    const commentCount =
      sql<number>`(select count(*) from ${comments} where ${comments.postId} = ${posts.id})`.mapWith(
        Number,
      );
    const viewerHasLiked = viewerId
      ? sql<boolean>`exists (select 1 from ${postLikes} where ${postLikes.postId} = ${posts.id} and ${postLikes.userId} = ${viewerId})`.mapWith(
          Boolean,
        )
      : sql<boolean>`false`.mapWith(Boolean);

    return { likeCount, commentCount, viewerHasLiked };
  }

  async list(params: ListPostsParams): Promise<PostListResult> {
    const { q, tagSlugs, sort, page, limit, viewerId } = params;
    const where = this.filter(q, tagSlugs);
    const { likeCount, commentCount, viewerHasLiked } = this.counters(viewerId);

    const rank = q
      ? sql`ts_rank(${posts.searchVector}, websearch_to_tsquery('portuguese', ${q}))`
      : sql`0`;

    const orderBy =
      sort === 'popular'
        ? [desc(likeCount), desc(posts.createdAt)]
        : q
          ? [desc(rank), desc(posts.createdAt)]
          : [desc(posts.createdAt)];

    // Query 1 of 3: the page itself.
    const rows = await this.db
      .select({
        id: posts.id,
        title: posts.title,
        description: posts.description,
        thumbnailUrl: posts.thumbnailUrl,
        createdAt: posts.createdAt,
        authorId: users.id,
        authorName: users.name,
        authorEmail: users.email,
        likeCount,
        commentCount,
        viewerHasLiked,
      })
      .from(posts)
      .innerJoin(users, eq(users.id, posts.authorId))
      .where(where)
      .orderBy(...orderBy)
      .limit(limit)
      .offset((page - 1) * limit);

    // Query 2 of 3: the total for the pagination metadata.
    const [{ total }] = await this.db
      .select({ total: sql<number>`count(*)`.mapWith(Number) })
      .from(posts)
      .where(where);

    // Query 3 of 3: every tag of every post on this page, in one round trip.
    const tagsByPost = await this.tagsService.findByPostIds(
      rows.map((row) => row.id),
    );

    return {
      items: rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        thumbnailUrl: row.thumbnailUrl,
        createdAt: row.createdAt,
        author: {
          id: row.authorId,
          name: row.authorName,
          handle: toHandle(row.authorEmail),
        },
        tags: tagsByPost.get(row.id) ?? [],
        likeCount: row.likeCount,
        commentCount: row.commentCount,
        viewerHasLiked: row.viewerHasLiked,
      })),
      total,
    };
  }

  async findOne(id: string, viewerId?: string): Promise<PostDetail> {
    const { likeCount, commentCount, viewerHasLiked } = this.counters(viewerId);

    const [row] = await this.db
      .select({
        id: posts.id,
        title: posts.title,
        description: posts.description,
        body: posts.body,
        thumbnailUrl: posts.thumbnailUrl,
        createdAt: posts.createdAt,
        authorId: users.id,
        authorName: users.name,
        authorEmail: users.email,
        likeCount,
        commentCount,
        viewerHasLiked,
      })
      .from(posts)
      .innerJoin(users, eq(users.id, posts.authorId))
      .where(eq(posts.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException('Post not found');
    }

    const tagsByPost = await this.tagsService.findByPostIds([row.id]);

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      body: row.body,
      thumbnailUrl: row.thumbnailUrl,
      createdAt: row.createdAt,
      author: {
        id: row.authorId,
        name: row.authorName,
        handle: toHandle(row.authorEmail),
      },
      tags: tagsByPost.get(row.id) ?? [],
      likeCount: row.likeCount,
      commentCount: row.commentCount,
      viewerHasLiked: row.viewerHasLiked,
    };
  }

  async create(authorId: string, dto: CreatePostDto): Promise<PostDetail> {
    // Tags are global and idempotent, so they resolve outside the transaction.
    const tagIds = await this.tagsService.resolveOrCreate(dto.tags ?? []);

    const created = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(posts)
        .values({
          authorId,
          title: dto.title,
          description: dto.description,
          body: dto.body,
          thumbnailUrl: dto.thumbnailUrl ?? null,
        })
        .returning({ id: posts.id });

      if (tagIds.length > 0) {
        await tx
          .insert(postTags)
          .values(tagIds.map((tagId) => ({ postId: row.id, tagId })));
      }
      return row;
    });

    return this.findOne(created.id, authorId);
  }
}

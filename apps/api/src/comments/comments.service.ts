import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../database/database.constants.js';
import { comments, posts, users } from '../database/schema.js';
import { toHandle } from '../users/handle.js';
import type { CreateCommentDto } from './dto/create-comment.dto.js';

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  body: string;
  createdAt: Date;
  author: { id: string; name: string; handle: string };
}

export interface CommentThread extends Comment {
  replies: Comment[];
}

interface CommentRow {
  id: string;
  postId: string;
  parentId: string | null;
  body: string;
  createdAt: Date;
  authorId: string;
  authorName: string;
  authorEmail: string;
}

function toComment(row: CommentRow): Comment {
  return {
    id: row.id,
    postId: row.postId,
    parentId: row.parentId,
    body: row.body,
    createdAt: row.createdAt,
    author: {
      id: row.authorId,
      name: row.authorName,
      handle: toHandle(row.authorEmail),
    },
  };
}

@Injectable()
export class CommentsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  private select() {
    return this.db
      .select({
        id: comments.id,
        postId: comments.postId,
        parentId: comments.parentId,
        body: comments.body,
        createdAt: comments.createdAt,
        authorId: users.id,
        authorName: users.name,
        authorEmail: users.email,
      })
      .from(comments)
      .innerJoin(users, eq(users.id, comments.authorId));
  }

  private async ensurePostExists(postId: string): Promise<void> {
    const [post] = await this.db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      throw new NotFoundException('Post not found');
    }
  }

  /**
   * One query brings roots and replies together (nesting is one level, so a
   * post's thread is small) and the grouping happens in memory.
   */
  async listByPost(postId: string): Promise<CommentThread[]> {
    await this.ensurePostExists(postId);

    const rows = await this.select()
      .where(eq(comments.postId, postId))
      .orderBy(asc(comments.createdAt));

    const roots: CommentThread[] = [];
    const repliesByParent = new Map<string, Comment[]>();

    for (const row of rows) {
      const comment = toComment(row);
      if (row.parentId === null) {
        roots.push({ ...comment, replies: [] });
        continue;
      }
      const list = repliesByParent.get(row.parentId);
      if (list) list.push(comment);
      else repliesByParent.set(row.parentId, [comment]);
    }

    for (const root of roots) {
      root.replies = repliesByParent.get(root.id) ?? [];
    }
    return roots;
  }

  async findOne(id: string): Promise<Comment> {
    const [row] = await this.select().where(eq(comments.id, id)).limit(1);

    if (!row) {
      throw new NotFoundException('Comment not found');
    }
    return toComment(row);
  }

  async create(
    postId: string,
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    await this.ensurePostExists(postId);

    if (dto.parentId) {
      const [parent] = await this.db
        .select({
          postId: comments.postId,
          parentId: comments.parentId,
        })
        .from(comments)
        .where(eq(comments.id, dto.parentId))
        .limit(1);

      if (!parent || parent.postId !== postId) {
        throw new NotFoundException('Parent comment not found');
      }
      // One level only: the body is well-formed, the relationship is not.
      if (parent.parentId !== null) {
        throw new UnprocessableEntityException(
          'Replies are limited to one level',
        );
      }
    }

    const [created] = await this.db
      .insert(comments)
      .values({
        postId,
        authorId,
        parentId: dto.parentId ?? null,
        body: dto.body,
      })
      .returning({ id: comments.id });

    return this.findOne(created.id);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, inArray } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../database/database.constants.js';
import { postTags, tags } from '../database/schema.js';
import { slugify } from './slugify.js';

export interface TagRow {
  slug: string;
  label: string;
}

@Injectable()
export class TagsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findAll(): Promise<TagRow[]> {
    return this.db
      .select({ slug: tags.slug, label: tags.label })
      .from(tags)
      .orderBy(asc(tags.label));
  }

  /** Every tag of every given post, in one round trip. */
  async findByPostIds(postIds: string[]): Promise<Map<string, TagRow[]>> {
    // `inArray` with an empty list is not valid SQL.
    if (postIds.length === 0) return new Map();

    const rows = await this.db
      .select({ postId: postTags.postId, slug: tags.slug, label: tags.label })
      .from(postTags)
      .innerJoin(tags, eq(tags.id, postTags.tagId))
      .where(inArray(postTags.postId, postIds))
      .orderBy(asc(tags.label));

    const grouped = new Map<string, TagRow[]>();
    for (const row of rows) {
      const tag = { slug: row.slug, label: row.label };
      const list = grouped.get(row.postId);
      if (list) list.push(tag);
      else grouped.set(row.postId, [tag]);
    }
    return grouped;
  }

  /** Finds or creates a tag per label and returns their ids. Idempotent. */
  async resolveOrCreate(labels: string[]): Promise<string[]> {
    const bySlug = new Map<string, string>();
    for (const label of labels) {
      const slug = slugify(label);
      if (slug) bySlug.set(slug, label.trim());
    }
    if (bySlug.size === 0) return [];

    await this.db
      .insert(tags)
      .values([...bySlug].map(([slug, label]) => ({ slug, label })))
      .onConflictDoNothing({ target: tags.slug });

    const rows = await this.db
      .select({ id: tags.id })
      .from(tags)
      .where(inArray(tags.slug, [...bySlug.keys()]));
    return rows.map((row) => row.id);
  }
}

import mongoose from 'mongoose';

import { ArticleRepository } from '@/repositories/article.repository';
import type {
  ArticleAdminListQuery,
  ArticleCreateInput,
  ArticleListQuery,
  ArticleUpdateInput,
} from '@/schemas/article.schema';
import { slugify } from '@/utils/slug';

export class ArticleService {
  private repository: ArticleRepository;

  constructor() {
    this.repository = new ArticleRepository();
  }

  async listPublished(query: ArticleListQuery) {
    const limit = query.limit ?? 10;
    const items = await this.repository.getList(
      { isPublished: true },
      { content: 0 },
      { limit },
    );

    return items
      .sort((a, b) => {
        const ad = a.publishedAt?.getTime() ?? a.createdAt?.getTime() ?? 0;
        const bd = b.publishedAt?.getTime() ?? b.createdAt?.getTime() ?? 0;
        return bd - ad;
      })
      .map((a) => ({
        id: String(a._id),
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        coverImageUrl: a.coverImageUrl,
        publishedAt: a.publishedAt?.toISOString(),
      }));
  }

  async listAdmin(query: ArticleAdminListQuery) {
    const limit = query.limit ?? 20;
    const page = query.page ?? 1;

    const filter: Record<string, unknown> = {};
    if (query.published !== undefined) {
      filter.isPublished = query.published;
    }

    const result = await this.repository.paginate(filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      select: { content: 0 },
    });

    return {
      page: result.page ?? page,
      limit: result.limit,
      total: result.totalDocs,
      items: result.docs.map((a) => ({
        id: String(a._id),
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        coverImageUrl: a.coverImageUrl,
        isPublished: a.isPublished,
        publishedAt: a.publishedAt?.toISOString(),
        createdAt: a.createdAt?.toISOString(),
        updatedAt: a.updatedAt?.toISOString(),
      })),
    };
  }

  async getByIdAdmin(id: string) {
    const article = await this.repository.getById(id);
    if (!article) return null;

    return {
      id: String(article._id),
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      coverImageUrl: article.coverImageUrl,
      isPublished: article.isPublished,
      publishedAt: article.publishedAt?.toISOString(),
      createdAt: article.createdAt?.toISOString(),
      updatedAt: article.updatedAt?.toISOString(),
    };
  }

  async getPublishedBySlug(slug: string) {
    const article = await this.repository.getBySlug(slug);
    if (!article || !article.isPublished) return null;

    return {
      id: String(article._id),
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      coverImageUrl: article.coverImageUrl,
      publishedAt: article.publishedAt?.toISOString(),
    };
  }

  async create(input: ArticleCreateInput, userId?: string) {
    const baseSlug = slugify(input.title);
    let slug = baseSlug;

    let suffix = 2;
    while (await this.repository.existsSlug(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const isPublished = input.isPublished ?? false;

    const authorId =
      userId && mongoose.isValidObjectId(userId)
        ? new mongoose.Types.ObjectId(userId)
        : undefined;

    const article = await this.repository.create({
      slug,
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      coverImageUrl: input.coverImageUrl,
      isPublished,
      publishedAt: isPublished ? new Date() : undefined,
      createdBy: authorId,
      updatedBy: authorId,
    });

    return {
      id: String(article._id),
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      coverImageUrl: article.coverImageUrl,
      publishedAt: article.publishedAt?.toISOString(),
    };
  }

  async update(id: string, input: ArticleUpdateInput, userId?: string) {
    let slugPatch: Record<string, string> = {};
    if (input.title) {
      const baseSlug = slugify(input.title);
      let slug = baseSlug;
      let suffix = 2;
      while (await this.repository.existsSlugExcludingId(slug, id)) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
      }
      slugPatch = { slug };
    }

    const authorId =
      userId && mongoose.isValidObjectId(userId)
        ? new mongoose.Types.ObjectId(userId)
        : undefined;

    const publishPatch =
      input.isPublished === true
        ? { publishedAt: new Date() }
        : input.isPublished === false
          ? { publishedAt: undefined }
          : {};

    const updated = await this.repository.update(id, {
      ...input,
      ...slugPatch,
      updatedBy: authorId,
      ...publishPatch,
    });

    if (!updated) return null;

    return {
      id: String(updated._id),
      slug: updated.slug,
      title: updated.title,
      excerpt: updated.excerpt,
      content: updated.content,
      coverImageUrl: updated.coverImageUrl,
      publishedAt: updated.publishedAt?.toISOString(),
    };
  }

  async delete(id: string) {
    return this.repository.delete(id);
  }
}

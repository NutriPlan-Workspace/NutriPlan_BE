import { z } from 'zod';

export const ArticleCreateSchema = z.object({
  title: z.string().min(3),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  coverImageUrl: z.string().url().optional(),
  isPublished: z.boolean().optional(),
});

export const ArticleUpdateSchema = z.object({
  title: z.string().min(3).optional(),
  excerpt: z.string().optional(),
  content: z.string().min(1).optional(),
  coverImageUrl: z.string().url().optional(),
  isPublished: z.boolean().optional(),
});

export const ArticleListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export const ArticleAdminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  published: z
    .preprocess((v) => {
      if (v === undefined || v === null || v === '') return undefined;
      if (v === 'true') return true;
      if (v === 'false') return false;
      return v;
    }, z.boolean().optional())
    .optional(),
});

export type ArticleCreateInput = z.infer<typeof ArticleCreateSchema>;
export type ArticleUpdateInput = z.infer<typeof ArticleUpdateSchema>;
export type ArticleListQuery = z.infer<typeof ArticleListQuerySchema>;
export type ArticleAdminListQuery = z.infer<typeof ArticleAdminListQuerySchema>;

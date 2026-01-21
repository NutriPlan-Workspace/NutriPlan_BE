import { model, PaginateModel, Schema } from 'mongoose';
import MongooseDelete, { SoftDeleteModel } from 'mongoose-delete';
import paginate from 'mongoose-paginate-v2';

import type { Article } from '@/types/article.types';

const ArticleSchema = new Schema<Article>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    excerpt: { type: String, required: false },
    content: { type: String, required: true },
    coverImageUrl: { type: String, required: false },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, required: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  },
  { timestamps: true, autoCreate: true },
);

ArticleSchema.plugin(MongooseDelete, {
  deletedAt: true,
  overrideMethods: true,
});
ArticleSchema.plugin(paginate);

export const ArticleModel = model<Article>(
  'Article',
  ArticleSchema,
) as SoftDeleteModel<Article> & PaginateModel<Article>;

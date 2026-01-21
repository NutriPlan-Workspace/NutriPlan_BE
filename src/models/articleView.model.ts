import { model, Schema } from 'mongoose';

import type { ArticleView } from '@/types';

const ArticleViewSchema = new Schema<ArticleView>(
  {
    articleId: { type: Schema.Types.ObjectId, ref: 'Article', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    source: { type: String, required: false },
  },
  { timestamps: true, autoCreate: true },
);

export const ArticleViewModel = model<ArticleView>(
  'ArticleView',
  ArticleViewSchema,
);

export default ArticleViewModel;

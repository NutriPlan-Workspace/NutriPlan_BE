import { ArticleModel } from '@/models/article.model';
import type { Article } from '@/types/article.types';

import { BaseRepository } from './base.repository';

export class ArticleRepository extends BaseRepository<Article> {
  constructor() {
    super(ArticleModel);
  }

  getBySlug(slug: string) {
    return ArticleModel.findOne({ slug }).exec();
  }

  existsSlug(slug: string) {
    return ArticleModel.exists({ slug });
  }

  existsSlugExcludingId(slug: string, excludeId: string) {
    return ArticleModel.exists({ slug, _id: { $ne: excludeId } });
  }
}

import { CategoryModel } from '@/models/category.model';
import type { Category } from '@/types';

import { BaseRepository } from './base.repository';

export class CategoryRepository extends BaseRepository<Category> {
  constructor() {
    super(CategoryModel);
  }
}

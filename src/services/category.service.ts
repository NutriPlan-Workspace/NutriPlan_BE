import { FilterQuery } from 'mongoose';

import { CATEGORIES_BY_GROUP, FOOD_CATEGORIES } from '@/constants/category';
import { CategoryRepository } from '@/repositories/category.repository';
import type { Category } from '@/types';

export class CategoryService {
  private repository: CategoryRepository;

  constructor() {
    this.repository = new CategoryRepository();
  }

  async listAll() {
    return this.repository.getList({}, undefined, undefined);
  }

  async listAdmin(params: { page: number; limit: number; q?: string }) {
    const { page, limit, q } = params;
    const query: FilterQuery<Category> = {};
    if (q) {
      query.label = { $regex: q, $options: 'i' };
    }
    return this.repository.paginate(query, {
      page,
      limit,
      sort: { value: 1 },
    });
  }

  async createCategory(data: Partial<Category>) {
    return this.repository.create(data);
  }

  async updateCategory(id: string, data: Partial<Category>) {
    return this.repository.update(id, data);
  }

  async deleteCategory(id: string) {
    return this.repository.delete(id);
  }

  buildSeedData(): Category[] {
    const groupLookup = new Map<number, { group: string; mainItem?: number }>();
    for (const group of CATEGORIES_BY_GROUP) {
      for (const item of group.items) {
        groupLookup.set(item, { group: group.group, mainItem: group.mainItem });
      }
    }

    return FOOD_CATEGORIES.map((item) => {
      const meta = groupLookup.get(item.value);
      return {
        label: item.label,
        value: item.value,
        group: meta?.group ?? 'Other',
        mainItem: meta?.mainItem,
      } as Category;
    });
  }
}

export default new CategoryService();

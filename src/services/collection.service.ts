import { FilterQuery } from 'mongoose';

import { CollectionRepository } from '@/repositories/collection.repository';
import type { Collection } from '@/types';

export class CollectionService {
  private repository: CollectionRepository;

  constructor() {
    this.repository = new CollectionRepository();
  }

  async createCollection(data: Partial<Collection>): Promise<Collection> {
    return this.repository.create(data);
  }

  async getCollectionById(id: string): Promise<Collection | null> {
    return this.repository.getById(id);
  }

  async updateCollection(
    id: string,
    data: Partial<Collection>,
  ): Promise<Collection | null> {
    return this.repository.update(id, data);
  }

  async deleteCollection(id: string): Promise<{ deletedCount: number }> {
    return this.repository.delete(id);
  }

  async restoreCollection(id: string): Promise<Collection | null> {
    return this.repository.restoreById(id);
  }

  async getList(
    userId: string,
    q?: string,
    page = 1,
    limit = 10,
  ): Promise<Collection[]> {
    const query: FilterQuery<Collection> = { userId };

    if (q) {
      query.title = { $regex: q, $options: 'i' };
    }

    return this.repository.getList(
      query,
      {},
      { skip: (page - 1) * limit, limit },
    );
  }

  async getFavoriteFoods(userId: string) {
    const query: FilterQuery<Collection> = { userId, isFavorites: true };
    return this.repository.getList(query, {});
  }

  async updateFavoriteFood(
    userId: string,
    data: Partial<Collection>,
  ): Promise<Collection | null> {
    const favoriteCollection = await this.getFavoriteFoods(userId);
    const collection = favoriteCollection[0];
    if (!collection?._id) {
      return null;
    }
    const updated = await this.repository.update(
      collection._id.toString(),
      data,
      {},
      { new: true },
    );

    return updated;
  }
}

export default new CollectionService();

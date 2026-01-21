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

    const [collections, defaults] = await Promise.all([
      this.repository.getList(query, {}, { skip: (page - 1) * limit, limit }),
      this.ensureDefaultCollections(userId),
    ]);

    const defaultItems = [defaults.favorites, defaults.exclusions].filter(
      (item): item is Collection => Boolean(item),
    );

    const merged = [...defaultItems, ...collections].reduce<Collection[]>(
      (acc, item) => {
        if (
          acc.some(
            (existing) => existing._id?.toString() === item._id?.toString(),
          )
        ) {
          return acc;
        }
        acc.push(item);
        return acc;
      },
      [],
    );

    return merged;
  }

  private async ensureDefaultCollections(userId: string) {
    const queryBase = { userId: userId as unknown as Collection['userId'] };
    const [favorites, exclusions] = await Promise.all([
      this.repository.getList({ ...queryBase, isFavorites: true }, {}),
      this.repository.getList({ ...queryBase, isExclusions: true }, {}),
    ]);

    let favoriteCollection = favorites[0] ?? null;
    let exclusionCollection = exclusions[0] ?? null;

    if (!favoriteCollection) {
      favoriteCollection = await this.repository.create({
        userId: queryBase.userId,
        title: 'Favorites',
        img: '',
        description: '',
        foods: [],
        isFavorites: true,
      });
    }

    if (!exclusionCollection) {
      exclusionCollection = await this.repository.create({
        userId: queryBase.userId,
        title: 'Exclusions',
        img: '',
        description: 'Foods to exclude from search and meal plans.',
        foods: [],
        isExclusions: true,
      });
    }

    return { favorites: favoriteCollection, exclusions: exclusionCollection };
  }

  async adminListCollections(params: {
    page: number;
    limit: number;
    q?: string;
    userId?: string;
    isCurated?: boolean;
  }) {
    const { page, limit, q, userId, isCurated } = params;
    const query: FilterQuery<Collection> = {};

    if (q) {
      query.title = { $regex: q, $options: 'i' };
    }

    if (userId) {
      query.userId = userId as unknown as Collection['userId'];
    }

    if (typeof isCurated === 'boolean') {
      query.isCurated = isCurated;
    }

    return this.repository.paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: {
        path: 'userId',
        select: 'fullName email',
      },
    });
  }

  async getCuratedCollections(params: {
    page: number;
    limit: number;
    q?: string;
  }) {
    const { page, limit, q } = params;
    const query: FilterQuery<Collection> = { isCurated: true };

    if (q) {
      query.title = { $regex: q, $options: 'i' };
    }

    return this.repository.paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 },
    });
  }

  async getFavoriteFoods(userId: string) {
    const query: FilterQuery<Collection> = { userId, isFavorites: true };
    return this.repository.getList(query, {});
  }

  async getExclusionCollection(userId: string) {
    const query: FilterQuery<Collection> = { userId, isExclusions: true };
    const collections = await this.repository.getList(
      query,
      {},
      undefined,
      'foods.food',
    );
    if (collections.length > 0) return collections[0];

    return this.repository.create({
      userId: userId as unknown as Collection['userId'],
      title: 'Exclusions',
      img: '',
      description: 'Foods to exclude from search and meal plans.',
      foods: [],
      isExclusions: true,
    });
  }

  async updateExclusionFoods(userId: string, foods: Collection['foods']) {
    const collection = await this.getExclusionCollection(userId);
    await this.repository.update(
      collection._id.toString(),
      { foods },
      {},
      { new: true },
    );
    return this.repository.getById(collection._id.toString());
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

import { QueryOptions } from 'mongoose';

import { CollectionModel } from '@/models';
import type { Collection } from '@/types';

import { BaseRepository } from './base.repository';

export class CollectionRepository extends BaseRepository<Collection> {
  constructor() {
    super(CollectionModel);
  }

  override getById(
    id: string,
    projection?: Record<string, unknown> | string | string[],
    options?: QueryOptions,
  ): Promise<Collection | null> {
    return CollectionModel.findById(id, projection, options || {})
      .populate('foods.food')
      .exec();
  }
}

import { FilterQuery } from 'mongoose';

import { FoodModel } from '@/models/food.model';
import type { Food } from '@/types';

import { BaseRepository } from './base.repository';

export class FoodRepository extends BaseRepository<Food> {
  constructor() {
    super(FoodModel);
  }

  async getByIds(ingredientFoodIds: string[]): Promise<Food[]> {
    return FoodModel.find({ _id: { $in: ingredientFoodIds } }).exec();
  }

  search(query: FilterQuery<Food> = {}, limit = 100): Promise<Food[]> {
    return FoodModel.find(query).limit(limit);
  }
}

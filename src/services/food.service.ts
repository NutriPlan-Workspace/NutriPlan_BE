import { FilterQuery, UpdateQuery } from 'mongoose';

import { FoodRepository } from '@/repositories/food.repository';
import type { Food, FoodWithIngredients } from '@/types';

export class FoodService {
  private repository: FoodRepository;

  constructor() {
    this.repository = new FoodRepository();
  }

  create(data: Partial<Food>): Promise<Food> {
    return this.repository.create(data);
  }

  getList(query: FilterQuery<Food> = {}): Promise<Food[]> {
    return this.repository.getList(query);
  }

  async getById(id: string): Promise<FoodWithIngredients | null> {
    const mainFood = await this.repository.getById(id);
    if (!mainFood) return null;

    const ingredientFoodIds = mainFood.ingredients.map(({ ingredientFoodId }) =>
      ingredientFoodId.toString(),
    );

    const ingredientList = await this.repository.getByIds(ingredientFoodIds);

    return { mainFood, ingredientList };
  }

  update(id: string, data: UpdateQuery<Food>): Promise<Food | null> {
    return this.repository.update(id, data);
  }

  delete(id: string): Promise<{ deletedCount: number }> {
    return this.repository.delete(id);
  }

  restoreById(id: string): Promise<Food | null> {
    return this.repository.restoreById(id);
  }
}

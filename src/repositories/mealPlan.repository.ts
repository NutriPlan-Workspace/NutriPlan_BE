import { FilterQuery } from 'mongoose';

import { MealPlanModel } from '@/models/mealPlan.model';
import type { MealPlan } from '@/types';

import { BaseRepository } from './base.repository';

export class MealPlanRepository extends BaseRepository<MealPlan> {
  constructor() {
    super(MealPlanModel);
  }

  private populateMeal = (mealPath: string) => ({
    path: `${mealPath}.foodId`,
    populate: {
      path: 'ingredients.ingredientFoodId',
      select: 'name',
    },
  });

  async getList(query: FilterQuery<MealPlan> = {}): Promise<MealPlan[]> {
    return MealPlanModel.find(query)
      .populate(this.populateMeal('mealItems.breakfast'))
      .populate(this.populateMeal('mealItems.lunch'))
      .populate(this.populateMeal('mealItems.dinner'))
      .exec();
  }
}

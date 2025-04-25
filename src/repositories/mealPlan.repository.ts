import { FilterQuery } from 'mongoose';

import { MealPlanModel } from '@/models/mealPlan.model';
import type { MealPlan, PopulatedMealPlanIngre } from '@/types';

import { BaseRepository } from './base.repository';

export class MealPlanRepository extends BaseRepository<MealPlan> {
  constructor() {
    super(MealPlanModel);
  }

  private populateMeal = (mealPath: string) => ({
    path: `${mealPath}.foodId`,
    populate: {
      path: 'ingredients.ingredientFoodId',
      select: '_id name units imgUrls nutrition amount ',
    },
  });

  async getListPopulate(
    query: FilterQuery<MealPlan> = {},
  ): Promise<PopulatedMealPlanIngre[]> {
    const result = await MealPlanModel.find(query)
      .populate(this.populateMeal('mealItems.breakfast'))
      .populate(this.populateMeal('mealItems.lunch'))
      .populate(this.populateMeal('mealItems.dinner'))
      .exec();

    return result as unknown as PopulatedMealPlanIngre[];
  }

  async getLatestMealPlan(
    date: Date,
    userId: string,
  ): Promise<MealPlan | null> {
    return MealPlanModel.findOne({
      userId,
      mealDate: { $lte: date },
    })
      .populate(this.populateMeal('mealItems.breakfast'))
      .populate(this.populateMeal('mealItems.lunch'))
      .populate(this.populateMeal('mealItems.dinner'))
      .sort({ mealDate: -1 })
      .exec();
  }
}

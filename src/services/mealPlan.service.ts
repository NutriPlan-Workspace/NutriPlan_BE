import { Schema, Types } from 'mongoose';

import { MealPlanRepository } from '@/repositories/mealPlan.repository';
import type { MealPlan } from '@/types';
import { getWeekRange } from '@/utils/date';

class MealPlanService {
  private mealPlanRepository: MealPlanRepository;

  constructor() {
    this.mealPlanRepository = new MealPlanRepository();
  }

  async getMealPlanByDate(date: Date, userId: string) {
    return await this.mealPlanRepository.getList({
      userId,
      mealDate: date,
    });
  }

  async getLatestMealPlan(date: Date, userId: string) {
    return await this.mealPlanRepository.getLatestMealPlan(date, userId);
  }

  async getMealPlanByRange(from: Date, to: Date, userId: string) {
    return this.mealPlanRepository.getList({
      userId,
      mealDate: { $gte: from, $lte: to },
    });
  }

  async getMealPlanByWeek(date: Date, userId: string) {
    const { startOfWeek, endOfWeek } = getWeekRange(new Date(date));
    return this.mealPlanRepository.getList({
      userId,
      mealDate: { $gte: startOfWeek, $lte: endOfWeek },
    });
  }

  async addFoodToMealPlan(mealItem: MealPlan, userId: string) {
    return this.mealPlanRepository.create({
      userId: new Types.ObjectId(userId) as unknown as Schema.Types.ObjectId,
      mealDate: mealItem.mealDate,
      mealItems: {
        breakfast: mealItem.mealItems.breakfast || [],
        lunch: mealItem.mealItems.lunch || [],
        dinner: mealItem.mealItems.dinner || [],
      },
    });
  }

  async editDayMealPlan(mealPlanId: string, mealPlanData: Partial<MealPlan>) {
    const mealPlan = await this.mealPlanRepository.getById(mealPlanId);
    if (!mealPlan) {
      return null;
    }
    const updatedMealPlan = await this.mealPlanRepository.update(mealPlanId, {
      mealItems: mealPlanData.mealItems,
    });
    return updatedMealPlan;
  }

  async removeMealPlan(mealPlanId: string) {
    const mealPlan = await this.mealPlanRepository.getById(mealPlanId);

    if (!mealPlan) return null;

    return this.mealPlanRepository.delete(mealPlanId);
  }
}

export default new MealPlanService();

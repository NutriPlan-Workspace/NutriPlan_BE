import { Schema, Types } from 'mongoose';

import { MealPlanRepository } from '@/repositories/mealPlan.repository';
import type { MealPlan, PopulatedMealPlanIngre } from '@/types';
import { getWeekRange } from '@/utils/date';

class MealPlanService {
  private mealPlanRepository: MealPlanRepository;

  constructor() {
    this.mealPlanRepository = new MealPlanRepository();
  }

  async getMealPlanByDate(date: Date, userId: string) {
    return await this.mealPlanRepository.getListPopulate({
      userId,
      mealDate: date,
    });
  }

  async getLatestMealPlan(date: Date, userId: string) {
    return await this.mealPlanRepository.getLatestMealPlan(date, userId);
  }

  async getMealPlanByRange(from: Date, to: Date, userId: string) {
    return this.mealPlanRepository.getListPopulate({
      userId,
      mealDate: { $gte: from, $lte: to },
    });
  }

  async getMealPlanByWeek(date: Date, userId: string) {
    const { startOfWeek, endOfWeek } = getWeekRange(new Date(date));
    return this.mealPlanRepository.getListPopulate({
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

  async getGroceries(mealPlanData: PopulatedMealPlanIngre[]) {
    const ingredientMap: Record<
      string,
      {
        name: string;
        totalAmount: number;
        unit: {
          description: string;
          amount: number;
          // _id: string;
        };
        units: { amount: number; description: string }[];
        nutrition: {
          calories: number;
          carbs: number;
          fats: number;
          proteins: number;
          fiber: number;
          sodium: number;
          cholesterol: number;
        };
        ingredientId: string;
        imgUrls: string[];
        foodDetails: {
          name: string;
          date: string;
          imgUrls: string[];
          amount: number;
          description: string;
        }[];
      }
    > = {};

    const mealTypes = ['breakfast', 'lunch', 'dinner'] as const;

    for (const plan of mealPlanData) {
      if (!plan) continue;

      const planDate = plan.mealDate;

      for (const mealType of mealTypes) {
        const mealItems = plan.mealItems[mealType] || [];

        for (const item of mealItems) {
          if (!item) continue;
          const ingredients = item.foodId?.ingredients || [];
          const check = item.unit === item.foodId.defaultUnit;

          for (const ing of ingredients) {
            const ingredient = ing.ingredientFoodId;

            if (!ingredient) continue;

            const key = ingredient._id.toString();
            const unitIndex = ing.unit;
            let ingredientAmount = ing.amount;

            const unit = ingredient.units[unitIndex];
            if (check) {
              ingredientAmount =
                (item.amount * ing.amount) /
                item.foodId.units[item.foodId.defaultUnit].amount;
            } else {
              ingredientAmount =
                (item.amount * ing.amount) /
                item.foodId.units[item.unit].amount;
            }
            if (!ingredientMap[key]) {
              ingredientMap[key] = {
                name: ingredient.name,
                totalAmount: ingredientAmount,
                unit: unit,
                ingredientId: ingredient._id.toString(),
                imgUrls: ingredient.imgUrls || [],
                units: ingredient.units,
                nutrition: {
                  calories: ingredient.nutrition.calories,
                  carbs: ingredient.nutrition.carbs,
                  fats: ingredient.nutrition?.fat || 0,
                  proteins: ingredient.nutrition.proteins,
                  fiber: ingredient.nutrition.fiber,
                  sodium: ingredient.nutrition.sodium,
                  cholesterol: ingredient.nutrition.cholesterol,
                },
                foodDetails: [
                  {
                    name: item.foodId.name,
                    date: planDate.toISOString(),
                    imgUrls: item.foodId.imgUrls,
                    amount: ingredientAmount,
                    description: ingredient.units[unitIndex].description,
                  },
                ],
              };
            } else {
              if (ingredientMap[key].unit.description === unit?.description) {
                ingredientMap[key].totalAmount += ingredientAmount;
              } else {
                ingredientMap[key].totalAmount +=
                  (ingredientAmount * ingredientMap[key].unit.amount) /
                  unit?.amount;
              }
              if (
                !ingredientMap[key].foodDetails.some(
                  (detail) =>
                    detail.name === item.foodId.name &&
                    detail.date === planDate.toISOString().split('T')[0],
                )
              ) {
                ingredientMap[key].foodDetails.push({
                  name: item.foodId.name,
                  date: planDate.toISOString(),
                  imgUrls: item.foodId.imgUrls,
                  amount: ingredientAmount,
                  description: ingredient.units[unitIndex].description,
                });
              }
            }
          }
        }
      }
    }

    return Object.values(ingredientMap);
  }
}

export default new MealPlanService();

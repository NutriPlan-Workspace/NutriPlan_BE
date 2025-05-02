import _ from 'lodash';
import { Schema, Types } from 'mongoose';

import { EXCLUDED_BY_DIET } from '@/constants/category';
import { MealPlanRepository } from '@/repositories/mealPlan.repository';
import { UserRepository } from '@/repositories/user.repository';
import type { MealPlanPreferences } from '@/schemas/mealPlan.schema';
import type {
  MealPlan,
  NutritionGoalsType,
  PopulatedMealPlanIngre,
} from '@/types';
import type {
  GeneratedMealPlan,
  MealPlanForUser,
} from '@/types/mealPlan.types';
import { ChooseMeal } from '@/utils/chooseMeal';
import { getWeekRange } from '@/utils/date';

class MealPlanService {
  private mealPlanRepository: MealPlanRepository;
  private userRepository: UserRepository;
  private chooseMeal: ChooseMeal;

  constructor() {
    this.mealPlanRepository = new MealPlanRepository();
    this.userRepository = new UserRepository();
    this.chooseMeal = new ChooseMeal();
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
                  fats: ingredient.nutrition.fats || 0,
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

  async autoGenerateMealPlanForUser(
    date: Date,
    userId: string,
  ): Promise<PopulatedMealPlanIngre | null> {
    const userPreferences = await this.getUserPreferences(userId);
    if (!userPreferences) {
      return null;
    }

    const mealPlan = await this.generateMealPlanForUser(date, userPreferences);
    if (!mealPlan) {
      return null;
    }

    const savedMealPlan = await this.mealPlanRepository.create({
      userId: new Types.ObjectId(userId) as unknown as Schema.Types.ObjectId,
      mealDate: date,
      mealItems: mealPlan,
    });

    const populatedMealPlan = await this.mealPlanRepository.getListPopulate({
      _id: savedMealPlan._id,
    });

    if (!populatedMealPlan[0]) {
      return null;
    }
    return populatedMealPlan[0].toObject();
  }

  private async getUserPreferences(
    userId: string,
  ): Promise<NutritionGoalsType | null> {
    const user = await this.userRepository.getById(userId, {
      nutritionGoals: 1,
    });
    if (!user?.nutritionGoals) {
      return null;
    }

    return user.nutritionGoals;
  }

  private getMealNutritionTargets(
    preferences: NutritionGoalsType,
    ratio: number,
  ): NutritionGoalsType {
    return {
      calories: Math.round(preferences.calories * ratio),
      proteinTarget: {
        from: Math.round(preferences.proteinTarget.from * ratio),
        to: Math.round(preferences.proteinTarget.to * ratio),
      },
      carbTarget: {
        from: Math.round(preferences.carbTarget.from * ratio),
        to: Math.round(preferences.carbTarget.to * ratio),
      },
      fatTarget: {
        from: Math.round(preferences.fatTarget.from * ratio),
        to: Math.round(preferences.fatTarget.to * ratio),
      },
    };
  }

  private async generateMealPlanForUser(
    date: Date,
    preferences: NutritionGoalsType,
  ): Promise<MealPlanForUser | null> {
    const breakfastMainCategories = [10, 66];
    const breakfastSideCategories = [28, 13];

    const lunchMainCategories = [43, 5];
    const lunchSideCategories = [54, 9];

    const dinnerMainCategories = [10, 66];
    const dinnerSideCategories = [28, 13];

    const breakfastTargets = this.getMealNutritionTargets(preferences, 0.3);
    const lunchTargets = this.getMealNutritionTargets(preferences, 0.4);
    const dinnerTargets = this.getMealNutritionTargets(preferences, 0.3);

    const [breakfastResult, lunchResult, dinnerResult] = await Promise.all([
      this.chooseMeal.getMealsByCategories(
        breakfastMainCategories,
        breakfastSideCategories,
        breakfastTargets,
        'lunch',
      ),
      this.chooseMeal.getMealsByCategories(
        lunchMainCategories,
        lunchSideCategories,
        lunchTargets,
        'lunch',
      ),
      this.chooseMeal.getMealsByCategories(
        dinnerMainCategories,
        dinnerSideCategories,
        dinnerTargets,
        'dinner',
      ),
    ]);

    if (
      !breakfastResult.mainDish ||
      !breakfastResult.sideDish ||
      !lunchResult.mainDish ||
      !lunchResult.sideDish ||
      !dinnerResult.mainDish ||
      !dinnerResult.sideDish
    ) {
      return null;
    }

    const breakfastMainDishId = breakfastResult.mainDish.food
      ._id as unknown as Schema.Types.ObjectId;
    const breakfastSideDishId = breakfastResult.sideDish.food
      ._id as unknown as Schema.Types.ObjectId;

    const lunchMainDishId = lunchResult.mainDish.food
      ._id as unknown as Schema.Types.ObjectId;
    const lunchSideDishId = lunchResult.sideDish.food
      ._id as unknown as Schema.Types.ObjectId;

    const dinnerMainDishId = dinnerResult.mainDish.food
      ._id as unknown as Schema.Types.ObjectId;
    const dinnerSideDishId = dinnerResult.sideDish.food
      ._id as unknown as Schema.Types.ObjectId;

    return {
      breakfast: [
        {
          foodId: breakfastMainDishId,
          amount:
            breakfastResult.mainDish.serving *
            breakfastResult.mainDish.food.units[
              breakfastResult.mainDish.food.defaultUnit
            ].amount,
          unit: breakfastResult.mainDish.food.defaultUnit,
        },
        {
          foodId: breakfastSideDishId,
          amount:
            breakfastResult.sideDish.serving *
            breakfastResult.sideDish.food.units[
              breakfastResult.sideDish.food.defaultUnit
            ].amount,
          unit: breakfastResult.sideDish.food.defaultUnit,
        },
      ],
      lunch: [
        {
          foodId: lunchMainDishId,
          amount:
            lunchResult.mainDish.serving *
            lunchResult.mainDish.food.units[
              lunchResult.mainDish.food.defaultUnit
            ].amount,
          unit: lunchResult.mainDish.food.defaultUnit,
        },
        {
          foodId: lunchSideDishId,
          amount:
            lunchResult.sideDish.serving *
            lunchResult.sideDish.food.units[
              lunchResult.sideDish.food.defaultUnit
            ].amount,
          unit: lunchResult.sideDish.food.defaultUnit,
        },
      ],
      dinner: [
        {
          foodId: dinnerMainDishId,
          amount:
            dinnerResult.mainDish.serving *
            dinnerResult.mainDish.food.units[
              dinnerResult.mainDish.food.defaultUnit
            ].amount,
          unit: dinnerResult.mainDish.food.defaultUnit,
        },
        {
          foodId: dinnerSideDishId,
          amount:
            dinnerResult.sideDish.serving *
            dinnerResult.sideDish.food.units[
              dinnerResult.sideDish.food.defaultUnit
            ].amount,
          unit: dinnerResult.sideDish.food.defaultUnit,
        },
      ],
    };
  }

  async autoGenerateMealPlanForDemo(
    date: Date,
    preferences: MealPlanPreferences,
  ): Promise<PopulatedMealPlanIngre | null> {
    const mealPlan = await this.generateMealPlanForDemo(date, preferences);
    if (!mealPlan) {
      return null;
    }

    const convertedMealPlan = {
      mealDate: mealPlan.mealDate,
      mealItems: {
        breakfast: mealPlan.mealItems.breakfast.map((item) => ({
          foodId: item.foodId._id as unknown as Schema.Types.ObjectId,
          amount: item.amount,
          unit: item.unit,
        })),
        lunch: mealPlan.mealItems.lunch.map((item) => ({
          foodId: item.foodId._id as unknown as Schema.Types.ObjectId,
          amount: item.amount,
          unit: item.unit,
        })),
        dinner: mealPlan.mealItems.dinner.map((item) => ({
          foodId: item.foodId._id as unknown as Schema.Types.ObjectId,
          amount: item.amount,
          unit: item.unit,
        })),
      },
    };

    const savedMealPlan = await this.mealPlanRepository.create({
      ...convertedMealPlan,
    });

    const populatedMealPlan = await this.mealPlanRepository.getListPopulate({
      _id: savedMealPlan._id,
    });

    return populatedMealPlan[0] || null;
  }

  private async generateMealPlanForDemo(
    _date: Date,
    preferences: MealPlanPreferences,
  ): Promise<GeneratedMealPlan | null> {
    const nutritionRanges: NutritionGoalsType = {
      calories: preferences.calories,
      proteinTarget: {
        from: Math.round(preferences.protein * 0.6),
        to: Math.round(preferences.protein * 1.4),
      },
      carbTarget: {
        from: Math.round(preferences.carbs * 0.6),
        to: Math.round(preferences.carbs * 1.4),
      },
      fatTarget: {
        from: Math.round(preferences.fat * 0.6),
        to: Math.round(preferences.fat * 1.4),
      },
    };

    const breakfastTargets = this.getMealNutritionTargets(nutritionRanges, 0.3);
    const lunchTargets = this.getMealNutritionTargets(nutritionRanges, 0.4);
    const dinnerTargets = this.getMealNutritionTargets(nutritionRanges, 0.3);

    const allCategoryIds = _.range(1, 137);
    const excluded: number[] = EXCLUDED_BY_DIET[preferences.type] || [];
    const filteredCategoryIds = allCategoryIds.filter(
      (id) => !excluded.includes(id),
    );

    const [breakfastResult, lunchResult, dinnerResult] = await Promise.all([
      this.chooseMeal.getMealsByCategories(
        filteredCategoryIds,
        filteredCategoryIds,
        breakfastTargets,
        'lunch',
      ),
      this.chooseMeal.getMealsByCategories(
        filteredCategoryIds,
        filteredCategoryIds,
        lunchTargets,
        'lunch',
      ),
      this.chooseMeal.getMealsByCategories(
        filteredCategoryIds,
        filteredCategoryIds,
        dinnerTargets,
        'dinner',
      ),
    ]);

    if (
      !breakfastResult.mainDish ||
      !breakfastResult.sideDish ||
      !lunchResult.mainDish ||
      !lunchResult.sideDish ||
      !dinnerResult.mainDish ||
      !dinnerResult.sideDish
    ) {
      return null;
    }

    return {
      mealDate: _date,
      mealItems: {
        breakfast: [
          {
            foodId: breakfastResult.mainDish.food,
            amount:
              breakfastResult.mainDish.serving *
              breakfastResult.mainDish.food.units[
                breakfastResult.mainDish.food.defaultUnit
              ].amount,
            unit: breakfastResult.mainDish.food.defaultUnit,
          },
          {
            foodId: breakfastResult.sideDish.food,
            amount:
              breakfastResult.sideDish.serving *
              breakfastResult.sideDish.food.units[
                breakfastResult.sideDish.food.defaultUnit
              ].amount,
            unit: breakfastResult.sideDish.food.defaultUnit,
          },
        ],
        lunch: [
          {
            foodId: lunchResult.mainDish.food,
            amount:
              lunchResult.mainDish.serving *
              lunchResult.mainDish.food.units[
                lunchResult.mainDish.food.defaultUnit
              ].amount,
            unit: lunchResult.mainDish.food.defaultUnit,
          },
          {
            foodId: lunchResult.sideDish.food,
            amount:
              lunchResult.sideDish.serving *
              lunchResult.sideDish.food.units[
                lunchResult.sideDish.food.defaultUnit
              ].amount,
            unit: lunchResult.sideDish.food.defaultUnit,
          },
        ],
        dinner: [
          {
            foodId: dinnerResult.mainDish.food,
            amount:
              dinnerResult.mainDish.serving *
              dinnerResult.mainDish.food.units[
                dinnerResult.mainDish.food.defaultUnit
              ].amount,
            unit: dinnerResult.mainDish.food.defaultUnit,
          },
          {
            foodId: dinnerResult.sideDish.food,
            amount:
              dinnerResult.sideDish.serving *
              dinnerResult.sideDish.food.units[
                dinnerResult.sideDish.food.defaultUnit
              ].amount,
            unit: dinnerResult.sideDish.food.defaultUnit,
          },
        ],
      },
    };
  }
}

export default new MealPlanService();

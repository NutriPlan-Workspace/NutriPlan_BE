import { FilterQuery, PipelineStage } from 'mongoose';

import type { DishType, PreferredFoodType } from '@/constants/food';
import type { ExpressionCondition, Food, Per100CaloriesFilters } from '@/types';

export const addNutritionRange = (
  query: FilterQuery<Food>,
  field: string,
  min?: number,
  max?: number,
  additional?: FilterQuery<Food>[string],
) => {
  if (min !== undefined || max !== undefined) {
    query[`nutrition.${field}`] = {
      ...(additional ?? {}),
      ...(min !== undefined && { $gte: min }),
      ...(max !== undefined && { $lte: max }),
    };
  }
};

export const addComputedNutritionFields = () => ({
  $addFields: {
    computedProtein: {
      $cond: [
        { $gt: ['$nutrition.calories', 0] },
        {
          $divide: [
            { $multiply: [100, '$nutrition.proteins'] },
            '$nutrition.calories',
          ],
        },
        0,
      ],
    },
    computedCarb: {
      $cond: [
        { $gt: ['$nutrition.calories', 0] },
        {
          $divide: [
            { $multiply: [100, '$nutrition.carbs'] },
            '$nutrition.calories',
          ],
        },
        0,
      ],
    },
    computedFat: {
      $cond: [
        { $gt: ['$nutrition.calories', 0] },
        {
          $divide: [
            { $multiply: [100, '$nutrition.fats'] },
            '$nutrition.calories',
          ],
        },
        0,
      ],
    },
    computedFiber: {
      $cond: [
        { $gt: ['$nutrition.calories', 0] },
        {
          $divide: [
            { $multiply: [100, '$nutrition.fiber'] },
            '$nutrition.calories',
          ],
        },
        0,
      ],
    },
    computedSodium: {
      $cond: [
        { $gt: ['$nutrition.calories', 0] },
        {
          $divide: [
            { $multiply: [100, '$nutrition.sodium'] },
            '$nutrition.calories',
          ],
        },
        0,
      ],
    },
  },
});

export const buildPer100CaloriesMatchExpr = ({
  minPer100CaloriesProteins,
  maxPer100CaloriesCarbs,
  maxPer100CaloriesFats,
  minPer100CaloriesFiber,
  maxPer100CaloriesSodium,
}: Per100CaloriesFilters): PipelineStage.Match => {
  const expr: ExpressionCondition[] = [];

  if (minPer100CaloriesProteins !== undefined) {
    expr.push({ $gte: ['$computedProtein', minPer100CaloriesProteins] });
  }
  if (minPer100CaloriesFiber !== undefined) {
    expr.push({ $gte: ['$computedFiber', minPer100CaloriesFiber] });
  }
  if (maxPer100CaloriesCarbs !== undefined) {
    expr.push({ $lte: ['$computedCarb', maxPer100CaloriesCarbs] });
  }
  if (maxPer100CaloriesFats !== undefined) {
    expr.push({ $lte: ['$computedFat', maxPer100CaloriesFats] });
  }
  if (maxPer100CaloriesSodium !== undefined) {
    expr.push({ $lte: ['$computedSodium', maxPer100CaloriesSodium] });
  }

  return {
    $match: {
      $expr: {
        $and: expr,
      },
    },
  };
};

export function buildPreferredFoodAndConditions(
  preferredFoodTypes: PreferredFoodType[],
) {
  return preferredFoodTypes.map((type) => {
    const key = `property.is${type.charAt(0).toUpperCase()}${type.slice(1)}`;
    return { [key]: true };
  });
}

export function buildDishTypeAndConditions(dishType: DishType) {
  const key = `property.${dishType}Dish`;
  return [{ [key]: true }];
}

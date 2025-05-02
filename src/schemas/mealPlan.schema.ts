import { z } from 'zod';

import { Food } from '@/types';
import { PrimaryDiet } from '@/types/user.types';

export const autoGenerateMealPlanSchema = z.object({
  date: z.string().datetime().optional(),
  preferences: z
    .object({
      type: z.nativeEnum(PrimaryDiet),
      calories: z.number().min(0),
      carbs: z.number().min(0),
      protein: z.number().min(0),
      fat: z.number().min(0),
    })
    .optional(),
});

export type AutoGenerateMealPlanInput = z.infer<
  typeof autoGenerateMealPlanSchema
>;

export type MealPlanPreferences = {
  type: PrimaryDiet;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
};

export interface GeneratedMealPlan {
  mealDate: Date;
  mealItems: {
    breakfast: {
      foodId: Food;
      amount: number;
      unit: number;
    }[];
    lunch: {
      foodId: Food;
      amount: number;
      unit: number;
    }[];
    dinner: {
      foodId: Food;
      amount: number;
      unit: number;
    }[];
  };
}

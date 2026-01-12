import { z } from 'zod';

import { ERROR_MESSAGE } from '@/constants/messages';
import { Food } from '@/types';
import { PrimaryDiet } from '@/types/user.types';

import { ObjectIdSchema } from './objectId.schema';

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

const MealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner']);

const swapOptionsFoodSchema = z.object({
  swapType: z.literal('food'),
  mealType: MealTypeSchema,
  targetFoodId: ObjectIdSchema.optional(),
  targetItemId: ObjectIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(20).optional(),
  tolerance: z.coerce.number().min(0.01).max(0.5).optional(),
});

const swapOptionsMealSchema = z.object({
  swapType: z.literal('meal'),
  mealType: MealTypeSchema,
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

export const mealPlanSwapOptionsSchema = z
  .discriminatedUnion('swapType', [
    swapOptionsFoodSchema,
    swapOptionsMealSchema,
  ])
  .superRefine((data, ctx) => {
    if (data.swapType === 'food' && !data.targetFoodId && !data.targetItemId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: ERROR_MESSAGE.INVALID_PARAMETER,
        path: ['targetFoodId'],
      });
    }
  });

export type MealPlanSwapOptionsInput = z.infer<
  typeof mealPlanSwapOptionsSchema
>;

const swapApplyFoodSchema = z.object({
  swapType: z.literal('food'),
  mealType: MealTypeSchema,
  targetFoodId: ObjectIdSchema.optional(),
  targetItemId: ObjectIdSchema.optional(),
  replacement: z.object({
    foodId: ObjectIdSchema,
    amount: z.number().min(0).optional(),
    unit: z.number().min(0).optional(),
  }),
});

const swapApplyMealSchema = z.object({
  swapType: z.literal('meal'),
  mealType: MealTypeSchema,
  replacement: z.object({
    items: z
      .array(
        z.object({
          foodId: ObjectIdSchema,
          amount: z.number().min(0),
          unit: z.number().min(0),
        }),
      )
      .min(1),
  }),
});

export const mealPlanSwapApplySchema = z
  .discriminatedUnion('swapType', [swapApplyFoodSchema, swapApplyMealSchema])
  .superRefine((data, ctx) => {
    if (data.swapType === 'food' && !data.targetFoodId && !data.targetItemId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: ERROR_MESSAGE.INVALID_PARAMETER,
        path: ['targetFoodId'],
      });
    }
  });

export type MealPlanSwapApplyInput = z.infer<typeof mealPlanSwapApplySchema>;

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

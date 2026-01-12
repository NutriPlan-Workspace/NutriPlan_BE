import z from 'zod';

import {
  DISH_TYPES,
  PREFERRED_FOOD_TYPES,
  PreferredFoodType,
  VALID_FILTERS,
  ValidFilter,
} from '@/constants/food';
import { ERROR_MESSAGE } from '@/constants/messages';

import { PaginationSchema } from './pagination.schema';

export const FoodFilterSchema = PaginationSchema.extend({
  q: z.string().optional(),
  filters: z
    .string()
    .optional()
    .transform((val) => {
      try {
        return val ? JSON.parse(val) : [];
      } catch {
        return null;
      }
    })
    .refine(
      (val) =>
        Array.isArray(val) &&
        val.every((item) => VALID_FILTERS.includes(item as ValidFilter)),
      {
        message: `${ERROR_MESSAGE.INVALID_FILTERS}: ${VALID_FILTERS.join(', ')}`,
      },
    ),

  preferredFoodTypes: z
    .string()
    .optional()
    .transform((val) => {
      try {
        return val ? JSON.parse(val) : [];
      } catch {
        return [];
      }
    })
    .refine(
      (val) =>
        Array.isArray(val) &&
        val.every((type) =>
          PREFERRED_FOOD_TYPES.includes(type as PreferredFoodType),
        ),
      {
        message: `${ERROR_MESSAGE.INVALID_PREFERRED_FOOD} ${PREFERRED_FOOD_TYPES.join(', ')}`,
      },
    ),

  applyExclusions: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (typeof val === 'boolean') return val;
      return val === 'true';
    }),

  minPer100CaloriesProteins: z.coerce.number().optional(),
  maxPer100CaloriesCarbs: z.coerce.number().optional(),
  maxPer100CaloriesFats: z.coerce.number().optional(),
  minPer100CaloriesFiber: z.coerce.number().optional(),
  maxPer100CaloriesSodium: z.coerce.number().optional(),

  dishType: z.enum(DISH_TYPES).optional(),

  searchCollections: z
    .string()
    .optional()
    .transform((val) => val === 'true'),

  collectionIds: z
    .string()
    .optional()
    .transform((val) => {
      try {
        return val ? JSON.parse(val) : [];
      } catch {
        return [];
      }
    }),

  minCalories: z.coerce.number().optional(),
  maxCalories: z.coerce.number().optional(),
  minCarbs: z.coerce.number().optional(),
  maxCarbs: z.coerce.number().optional(),
  minCholesterol: z.coerce.number().optional(),
  maxCholesterol: z.coerce.number().optional(),
  minFats: z.coerce.number().optional(),
  maxFats: z.coerce.number().optional(),
  minFiber: z.coerce.number().optional(),
  maxFiber: z.coerce.number().optional(),
  minProteins: z.coerce.number().optional(),
  maxProteins: z.coerce.number().optional(),
  minSodium: z.coerce.number().optional(),
  maxSodium: z.coerce.number().optional(),
  minSugar: z.coerce.number().optional(),
  maxSugar: z.coerce.number().optional(),
});

export type FoodFilterQuery = z.infer<typeof FoodFilterSchema>;

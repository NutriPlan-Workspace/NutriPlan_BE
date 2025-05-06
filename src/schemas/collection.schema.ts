import { z } from 'zod';

import { ERROR_MESSAGE } from '@/constants/messages';
import { ObjectIdSchema } from '@/schemas/objectId.schema';
import { PaginationSchema } from '@/schemas/pagination.schema';

const FoodItemSchema = z.object({
  food: ObjectIdSchema,
  date: z.coerce.date().optional(),
});

export const CreateCollectionSchema = z.object({
  title: z.string().min(1, ERROR_MESSAGE.TITLE_REQUIRED),
  img: z
    .string()
    .url(ERROR_MESSAGE.INVALID_IMG_URL)
    .optional()
    .or(z.literal('')),
  description: z.string().optional(),
  foods: z.array(FoodItemSchema).optional(),
});

export const collectionQuerySchema = PaginationSchema.extend({
  q: z.string().optional(),
});

export const UpdateCollectionSchema = CreateCollectionSchema.partial();

export const UpdateFavoriteListSchema = z.object({
  foods: z
    .array(
      z.object({
        food: ObjectIdSchema,
        date: z.coerce.date().optional(),
      }),
    )
    .optional(),
});

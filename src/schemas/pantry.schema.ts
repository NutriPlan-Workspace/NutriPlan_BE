import { z } from 'zod';

import { ObjectIdSchema } from '@/schemas/objectId.schema';
import { PaginationSchema } from '@/schemas/pagination.schema';

export const pantryItemSchema = z.object({
  ingredientFoodId: ObjectIdSchema.optional(),
  name: z.string().min(1),
  quantity: z.number().min(0),
  unit: z.string().min(1).optional(),
  status: z.enum(['in_pantry', 'need_buy']).optional(),
  note: z.string().optional(),
});

export const pantryConsumeSchema = z.object({
  items: z.array(
    z.object({
      ingredientFoodId: ObjectIdSchema.optional(),
      name: z.string().min(1),
      quantity: z.number().min(0),
      unit: z.string().min(1).optional(),
    }),
  ),
});

export const pantryQuerySchema = PaginationSchema.extend({
  status: z.enum(['in_pantry', 'need_buy']).optional(),
  q: z.string().optional(),
});

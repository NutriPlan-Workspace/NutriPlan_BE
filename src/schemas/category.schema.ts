import { z } from 'zod';

import { ERROR_MESSAGE } from '@/constants/messages';
import { PaginationSchema } from '@/schemas/pagination.schema';

export const categoryCreateSchema = z.object({
  label: z.string().min(1, ERROR_MESSAGE.INVALID_PARAMETER),
  value: z.coerce.number().min(0),
  group: z.string().min(1, ERROR_MESSAGE.INVALID_PARAMETER),
  mainItem: z.coerce.number().optional(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const categoryAdminListQuerySchema = PaginationSchema.extend({
  q: z.string().optional(),
});

import z from 'zod';

import { ERROR_MESSAGE } from '@/constants/messages';

export const PaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => Number(val) || 1)
    .refine((val) => val > 0, { message: ERROR_MESSAGE.INVALID_PARAMETER }),

  limit: z
    .string()
    .optional()
    .transform((val) => Number(val) || 10)
    .refine((val) => val > 0, { message: ERROR_MESSAGE.INVALID_PARAMETER }),
});

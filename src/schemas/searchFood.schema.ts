import { z } from 'zod';

import { VALID_FILTERS, ValidFilter } from '@/constants/food';
import { ERROR_MESSAGE } from '@/constants/messages';

export const searchFoodSchema = z.object({
  q: z.string().optional(),
  allSearch: z
    .string()
    .min(1, ERROR_MESSAGE.INVALID_ALLSEARCH)
    .transform((val) => val === 'true'),

  filters: z
    .string()
    .optional()
    .transform((val) => {
      try {
        return val ? (JSON.parse(val) as unknown) : [];
      } catch {
        return null;
      }
    })
    .refine(
      (val): val is ValidFilter[] =>
        Array.isArray(val) &&
        val.every((item) => VALID_FILTERS.includes(item as ValidFilter)),
      {
        message: `${ERROR_MESSAGE.INVALID_FILTERS} ${VALID_FILTERS.join(', ')}`,
      },
    ),
});

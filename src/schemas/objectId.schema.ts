import mongoose from 'mongoose';
import z from 'zod';

import { ERROR_MESSAGE } from '@/constants/messages';

export const ObjectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: ERROR_MESSAGE.INVALID_OBJECTID,
  });

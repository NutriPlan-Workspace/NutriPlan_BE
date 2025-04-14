import { z } from 'zod';

import { ERROR_MESSAGE } from '@/constants/messages';

export const emailSchema = z.string().email(ERROR_MESSAGE.INVALID_EMAIL);

export const passwordSchema = z
  .string()
  .min(8, { message: ERROR_MESSAGE.PASSWORD_TOO_SHORT })
  .regex(/[A-Z]/, { message: ERROR_MESSAGE.PASSWORD_MISSING_UPPERCASE })
  .regex(/[a-z]/, { message: ERROR_MESSAGE.PASSWORD_MISSING_LOWERCASE })
  .regex(/\d/, { message: ERROR_MESSAGE.PASSWORD_MISSING_NUMBER })
  .regex(/[\W_]/, { message: ERROR_MESSAGE.PASSWORD_MISSING_SPECIAL });

export const loginSchemaValidate = z.object({
  email: emailSchema,
  password: passwordSchema,
});

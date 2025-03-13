import { z } from 'zod';

import { ERROR_MESSAGE } from '@/constants/messages';

export const loginSchemaValidate = z.object({
  email: z.string().email({ message: ERROR_MESSAGE.INVALID_EMAIL }),
  password: z.string().min(6, { message: ERROR_MESSAGE.PASSWORD_TOO_SHORT }),
});

export const logoutSchemaValidate = z.object({
  accessToken: z.string(),
});

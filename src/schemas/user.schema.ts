import { z } from 'zod';

import { ERROR_MESSAGE } from '@/constants/messages';
import { UserModel } from '@/models/user.model';
import { ActivityLevel, BodyFat, Gender, PrimaryDiet, UserRole } from '@/types';
import { emailSchema, passwordSchema } from '@/validations/auth.validates';

const dateDto = z.coerce.date().optional();

const physicalStatDto = z.object({
  gender: z.nativeEnum(Gender),
  height: z.number().min(50, ERROR_MESSAGE.HEIGHT_TOO_SMALL),
  weight: z.number().min(10, ERROR_MESSAGE.WEIGHT_TOO_SMALL),
  dateOfBirth: z.coerce.date(),
  bodyFat: z.nativeEnum(BodyFat),
  activityLevel: z.nativeEnum(ActivityLevel),
  time: dateDto,
});

const excludedDto = z.object({
  categories: z.array(z.object({ categoryId: z.string().min(1) })).optional(),
  foods: z.array(z.object({ foodId: z.string().min(1) })).optional(),
});

export const baseUserSchema = z.object({
  fullName: z
    .string()
    .min(3, ERROR_MESSAGE.FULLNAME_TOO_SHORT)
    .regex(/[a-zA-Z]/, ERROR_MESSAGE.FULLNAME_CANNOT_BE_NUMBERS),
  email: emailSchema,
  phoneNumber: z
    .string()
    .regex(/^\d{10}$/, ERROR_MESSAGE.INVALID_PHONE_NUMBER)
    .optional(),
  password: passwordSchema,
  physicalStat: physicalStatDto.optional(),
  excluded: excludedDto.optional(),
  nutritionGoals: z.any().optional(),
  primaryDiet: z.nativeEnum(PrimaryDiet).optional(),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
});

export const createUserDto = baseUserSchema.extend({
  email: baseUserSchema.shape.email.refine(async (email) => {
    const existingUser = await UserModel.findOne({ email });
    return !existingUser;
  }, ERROR_MESSAGE.EMAIL_ALREADY_IN_USE),
});

export type CreateUserDto = z.infer<typeof createUserDto>;

export const updateUserPasswordSchema = z.object({
  newPassword: passwordSchema,
});

import { z } from 'zod';

import { ERROR_MESSAGE } from '@/constants/messages';
import { NUTRITION_TARGET_MIN_GAP } from '@/constants/nutritionTargets';
import { UserModel } from '@/models/user.model';
import {
  ActivityLevel,
  BodyFat,
  Gender,
  NutritionGoals,
  PrimaryDiet,
  UserRole,
} from '@/types';
import { emailSchema, passwordSchema } from '@/validations/auth.validates';

export const physicalStatDto = z.object({
  gender: z.nativeEnum(Gender),
  heightRecords: z.array(
    z.object({
      height: z.number().min(50, ERROR_MESSAGE.HEIGHT_TOO_SMALL),
      date: z.coerce.date().optional(),
    }),
  ),
  weightRecords: z.array(
    z.object({
      weight: z.number().min(10, ERROR_MESSAGE.WEIGHT_TOO_SMALL),
      date: z.coerce.date().optional(),
    }),
  ),
  dateOfBirth: z.coerce.date(),
  bodyFat: z.nativeEnum(BodyFat),
  activityLevel: z.nativeEnum(ActivityLevel),
});

export const physicalStatUpdateDto = z.object({
  gender: z.nativeEnum(Gender).optional(),
  heightRecords: z
    .array(
      z.object({
        height: z.number().min(50, ERROR_MESSAGE.HEIGHT_TOO_SMALL),
        date: z.coerce.date().optional(),
      }),
    )
    .optional(),
  weightRecords: z
    .array(
      z.object({
        weight: z.number().min(10, ERROR_MESSAGE.WEIGHT_TOO_SMALL),
        date: z.coerce.date().optional(),
      }),
    )
    .optional(),
  dateOfBirth: z.coerce.date().optional(),
  bodyFat: z.nativeEnum(BodyFat).optional(),
  activityLevel: z.nativeEnum(ActivityLevel).optional(),
});

const makeRangeSchema = (minGap: number) =>
  z
    .object({
      from: z.number().min(0, ERROR_MESSAGE.FROM_NUMBER),
      to: z.number().min(0, ERROR_MESSAGE.TO_NUMBER),
    })
    .refine((data) => data.from < data.to, {
      message: ERROR_MESSAGE.FROM_LESS_THAN_TO,
      path: ['from'],
    })
    .refine((data) => data.to - data.from >= minGap, {
      message: `Range must be at least ${minGap}`,
      path: ['to'],
    });

export const nutritionGoalsDto = z.object({
  title: z.string().min(0).optional(),
  calories: z.number().min(0, ERROR_MESSAGE.CALORIES_NUMBER).optional(),
  proteinTarget: makeRangeSchema(NUTRITION_TARGET_MIN_GAP.PROTEIN).optional(),
  carbTarget: makeRangeSchema(NUTRITION_TARGET_MIN_GAP.CARB).optional(),
  fatTarget: makeRangeSchema(NUTRITION_TARGET_MIN_GAP.FAT).optional(),
  minimumFiber: z.number().min(0, ERROR_MESSAGE.FIBER_NUMBER).optional(),
  maxiumSodium: z.number().min(0, ERROR_MESSAGE.MAX_SODIUM).optional(),
  maxiumCholesterol: z
    .number()
    .min(0, ERROR_MESSAGE.MAX_CHOLESTEROL)
    .optional(),
  goalType: z.nativeEnum(NutritionGoals).optional(),
  breakfastRatio: z.number().min(0).max(1).optional(),
  lunchRatio: z.number().min(0).max(1).optional(),
  dinnerRatio: z.number().min(0).max(1).optional(),
  snackRatio: z.number().min(0).max(1).optional(),
});

export const primaryDietDto = z.object({
  primaryDiet: z.nativeEnum(PrimaryDiet).optional(),
});

export const excludedDto = z.object({
  categories: z.array(z.number()).optional(),
  foods: z.array(z.object({ foodId: z.string().min(1) })).optional(),
});

export const avatarDto = z.object({
  avatarUrl: z.string().url().min(1),
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
  nutritionGoals: nutritionGoalsDto.optional(),
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

export const adminUpdateUserRoleDto = z.object({
  role: z.nativeEnum(UserRole),
});

import { Schema } from 'mongoose';
import { SoftDeleteDocument } from 'mongoose-delete';

export interface Range {
  from: number;
  to: number;
}

export interface NutritionGoalsType {
  calories: number;
  proteinTarget: Range;
  carbTarget: Range;
  fatTarget: Range;
}

export interface ExtendedNutritionGoals extends NutritionGoalsType {
  title: string;
  minimumFiber: number;
  maxiumSodium: number;
  maxiumCholesterol: number;
  goalType: NutritionGoals;
}

export interface User extends SoftDeleteDocument {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  avatarUrl?: string;
  physicalStat: {
    gender: Gender;
    heightRecords: { date: Date; height: number }[];
    weightRecords: { date: Date; weight: number }[];
    dateOfBirth: Date;
    bodyFat: BodyFat;
    activityLevel: ActivityLevel;
    time: Date;
  };
  excluded: {
    categories: number[];
    foods: Schema.Types.ObjectId[];
  };
  nutritionGoals: ExtendedNutritionGoals;
  refreshToken: string;
  primaryDiet: PrimaryDiet;
  role: UserRole;
}

export type UserResponse = {
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string;
};

export enum NutritionGoals {
  LOSE_FAT = 'lose fat',
  MAINTAIN_WEIGHT = 'maintain weight',
  BUILD_MUSCLE = 'build muscle',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum BodyFat {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum ActivityLevel {
  SEDENTARY = 'sedentary',
  LIGHT = 'light',
  MODERATE = 'moderate',
  ACTIVE = 'active',
  VERY_ACTIVE = 'very_active',
}

export enum PrimaryDiet {
  ANYTHING = 'anything',
  KETO = 'keto',
  MEDITERRANEAN = 'mediterranean',
  PALEO = 'paleo',
  VEGAN = 'vegan',
  VEGETARIAN = 'vegetarian',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export interface TokenPayload {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
}

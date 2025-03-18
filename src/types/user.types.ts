import { Schema } from 'mongoose';
import { SoftDeleteDocument } from 'mongoose-delete';

export interface User extends SoftDeleteDocument {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  physicalStat: {
    gender: Gender;
    height: number;
    weight: number;
    dateOfBirth: Date;
    bodyFat: BodyFat;
    activityLevel: ActivityLevel;
    time: Date;
  };
  excluded: {
    categories: Schema.Types.ObjectId[];
    foods: Schema.Types.ObjectId[];
  };
  nutritionGoals: {
    title: string;
    caloriesLimit: number;
    proteinTarget: number;
    carbTarget: number;
    fatTarget: number;
    minimumFiber: number;
  };
  refreshToken: string;
  primaryDiet: PrimaryDiet;
  role: UserRole;
}

export type UserResponse = {
  fullName: string;
  email: string;
  role: string;
};

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

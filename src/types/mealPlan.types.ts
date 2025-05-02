import { Schema } from 'mongoose';
import { SoftDeleteDocument } from 'mongoose-delete';

import { Food } from '@/types';
import { PopulatedFood } from '@/types/food.types';
import { NutritionGoalsType } from '@/types/user.types';

export interface MealPlan extends SoftDeleteDocument {
  userId: Schema.Types.ObjectId;
  mealDate: Date;
  mealItems: {
    breakfast: {
      foodId: Schema.Types.ObjectId;
      amount: number;
      unit: number;
    }[];
    lunch: {
      foodId: Schema.Types.ObjectId;
      amount: number;
      unit: number;
    }[];
    dinner: {
      foodId: Schema.Types.ObjectId;
      amount: number;
      unit: number;
    }[];
  };
}

export interface PopulatedMealItemIngre {
  foodId: PopulatedFood;
  amount: number;
  unit: number;
}

export interface PopulatedMealPlanIngre extends SoftDeleteDocument {
  userId: Schema.Types.ObjectId;
  mealDate: Date;
  mealItems: {
    breakfast: PopulatedMealItemIngre[];
    lunch: PopulatedMealItemIngre[];
    dinner: PopulatedMealItemIngre[];
  };
}

export type MealPlanPreferences = NutritionGoalsType;

export interface GeneratedMealPlan {
  mealDate: Date;
  mealItems: {
    breakfast: {
      foodId: Food;
      amount: number;
      unit: number;
    }[];
    lunch: {
      foodId: Food;
      amount: number;
      unit: number;
    }[];
    dinner: {
      foodId: Food;
      amount: number;
      unit: number;
    }[];
  };
}

export interface MealPlanForUser {
  breakfast: {
    foodId: Schema.Types.ObjectId;
    amount: number;
    unit: number;
  }[];
  lunch: {
    foodId: Schema.Types.ObjectId;
    amount: number;
    unit: number;
  }[];
  dinner: {
    foodId: Schema.Types.ObjectId;
    amount: number;
    unit: number;
  }[];
}

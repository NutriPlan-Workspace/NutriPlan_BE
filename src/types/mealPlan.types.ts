import { Schema } from 'mongoose';
import { SoftDeleteDocument } from 'mongoose-delete';

import { PopulatedFood } from '@/types/food.types';

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

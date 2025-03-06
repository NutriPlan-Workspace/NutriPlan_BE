import { Schema } from 'mongoose';
import { SoftDeleteDocument } from 'mongoose-delete';

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

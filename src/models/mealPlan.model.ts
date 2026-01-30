import { model, PaginateModel, Schema } from 'mongoose';
import MongooseDelete, { SoftDeleteModel } from 'mongoose-delete';
import paginate from 'mongoose-paginate-v2';

import type { MealPlan } from '@/types';

const MealPlanSchema = new Schema<MealPlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    mealDate: {
      type: Date,
      required: true,
    },
    mealItems: {
      breakfast: [
        {
          foodId: {
            type: Schema.Types.ObjectId,
            ref: 'Food',
            required: true,
          },
          amount: {
            type: Number,
            required: true,
          },
          unit: {
            type: Number,
            required: true,
          },
          isEaten: {
            type: Boolean,
            default: false,
          },
        },
      ],
      lunch: [
        {
          foodId: {
            type: Schema.Types.ObjectId,
            ref: 'Food',
            required: true,
          },
          amount: {
            type: Number,
            required: true,
          },
          unit: {
            type: Number,
            required: true,
          },
          isEaten: {
            type: Boolean,
            default: false,
          },
        },
      ],
      dinner: [
        {
          foodId: {
            type: Schema.Types.ObjectId,
            ref: 'Food',
            required: true,
          },
          amount: {
            type: Number,
            required: true,
          },
          unit: {
            type: Number,
            required: true,
          },
          isEaten: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },
    targetPercentage: {
      type: Number,
      default: 100,
      min: 60,
      max: 120,
    },
  },
  { timestamps: true, autoCreate: true },
);

MealPlanSchema.plugin(MongooseDelete, {
  deletedAt: true,
  overrideMethods: true,
});
MealPlanSchema.plugin(paginate);

export const MealPlanModel = model<MealPlan>(
  'MealPlan',
  MealPlanSchema,
) as SoftDeleteModel<MealPlan> & PaginateModel<MealPlan>;

import { model, Schema } from 'mongoose';
import MongooseDelete, { SoftDeleteModel } from 'mongoose-delete';
import paginate from 'mongoose-paginate-v2';

import { MealPlan } from '@/types';

const MealPlanSchema = new Schema<MealPlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
        },
      ],
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
) as SoftDeleteModel<MealPlan>;

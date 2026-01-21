import { model, Schema } from 'mongoose';

import type { FoodView } from '@/types';

const FoodViewSchema = new Schema<FoodView>(
  {
    foodId: { type: Schema.Types.ObjectId, ref: 'Food', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    source: { type: String, required: false },
  },
  { timestamps: true, autoCreate: true },
);

export const FoodViewModel = model<FoodView>('FoodView', FoodViewSchema);

export default FoodViewModel;

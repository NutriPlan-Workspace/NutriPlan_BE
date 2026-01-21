import { model, PaginateModel, Schema } from 'mongoose';
import MongooseDelete, { SoftDeleteModel } from 'mongoose-delete';
import paginate from 'mongoose-paginate-v2';

import type { PantryItem } from '@/types';

const PantrySchema = new Schema<PantryItem>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ingredientFoodId: {
      type: Schema.Types.ObjectId,
      ref: 'Food',
      required: false,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      default: 'serving',
    },
    status: {
      type: String,
      enum: ['in_pantry', 'need_buy'],
      default: 'in_pantry',
    },
    note: {
      type: String,
      required: false,
    },
    imgUrl: {
      type: String,
      required: false,
    },
  },
  { timestamps: true, autoCreate: true },
);

PantrySchema.plugin(MongooseDelete, {
  deletedAt: true,
  overrideMethods: true,
});
PantrySchema.plugin(paginate);

export const PantryModel = model<PantryItem>(
  'Pantry',
  PantrySchema,
) as SoftDeleteModel<PantryItem> & PaginateModel<PantryItem>;

export default PantryModel;

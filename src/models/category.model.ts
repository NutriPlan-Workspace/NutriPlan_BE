import { model, Schema } from 'mongoose';
import MongooseDelete, { SoftDeleteModel } from 'mongoose-delete';
import paginate from 'mongoose-paginate-v2';

import { Category } from '@/types';

const CategorySchema = new Schema<Category>(
  {
    name: {
      type: String,
      required: false,
    },
  },
  { timestamps: true, autoCreate: true },
);

CategorySchema.plugin(MongooseDelete, {
  deletedAt: true,
  overrideMethods: true,
});
CategorySchema.plugin(paginate);

export const CategoryModel = model<Category>(
  'Category',
  CategorySchema,
) as SoftDeleteModel<Category>;

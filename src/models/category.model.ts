import { model, PaginateModel, Schema } from 'mongoose';
import MongooseDelete, { SoftDeleteModel } from 'mongoose-delete';
import paginate from 'mongoose-paginate-v2';

import type { Category } from '@/types';

const CategorySchema = new Schema<Category>(
  {
    label: { type: String, required: true, trim: true },
    value: { type: Number, required: true, unique: true },
    group: { type: String, required: true },
    mainItem: { type: Number, required: false },
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
) as SoftDeleteModel<Category> & PaginateModel<Category>;

export default CategoryModel;

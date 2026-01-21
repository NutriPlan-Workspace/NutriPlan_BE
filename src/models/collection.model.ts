import { model, PaginateModel, Schema } from 'mongoose';
import MongooseDelete, { SoftDeleteModel } from 'mongoose-delete';
import paginate from 'mongoose-paginate-v2';

import type { Collection } from '@/types';

const CollectionSchema = new Schema<Collection>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    img: {
      type: String,
    },
    description: {
      type: String,
    },
    foods: [
      {
        food: {
          type: Schema.Types.ObjectId,
          ref: 'Food',
          required: true,
        },
        date: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    isFavorites: {
      type: Boolean,
      default: false,
    },
    isExclusions: {
      type: Boolean,
      default: false,
    },
    isCurated: {
      type: Boolean,
      default: false,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: false,
    },
    recurringStartDate: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true, autoCreate: true },
);

CollectionSchema.plugin(MongooseDelete, {
  deletedAt: true,
  overrideMethods: true,
});
CollectionSchema.plugin(paginate);

export const CollectionModel = model<Collection>(
  'Collection',
  CollectionSchema,
) as SoftDeleteModel<Collection> & PaginateModel<Collection>;

import { Schema, Types } from 'mongoose';
import { SoftDeleteDocument } from 'mongoose-delete';

import type { Food } from '@/types';

interface FoodItem {
  food: Food;
  date: Date;
}

export interface Collection extends SoftDeleteDocument {
  _id: Types.ObjectId;
  userId: Schema.Types.ObjectId;
  title: string;
  img: string;
  description: string;
  foods: FoodItem[];
  isFavorites: boolean;
  isExclusions: boolean;
  isCurated: boolean;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly';
  recurringStartDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

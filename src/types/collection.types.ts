import { Schema } from 'mongoose';
import { SoftDeleteDocument } from 'mongoose-delete';

import type { Food } from '@/types';

interface FoodItem {
  food: Food;
  date: Date;
}

export interface Collection extends SoftDeleteDocument {
  userId: Schema.Types.ObjectId;
  title: string;
  img: string;
  description: string;
  foods: FoodItem[];
  isFavorites: boolean;
}

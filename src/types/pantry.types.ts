import type { Schema, Types } from 'mongoose';
import { SoftDeleteDocument } from 'mongoose-delete';

export type PantryStatus = 'in_pantry' | 'need_buy';

export interface PantryItem extends SoftDeleteDocument {
  userId: Schema.Types.ObjectId;
  ingredientFoodId?: Types.ObjectId;
  name: string;
  quantity: number;
  unit: string;
  status: PantryStatus;
  note?: string;
  imgUrl?: string;
}

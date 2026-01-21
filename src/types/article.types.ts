import type { Types } from 'mongoose';
import type { SoftDeleteDocument } from 'mongoose-delete';

export type Article = SoftDeleteDocument & {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  isPublished: boolean;
  publishedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

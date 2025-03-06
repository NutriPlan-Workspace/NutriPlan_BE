import { SoftDeleteDocument } from 'mongoose-delete';

export interface Category extends SoftDeleteDocument {
  name: string;
}

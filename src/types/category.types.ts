import { SoftDeleteDocument } from 'mongoose-delete';

export type CategoryGroup = ReadonlyArray<{
  readonly group: string;
  readonly mainItem?: number;
  readonly items: ReadonlyArray<number>;
}>;

export interface Category extends SoftDeleteDocument {
  label: string;
  value: number;
  group: string;
  mainItem?: number;
}

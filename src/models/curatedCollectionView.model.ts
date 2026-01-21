import { model, Schema } from 'mongoose';

import type { CuratedCollectionView } from '@/types';

const CuratedCollectionViewSchema = new Schema<CuratedCollectionView>(
  {
    collectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Collection',
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    source: { type: String, required: false },
  },
  { timestamps: true, autoCreate: true },
);

export const CuratedCollectionViewModel = model<CuratedCollectionView>(
  'CuratedCollectionView',
  CuratedCollectionViewSchema,
);

export default CuratedCollectionViewModel;

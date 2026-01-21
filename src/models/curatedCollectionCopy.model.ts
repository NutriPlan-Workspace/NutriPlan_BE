import { model, Schema } from 'mongoose';

import type { CuratedCollectionCopy } from '@/types';

const CuratedCollectionCopySchema = new Schema<CuratedCollectionCopy>(
  {
    collectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Collection',
      required: true,
    },
    destinationCollectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Collection',
      required: false,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    source: { type: String, required: false },
  },
  { timestamps: true, autoCreate: true },
);

export const CuratedCollectionCopyModel = model<CuratedCollectionCopy>(
  'CuratedCollectionCopy',
  CuratedCollectionCopySchema,
);

export default CuratedCollectionCopyModel;

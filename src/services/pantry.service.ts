import { FilterQuery, Schema, Types } from 'mongoose';

import { FoodModel, PantryModel } from '@/models';
import type { PantryItem, PantryStatus } from '@/types';

class PantryService {
  async list(userId: string, params: { q?: string; status?: PantryStatus }) {
    const query: FilterQuery<PantryItem> = {
      userId: new Types.ObjectId(userId) as unknown as Schema.Types.ObjectId,
    };

    if (params.status) {
      query.status = params.status;
    }

    if (params.q) {
      query.name = { $regex: params.q, $options: 'i' };
    }

    return PantryModel.find(query).sort({ updatedAt: -1 }).exec();
  }

  async upsert(userId: string, data: Partial<PantryItem>) {
    const base: Partial<PantryItem> = {
      userId: new Types.ObjectId(userId) as unknown as Schema.Types.ObjectId,
      ingredientFoodId: data.ingredientFoodId,
      name: data.name ?? '',
      quantity: data.quantity ?? 0,
      unit: data.unit ?? 'serving',
      status: data.status ?? 'in_pantry',
      note: data.note,
      imgUrl: data.imgUrl,
    };

    const query: FilterQuery<PantryItem> = {
      userId: base.userId as Schema.Types.ObjectId,
    };

    if (data.ingredientFoodId) {
      query.ingredientFoodId =
        data.ingredientFoodId as unknown as Schema.Types.ObjectId;
    } else {
      query.name = base.name;
    }

    const existing = await PantryModel.findOne(query).exec();
    if (!existing) {
      return PantryModel.create(base);
    }

    existing.quantity = Math.max(0, existing.quantity + (base.quantity ?? 0));
    existing.unit = base.unit ?? existing.unit;
    existing.status = base.status ?? existing.status;
    if (base.note !== undefined) {
      existing.note = base.note;
    }
    if (base.imgUrl !== undefined) {
      existing.imgUrl = base.imgUrl;
    }

    return existing.save();
  }

  async update(id: string, data: Partial<PantryItem>) {
    return PantryModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async remove(id: string) {
    return PantryModel.deleteOne({ _id: id }).exec();
  }

  async consume(
    userId: string,
    items: Array<{
      name: string;
      ingredientFoodId?: string;
      quantity: number;
      unit?: string;
    }>,
  ) {
    const userObjectId = new Types.ObjectId(
      userId,
    ) as unknown as Schema.Types.ObjectId;

    for (const item of items) {
      const query: FilterQuery<PantryItem> = {
        userId: userObjectId,
      };
      if (item.ingredientFoodId) {
        query.ingredientFoodId = new Types.ObjectId(
          item.ingredientFoodId,
        ) as unknown as Schema.Types.ObjectId;
      } else {
        query.name = item.name;
      }

      const pantryItem = await PantryModel.findOne(query).exec();
      if (!pantryItem) continue;

      pantryItem.quantity = Math.max(0, pantryItem.quantity - item.quantity);
      await pantryItem.save();
    }
  }

  async getSuggestions(userId: string, limit = 6) {
    const pantryItems = await PantryModel.find({
      userId: new Types.ObjectId(userId) as unknown as Schema.Types.ObjectId,
      ingredientFoodId: { $ne: null },
    }).exec();

    const ingredientIds = pantryItems
      .map((item) => item.ingredientFoodId?.toString())
      .filter((id): id is string => Boolean(id));

    if (ingredientIds.length === 0) {
      return [];
    }

    const results = await FoodModel.aggregate([
      { $match: { deleted: false, isRecipe: true } },
      { $unwind: '$ingredients' },
      {
        $match: {
          'ingredients.ingredientFoodId': {
            $in: ingredientIds.map((id) => new Types.ObjectId(id)),
          },
        },
      },
      {
        $group: {
          _id: '$_id',
          matchCount: { $sum: 1 },
          name: { $first: '$name' },
          imgUrls: { $first: '$imgUrls' },
          categories: { $first: '$categories' },
        },
      },
      { $match: { matchCount: { $gte: 1 } } },
      { $sort: { matchCount: -1 } },
      { $limit: limit },
    ]);

    return results;
  }
}

export default new PantryService();

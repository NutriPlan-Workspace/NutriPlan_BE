import mongoose from 'mongoose';

import connectDB from '@/configs/database.config';
import { CollectionModel } from '@/models/collection.model';
import { FoodModel } from '@/models/food.model';
import { UserModel } from '@/models/user.model';
import { UserRole } from '@/types/user.types';

async function main() {
  await connectDB();

  const force = process.env.FORCE === 'true' || process.env.FORCE === '1';
  const existingCount = await CollectionModel.countDocuments({
    isCurated: true,
  });

  if (existingCount > 0 && !force) {
    // eslint-disable-next-line no-console
    console.log(
      `Skip seeding: already has ${existingCount} curated collections. Set FORCE=true to re-seed.`,
    );
    return;
  }

  if (force && existingCount > 0) {
    await CollectionModel.deleteMany({ isCurated: true });
  }

  const adminUser = await UserModel.findOne({ role: UserRole.ADMIN });
  const ownerId = adminUser?._id;

  if (!ownerId) {
    // eslint-disable-next-line no-console
    console.log('No admin user found. Create an admin user before seeding.');
    return;
  }

  const seed = [
    {
      title: 'Vietnamese Favorites',
      description: 'Classic Vietnamese comfort foods with balanced macros.',
      img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Thai Street Classics',
      description: 'Bold Thai flavors with a lighter nutrition profile.',
      img: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Quick Bento Boxes',
      description: 'Portion-friendly lunch sets for busy weekdays.',
      img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Lean & Green Bowls',
      description: 'Veg-forward bowls with high protein add-ons.',
      img: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Budget-Friendly Meals',
      description: 'Affordable dishes designed for weekly planning.',
      img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  const foodsPerCollection = Math.max(
    0,
    Number(process.env.FOODS_PER_COLLECTION ?? 8) || 0,
  );

  const availableFoods = foodsPerCollection
    ? await FoodModel.find({ deleted: false, isRecipe: true })
        .select('_id')
        .limit(200)
        .exec()
    : [];

  const foodIds = availableFoods.map((f) => f._id);

  const pickFoods = (startIndex: number) => {
    if (foodsPerCollection <= 0) return [];
    if (foodIds.length === 0) return [];

    const picked: Array<{ food: mongoose.Types.ObjectId; date: Date }> = [];
    for (let i = 0; i < foodsPerCollection; i++) {
      const idx = (startIndex + i) % foodIds.length;
      picked.push({ food: foodIds[idx], date: new Date() });
    }
    return picked;
  };

  for (const [index, collection] of seed.entries()) {
    await CollectionModel.create({
      ...collection,
      userId: ownerId,
      foods: pickFoods(index * foodsPerCollection),
      isCurated: true,
      isFavorites: false,
      isExclusions: false,
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    `Seeded ${seed.length} curated collections successfully. (foodsPerCollection=${foodsPerCollection})`,
  );
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Seed curated collections failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

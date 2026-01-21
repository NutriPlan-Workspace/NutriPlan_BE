import mongoose from 'mongoose';

import connectDB from '@/configs/database.config';
import { CategoryModel } from '@/models/category.model';
import categoryService from '@/services/category.service';

async function main() {
  await connectDB();

  const force = process.env.FORCE === 'true' || process.env.FORCE === '1';
  const existingCount = await CategoryModel.countDocuments();

  if (existingCount > 0 && !force) {
    // eslint-disable-next-line no-console
    console.log(
      `Skip seeding: already has ${existingCount} categories. Set FORCE=true to re-seed.`,
    );
    return;
  }

  if (force && existingCount > 0) {
    await CategoryModel.deleteMany({});
  }

  const seed = categoryService.buildSeedData();
  if (seed.length === 0) {
    // eslint-disable-next-line no-console
    console.log('No category seed data found.');
    return;
  }

  await CategoryModel.insertMany(seed, { ordered: false });

  // eslint-disable-next-line no-console
  console.log(`Seeded ${seed.length} categories successfully.`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Seed categories failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

import { CollectionModel } from '@/models/collection.model';

export const createDefaultCollection = async (userId: string) => {
  const defaultCollection = new CollectionModel({
    userId,
    title: 'Favorites',
    img: '',
    description: '',
    foods: [],
    isFavorites: true,
  });
  await defaultCollection.save();

  const exclusionCollection = new CollectionModel({
    userId,
    title: 'Exclusions',
    img: '',
    description: 'Foods to exclude from search and meal plans.',
    foods: [],
    isExclusions: true,
  });

  return await exclusionCollection.save();
};

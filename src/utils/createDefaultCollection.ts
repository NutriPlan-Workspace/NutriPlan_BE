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

  return await defaultCollection.save();
};

import { FilterQuery, UpdateQuery } from 'mongoose';

import { isActiveFilter } from '@/constants/food';
import { CollectionRepository } from '@/repositories/collection.repository';
import { FoodRepository } from '@/repositories/food.repository';
import type { FoodFilterQuery } from '@/schemas/foodFilter.schema';
import type {
  Collection,
  Food,
  FoodWithIngredients,
  TokenPayload,
} from '@/types';
import {
  addComputedNutritionFields,
  addNutritionRange,
  buildDishTypeAndConditions,
  buildPer100CaloriesMatchExpr,
  buildPreferredFoodAndConditions,
} from '@/utils/nutritionFoodQueryRange';

export class FoodService {
  private repository: FoodRepository;
  private collectionRepository: CollectionRepository;

  constructor() {
    this.repository = new FoodRepository();
    this.collectionRepository = new CollectionRepository();
  }

  private extractUniqueFoods(collections: Collection[]): Food[] {
    const foods = collections.flatMap((col) =>
      col.foods.map((item) => item.food),
    );
    const uniqueFoods = Array.from(
      new Map(foods.map((f) => [String(f._id), f])).values(),
    );
    return uniqueFoods;
  }

  private async getFoodsFromCollections(collectionIds: string[]) {
    const collections = await this.collectionRepository.getList(
      { _id: { $in: collectionIds } },
      undefined,
      { limit: 200 },
      'foods.food',
    );
    return this.extractUniqueFoods(collections);
  }

  private async getFavoriteFoods(userId: string) {
    const favoriteCollections = await this.collectionRepository.getList(
      { isFavorites: true, userId },
      undefined,
      { limit: 100 },
      'foods.food',
    );
    return this.extractUniqueFoods(favoriteCollections);
  }

  private async getCollectionFoods(userId: string) {
    const collections = await this.collectionRepository.getList(
      { userId },
      undefined,
      { limit: 200 },
      'foods.food',
    );
    return this.extractUniqueFoods(collections);
  }

  create(data: Partial<Food>): Promise<Food> {
    return this.repository.create(data);
  }

  async searchFood(
    allSearch: boolean,
    filters: string[],
    decoded: TokenPayload | null,
    q?: string,
  ) {
    const query: FilterQuery<Food> = {};
    if (q) {
      query.name = { $regex: q, $options: 'i' };
    }

    if (!allSearch) {
      const selectedFilter = filters[0];

      switch (selectedFilter) {
        case 'recipe':
          query.isRecipe = true;
          break;
        case 'customRecipe':
          query.isRecipe = true;
          query.isCustom = true;
          break;
        case 'customFood':
          query.isRecipe = false;
          query.isCustom = true;
          break;
        case 'basicFood':
          query['property.isBasicFood'] = true;
          break;
        case 'favorites': {
          if (!decoded) {
            return { favorites: { foods: [], total: 0 } };
          }
          const favorites = await this.getFavoriteFoods(decoded.id);
          return { favorites: { foods: favorites, total: favorites.length } };
        }
        case 'collectionFoods': {
          if (!decoded) {
            return { collectionFoods: { foods: [], total: 0 } };
          }
          const collectionFoods = await this.getCollectionFoods(decoded.id);
          return {
            collectionFoods: {
              foods: collectionFoods,
              total: collectionFoods.length,
            },
          };
        }
      }

      const filteredFoods = await this.repository.search(query);
      return {
        [selectedFilter]: {
          foods: filteredFoods,
          total: filteredFoods.length,
        },
      };
    }

    const [recipe, customRecipe, customFood, basicFood] = await Promise.all([
      this.repository.search({ ...query, isRecipe: true }),
      this.repository.search({ ...query, isRecipe: true, isCustom: true }),
      this.repository.search({ ...query, isRecipe: false, isCustom: true }),
      this.repository.search({ ...query, 'property.isBasicFood': true }),
    ]);

    let favorites: Food[] = [];
    let collectionFoods: Food[] = [];

    if (decoded) {
      const [fav, coll] = await Promise.all([
        this.getFavoriteFoods(decoded.id),
        this.getCollectionFoods(decoded.id),
      ]);
      favorites = fav;
      collectionFoods = coll;
    }

    return {
      recipe: { foods: recipe, total: recipe.length },
      customRecipe: { foods: customRecipe, total: customRecipe.length },
      customFood: { foods: customFood, total: customFood.length },
      basicFood: { foods: basicFood, total: basicFood.length },
      favorites: { foods: favorites, total: favorites.length },
      collectionFoods: {
        foods: collectionFoods,
        total: collectionFoods.length,
      },
    };
  }

  async getById(id: string): Promise<FoodWithIngredients | null> {
    const mainFood = await this.repository.getById(id);
    if (!mainFood) return null;

    const ingredientFoodIds = mainFood.ingredients.map(({ ingredientFoodId }) =>
      ingredientFoodId.toString(),
    );

    const ingredientList = await this.repository.getByIds(ingredientFoodIds);

    return { mainFood, ingredientList };
  }

  async getList(parseSchema: FoodFilterQuery, decoded: TokenPayload | null) {
    const {
      q,
      filters,
      preferredFoodTypes,
      searchCollections,
      collectionIds,
      minPer100CaloriesProteins,
      maxPer100CaloriesCarbs,
      maxPer100CaloriesFats,
      minPer100CaloriesFiber,
      maxPer100CaloriesSodium,
      dishType,
      minCalories,
      maxCalories,
      minCarbs,
      maxCarbs,
      minCholesterol,
      maxCholesterol,
      minFats,
      maxFats,
      minFiber,
      maxFiber,
      minProteins,
      maxProteins,
      minSodium,
      maxSodium,
      minSugar,
      maxSugar,
      limit,
      page,
    } = parseSchema;

    // TODO: Refine this logic after complete exclusion and generate meal plan
    if (
      decoded !== null &&
      (searchCollections === true ||
        (Array.isArray(collectionIds) && collectionIds.length > 0))
    ) {
      if (searchCollections === true) {
        return await this.getCollectionFoods(decoded.id);
      }
      if (Array.isArray(collectionIds) && collectionIds.length > 0) {
        return await this.getFoodsFromCollections(collectionIds);
      }
    }

    const matchStage: FilterQuery<Food> = {};
    const andConditions: FilterQuery<Food>[] = [];

    if (q) {
      andConditions.push({ name: { $regex: q, $options: 'i' } });
    }

    addNutritionRange(matchStage, 'calories', minCalories, maxCalories, {
      $ne: 0,
    });
    addNutritionRange(matchStage, 'carbs', minCarbs, maxCarbs);
    addNutritionRange(
      matchStage,
      'cholesterol',
      minCholesterol,
      maxCholesterol,
    );
    addNutritionRange(matchStage, 'fiber', minFiber, maxFiber);
    addNutritionRange(matchStage, 'fats', minFats, maxFats);
    addNutritionRange(matchStage, 'proteins', minProteins, maxProteins);
    addNutritionRange(matchStage, 'sodium', minSodium, maxSodium);
    addNutritionRange(matchStage, 'sugar', minSugar, maxSugar);

    if (Object.keys(matchStage).length > 0) {
      andConditions.push(matchStage);
    }

    if (preferredFoodTypes?.length) {
      andConditions.push(
        ...buildPreferredFoodAndConditions(preferredFoodTypes),
      );
    }

    if (dishType?.length) {
      andConditions.push(...buildDishTypeAndConditions(dishType));
    }

    const activeFilters = (filters ?? []).filter(isActiveFilter);
    const orConditions: FilterQuery<Food>[] = [];

    for (const filter of activeFilters) {
      switch (filter) {
        case 'basicFood':
          orConditions.push({ 'property.isBasicFood': true });
          break;
        case 'recipe':
          orConditions.push({ isRecipe: true, isCustom: false });
          break;
        case 'customRecipe':
          orConditions.push({ isRecipe: true, isCustom: true });
          break;
        case 'customFood':
          orConditions.push({ isRecipe: false, isCustom: true });
          break;
      }
    }

    if (orConditions.length > 0) {
      andConditions.push({ $or: orConditions });
    }

    const finalMatchStage: FilterQuery<Food> =
      andConditions.length > 0 ? { $and: andConditions } : {};

    const pipeline = [];

    pipeline.push({ $match: finalMatchStage });

    const hasComputedFilters =
      minPer100CaloriesProteins !== undefined ||
      maxPer100CaloriesCarbs !== undefined ||
      maxPer100CaloriesFats !== undefined ||
      minPer100CaloriesFiber !== undefined ||
      maxPer100CaloriesSodium !== undefined;

    if (hasComputedFilters) {
      pipeline.push(addComputedNutritionFields());
      pipeline.push(
        buildPer100CaloriesMatchExpr({
          minPer100CaloriesProteins,
          maxPer100CaloriesCarbs,
          maxPer100CaloriesFats,
          minPer100CaloriesFiber,
          maxPer100CaloriesSodium,
        }),
      );
    }
    const skip = ((page ?? 1) - 1) * (limit ?? 8);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
    const result = await this.repository.aggregate(pipeline);
    return result;
  }

  update(id: string, data: UpdateQuery<Food>): Promise<Food | null> {
    return this.repository.update(id, data);
  }

  delete(id: string): Promise<{ deletedCount: number }> {
    return this.repository.delete(id);
  }

  restoreById(id: string): Promise<Food | null> {
    return this.repository.restoreById(id);
  }
}

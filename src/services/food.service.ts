import { FilterQuery, ObjectId, Types, UpdateQuery } from 'mongoose';

import { CATEGORIES_BY_GROUP, EXCLUDED_BY_DIET } from '@/constants/category';
import { isActiveFilter } from '@/constants/food';
import { CollectionRepository } from '@/repositories/collection.repository';
import { FoodRepository } from '@/repositories/food.repository';
import { UserRepository } from '@/repositories/user.repository';
import { FoodInput } from '@/schemas/food.schema';
import type { FoodFilterQuery } from '@/schemas/foodFilter.schema';
import type {
  Collection,
  Food,
  FoodWithIngredients,
  NutritionFields,
  TokenPayload,
} from '@/types';
import { UserRole } from '@/types';
import { calculateTotalNutrition } from '@/utils/calculateTotalNutrition';
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
  private userRepository: UserRepository;

  constructor() {
    this.repository = new FoodRepository();
    this.collectionRepository = new CollectionRepository();
    this.userRepository = new UserRepository();
  }

  private extractUniqueFoods(collections: Collection[]): Food[] {
    const foods = collections.flatMap((col) =>
      col.foods
        .map((item) => item.food)
        .filter(
          (f): f is Food =>
            !!f && typeof f !== 'string' && '_id' in f && !!f._id,
        ),
    );
    const uniqueFoods = Array.from(
      new Map(foods.map((f) => [String(f._id), f])).values(),
    );
    return uniqueFoods;
  }

  private prepareFoodData(
    foodData: Partial<FoodInput>,
    isRecipe: boolean,
    isCustom: boolean,
    userId?: string,
    totalNutrition?: NutritionFields,
  ): Partial<Food> {
    const base: Partial<Food> = {
      ...foodData,
      userId: userId
        ? (new Types.ObjectId(userId) as unknown as ObjectId)
        : undefined,
      ingredients: foodData.ingredients?.map((ingredient) => ({
        ...ingredient,
        ingredientFoodId: new Types.ObjectId(
          ingredient.ingredientFoodId,
        ) as unknown as ObjectId,
        preparation: ingredient.preparation ?? '',
      })),
      directions: foodData.directions?.map((item) => item.step),
      isRecipe,
      isCustom,
    };

    if (totalNutrition) {
      base.nutrition = totalNutrition;
    }

    return base;
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
      {
        userId,
        $or: [{ isFavorites: true }, { title: 'Favorites' }],
      },
      undefined,
      { limit: 100 },
      'foods.food',
    );
    return this.extractUniqueFoods(favoriteCollections);
  }

  private async getCollectionFoods(userId: string) {
    const collections = await this.collectionRepository.getList(
      {
        userId,
        isExclusions: { $ne: true },
        title: { $ne: 'Exclusions' },
        isFavorites: { $ne: true },
        $and: [{ title: { $ne: 'Favorites' } }],
      },
      undefined,
      { limit: 200 },
      'foods.food',
    );
    return this.extractUniqueFoods(collections);
  }

  private async getExcludedFoods(
    decoded: TokenPayload,
    excludedFoodSet: Set<string>,
  ) {
    const user = await this.userRepository.getById(decoded.id, {
      excluded: 1,
    });

    if (Array.isArray(user?.excluded?.foods)) {
      user.excluded.foods.forEach((food) => {
        let foodId: string | undefined;
        if (typeof food === 'string') {
          foodId = food;
        } else if (food instanceof Types.ObjectId) {
          foodId = food.toString();
        } else {
          foodId = (food as { foodId?: Types.ObjectId }).foodId?.toString();
        }
        if (foodId) {
          excludedFoodSet.add(foodId);
        }
      });
    }

    const exclusionCollections = await this.collectionRepository.getList(
      { userId: decoded.id, isExclusions: true },
      undefined,
      { limit: 1 },
      'foods.food',
    );

    exclusionCollections.forEach((collection) => {
      collection.foods?.forEach((item) => {
        const foodId = (item as { food?: { _id?: Types.ObjectId } })?.food?._id;
        if (foodId) excludedFoodSet.add(foodId.toString());
      });
    });
  }

  private async getExcludedCategories(
    decoded: TokenPayload,
    excludedCategorySet: Set<number>,
  ) {
    const user = await this.userRepository.getById(decoded.id, {
      excluded: 1,
      primaryDiet: 1,
    });

    if (Array.isArray(user?.excluded?.categories)) {
      user.excluded.categories.forEach((catId) =>
        excludedCategorySet.add(catId),
      );
    }

    if (user?.primaryDiet && user.primaryDiet in EXCLUDED_BY_DIET) {
      const dietExcluded =
        EXCLUDED_BY_DIET[user.primaryDiet as keyof typeof EXCLUDED_BY_DIET];

      dietExcluded.forEach((mainItemId) => {
        excludedCategorySet.add(mainItemId);

        const group = CATEGORIES_BY_GROUP.find(
          (group) => group.mainItem === mainItemId,
        );
        if (group) {
          group.items.forEach((itemId) => excludedCategorySet.add(itemId));
        }
      });
    }
  }

  private async createFoodWithIngredients(
    foodData: Partial<FoodInput>,
    isRecipe: boolean,
    isCustom: boolean,
    userId?: string,
  ) {
    const ingredientIds = foodData.ingredients?.map(
      (ingredient) => ingredient.ingredientFoodId,
    );

    if (!ingredientIds || ingredientIds.length === 0) {
      return null;
    }

    const ingredientsData = await this.repository.getByIds(ingredientIds);
    const totalNutrition = calculateTotalNutrition(ingredientsData);

    const preparedFoodData = this.prepareFoodData(
      foodData,
      isRecipe,
      isCustom,
      userId,
      totalNutrition,
    );
    const newFood = await this.repository.create(preparedFoodData);
    return newFood;
  }

  async createCustomFood(foodData: Partial<FoodInput>, userId: string) {
    const preparedFoodData = this.prepareFoodData(
      foodData,
      false,
      true,
      userId,
    );
    const newCustomFood = await this.repository.create(preparedFoodData);
    return newCustomFood;
  }

  async createCustomRecipe(
    foodData: Partial<FoodInput>,
    userId: string,
  ): Promise<Food | null> {
    return this.createFoodWithIngredients(foodData, true, true, userId);
  }

  async create(foodData: Partial<FoodInput>): Promise<Food | null> {
    return this.createFoodWithIngredients(foodData, false, false);
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
    if (decoded !== null) {
      const excludedCategorySet = new Set<number>();
      const excludedFoodSet = new Set<string>();

      await this.getExcludedCategories(decoded, excludedCategorySet);
      await this.getExcludedFoods(decoded, excludedFoodSet);

      if (excludedCategorySet.size !== 0) {
        const excludedCategoryArray = Array.from(excludedCategorySet);
        if (excludedCategoryArray.length > 0) {
          query.categories = { $nin: excludedCategoryArray };
        }
      }

      if (excludedFoodSet.size > 0) {
        query._id = { $nin: Array.from(excludedFoodSet) };
      }
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
          if (decoded) {
            query.userId = new Types.ObjectId(decoded.id);
          }
          break;
        case 'customFood':
          query.isRecipe = false;
          query.isCustom = true;
          if (decoded) {
            query.userId = new Types.ObjectId(decoded.id);
          }
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
    const userId = decoded ? new Types.ObjectId(decoded.id) : undefined;

    const [recipe, customRecipe, customFood, basicFood] = await Promise.all([
      this.repository.search({ ...query, isRecipe: true }),
      this.repository.search({
        ...query,
        isRecipe: true,
        isCustom: true,
        ...(userId ? { userId } : {}),
      }),
      this.repository.search({
        ...query,
        isRecipe: false,
        isCustom: true,
        ...(userId ? { userId } : {}),
      }),
      this.repository.search({
        ...query,
        'property.isBasicFood': true,
      }),
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

    // Ensure API always returns categories (legacy docs may not have the field)
    if (!Array.isArray(mainFood.categories)) {
      mainFood.categories = [];
    }

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
      applyExclusions,
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
    const userId = decoded ? new Types.ObjectId(decoded.id) : undefined;

    for (const filter of activeFilters) {
      switch (filter) {
        case 'basicFood':
          orConditions.push({ 'property.isBasicFood': true });
          break;
        case 'recipe':
          orConditions.push({ isRecipe: true, isCustom: false });
          break;
        case 'customRecipe':
          orConditions.push({
            isRecipe: true,
            isCustom: true,
            ...(userId ? { userId } : {}),
          });
          break;
        case 'customFood':
          orConditions.push({
            isRecipe: false,
            isCustom: true,
            ...(userId ? { userId } : {}),
          });
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

    // Always include categories + ingredients arrays, even for legacy docs
    pipeline.push({
      $addFields: {
        categories: { $ifNull: ['$categories', []] },
        ingredients: { $ifNull: ['$ingredients', []] },
      },
    });

    const applyExclusionsFlag =
      applyExclusions === undefined ? true : applyExclusions;

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
    if (applyExclusionsFlag && decoded !== null) {
      const excludedCategorySet = new Set<number>();
      const excludedFoodSet = new Set<string>();

      await this.getExcludedCategories(decoded, excludedCategorySet);
      await this.getExcludedFoods(decoded, excludedFoodSet);

      if (excludedCategorySet.size !== 0) {
        const excludedCategoryArray = Array.from(excludedCategorySet);
        pipeline.push({
          $match: {
            categories: {
              $not: { $elemMatch: { $in: excludedCategoryArray } },
            },
          },
        });
      }

      if (excludedFoodSet.size > 0) {
        pipeline.push({
          $match: {
            _id: { $nin: Array.from(excludedFoodSet) },
          },
        });
      }
    }

    // Populate ingredientFoodId (name/_id) into ingredients for list views
    pipeline.push({
      $lookup: {
        from: 'foods',
        let: {
          ingredientIds: { $ifNull: ['$ingredients.ingredientFoodId', []] },
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: [
                  { $toString: '$_id' },
                  {
                    $map: {
                      input: { $ifNull: ['$$ingredientIds', []] },
                      as: 'id',
                      in: { $toString: '$$id' },
                    },
                  },
                ],
              },
            },
          },
          { $project: { _id: 1, name: 1 } },
        ],
        as: '_ingredientFoods',
      },
    });

    pipeline.push({
      $addFields: {
        ingredients: {
          $map: {
            input: '$ingredients',
            as: 'ing',
            in: {
              _id: '$$ing._id',
              amount: '$$ing.amount',
              unit: '$$ing.unit',
              preparation: '$$ing.preparation',
              ingredientFoodId: {
                $let: {
                  vars: {
                    hit: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$_ingredientFoods',
                            as: 'f',
                            cond: {
                              $eq: [
                                { $toString: '$$f._id' },
                                { $toString: '$$ing.ingredientFoodId' },
                              ],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: '$$hit',
                },
              },
            },
          },
        },
      },
    });

    pipeline.push({ $project: { _ingredientFoods: 0 } });
    const skip = ((page ?? 1) - 1) * (limit ?? 8);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
    const result = await this.repository.aggregate(pipeline);
    return result;
  }

  private async checkAccessPermission(
    id: string,
    user: TokenPayload,
  ): Promise<Food | null> {
    const food = await this.repository.getById(id);
    if (!food) {
      return null;
    }
    const isOwner = food.userId?.toString() === user.id;
    const isAdmin = user.role === UserRole.ADMIN;
    if (!isOwner && !isAdmin) {
      return null;
    }
    return food;
  }

  async update(
    id: string,
    user: TokenPayload,
    data: UpdateQuery<Food>,
  ): Promise<Food | null> {
    const food = await this.checkAccessPermission(id, user);

    if (!food) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isRecipe, isCustom, ...filteredData } = data;

    return await this.repository.update(id, filteredData);
  }

  async delete(
    id: string,
    user: TokenPayload,
  ): Promise<{ deletedCount: number } | null> {
    const food = await this.checkAccessPermission(id, user);

    if (!food) {
      return null;
    }

    return this.repository.delete(id);
  }

  restoreById(id: string): Promise<Food | null> {
    return this.repository.restoreById(id);
  }
}

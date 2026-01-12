import { FoodRepository } from '@/repositories/food.repository';
import { Food, NutritionGoalsType, Range } from '@/types';
import { compareFood, compareFoodReverse } from '@/utils/sortFood';

export class ChooseMeal {
  private foodRepository: FoodRepository;

  constructor() {
    this.foodRepository = new FoodRepository();
  }

  private buildValidCombinations(
    mainDishes: Food[],
    sideDishes: Food[],
    nutritionRange: {
      calories: Range;
      proteins: Range;
      carbs: Range;
      fats: Range;
    },
    maxCombinations = 20,
  ) {
    const servingSizes = [
      1,
      1, // 1-1
      1,
      0.5, // 1-0.5
      1,
      1.5, // 1-1.5
      1,
      2, // 1-2
      0.5,
      1, // 0.5-1
      1.5,
      1, // 1.5-1
      2,
      1, // 2-1
      0.5,
      0.5, // 0.5-0.5
      1.5,
      1.5, // 1.5-1.5
      2,
      2, // 2-2
      0.5,
      1.5, // 0.5-1.5
      1.5,
      0.5, // 1.5-0.5
      0.5,
      2, // 0.5-2
      2,
      0.5, // 2-0.5
      1.5,
      2, // 1.5-2
      2,
      1.5, // 2-1.5
    ];

    const validCombinations: {
      mainDish: { food: Food; serving: number };
      sideDish: { food: Food; serving: number };
      totals: { calories: number; protein: number; carbs: number; fat: number };
    }[] = [];

    for (let i = 0; i < servingSizes.length - 1; i += 2) {
      const mainServing = servingSizes[i];
      const sideServing = servingSizes[i + 1];

      let mainPointer = 0;
      let sidePointer = 0;

      while (
        mainPointer < mainDishes.length &&
        sidePointer < sideDishes.length
      ) {
        const mainFood = mainDishes[mainPointer];
        const sideFood = sideDishes[sidePointer];

        const mainTotalNutrition = this.calculateTotalNutrition(
          mainFood,
          mainServing,
        );
        const sideTotalNutrition = this.calculateTotalNutrition(
          sideFood,
          sideServing,
        );

        const totalCalories =
          mainTotalNutrition.calories + sideTotalNutrition.calories;
        const totalProtein =
          mainTotalNutrition.protein + sideTotalNutrition.protein;
        const totalCarbs = mainTotalNutrition.carbs + sideTotalNutrition.carbs;
        const totalFat = mainTotalNutrition.fat + sideTotalNutrition.fat;

        if (
          totalCalories >= nutritionRange.calories.from &&
          totalCalories <= nutritionRange.calories.to &&
          totalProtein >= nutritionRange.proteins.from &&
          totalProtein <= nutritionRange.proteins.to &&
          totalCarbs >= nutritionRange.carbs.from &&
          totalCarbs <= nutritionRange.carbs.to &&
          totalFat >= nutritionRange.fats.from &&
          totalFat <= nutritionRange.fats.to
        ) {
          validCombinations.push({
            mainDish: { food: mainFood, serving: mainServing },
            sideDish: { food: sideFood, serving: sideServing },
            totals: {
              calories: totalCalories,
              protein: totalProtein,
              carbs: totalCarbs,
              fat: totalFat,
            },
          });

          if (validCombinations.length >= maxCombinations) break;
        }

        const currentTotalCalories =
          mainFood.nutrition.calories + sideFood.nutrition.calories;

        if (currentTotalCalories < nutritionRange.calories.from) {
          mainPointer++;
        } else if (currentTotalCalories > nutritionRange.calories.to) {
          sidePointer++;
        } else {
          sidePointer++;
        }
      }
      if (validCombinations.length >= maxCombinations) break;
    }

    return validCombinations;
  }

  private calculateTotalNutrition(food: Food, servingSize: number) {
    const nutrition = (food.nutrition as any).toObject();

    const totalCalories = nutrition.calories * servingSize;
    const totalProtein = nutrition.proteins * servingSize;
    const totalCarbs = nutrition.carbs * servingSize;
    const totalFat = nutrition.fats * servingSize;

    return {
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat,
    };
  }

  private calculateNutritionRange(
    target: NutritionGoalsType,
    tolerance = 0.05,
  ) {
    const calories: Range = {
      from: target.calories * (1 - 0.02),
      to: target.calories * (1 + 0.02),
    };

    const proteins: Range = {
      from: target.proteinTarget.from * (1 - tolerance),
      to: target.proteinTarget.to * (1 + tolerance),
    };

    const carbs: Range = {
      from: target.carbTarget.from * (1 - tolerance),
      to: target.carbTarget.to * (1 + tolerance),
    };

    const fats: Range = {
      from: target.fatTarget.from * (1 - tolerance),
      to: target.fatTarget.to * (1 + tolerance),
    };

    return { calories, proteins, carbs, fats };
  }

  async getMainDishes(
    mainCategories: number[],
    mealType?: 'breakfast' | 'lunch' | 'dinner',
    excludedCategoryIds?: Iterable<number>,
  ): Promise<Food[]> {
    const excluded = excludedCategoryIds
      ? Array.from(excludedCategoryIds).filter((id) => Number.isFinite(id))
      : [];

    const query: any = {
      'property.mainDish': true,
      categories: {
        $in: mainCategories,
        ...(excluded.length > 0 ? { $nin: excluded } : {}),
      },
      deleted: false,
    };

    if (mealType) {
      query[
        `property.is${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`
      ] = true;
    }

    return this.foodRepository.getList(
      query,
      {
        name: 1,
        imgUrls: 1,
        'nutrition.carbs': 1,
        'nutrition.fats': 1,
        'nutrition.proteins': 1,
        'nutrition.calories': 1,
        _id: 1,
        defaultUnit: 1,
        units: 1,
      },
      { limit: 1000 },
    );
  }

  async getSideDishes(
    sideCategories: number[],
    mealType?: 'breakfast' | 'lunch' | 'dinner',
    excludedCategoryIds?: Iterable<number>,
  ): Promise<Food[]> {
    const excluded = excludedCategoryIds
      ? Array.from(excludedCategoryIds).filter((id) => Number.isFinite(id))
      : [];

    const query: any = {
      'property.sideDish': true,
      categories: {
        $in: sideCategories,
        ...(excluded.length > 0 ? { $nin: excluded } : {}),
      },
      deleted: false,
    };

    if (mealType) {
      query[
        `property.is${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`
      ] = true;
    }

    return this.foodRepository.getList(
      query,
      {
        name: 1,
        imgUrls: 1,
        'nutrition.carbs': 1,
        'nutrition.fats': 1,
        'nutrition.proteins': 1,
        'nutrition.calories': 1,
        _id: 1,
        defaultUnit: 1,
        units: 1,
      },
      { limit: 1000 },
    );
  }

  async getMealsByCategories(
    mainCategories: number[],
    sideCategories: number[],
    nutritionGoals: NutritionGoalsType,
    mealType?: 'breakfast' | 'lunch' | 'dinner',
    excludedCategoryIds?: Iterable<number>,
  ): Promise<{
    mainDish: { food: Food; serving: number } | null;
    sideDish: { food: Food; serving: number } | null;
  }> {
    const [mainDishes, sideDishes] = await Promise.all([
      this.getMainDishes(mainCategories, mealType, excludedCategoryIds),
      this.getSideDishes(sideCategories, mealType, excludedCategoryIds),
    ]);

    const nutritionRange = this.calculateNutritionRange(nutritionGoals);

    mainDishes.sort(compareFood);
    sideDishes.sort(compareFoodReverse);

    const validCombinations = this.buildValidCombinations(
      mainDishes,
      sideDishes,
      nutritionRange,
      20,
    );

    if (validCombinations.length === 0) {
      return { mainDish: null, sideDish: null };
    }

    const randomIndex = Math.floor(Math.random() * validCombinations.length);
    return validCombinations[randomIndex];
  }

  async getMealOptionsByCategories(
    mainCategories: number[],
    sideCategories: number[],
    nutritionGoals: NutritionGoalsType,
    mealType?: 'breakfast' | 'lunch' | 'dinner',
    limit = 10,
    excludeFoodIds: Set<string> = new Set(),
    excludedCategoryIds?: Iterable<number>,
  ) {
    const [mainDishes, sideDishes] = await Promise.all([
      this.getMainDishes(mainCategories, mealType, excludedCategoryIds),
      this.getSideDishes(sideCategories, mealType, excludedCategoryIds),
    ]);

    const nutritionRange = this.calculateNutritionRange(nutritionGoals);

    mainDishes.sort(compareFood);
    sideDishes.sort(compareFoodReverse);

    const maxCombinations = Math.max(limit * 5, 20);
    const combinations = this.buildValidCombinations(
      mainDishes,
      sideDishes,
      nutritionRange,
      maxCombinations,
    ).filter(
      (combo) =>
        !excludeFoodIds.has(combo.mainDish.food._id.toString()) &&
        !excludeFoodIds.has(combo.sideDish.food._id.toString()),
    );

    return combinations.slice(0, limit);
  }
}

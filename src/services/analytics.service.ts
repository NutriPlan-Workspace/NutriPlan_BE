import { Types } from 'mongoose';

import {
  ArticleViewModel,
  CollectionModel,
  CuratedCollectionCopyModel,
  CuratedCollectionViewModel,
  FoodModel,
  FoodViewModel,
  MealPlanModel,
  UserModel,
} from '@/models';
import type { AdminDashboardStats } from '@/types';

class AnalyticsService {
  private buildDateSeries(
    records: Array<{ _id: string; count: number }>,
    startDate: Date,
    days: number,
  ) {
    const recordMap = new Map(
      records.map((record) => [record._id, record.count]),
    );
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      return {
        date: key,
        value: recordMap.get(key) ?? 0,
      };
    });
  }

  async trackFoodView(foodId: string, userId?: string, source?: string) {
    const payload = {
      foodId: new Types.ObjectId(foodId),
      ...(userId ? { userId: new Types.ObjectId(userId) } : {}),
      ...(source ? { source } : {}),
    };
    return FoodViewModel.create(payload);
  }

  async trackArticleView(articleId: string, userId?: string, source?: string) {
    const payload = {
      articleId: new Types.ObjectId(articleId),
      ...(userId ? { userId: new Types.ObjectId(userId) } : {}),
      ...(source ? { source } : {}),
    };
    return ArticleViewModel.create(payload);
  }

  async trackCuratedCollectionView(
    collectionId: string,
    userId?: string,
    source?: string,
  ) {
    const payload = {
      collectionId: new Types.ObjectId(collectionId),
      ...(userId ? { userId: new Types.ObjectId(userId) } : {}),
      ...(source ? { source } : {}),
    };
    return CuratedCollectionViewModel.create(payload);
  }

  async trackCuratedCollectionCopy(
    collectionId: string,
    userId?: string,
    destinationCollectionId?: string,
    source?: string,
  ) {
    const payload = {
      collectionId: new Types.ObjectId(collectionId),
      ...(destinationCollectionId
        ? {
            destinationCollectionId: new Types.ObjectId(
              destinationCollectionId,
            ),
          }
        : {}),
      ...(userId ? { userId: new Types.ObjectId(userId) } : {}),
      ...(source ? { source } : {}),
    };
    return CuratedCollectionCopyModel.create(payload);
  }

  async getDashboardStats(): Promise<AdminDashboardStats> {
    const [
      users,
      foods,
      mealPlans,
      collections,
      foodViews,
      articleViews,
      curatedCollectionViews,
      curatedCollectionCopies,
    ] = await Promise.all([
      UserModel.countDocuments(),
      FoodModel.countDocuments(),
      MealPlanModel.countDocuments(),
      CollectionModel.countDocuments(),
      FoodViewModel.countDocuments(),
      ArticleViewModel.countDocuments(),
      CuratedCollectionViewModel.countDocuments(),
      CuratedCollectionCopyModel.countDocuments(),
    ]);

    const days = 14;
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const topViewedFoods = await FoodViewModel.aggregate([
      { $group: { _id: '$foodId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'foods',
          localField: '_id',
          foreignField: '_id',
          as: 'food',
        },
      },
      { $unwind: { path: '$food', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          foodId: { $toString: '$_id' },
          count: 1,
          name: '$food.name',
          imgUrl: { $arrayElemAt: ['$food.imgUrls', 0] },
        },
      },
    ]);

    const topFavoritedFoods = await CollectionModel.aggregate([
      { $match: { isFavorites: true } },
      { $unwind: '$foods' },
      { $group: { _id: '$foods.food', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'foods',
          localField: '_id',
          foreignField: '_id',
          as: 'food',
        },
      },
      { $unwind: { path: '$food', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          foodId: { $toString: '$_id' },
          count: 1,
          name: '$food.name',
          imgUrl: { $arrayElemAt: ['$food.imgUrls', 0] },
        },
      },
    ]);

    const topMealPlanFoods = await MealPlanModel.aggregate([
      {
        $project: {
          foods: {
            $concatArrays: [
              '$mealItems.breakfast',
              '$mealItems.lunch',
              '$mealItems.dinner',
            ],
          },
        },
      },
      { $unwind: '$foods' },
      { $group: { _id: '$foods.foodId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'foods',
          localField: '_id',
          foreignField: '_id',
          as: 'food',
        },
      },
      { $unwind: { path: '$food', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          foodId: { $toString: '$_id' },
          count: 1,
          name: '$food.name',
          imgUrl: { $arrayElemAt: ['$food.imgUrls', 0] },
        },
      },
    ]);

    const topExcludedFoods = await UserModel.aggregate([
      { $match: { 'excluded.foods.0': { $exists: true } } },
      { $unwind: '$excluded.foods' },
      { $match: { 'excluded.foods.foodId': { $ne: null } } },
      { $group: { _id: '$excluded.foods.foodId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'foods',
          localField: '_id',
          foreignField: '_id',
          as: 'food',
        },
      },
      { $unwind: { path: '$food', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          foodId: { $toString: '$_id' },
          count: 1,
          name: '$food.name',
          imgUrl: { $arrayElemAt: ['$food.imgUrls', 0] },
        },
      },
    ]);

    const topViewedArticles = await ArticleViewModel.aggregate([
      { $group: { _id: '$articleId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'articles',
          localField: '_id',
          foreignField: '_id',
          as: 'article',
        },
      },
      { $unwind: { path: '$article', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          articleId: { $toString: '$_id' },
          count: 1,
          title: '$article.title',
          coverImageUrl: '$article.coverImageUrl',
        },
      },
    ]);

    const primaryDiets = await UserModel.aggregate([
      {
        $match: {
          primaryDiet: { $exists: true, $nin: [null, ''] },
        },
      },
      { $group: { _id: '$primaryDiet', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      {
        $project: {
          diet: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    const [
      foodViewsByDate,
      mealPlansByDate,
      favoritesByDate,
      articleViewsByDate,
      curatedCollectionViewsByDate,
      curatedCollectionCopiesByDate,
      usersByDate,
      foodsByDate,
      curatedCollectionsByDate,
    ] = await Promise.all([
      FoodViewModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      MealPlanModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            deleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      CollectionModel.aggregate([
        { $match: { isFavorites: true } },
        { $unwind: '$foods' },
        {
          $match: {
            'foods.date': { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$foods.date' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      ArticleViewModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      CuratedCollectionViewModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      CuratedCollectionCopyModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      UserModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      FoodModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      CollectionModel.aggregate([
        {
          $match: {
            isCurated: true,
            createdAt: { $gte: startDate, $lte: endDate },
            deleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const timeSeries = {
      users: this.buildDateSeries(usersByDate, startDate, days),
      foods: this.buildDateSeries(foodsByDate, startDate, days),
      curatedCollections: this.buildDateSeries(
        curatedCollectionsByDate,
        startDate,
        days,
      ),
      foodViews: this.buildDateSeries(foodViewsByDate, startDate, days),
      mealPlans: this.buildDateSeries(mealPlansByDate, startDate, days),
      favorites: this.buildDateSeries(favoritesByDate, startDate, days),
      articleViews: this.buildDateSeries(articleViewsByDate, startDate, days),
      curatedCollectionViews: this.buildDateSeries(
        curatedCollectionViewsByDate,
        startDate,
        days,
      ),
      curatedCollectionCopies: this.buildDateSeries(
        curatedCollectionCopiesByDate,
        startDate,
        days,
      ),
    };

    return {
      totals: {
        users,
        foods,
        mealPlans,
        collections,
        foodViews,
        articleViews,
        curatedCollectionViews,
        curatedCollectionCopies,
      },
      topViewedFoods,
      topFavoritedFoods,
      topMealPlanFoods,
      topViewedArticles,
      topExcludedFoods,
      primaryDiets,
      timeSeries,
    };
  }
}

export default new AnalyticsService();

import { MealPlanModel } from '@/models';
import { MealPlan } from '@/types';

type MEAL_TYPES = 'breakfast' | 'lunch' | 'dinner';

class MealPlanService {
  populateMeal = (mealPath: string) => ({
    path: `${mealPath}.foodId`,
    select: 'name units imgUrls ingredients',
    populate: {
      path: 'ingredients.ingredientFoodId',
      select: 'name',
    },
  });

  async getMealPlanByDate(date: Date, userId: string) {
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return MealPlanModel.findOne({
      userId,
      mealDate: { $gte: today, $lt: tomorrow },
    })
      .populate(this.populateMeal('mealItems.breakfast'))
      .populate(this.populateMeal('mealItems.lunch'))
      .populate(this.populateMeal('mealItems.dinner'));
  }

  async getMealPlanByRange(from: Date, to: Date, userId: string) {
    const dateFrom = new Date(from);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date(to);
    dateTo.setHours(23, 59, 59, 59);
    return MealPlanModel.find({
      userId,
      mealDate: { $gte: dateFrom, $lt: dateTo },
    })
      .populate(this.populateMeal('mealItems.breakfast'))
      .populate(this.populateMeal('mealItems.lunch'))
      .populate(this.populateMeal('mealItems.dinner'));
  }

  async getMealPlanByWeek(date: Date, userId: string) {
    const today = new Date(date);
    const startOfWeek = new Date();
    const endOfWeek = new Date();
    const dayOfWeek = today.getDay();
    const diffToStartOfWeek = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(today.getDate() + diffToStartOfWeek);
    const diffToEndOfWeek = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    endOfWeek.setDate(today.getDate() + diffToEndOfWeek);
    return MealPlanModel.find({
      userId,
      mealDate: { $gte: startOfWeek, $lt: endOfWeek },
    })
      .populate(this.populateMeal('mealItems.breakfast'))
      .populate(this.populateMeal('mealItems.lunch'))
      .populate(this.populateMeal('mealItems.dinner'));
  }

  async addFoodToMealPlan(mealItem: MealPlan & { mealType: MEAL_TYPES }) {
    let mealPlan = await MealPlanModel.findOne({
      userId: mealItem.userId,
      mealDate: mealItem.mealDate,
    });

    if (!mealPlan) {
      mealPlan = new MealPlanModel({
        userId: mealItem.userId,
        mealDate: mealItem.mealDate,
        mealItems: {
          breakfast: [],
          lunch: [],
          dinner: [],
        },
      });
    }

    const mealData = mealItem.mealItems[mealItem.mealType]?.[0];

    if (!mealData) {
      return;
    }

    const { foodId, amount, unit } = mealData;

    mealPlan.mealItems[mealItem.mealType].push({ foodId, amount, unit });

    await mealPlan.save();
    return mealPlan;
  }

  async editDayMealPlan(mealPlanData: MealPlan) {
    const { userId, mealDate, mealItems } = mealPlanData;
    let mealPlan = await MealPlanModel.findOne({ userId, mealDate });

    if (!mealPlan) {
      mealPlan = new MealPlanModel({
        userId,
        mealDate,
        mealItems: { breakfast: [], lunch: [], dinner: [] },
      });
    }

    mealPlan.mealItems = mealItems;
    await mealPlan.save();
    return mealPlan;
  }

  async removeFoodFromMealPlan(
    mealItem: MealPlan & { mealType: MEAL_TYPES },
    foodId: string,
  ) {
    const mealPlan = await MealPlanModel.findOne({
      _id: mealItem._id,
      userId: mealItem.userId,
    });

    if (!mealPlan) return null;

    mealPlan.mealItems[mealItem.mealType] = mealPlan.mealItems[
      mealItem.mealType
    ].filter((item) => item.foodId.toString() !== foodId.toString());

    await mealPlan.save();
    return mealPlan;
  }
}

export default new MealPlanService();

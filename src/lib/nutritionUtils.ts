import type { NutritionData, MealEntry } from '../types';

export const DV = {
  FAT: 75,
  SAT_TRANS_FAT: 20,
  SODIUM: 2300,
  CARBS: 275,
  FIBRE: 28,
  SUGARS: 100,
  CHOLESTEROL: 300,
};

export const calculateDV = (value: number, limit: number): number => {
  return Math.round((value / limit) * 100);
};

const EMPTY: NutritionData = {
  calories: 0,
  fat: 0,
  saturatedFat: 0,
  transFat: 0,
  cholesterol: 0,
  sodium: 0,
  carbohydrates: 0,
  fibre: 0,
  sugars: 0,
  protein: 0,
};

function addNutrition(
  a: NutritionData,
  b: NutritionData,
  bMultiplier = 1,
): NutritionData {
  return {
    calories: a.calories + b.calories * bMultiplier,
    fat: a.fat + b.fat * bMultiplier,
    saturatedFat: a.saturatedFat + b.saturatedFat * bMultiplier,
    transFat: a.transFat + b.transFat * bMultiplier,
    cholesterol: a.cholesterol + b.cholesterol * bMultiplier,
    sodium: a.sodium + b.sodium * bMultiplier,
    carbohydrates: a.carbohydrates + b.carbohydrates * bMultiplier,
    fibre: a.fibre + b.fibre * bMultiplier,
    sugars: a.sugars + b.sugars * bMultiplier,
    protein: a.protein + b.protein * bMultiplier,
  };
}

export function entryNutrition(entry: MealEntry): NutritionData {
  let total: NutritionData = { ...EMPTY };
  total = addNutrition(total, entry.item);
  for (const ex of entry.extras) {
    total = addNutrition(total, ex.option, ex.qty);
  }
  return total;
}

export function aggregateMeal(entries: MealEntry[]): NutritionData {
  return entries.reduce<NutritionData>(
    (acc, entry) => addNutrition(acc, entryNutrition(entry)),
    { ...EMPTY },
  );
}

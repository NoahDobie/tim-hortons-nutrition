export interface NutritionData {
  calories: number;
  fat: number;
  saturatedFat: number;
  transFat: number;
  cholesterol: number;
  sodium: number;
  carbohydrates: number;
  fibre: number;
  sugars: number;
  protein: number;
}

export interface MenuItem extends NutritionData {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  size?: string;
  baseName?: string;
  customizable: boolean;
}

export interface Subcategory {
  name: string;
  items: MenuItem[];
}

export interface Category {
  name: string;
  subcategories: Subcategory[];
  count: number;
}

export type ExtraKind = 'cream' | 'milk' | 'sugar' | 'syrup';

export interface ExtraOption extends NutritionData {
  id: string;
  name: string;
  kind: ExtraKind;
  appliesTo: 'Coffee' | 'Iced Coffee' | 'Tea' | 'Any';
  size?: string;
}

export interface SelectedExtra {
  option: ExtraOption;
  qty: number;
}

export interface MealEntry {
  timestamp: number;
  item: MenuItem;
  extras: SelectedExtra[];
}

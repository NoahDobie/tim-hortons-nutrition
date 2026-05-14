import type { MenuItem } from '../types';

/**
 * One Iconify icon per subcategory. Items whose subcategory isn't mapped
 * (e.g. plain donuts that have no subcategory, or Breakfast > Other)
 * fall back to the category-level icon.
 *
 * Browse the icon catalog at https://icon-sets.iconify.design/mdi/
 * Streamline icons: https://icon-sets.iconify.design/streamline/
 */

export interface CategoryMeta {
  icon: string;
  short: string;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  'Coffee, Tea & Other Hot Beverages': {
    icon: 'mdi:coffee-outline',
    short: 'Hot Drinks',
  },
  'Cold Beverages': { 
    icon: 'mdi:cup-ice',
    short: 'Cold Drinks' 
  },
  Donuts: {
    icon: 'streamline:donut',
    short: 'Donuts'
  },
  'Baked Goods': {
    icon: 'mdi:muffin',
    short: 'Bakery'
  },
  Breakfast: {
    icon: 'mdi:egg-fried',
    short: 'Breakfast'
  },
  Lunch: { 
    icon: 'mdi:hamburger',
    short: 'Lunch'
  },
};

export function categoryIcon(name: string): string {
  return CATEGORY_META[name]?.icon ?? 'mdi:silverware-fork-knife';
}

export function categoryShortName(name: string): string {
  return CATEGORY_META[name]?.short ?? name;
}

const SUBCATEGORY_ICON: Record<string, string> = {
  // Coffee, Tea & Other Hot Beverages
  'Brewed Coffee': 'mdi:coffee-outline',
  'Espresso Beverages': 'mdi:coffee-outline',
  'Specialty Beverages': 'mdi:coffee-outline',
  'Tea & Tea Lattes': 'mdi:tea',

  // Cold Beverages
  'Iced Coffee & Cold Brew': 'mdi:cup-ice',
  'Iced Lattes': 'mdi:cup-ice',
  'Iced Capps': 'mdi:cup-ice',
  Lemonades: 'mdi:fruit-lemon',
  'Lemonade Quenchers': 'mdi:fruit-lemon',
  'Sparkling Quenchers': 'mdi:cup-ice',
  'Frozen Quenchers': 'mdi:snowflake',

  // Donuts
  Donuts: 'streamline:donut',
  Timbits: 'streamline:donut',

  // Baked Goods
  Muffins: 'mdi:muffin',
  'Cookies & Brownies': 'mdi:cookie-outline',
  Croissants: 'mdi:barley',
  'Tea Biscuits': 'mdi:biscuit',
  'Savoury Pastries': 'mdi:barley',
  'Classic Bagels': 'streamline:donut',
  'Specialty Bagels': 'streamline:donut',
  'Bagel Toppings': 'mdi:cheese',

  // Breakfast
  'Classic Breakfast Sandwiches': 'mdi:egg-fried',
  'Bagel Breakfast Sandwiches': 'streamline:donut',
  'Bagel BELT Breakfast Sandwiches': 'streamline:donut',
  'Breakfast Wraps': 'streamline:burrito-fastfood',
  'Loaded Breakfast Bowls': 'mdi:pot-mix-outline',
  'Omelette Bites (2 per serving)': 'mdi:egg-fried',

  // Lunch
  Sandwiches: 'mdi:hamburger',
  Wraps: 'streamline:burrito-fastfood',
  'Loaded Wraps': 'streamline:burrito-fastfood',
  'Loaded Bowls': 'mdi:bowl-mix-outline',
  'Flatbread Pizzas': 'mdi:pizza',
  Melts: 'mdi:bread-slice-outline',
  'Soups & Chili': 'mdi:pot-mix-outline',
  Sides: 'mdi:french-fries',
};

export function iconForItem(item: MenuItem): string {
  return SUBCATEGORY_ICON[item.subcategory] ?? categoryIcon(item.category);
}

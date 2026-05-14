import rawData from './menu.json';
import type {
  Category,
  ExtraOption,
  MenuItem,
  NutritionData,
  Subcategory,
} from '../types';

interface RawNutrition {
  calories_kcal: number | null;
  fat_g: number | null;
  saturated_fat_g: number | null;
  trans_fat_g: number | null;
  cholesterol_mg: number | null;
  sodium_mg: number | null;
  carbohydrates_g: number | null;
  fibre_g: number | null;
  total_sugars_g: number | null;
  protein_g: number | null;
}

interface RawItem {
  id: string;
  name: string;
  base_name?: string;
  serving_size?: string | null;
  category: string;
  subcategory?: string | null;
  page?: number;
  nutrition: RawNutrition;
}

const n = (v: number | null | undefined) => (v == null ? 0 : v);

function toNutrition(r: RawNutrition): NutritionData {
  return {
    calories: n(r.calories_kcal),
    fat: n(r.fat_g),
    saturatedFat: n(r.saturated_fat_g),
    transFat: n(r.trans_fat_g),
    cholesterol: n(r.cholesterol_mg),
    sodium: n(r.sodium_mg),
    carbohydrates: n(r.carbohydrates_g),
    fibre: n(r.fibre_g),
    sugars: n(r.total_sugars_g),
    protein: n(r.protein_g),
  };
}

// Subcategories whose items can be customized with extras.
const CUSTOMIZABLE_SUBCATS = new Set([
  'Brewed Coffee',
  'Espresso Beverages',
  'Specialty Beverages',
  'Tea & Tea Lattes',
  'Iced Coffee & Cold Brew',
  'Iced Lattes',
  'Iced Capps',
]);

// Map a beverage's subcategory to the kind of "for X" extras that apply.
export function appliesToFromSubcat(
  subcat: string | undefined | null,
): 'Coffee' | 'Iced Coffee' | 'Tea' | null {
  if (!subcat) return null;
  if (subcat === 'Tea & Tea Lattes') return 'Tea';
  if (
    subcat === 'Iced Coffee & Cold Brew' ||
    subcat === 'Iced Lattes' ||
    subcat === 'Iced Capps'
  )
    return 'Iced Coffee';
  if (
    subcat === 'Brewed Coffee' ||
    subcat === 'Espresso Beverages' ||
    subcat === 'Specialty Beverages'
  )
    return 'Coffee';
  return null;
}

const items: RawItem[] = (rawData as { items: RawItem[] }).items;

// ---------- Build EXTRAS from the "Beverage Additions" category ----------
function makeExtra(
  raw: RawItem,
  kind: ExtraOption['kind'],
  appliesTo: ExtraOption['appliesTo'],
  size?: string,
): ExtraOption {
  return {
    ...toNutrition(raw.nutrition),
    id: raw.id,
    name: raw.name,
    kind,
    appliesTo,
    size,
  };
}

function parseSize(name: string): { base: string; size?: string } {
  const sizes = ['X Large', 'Large', 'Medium', 'Small'];
  for (const s of sizes) {
    const suffix = ` - ${s}`;
    if (name.endsWith(suffix)) {
      return { base: name.slice(0, -suffix.length), size: s };
    }
  }
  return { base: name };
}

const SIZE_SHORT: Record<string, string> = {
  Small: 'S',
  Medium: 'M',
  Large: 'L',
  'X Large': 'XL',
};

export function formatSize(size: string | undefined): string | undefined {
  if (!size) return undefined;
  return SIZE_SHORT[size] ?? size;
}

const EXTRAS: ExtraOption[] = [];
for (const it of items) {
  if (it.category !== 'Beverage Additions') continue;
  const { base, size } = parseSize(it.name);
  if (it.subcategory === 'Dairy (single serving)') {
    // Cream for Coffee / Iced Coffee / Tea ;  2% Milk for Coffee / Iced Coffee / Tea
    const lower = base.toLowerCase();
    const kind: 'cream' | 'milk' = lower.startsWith('cream') ? 'cream' : 'milk';
    let appliesTo: ExtraOption['appliesTo'] = 'Coffee';
    if (lower.includes('iced coffee')) appliesTo = 'Iced Coffee';
    else if (lower.includes('tea')) appliesTo = 'Tea';
    else if (lower.includes('coffee')) appliesTo = 'Coffee';
    EXTRAS.push(makeExtra(it, kind, appliesTo, size));
  } else if (it.subcategory === 'Sugar (single serving)') {
    // "Sugar for Coffee & Tea - Small" — applies to all hot/cold beverages
    EXTRAS.push(makeExtra(it, 'sugar', 'Any', size));
  } else if (it.subcategory === 'Flavoured Syrups (per pump)') {
    EXTRAS.push(makeExtra(it, 'syrup', 'Any'));
  }
}

// ---------- Helper: find best-fitting size for an extra ----------
const SIZE_ORDER = ['Small', 'Medium', 'Large', 'X Large'];

export function findExtra(
  kind: 'cream' | 'milk' | 'sugar',
  appliesTo: 'Coffee' | 'Iced Coffee' | 'Tea',
  size: string | undefined,
): ExtraOption | undefined {
  const candidates = EXTRAS.filter(
    (e) =>
      e.kind === kind &&
      (e.appliesTo === appliesTo || e.appliesTo === 'Any'),
  );
  if (candidates.length === 0) return undefined;
  // Prefer exact size match, else nearest smaller, else nearest larger.
  if (size) {
    const exact = candidates.find((c) => c.size === size);
    if (exact) return exact;
    const targetIdx = SIZE_ORDER.indexOf(size);
    for (let i = targetIdx - 1; i >= 0; i--) {
      const m = candidates.find((c) => c.size === SIZE_ORDER[i]);
      if (m) return m;
    }
    for (let i = targetIdx + 1; i < SIZE_ORDER.length; i++) {
      const m = candidates.find((c) => c.size === SIZE_ORDER[i]);
      if (m) return m;
    }
  }
  return candidates[0];
}

export function getApplicableExtras(item: MenuItem): {
  cream?: ExtraOption;
  milk?: ExtraOption;
  sugar?: ExtraOption;
  syrups: ExtraOption[];
} {
  const appliesTo = appliesToFromSubcat(item.subcategory);
  const out: ReturnType<typeof getApplicableExtras> = { syrups: [] };
  if (appliesTo) {
    out.cream = findExtra('cream', appliesTo, item.size);
    out.milk = findExtra('milk', appliesTo, item.size);
    out.sugar = findExtra('sugar', appliesTo, item.size);
  }
  // Syrups available to any customizable beverage
  out.syrups = EXTRAS.filter((e) => e.kind === 'syrup');
  return out;
}

// ---------- Build MENU_DATA grouped category → subcategory → items ----------
const CATEGORY_ORDER = [
  'Coffee, Tea & Other Hot Beverages',
  'Cold Beverages',
  'Donuts',
  'Baked Goods',
  'Breakfast',
  'Lunch',
];

function toMenuItem(raw: RawItem): MenuItem {
  const customizable =
    !!raw.subcategory && CUSTOMIZABLE_SUBCATS.has(raw.subcategory);
  return {
    ...toNutrition(raw.nutrition),
    id: raw.id,
    name: raw.name,
    category: raw.category,
    subcategory: raw.subcategory ?? 'Other',
    size: raw.serving_size ?? undefined,
    baseName: raw.base_name,
    customizable,
  };
}

const categoryMap = new Map<string, Map<string, MenuItem[]>>();
for (const raw of items) {
  if (raw.category === 'Beverage Additions') continue; // shown only via extras flow
  const cat = raw.category;
  const sub = raw.subcategory ?? 'Other';
  if (!categoryMap.has(cat)) categoryMap.set(cat, new Map());
  const subMap = categoryMap.get(cat)!;
  if (!subMap.has(sub)) subMap.set(sub, []);
  subMap.get(sub)!.push(toMenuItem(raw));
}

export const MENU_DATA: Category[] = [...categoryMap.entries()]
  .sort(([a], [b]) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  })
  .map<Category>(([name, subMap]) => {
    const subcategories: Subcategory[] = [...subMap.entries()].map(
      ([subName, list]) => ({ name: subName, items: list }),
    );
    const count = subcategories.reduce((s, sc) => s + sc.items.length, 0);
    return { name, subcategories, count };
  });

export const ALL_ITEMS: MenuItem[] = MENU_DATA.flatMap((c) =>
  c.subcategories.flatMap((s) => s.items),
);

export const TOTAL_ITEM_COUNT = ALL_ITEMS.length;
export { EXTRAS };

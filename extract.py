"""Extract Tim Hortons nutrition data from the PDF into a clean JSON file.

The PDF has a consistent table format across all pages:
- Column 0: Menu Item (sometimes a category header with no nutrition columns)
- Columns 1-10: Calories, Fat (g), Saturated Fat (g), Trans Fat (g), Cholesterol (mg),
                Sodium (mg), Carbohydrates (g), Fibre (g), Total Sugars (g), Protein (g)

Category rows have None for all nutrition values — we use these to group items.
"""

import pdfplumber
import json
import re

PDF_PATH = r"C:\github\tim-hortons-nutrition\Tim Hortons Nutrition Guide - March 2026.pdf"
OUT_PATH = r"C:\github\tim-hortons-nutrition\src\data\menu.json"

NUTRITION_KEYS = [
    "calories",
    "fat_g",
    "saturated_fat_g",
    "trans_fat_g",
    "cholesterol_mg",
    "sodium_mg",
    "carbs_g",
    "fibre_g",
    "sugars_g",
    "protein_g",
]


def parse_num(v):
    if v is None:
        return None
    s = str(v).strip()
    if not s:
        return None
    # Some cells may contain "<1" or similar; treat as 0.5
    if s.startswith("<"):
        try:
            return float(s[1:]) / 2
        except ValueError:
            return 0
    try:
        if "." in s:
            return float(s)
        return int(s)
    except ValueError:
        return None


def is_category_row(row):
    """A category row has a name in col 0 and None/empty in the nutrition columns."""
    if not row or not row[0]:
        return False
    nutrition_cells = row[1:11]
    return all(c is None or str(c).strip() == "" for c in nutrition_cells)


def is_header_row(row):
    if not row or not row[0]:
        return False
    return str(row[0]).strip().lower().startswith("menu item")


categories = {}
current_category = "Other"
seen_items = set()

with pdfplumber.open(PDF_PATH) as pdf:
    for page in pdf.pages:
        tables = page.extract_tables()
        for table in tables:
            for row in table:
                if is_header_row(row):
                    continue
                if not row or not row[0]:
                    continue
                name = str(row[0]).strip()
                if not name:
                    continue
                if is_category_row(row):
                    current_category = name
                    if current_category not in categories:
                        categories[current_category] = []
                    continue
                # Skip duplicates that occur when a category appears on multiple pages
                key = (current_category, name)
                if key in seen_items:
                    continue
                seen_items.add(key)
                nutrition = {}
                for i, k in enumerate(NUTRITION_KEYS):
                    nutrition[k] = parse_num(row[i + 1]) if i + 1 < len(row) else None
                # Require at least calories to be present
                if nutrition.get("calories") is None:
                    continue
                if current_category not in categories:
                    categories[current_category] = []
                categories[current_category].append({"name": name, **nutrition})

# Map category names to emoji icons.
EMOJI_MAP = {
    "coffee": "☕",
    "tea": "🍵",
    "espresso": "☕",
    "latte": "🥛",
    "cappuccino": "☕",
    "hot chocolate": "🍫",
    "iced": "🧊",
    "frozen": "🥤",
    "lemonade": "🍋",
    "quencher": "🍹",
    "smile": "🍹",
    "refresher": "🍹",
    "donut": "🍩",
    "timbit": "🍩",
    "muffin": "🧁",
    "cookie": "🍪",
    "cake": "🍰",
    "croissant": "🥐",
    "biscuit": "🥖",
    "danish": "🥐",
    "bagel": "🥯",
    "tea biscuit": "🥖",
    "loaded": "🌯",
    "wrap": "🌯",
    "sandwich": "🥪",
    "panini": "🥪",
    "breakfast": "🍳",
    "egg": "🥚",
    "soup": "🍲",
    "chili": "🍲",
    "chicken": "🍗",
    "potato": "🥔",
    "hashbrown": "🥔",
    "wedges": "🥔",
    "yogurt": "🥣",
    "oatmeal": "🥣",
    "fruit": "🍎",
    "snack": "🥨",
    "addition": "➕",
    "cream": "🥛",
    "milk": "🥛",
    "syrup": "🍯",
    "sugar": "🍬",
}


def emoji_for(category):
    low = category.lower()
    for k, v in EMOJI_MAP.items():
        if k in low:
            return v
    return "🍽️"


output = {
    "source": "Tim Hortons Nutrition Guide - March 2026 (Canadian Edition)",
    "categories": [
        {
            "name": cat,
            "icon": emoji_for(cat),
            "items": items,
        }
        for cat, items in categories.items()
        if items
    ],
}

import os
os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
with open(OUT_PATH, "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

total_items = sum(len(c["items"]) for c in output["categories"])
print(f"Wrote {len(output['categories'])} categories with {total_items} items to {OUT_PATH}")
for c in output["categories"]:
    print(f"  {c['icon']} {c['name']}: {len(c['items'])} items")

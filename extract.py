"""Extract Tim Hortons nutrition data from a PDF guide into structured JSON.

The output JSON matches the schema consumed by the app (src/data/menu.json):

    {
        "metadata": { source, country, effective_date, columns, units,
                      item_count, notes },
        "items": [
            { id, name, base_name, serving_size, category, subcategory,
              page, nutrition }
        ]
    }

Usage:
    python extract.py [PDF_PATH] [--output PATH] [--country COUNTRY]
                      [--effective-date "Month YYYY"] [--extra-category NAME ...]

If PDF_PATH is omitted, the script looks for a single .pdf inside
nutrition-data/ (relative to this file) and uses that.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

import pdfplumber


# Nutrition columns in the order they appear in the PDF table.
NUTRITION_COLUMNS: list[tuple[str, str]] = [
    ("calories_kcal", "kcal"),
    ("fat_g", "g"),
    ("saturated_fat_g", "g"),
    ("trans_fat_g", "g"),
    ("cholesterol_mg", "mg"),
    ("sodium_mg", "mg"),
    ("carbohydrates_g", "g"),
    ("fibre_g", "g"),
    ("total_sugars_g", "g"),
    ("protein_g", "g"),
]
NUTRITION_KEYS = [k for k, _ in NUTRITION_COLUMNS]

# Heading rows whose text matches one of these (case-insensitive, punctuation
# tolerant) switch the current top-level category. Any other heading row is
# treated as a subcategory under the current category.
KNOWN_CATEGORIES: set[str] = {
    "Coffee, Tea & Other Hot Beverages",
    "Cold Beverages",
    "Beverage Additions",
    "Donuts",
    "Baked Goods",
    "Breakfast",
    "Lunch",
}

# Item names sometimes end in " - <Size>". The second value is the normalized
# form written to the JSON.
SIZE_SUFFIXES: list[tuple[str, str]] = [
    ("X Large", "X Large"),
    ("Extra Large", "X Large"),
    ("Large", "Large"),
    ("Medium", "Medium"),
    ("Small", "Small"),
]

DATE_RE = re.compile(
    r"(January|February|March|April|May|June|July|August|"
    r"September|October|November|December)\s+(\d{4})",
    re.IGNORECASE,
)


def parse_value(v: Any) -> float | int | None:
    """Parse a nutrition cell into a number, or None if blank/unparseable."""
    if v is None:
        return None
    s = str(v).strip()
    if not s or s in {"—", "-", "–", "N/A", "n/a"}:
        return None
    if s.startswith("<"):
        try:
            return round(float(s[1:].strip()) / 2, 2)
        except ValueError:
            return 0
    s = s.replace(",", "")
    try:
        f = float(s)
        return int(f) if f.is_integer() else f
    except ValueError:
        return None


def slugify(text: str, used: set[str]) -> str:
    """Return a kebab-case ID unique against `used` (mutates `used`)."""
    s = re.sub(r"[^\w\s-]", "", text.lower())
    s = re.sub(r"[\s_]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    base = s or "item"
    candidate = base
    i = 2
    while candidate in used:
        candidate = f"{base}-{i}"
        i += 1
    used.add(candidate)
    return candidate


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def category_key(text: str) -> str:
    """Compare-friendly form: lowercase, alphanumeric only."""
    return re.sub(r"[^a-z0-9]", "", text.lower())


def parse_size(name: str) -> tuple[str, str | None]:
    """Split 'Foo - Small' into ('Foo', 'Small'). Normalizes 'Extra Large'."""
    for suffix, normalized in SIZE_SUFFIXES:
        marker = f" - {suffix}"
        if name.endswith(marker):
            return name[: -len(marker)].strip(), normalized
    return name, None


def detect_effective_date(pdf: pdfplumber.PDF, filename: str) -> str | None:
    """Look in the filename, then the first page text, for a 'Month YYYY' marker."""
    m = DATE_RE.search(filename)
    if not m:
        try:
            text = pdf.pages[0].extract_text() or ""
            m = DATE_RE.search(text)
        except Exception:
            m = None
    if not m:
        return None
    return f"{m.group(1).title()} {m.group(2)}"


def is_table_header_row(row: list) -> bool:
    if not row or not row[0]:
        return False
    head = str(row[0]).strip().lower()
    return head.startswith("menu item") or head.startswith("item")


def is_heading_row(row: list) -> bool:
    """A heading row has text in col 0 and no nutrition values in cols 1..n."""
    if not row or row[0] is None or not str(row[0]).strip():
        return False
    nutrition_cells = row[1 : 1 + len(NUTRITION_KEYS)]
    return all(c is None or str(c).strip() == "" for c in nutrition_cells)


def extract_items(
    pdf: pdfplumber.PDF, known_categories: set[str]
) -> tuple[list[dict[str, Any]], list[str]]:
    """Return (items, warnings)."""
    cat_lookup = {category_key(c): c for c in known_categories}
    items: list[dict[str, Any]] = []
    warnings: list[str] = []
    seen: set[tuple[str, str, str]] = set()
    used_ids: set[str] = set()
    current_category: str | None = None
    current_subcategory: str | None = None

    for page_num, page in enumerate(pdf.pages, start=1):
        for table in page.extract_tables() or []:
            for row in table:
                if not row or is_table_header_row(row):
                    continue
                if row[0] is None or not str(row[0]).strip():
                    continue
                name = normalize_text(str(row[0]))

                if is_heading_row(row):
                    canonical = cat_lookup.get(category_key(name))
                    if canonical:
                        current_category = canonical
                        # Items that appear before any explicit subcategory
                        # heading inherit the category name as their subcategory.
                        current_subcategory = canonical
                    else:
                        current_subcategory = name
                    continue

                nutrition: dict[str, float | int | None] = {
                    k: parse_value(row[i + 1]) if i + 1 < len(row) else None
                    for i, k in enumerate(NUTRITION_KEYS)
                }
                if all(v is None for v in nutrition.values()):
                    continue

                if current_category is None:
                    warnings.append(
                        f"Page {page_num}: '{name}' found before any "
                        f"known category — assigning to 'Other'."
                    )

                key = (
                    current_category or "Other",
                    current_subcategory or "Other",
                    name,
                )
                if key in seen:
                    continue
                seen.add(key)

                base, size = parse_size(name)
                items.append(
                    {
                        "id": slugify(name, used_ids),
                        "name": name,
                        "base_name": base,
                        "serving_size": size,
                        "category": current_category or "Other",
                        "subcategory": current_subcategory or "Other",
                        "page": page_num,
                        "nutrition": nutrition,
                    }
                )

    return items, warnings


def build_output(
    items: list[dict[str, Any]],
    *,
    source: str,
    country: str,
    effective_date: str | None,
) -> dict[str, Any]:
    return {
        "metadata": {
            "source": source,
            "country": country,
            "effective_date": effective_date,
            "columns": NUTRITION_KEYS,
            "units": {k: u for k, u in NUTRITION_COLUMNS},
            "item_count": len(items),
            "notes": [
                "Nutrition values are based on the PDF source. Some regional, "
                "test, or limited-time items may not be listed in the source document."
            ],
        },
        "items": items,
    }


def default_pdf_path(script_dir: Path) -> Path | None:
    pdfs = sorted((script_dir / "nutrition-data").glob("*.pdf"))
    return pdfs[0] if len(pdfs) == 1 else None


def main(argv: list[str] | None = None) -> int:
    script_dir = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(
        description="Extract Tim Hortons nutrition data from a PDF guide.",
    )
    parser.add_argument(
        "pdf_path",
        nargs="?",
        type=Path,
        help="Path to the PDF. Defaults to the single .pdf in nutrition-data/.",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=script_dir / "src" / "data" / "menu.json",
        help="Output JSON path (default: src/data/menu.json).",
    )
    parser.add_argument(
        "--country",
        default="Canada",
        help="Country/region for the metadata (default: Canada).",
    )
    parser.add_argument(
        "--effective-date",
        help="Effective date label, e.g. 'March 2026'. Auto-detected if omitted.",
    )
    parser.add_argument(
        "--extra-category",
        action="append",
        default=[],
        metavar="NAME",
        help="Additional top-level category name (can be repeated).",
    )
    args = parser.parse_args(argv)

    pdf_path: Path | None = args.pdf_path or default_pdf_path(script_dir)
    if pdf_path is None:
        parser.error(
            "No PDF provided and could not auto-detect one in nutrition-data/."
        )
    if not pdf_path.exists():
        parser.error(f"PDF not found: {pdf_path}")

    known = set(KNOWN_CATEGORIES) | set(args.extra_category)

    with pdfplumber.open(str(pdf_path)) as pdf:
        effective_date = args.effective_date or detect_effective_date(
            pdf, pdf_path.name
        )
        items, warnings = extract_items(pdf, known)

    if not items:
        print("ERROR: no items extracted — check the PDF format.", file=sys.stderr)
        return 1

    for w in warnings[:10]:
        print(f"WARNING: {w}", file=sys.stderr)
    if len(warnings) > 10:
        print(f"... and {len(warnings) - 10} more warnings.", file=sys.stderr)

    output = build_output(
        items,
        source=pdf_path.name,
        country=args.country,
        effective_date=effective_date,
    )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(output, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    by_cat: dict[str, dict[str, int]] = {}
    for it in items:
        by_cat.setdefault(it["category"], {}).setdefault(it["subcategory"], 0)
        by_cat[it["category"]][it["subcategory"]] += 1

    print(f"Wrote {len(items)} items to {args.output}")
    for cat, subs in by_cat.items():
        total = sum(subs.values())
        print(f"  {cat} ({total})")
        for sub, n in subs.items():
            print(f"    - {sub}: {n}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

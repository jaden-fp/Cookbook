/**
 * Ingredient cost estimation — v2
 * Per-package pricing with density-based weight↔volume conversion.
 * Prices based on Trader Joe's / Kroger averages (2024–2026).
 */


// ── Types ─────────────────────────────────────────────────────────────────────

export type PackageUnit = 'cup' | 'tsp' | 'tbsp' | 'floz' | 'oz' | 'lb' | 'g' | 'piece';

export interface PriceEntry {
  key: string;           // stable ID for localStorage (e.g. "chocolate-chips")
  keywords: string[];    // for matching — ordered most-specific to least
  packagePrice: number;  // total USD for the full package
  packageAmount: number; // size in packageUnit
  packageUnit: PackageUnit;
  densityGPerCup?: number; // grams per cup — enables weight↔volume conversions
}

export interface PriceOverride {
  packagePrice: number;
  packageAmount: number;
  packageUnit: PackageUnit;
}

export interface AIPrice {
  packagePrice: number;
  packageAmount: number;
  packageUnit: PackageUnit;
  densityGPerCup?: number | null;
}

export interface CostResult {
  cost: number | null;
  display: string; // "$0.45" or "< $0.01" or "—"
}

export interface PriceEntryDisplay {
  key: string;
  label: string;           // first keyword, title-cased
  packagePrice: number;    // effective (after override)
  packageAmount: number;
  packageUnit: PackageUnit;
  isOverridden: boolean;
  defaultPackagePrice: number;
  defaultPackageAmount: number;
  defaultPackageUnit: PackageUnit;
}

// ── Ingredient database ───────────────────────────────────────────────────────

const PRICES: PriceEntry[] = [
  // ── Dairy ─────────────────────────────────────────────────────────────────
  {
    key: 'butter',
    keywords: ['unsalted butter', 'salted butter', 'butter'],
    packagePrice: 4.49, packageAmount: 1, packageUnit: 'lb',
    densityGPerCup: 227,
  },
  {
    key: 'cream-cheese',
    keywords: ['cream cheese'],
    packagePrice: 2.29, packageAmount: 8, packageUnit: 'oz',
    densityGPerCup: 232,
  },
  {
    key: 'milk',
    keywords: ['whole milk', 'buttermilk', '2% milk', 'milk'],
    packagePrice: 0.25, packageAmount: 1, packageUnit: 'cup',
    densityGPerCup: 244,
  },
  {
    key: 'heavy-cream',
    keywords: ['heavy whipping cream', 'whipping cream', 'heavy cream'],
    packagePrice: 2.99, packageAmount: 8, packageUnit: 'floz',
    densityGPerCup: 238,
  },
  {
    key: 'sour-cream',
    keywords: ['sour cream'],
    packagePrice: 2.49, packageAmount: 16, packageUnit: 'oz',
    densityGPerCup: 230,
  },
  {
    key: 'cream',
    keywords: ['cream'],
    packagePrice: 2.99, packageAmount: 8, packageUnit: 'floz',
    densityGPerCup: 238,
  },
  {
    key: 'egg-yolks',
    keywords: ['egg yolk', 'egg yolks', 'yolk', 'yolks'],
    packagePrice: 4.49, packageAmount: 24, packageUnit: 'piece',
  },
  {
    key: 'eggs',
    keywords: ['large egg', 'large eggs', 'egg', 'eggs'],
    packagePrice: 4.49, packageAmount: 12, packageUnit: 'piece',
  },

  // ── Sugars ────────────────────────────────────────────────────────────────
  {
    key: 'granulated-sugar',
    keywords: ['granulated sugar', 'white sugar', 'cane sugar', 'sugar'],
    packagePrice: 2.99, packageAmount: 4, packageUnit: 'lb',
    densityGPerCup: 200,
  },
  {
    key: 'brown-sugar',
    keywords: ['light brown sugar', 'dark brown sugar', 'brown sugar'],
    packagePrice: 2.49, packageAmount: 2, packageUnit: 'lb',
    densityGPerCup: 220,
  },
  {
    key: 'powdered-sugar',
    keywords: ['powdered sugar', 'confectioners sugar', 'icing sugar', 'confectioners'],
    packagePrice: 2.49, packageAmount: 2, packageUnit: 'lb',
    densityGPerCup: 120,
  },
  {
    key: 'honey',
    keywords: ['honey'],
    packagePrice: 5.99, packageAmount: 16, packageUnit: 'oz',
    densityGPerCup: 340,
  },
  {
    key: 'maple-syrup',
    keywords: ['maple syrup'],
    packagePrice: 8.99, packageAmount: 12, packageUnit: 'floz',
    densityGPerCup: 315,
  },
  {
    key: 'corn-syrup',
    keywords: ['light corn syrup', 'dark corn syrup', 'corn syrup'],
    packagePrice: 3.49, packageAmount: 16, packageUnit: 'floz',
    densityGPerCup: 326,
  },

  // ── Flours ────────────────────────────────────────────────────────────────
  {
    key: 'all-purpose-flour',
    keywords: ['all-purpose flour', 'all purpose flour'],
    packagePrice: 3.49, packageAmount: 5, packageUnit: 'lb',
    densityGPerCup: 120,
  },
  {
    key: 'bread-flour',
    keywords: ['bread flour'],
    packagePrice: 3.99, packageAmount: 5, packageUnit: 'lb',
    densityGPerCup: 127,
  },
  {
    key: 'cake-flour',
    keywords: ['cake flour'],
    packagePrice: 4.29, packageAmount: 2, packageUnit: 'lb',
    densityGPerCup: 100,
  },
  {
    key: 'almond-flour',
    keywords: ['blanched almond flour', 'almond flour'],
    packagePrice: 5.99, packageAmount: 16, packageUnit: 'oz',
    densityGPerCup: 96,
  },
  {
    key: 'oat-flour',
    keywords: ['oat flour'],
    packagePrice: 3.49, packageAmount: 16, packageUnit: 'oz',
    densityGPerCup: 92,
  },
  {
    key: 'whole-wheat-flour',
    keywords: ['whole wheat flour'],
    packagePrice: 4.29, packageAmount: 5, packageUnit: 'lb',
    densityGPerCup: 120,
  },
  {
    key: 'flour',
    keywords: ['flour'],
    packagePrice: 3.49, packageAmount: 5, packageUnit: 'lb',
    densityGPerCup: 120,
  },

  // ── Baking agents ─────────────────────────────────────────────────────────
  {
    key: 'baking-powder',
    keywords: ['baking powder'],
    packagePrice: 2.49, packageAmount: 8.1, packageUnit: 'oz',
    densityGPerCup: 230,
  },
  {
    key: 'baking-soda',
    keywords: ['bicarbonate of soda', 'baking soda'],
    packagePrice: 0.99, packageAmount: 16, packageUnit: 'oz',
    densityGPerCup: 274,
  },
  {
    key: 'cream-of-tartar',
    keywords: ['cream of tartar'],
    packagePrice: 3.49, packageAmount: 1.5, packageUnit: 'oz',
    densityGPerCup: 150,
  },
  {
    key: 'cornstarch',
    keywords: ['corn starch', 'cornstarch', 'arrowroot'],
    packagePrice: 2.49, packageAmount: 16, packageUnit: 'oz',
    densityGPerCup: 128,
  },
  {
    key: 'instant-yeast',
    keywords: ['instant yeast', 'active dry yeast', 'yeast'],
    packagePrice: 3.99, packageAmount: 4, packageUnit: 'oz',
    densityGPerCup: 150,
  },

  // ── Extracts & flavorings ─────────────────────────────────────────────────
  {
    key: 'vanilla-extract',
    keywords: ['pure vanilla extract', 'vanilla extract', 'vanilla'],
    packagePrice: 7.99, packageAmount: 4, packageUnit: 'floz',
    densityGPerCup: 220,
  },
  {
    key: 'almond-extract',
    keywords: ['almond extract'],
    packagePrice: 4.99, packageAmount: 2, packageUnit: 'floz',
    densityGPerCup: 220,
  },
  {
    key: 'peppermint-extract',
    keywords: ['peppermint extract'],
    packagePrice: 4.99, packageAmount: 2, packageUnit: 'floz',
    densityGPerCup: 220,
  },
  {
    key: 'lemon-extract',
    keywords: ['lemon extract', 'orange extract'],
    packagePrice: 4.99, packageAmount: 2, packageUnit: 'floz',
    densityGPerCup: 220,
  },
  {
    key: 'food-coloring',
    keywords: ['red gel food coloring', 'gel food coloring', 'red food coloring', 'food coloring'],
    packagePrice: 3.99, packageAmount: 0.75, packageUnit: 'oz',
  },

  // ── Chocolate & cocoa ─────────────────────────────────────────────────────
  {
    key: 'cocoa-powder',
    keywords: ['dutch processed cocoa', 'dutch process cocoa', 'dutch cocoa', 'unsweetened cocoa', 'cocoa powder', 'cocoa'],
    packagePrice: 4.49, packageAmount: 8, packageUnit: 'oz',
    densityGPerCup: 100,
  },
  {
    key: 'chocolate-chips',
    keywords: ['semi-sweet chocolate chips', 'dark chocolate chips', 'chocolate chips'],
    packagePrice: 3.49, packageAmount: 12, packageUnit: 'oz',
    densityGPerCup: 168,
  },
  {
    key: 'white-chocolate',
    keywords: ['white chocolate chips', 'white chocolate'],
    packagePrice: 3.99, packageAmount: 12, packageUnit: 'oz',
    densityGPerCup: 168,
  },
  {
    key: 'dark-chocolate',
    keywords: ['bittersweet chocolate', 'semi-sweet chocolate', 'dark chocolate'],
    packagePrice: 3.99, packageAmount: 4, packageUnit: 'oz',
    densityGPerCup: 168,
  },
  {
    key: 'milk-chocolate',
    keywords: ['milk chocolate'],
    packagePrice: 3.49, packageAmount: 4, packageUnit: 'oz',
    densityGPerCup: 168,
  },

  // ── Oils & fats ───────────────────────────────────────────────────────────
  {
    key: 'vegetable-oil',
    keywords: ['canola oil', 'neutral oil', 'vegetable oil'],
    packagePrice: 4.99, packageAmount: 48, packageUnit: 'floz',
    densityGPerCup: 218,
  },
  {
    key: 'coconut-oil',
    keywords: ['coconut oil'],
    packagePrice: 5.99, packageAmount: 14, packageUnit: 'oz',
    densityGPerCup: 218,
  },
  {
    key: 'olive-oil',
    keywords: ['olive oil'],
    packagePrice: 6.99, packageAmount: 16, packageUnit: 'floz',
    densityGPerCup: 216,
  },

  // ── Nuts ──────────────────────────────────────────────────────────────────
  {
    key: 'walnuts',
    keywords: ['chopped walnuts', 'walnuts', 'walnut'],
    packagePrice: 5.99, packageAmount: 16, packageUnit: 'oz',
    densityGPerCup: 120,
  },
  {
    key: 'pecans',
    keywords: ['chopped pecans', 'pecans', 'pecan'],
    packagePrice: 6.99, packageAmount: 16, packageUnit: 'oz',
    densityGPerCup: 110,
  },
  {
    key: 'almonds',
    keywords: ['sliced almonds', 'slivered almonds', 'almonds'],
    packagePrice: 5.99, packageAmount: 16, packageUnit: 'oz',
    densityGPerCup: 92,
  },
  {
    key: 'peanuts',
    keywords: ['peanut butter chips', 'peanuts'],
    packagePrice: 3.99, packageAmount: 16, packageUnit: 'oz',
    densityGPerCup: 146,
  },
  {
    key: 'cashews',
    keywords: ['cashews'],
    packagePrice: 8.99, packageAmount: 16, packageUnit: 'oz',
    densityGPerCup: 130,
  },
  {
    key: 'hazelnuts',
    keywords: ['hazelnuts'],
    packagePrice: 7.99, packageAmount: 12, packageUnit: 'oz',
    densityGPerCup: 135,
  },
  {
    key: 'macadamia',
    keywords: ['macadamia nuts', 'macadamia'],
    packagePrice: 9.99, packageAmount: 8, packageUnit: 'oz',
    densityGPerCup: 134,
  },

  // ── Spices & salt ─────────────────────────────────────────────────────────
  {
    key: 'cinnamon',
    keywords: ['ground cinnamon', 'cinnamon'],
    packagePrice: 2.99, packageAmount: 2.37, packageUnit: 'oz',
    densityGPerCup: 120,
  },
  {
    key: 'nutmeg',
    keywords: ['ground nutmeg', 'nutmeg'],
    packagePrice: 2.99, packageAmount: 1.1, packageUnit: 'oz',
    densityGPerCup: 110,
  },
  {
    key: 'ginger',
    keywords: ['ground ginger', 'ginger'],
    packagePrice: 2.99, packageAmount: 1.5, packageUnit: 'oz',
    densityGPerCup: 160,
  },
  {
    key: 'cloves',
    keywords: ['ground cloves', 'cloves'],
    packagePrice: 2.99, packageAmount: 1.2, packageUnit: 'oz',
    densityGPerCup: 130,
  },
  {
    key: 'cardamom',
    keywords: ['cardamom'],
    packagePrice: 4.99, packageAmount: 1.5, packageUnit: 'oz',
    densityGPerCup: 112,
  },
  {
    key: 'espresso-powder',
    keywords: ['espresso powder', 'instant espresso', 'instant coffee'],
    packagePrice: 4.99, packageAmount: 2, packageUnit: 'oz',
    densityGPerCup: 85,
  },
  {
    key: 'salt',
    keywords: ['kosher salt', 'sea salt', 'salt'],
    packagePrice: 2.99, packageAmount: 26, packageUnit: 'oz',
    densityGPerCup: 288,
  },
  {
    key: 'black-pepper',
    keywords: ['black pepper', 'pepper'],
    packagePrice: 3.49, packageAmount: 3, packageUnit: 'oz',
    densityGPerCup: 100,
  },

  // ── Acids & liquids ───────────────────────────────────────────────────────
  {
    key: 'lemon-juice',
    keywords: ['fresh lemon juice', 'lemon juice'],
    packagePrice: 1.99, packageAmount: 16, packageUnit: 'floz',
    densityGPerCup: 244,
  },
  {
    key: 'orange-juice',
    keywords: ['orange juice'],
    packagePrice: 3.99, packageAmount: 52, packageUnit: 'floz',
    densityGPerCup: 248,
  },
  {
    key: 'vinegar',
    keywords: ['apple cider vinegar', 'white vinegar', 'vinegar'],
    packagePrice: 2.99, packageAmount: 32, packageUnit: 'floz',
    densityGPerCup: 240,
  },
  {
    key: 'water',
    keywords: ['water'],
    packagePrice: 0, packageAmount: 1, packageUnit: 'cup',
    densityGPerCup: 237,
  },

  // ── Other ─────────────────────────────────────────────────────────────────
  {
    key: 'sprinkles',
    keywords: ['jimmies', 'rainbow sprinkles', 'sprinkles'],
    packagePrice: 3.49, packageAmount: 6, packageUnit: 'oz',
    densityGPerCup: 160,
  },
  {
    key: 'vanilla-bean',
    keywords: ['vanilla bean', 'vanilla beans'],
    packagePrice: 8.99, packageAmount: 2, packageUnit: 'piece',
  },
  {
    key: 'coconut-cream',
    keywords: ['cream of coconut', 'coconut cream'],
    packagePrice: 2.49, packageAmount: 13.5, packageUnit: 'floz',
    densityGPerCup: 240,
  },
  {
    key: 'shredded-coconut',
    keywords: ['sweetened coconut', 'coconut flakes', 'shredded coconut'],
    packagePrice: 2.99, packageAmount: 14, packageUnit: 'oz',
    densityGPerCup: 93,
  },
  {
    key: 'peanut-butter',
    keywords: ['peanut butter'],
    packagePrice: 3.99, packageAmount: 16, packageUnit: 'oz',
    densityGPerCup: 258,
  },
  {
    key: 'nutella',
    keywords: ['hazelnut spread', 'nutella'],
    packagePrice: 4.99, packageAmount: 13, packageUnit: 'oz',
    densityGPerCup: 260,
  },
  {
    key: 'jam',
    keywords: ['preserves', 'jelly', 'jam'],
    packagePrice: 3.49, packageAmount: 18, packageUnit: 'oz',
    densityGPerCup: 320,
  },
];

// ── localStorage overrides ────────────────────────────────────────────────────

const LS_KEY = 'ingredient-prices-v1';

function getOverrides(): Record<string, PriceOverride> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, PriceOverride>) : {};
  } catch {
    return {};
  }
}

export function getUserOverride(key: string): PriceOverride | null {
  return getOverrides()[key] ?? null;
}

export function setUserOverride(key: string, override: PriceOverride): void {
  const overrides = getOverrides();
  overrides[key] = override;
  localStorage.setItem(LS_KEY, JSON.stringify(overrides));
}

export function resetUserOverride(key: string): void {
  const overrides = getOverrides();
  delete overrides[key];
  localStorage.setItem(LS_KEY, JSON.stringify(overrides));
}

export function hasUserOverride(key: string): boolean {
  return key in getOverrides();
}

// ── AI price cache ────────────────────────────────────────────────────────────

const AI_LS_KEY = 'ingredient-ai-prices-v1';

function getAIPriceCache(): Record<string, AIPrice> {
  try {
    const raw = localStorage.getItem(AI_LS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, AIPrice>) : {};
  } catch {
    return {};
  }
}

export function getAIPrice(name: string): AIPrice | null {
  return getAIPriceCache()[name.toLowerCase()] ?? null;
}

export function setAIPrice(name: string, price: AIPrice): void {
  try {
    const cache = getAIPriceCache();
    cache[name.toLowerCase()] = price;
    localStorage.setItem(AI_LS_KEY, JSON.stringify(cache));
  } catch {}
}

// ── Derived prices from a package entry ───────────────────────────────────────

interface DerivedPrices {
  pricePerCup: number | null;
  pricePerGram: number | null;
  pricePerPiece: number | null;
}

function derivePrices(
  packagePrice: number,
  packageAmount: number,
  packageUnit: PackageUnit,
  densityGPerCup?: number,
): DerivedPrices {
  let pricePerCup: number | null = null;
  let pricePerGram: number | null = null;
  let pricePerPiece: number | null = null;

  switch (packageUnit) {
    case 'piece':
      pricePerPiece = packagePrice / packageAmount;
      break;
    case 'cup':
      pricePerCup = packagePrice / packageAmount;
      if (densityGPerCup) pricePerGram = pricePerCup / densityGPerCup;
      break;
    case 'tsp':
      pricePerCup = (packagePrice / packageAmount) * 48;
      if (densityGPerCup) pricePerGram = pricePerCup / densityGPerCup;
      break;
    case 'tbsp':
      pricePerCup = (packagePrice / packageAmount) * 16;
      if (densityGPerCup) pricePerGram = pricePerCup / densityGPerCup;
      break;
    case 'floz':
      pricePerCup = (packagePrice / packageAmount) * 8;
      if (densityGPerCup) pricePerGram = pricePerCup / densityGPerCup;
      break;
    case 'oz':
      pricePerGram = packagePrice / packageAmount / 28.3495;
      if (densityGPerCup) pricePerCup = pricePerGram * densityGPerCup;
      break;
    case 'lb':
      pricePerGram = packagePrice / packageAmount / 453.592;
      if (densityGPerCup) pricePerCup = pricePerGram * densityGPerCup;
      break;
    case 'g':
      pricePerGram = packagePrice / packageAmount;
      if (densityGPerCup) pricePerCup = pricePerGram * densityGPerCup;
      break;
  }

  return { pricePerCup, pricePerGram, pricePerPiece };
}

function getEffectiveDerived(entry: PriceEntry): DerivedPrices {
  const override = getUserOverride(entry.key);
  if (override) {
    return derivePrices(
      override.packagePrice,
      override.packageAmount,
      override.packageUnit,
      entry.densityGPerCup,
    );
  }
  return derivePrices(
    entry.packagePrice,
    entry.packageAmount,
    entry.packageUnit,
    entry.densityGPerCup,
  );
}

// ── Entry lookup (smarter matching) ──────────────────────────────────────────

function findEntry(name: string): PriceEntry | null {
  const n = name.toLowerCase().trim();
  // Step 1: exact match against any keyword
  for (const entry of PRICES) {
    if (entry.keywords.some(k => k === n)) return entry;
  }
  // Step 2: name contains keyword — longest keyword wins (no reverse)
  let best: PriceEntry | null = null;
  let bestLen = 0;
  for (const entry of PRICES) {
    for (const k of entry.keywords) {
      if (n.includes(k) && k.length > bestLen) {
        bestLen = k.length;
        best = entry;
      }
    }
  }
  return best;
}

/** Expose entry key lookup for UI use. */
export function findEntryKey(name: string): string | null {
  return findEntry(name)?.key ?? null;
}

// ── Unit → cups conversion ────────────────────────────────────────────────────

const VOLUME_TO_CUPS: Record<string, number> = {
  cup: 1, cups: 1,
  tablespoon: 1 / 16, tablespoons: 1 / 16, tbsp: 1 / 16,
  teaspoon: 1 / 48, teaspoons: 1 / 48, tsp: 1 / 48,
  'fluid oz': 1 / 8, 'fluid ounce': 1 / 8, 'fluid ounces': 1 / 8, floz: 1 / 8,
  quart: 4, quarts: 4, pint: 2, pints: 2,
  liter: 4.22675, litre: 4.22675, ml: 0.00422675,
};

// Ingredient units that represent weight (convert to grams)
const WEIGHT_UNIT_TO_GRAMS: Record<string, number> = {
  oz: 28.3495, ounce: 28.3495, ounces: 28.3495,
  lb: 453.592, lbs: 453.592, pound: 453.592, pounds: 453.592,
  g: 1, gram: 1, grams: 1,
};

const PIECE_UNITS = new Set(['', 'large', 'medium', 'small', 'extra-large', 'whole', 'piece', 'pieces']);

// ── Amount parser ─────────────────────────────────────────────────────────────

function parseAmount(s: string): number | null {
  s = s.trim();
  // Mixed number "1 1/2"
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  // Fraction "1/2"
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) return parseInt(frac[1]) / parseInt(frac[2]);
  // Range "2-3" — use midpoint
  const range = s.match(/^([\d.]+)-([\d.]+)$/);
  if (range) return (parseFloat(range[1]) + parseFloat(range[2])) / 2;
  // Unicode fractions
  const unicodeMap: Record<string, number> = {
    '½': 0.5, '¼': 0.25, '¾': 0.75,
    '⅓': 1 / 3, '⅔': 2 / 3,
    '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
  };
  for (const [sym, val] of Object.entries(unicodeMap)) {
    if (s === sym) return val;
    const mixedUni = s.match(new RegExp(`^(\\d+)\\s*${sym}$`));
    if (mixedUni) return parseInt(mixedUni[1]) + val;
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// ── Main exports ──────────────────────────────────────────────────────────────

export function estimateCost(amount: string, unit: string, name: string, scale = 1, aiPrice?: AIPrice | null): CostResult {
  const entry = findEntry(name);
  if (!entry && !aiPrice) return { cost: null, display: '—' };

  // Strip unit from amount if accidentally embedded
  let cleanAmount = amount.trim();
  if (unit) {
    const tl = cleanAmount.toLowerCase();
    const ul = unit.toLowerCase();
    if (tl.endsWith(ul) && tl.length > ul.length) cleanAmount = cleanAmount.slice(0, -unit.length).trim();
  }

  const qty = parseAmount(cleanAmount);
  if (qty === null || qty === 0) return { cost: null, display: '—' };

  const scaledQty = qty * scale;
  const unitLower = unit.toLowerCase().trim();

  // Use database entry if found, otherwise fall back to AI price
  const derived = entry
    ? getEffectiveDerived(entry)
    : derivePrices(aiPrice!.packagePrice, aiPrice!.packageAmount, aiPrice!.packageUnit, aiPrice!.densityGPerCup ?? undefined);
  const { pricePerCup, pricePerGram, pricePerPiece } = derived;

  let cost: number | null = null;

  if (PIECE_UNITS.has(unitLower)) {
    if (pricePerPiece != null) cost = scaledQty * pricePerPiece;
  } else if (unitLower in WEIGHT_UNIT_TO_GRAMS) {
    const grams = scaledQty * WEIGHT_UNIT_TO_GRAMS[unitLower];
    if (pricePerGram != null) cost = grams * pricePerGram;
  } else {
    const cupsPerUnit = VOLUME_TO_CUPS[unitLower];
    if (cupsPerUnit != null && pricePerCup != null) {
      cost = scaledQty * cupsPerUnit * pricePerCup;
    }
  }

  if (cost === null) return { cost: null, display: '—' };

  return {
    cost,
    display: cost === 0 ? '$0.00' : cost < 0.01 ? '< $0.01' : `$${cost.toFixed(2)}`,
  };
}

export function totalCost(
  ingredientGroups: { ingredients: { amount: string; unit: string; name: string }[] }[],
  scale = 1,
  aiPriceMap: Record<string, AIPrice> = {},
): number | null {
  let total = 0;
  let hasAny = false;
  for (const group of ingredientGroups) {
    for (const ing of group.ingredients) {
      const aiPrice = aiPriceMap[ing.name.toLowerCase()];
      const { cost } = estimateCost(ing.amount, ing.unit, ing.name, scale, aiPrice);
      if (cost != null) { total += cost; hasAny = true; }
    }
  }
  return hasAny ? total : null;
}

export function costCoverage(
  groups: { ingredients: { amount: string; unit: string; name: string }[] }[],
  scale = 1,
  aiPriceMap: Record<string, AIPrice> = {},
): { priced: number; total: number } {
  let total = 0;
  let priced = 0;
  for (const group of groups) {
    for (const ing of group.ingredients) {
      total++;
      const aiPrice = aiPriceMap[ing.name.toLowerCase()];
      const { cost } = estimateCost(ing.amount, ing.unit, ing.name, scale, aiPrice);
      if (cost != null) priced++;
    }
  }
  return { priced, total };
}

export function getAllPriceEntries(): PriceEntryDisplay[] {
  return PRICES.map(entry => {
    const override = getUserOverride(entry.key);
    const label = entry.keywords[0]
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      key: entry.key,
      label,
      packagePrice: override ? override.packagePrice : entry.packagePrice,
      packageAmount: override ? override.packageAmount : entry.packageAmount,
      packageUnit: override ? override.packageUnit : entry.packageUnit,
      isOverridden: !!override,
      defaultPackagePrice: entry.packagePrice,
      defaultPackageAmount: entry.packageAmount,
      defaultPackageUnit: entry.packageUnit,
    };
  });
}

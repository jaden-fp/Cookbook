import { INGREDIENTS, type IngredientEntry, type NutrientPer100g } from './nutritionData';
import type { IngredientGroup } from '../types';

// ── Amount parsing ─────────────────────────────────────────────────────────

/** Parse a fraction string like "1/2", "2/3", "3/4" */
function parseFraction(s: string): number | null {
  const m = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!m) return null;
  const num = parseInt(m[1], 10);
  const den = parseInt(m[2], 10);
  if (den === 0) return null;
  return num / den;
}

/** Parse an amount string like "1.5", "1 1/2", "2/3", "¼", "½", "¾" */
export function parseAmount(raw: string): number {
  if (!raw || !raw.trim()) return 0;
  const s = raw.trim()
    .replace(/¼/g, '1/4').replace(/½/g, '1/2').replace(/¾/g, '3/4')
    .replace(/⅓/g, '1/3').replace(/⅔/g, '2/3')
    .replace(/⅛/g, '1/8').replace(/⅜/g, '3/8').replace(/⅝/g, '5/8').replace(/⅞/g, '7/8')
    .replace(/[–—]/g, '-'); // em/en dash

  // Range like "2-3" → take average
  const rangeParts = s.split(/\s*-\s*/);
  if (rangeParts.length === 2) {
    const a = parseAmount(rangeParts[0]);
    const b = parseAmount(rangeParts[1]);
    if (!isNaN(a) && !isNaN(b) && b > a) return (a + b) / 2;
  }

  // "1 1/2" or "2 3/4"
  const mixed = s.match(/^(\d+(?:\.\d+)?)\s+(\d+\/\d+)$/);
  if (mixed) {
    const whole = parseFloat(mixed[1]);
    const frac = parseFraction(mixed[2]);
    if (frac !== null) return whole + frac;
  }

  // Plain fraction
  const frac = parseFraction(s);
  if (frac !== null) return frac;

  // Plain decimal / integer
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

// ── Unit normalisation ─────────────────────────────────────────────────────

/** All volume/mass conversions in grams or ml (treated as grams for water‑density items) */
const UNIT_ALIASES: Record<string, string> = {
  // cups
  cup: 'cup', cups: 'cup', c: 'cup',
  // tablespoons
  tablespoon: 'tbsp', tablespoons: 'tbsp', tbsp: 'tbsp', tbs: 'tbsp', tb: 'tbsp', t: 'tbsp',
  // teaspoons
  teaspoon: 'tsp', teaspoons: 'tsp', tsp: 'tsp', ts: 'tsp',
  // grams
  g: 'g', gram: 'g', grams: 'g', gr: 'g',
  // kilograms
  kg: 'kg', kilogram: 'kg', kilograms: 'kg',
  // ounces
  oz: 'oz', ounce: 'oz', ounces: 'oz',
  // pounds
  lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
  // millilitres
  ml: 'ml', milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml', cc: 'ml',
  // litres
  l: 'l', liter: 'l', liters: 'l', litre: 'l', litres: 'l',
  // fluid ounces
  'fl oz': 'floz', floz: 'floz',
  // whole items
  each: 'unit', piece: 'unit', pieces: 'unit', whole: 'unit', unit: 'unit',
  large: 'unit', medium: 'unit', small: 'unit',
  stick: 'stick', sticks: 'stick',
  // pinch/dash — effectively zero for nutrition
  pinch: 'pinch', dash: 'pinch',
};

function normaliseUnit(raw: string): string {
  return UNIT_ALIASES[raw.toLowerCase().trim()] ?? raw.toLowerCase().trim();
}

/** Convert a normalised unit + amount to GRAMS using per-ingredient density if available */
function toGrams(amount: number, normUnit: string, entry: IngredientEntry): number {
  switch (normUnit) {
    case 'g':     return amount;
    case 'kg':    return amount * 1000;
    case 'oz':    return amount * 28.3495;
    case 'lb':    return amount * 453.592;
    case 'ml':    return amount; // water density approximation
    case 'l':     return amount * 1000;
    case 'floz':  return amount * 29.5735;
    case 'pinch': return 0.3; // negligible
    case 'unit':  return amount * (entry.gramsPerUnit ?? 50);
    case 'stick': return amount * 113; // butter stick
    case 'cup':   return amount * (entry.gramsPerCup ?? 240);
    case 'tbsp':  return amount * (entry.gramsPerTbsp ?? entry.gramsPerCup ? (entry.gramsPerCup! / 16) : 15);
    case 'tsp': {
      const tbspG = entry.gramsPerTbsp ?? (entry.gramsPerCup ? entry.gramsPerCup / 16 : 15);
      return amount * (tbspG / 3);
    }
    default:      return 0; // unknown unit — skip
  }
}

// ── Ingredient matching ────────────────────────────────────────────────────

function normaliseIngName(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const PREP_WORDS = new Set([
  'fresh', 'dried', 'ground', 'chopped', 'diced', 'sliced', 'minced', 'grated', 'shredded',
  'melted', 'softened', 'room temperature', 'cold', 'warm', 'cooled', 'toasted', 'roasted',
  'packed', 'lightly', 'firmly', 'heaped', 'heaping', 'sifted', 'unsalted', 'salted',
  'sweetened', 'unsweetened', 'pure', 'natural', 'organic', 'raw',
]);

function stripPrep(name: string): string {
  return name.split(' ').filter(w => !PREP_WORDS.has(w) && w.length > 1).join(' ').trim() || name;
}

function scoreMatch(ingName: string, alias: string): number {
  // Exact match
  if (ingName === alias) return 100;
  // Alias is contained in ingName
  if (ingName.includes(alias)) return 80;
  // ingName is contained in alias
  if (alias.includes(ingName)) return 70;
  // Word overlap
  const ingWords = ingName.split(' ');
  const aliasWords = alias.split(' ');
  const matches = ingWords.filter(w => aliasWords.includes(w));
  if (matches.length === 0) return 0;
  return (matches.length / Math.max(ingWords.length, aliasWords.length)) * 60;
}

export function findIngredient(rawName: string): IngredientEntry | null {
  const norm = normaliseIngName(rawName);
  const stripped = stripPrep(norm);

  let best: { entry: IngredientEntry; score: number } | null = null;

  for (const entry of INGREDIENTS) {
    for (const alias of entry.aliases) {
      const s1 = scoreMatch(norm, alias);
      const s2 = scoreMatch(stripped, alias);
      const score = Math.max(s1, s2);
      if (score > 0 && (!best || score > best.score)) {
        best = { entry, score };
      }
    }
  }

  return best && best.score >= 30 ? best.entry : null;
}

// ── Per-ingredient calculation ─────────────────────────────────────────────

export interface IngredientNutrition {
  name: string;
  grams: number;
  matched: boolean;
  nutrition: NutrientPer100g;
  ingredientName: string;  // just the ingredient name (not amount/unit)
  amount: number;          // parsed amount (already scaled)
  unit: string;            // normalised unit
}

export interface NutritionResult {
  total: NutrientPer100g;
  perServing: NutrientPer100g;
  servings: number;
  breakdown: IngredientNutrition[];
  coveragePercent: number; // % of ingredients successfully matched
}

function scaleNutrition(n: NutrientPer100g, factor: number): NutrientPer100g {
  return {
    calories: Math.round(n.calories * factor),
    protein:  Math.round(n.protein  * factor * 10) / 10,
    fat:      Math.round(n.fat      * factor * 10) / 10,
    sugar:    Math.round(n.sugar    * factor * 10) / 10,
    carbs:    Math.round(n.carbs    * factor * 10) / 10,
  };
}

function addNutrition(a: NutrientPer100g, b: NutrientPer100g): NutrientPer100g {
  return {
    calories: a.calories + b.calories,
    protein:  a.protein  + b.protein,
    fat:      a.fat      + b.fat,
    sugar:    a.sugar    + b.sugar,
    carbs:    a.carbs    + b.carbs,
  };
}

const ZERO: NutrientPer100g = { calories: 0, protein: 0, fat: 0, sugar: 0, carbs: 0 };

/**
 * Calculate total nutrition for all ingredient groups.
 * @param groups  Ingredient groups from the recipe
 * @param servings  Number of servings to divide by (default 1)
 * @param scale   Recipe scale multiplier (default 1)
 */
export function calcNutrition(
  groups: IngredientGroup[],
  servings: number,
  scale = 1,
): NutritionResult {
  const allIngredients = groups.flatMap(g => g.ingredients);
  const breakdown: IngredientNutrition[] = [];
  let matchedCount = 0;

  let total: NutrientPer100g = { ...ZERO };

  for (const ing of allIngredients) {
    const entry = findIngredient(ing.name);
    const grams = entry
      ? toGrams(parseAmount(ing.amount) * scale, normaliseUnit(ing.unit), entry)
      : 0;

    const matched = entry !== null && grams > 0;
    if (matched) matchedCount++;

    const contrib = entry && grams > 0
      ? scaleNutrition(entry.nutrition, grams / 100)
      : { ...ZERO };

    total = addNutrition(total, contrib);

    breakdown.push({
      name: [ing.amount, ing.unit, ing.name].filter(Boolean).join(' '),
      grams,
      matched,
      nutrition: contrib,
      ingredientName: ing.name,
      amount: parseAmount(ing.amount) * scale,
      unit: normaliseUnit(ing.unit),
    });
  }

  const s = Math.max(servings, 1);
  const perServing: NutrientPer100g = {
    calories: Math.round(total.calories / s),
    protein:  Math.round((total.protein / s) * 10) / 10,
    fat:      Math.round((total.fat / s) * 10) / 10,
    sugar:    Math.round((total.sugar / s) * 10) / 10,
    carbs:    Math.round((total.carbs / s) * 10) / 10,
  };

  total = {
    calories: Math.round(total.calories),
    protein:  Math.round(total.protein * 10) / 10,
    fat:      Math.round(total.fat * 10) / 10,
    sugar:    Math.round(total.sugar * 10) / 10,
    carbs:    Math.round(total.carbs * 10) / 10,
  };

  return {
    total,
    perServing,
    servings: s,
    breakdown,
    coveragePercent: allIngredients.length > 0
      ? Math.round((matchedCount / allIngredients.length) * 100)
      : 0,
  };
}

/** Parse a serving count from a recipe yield string like "12 cookies", "serves 4", "6" */
export function parseServings(yieldStr: string | null | undefined): number {
  if (!yieldStr) return 1;
  const m = yieldStr.match(/\d+/);
  return m ? Math.max(1, parseInt(m[0], 10)) : 1;
}

/** Return category badges for notable nutrition */
export function getNutritionBadges(perServing: NutrientPer100g): { label: string; color: string }[] {
  const badges: { label: string; color: string }[] = [];
  if (perServing.sugar > 20)    badges.push({ label: 'Indulgent',      color: '#E9557A' });
  if (perServing.fat > 20)      badges.push({ label: 'Rich',           color: '#C47C2B' });
  if (perServing.protein > 10)  badges.push({ label: 'Protein Boost',  color: '#3DAD6B' });
  if (perServing.calories < 150) badges.push({ label: 'Light Bite',    color: '#00B4A4' });
  if (perServing.calories > 500) badges.push({ label: 'Hearty',        color: '#7040DC' });
  return badges;
}

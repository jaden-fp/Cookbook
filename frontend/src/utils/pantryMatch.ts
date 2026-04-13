import type { Recipe, PantryItem } from '../types';

const PANTRY_QUALIFIERS = new Set([
  'unsalted', 'salted', 'large', 'medium', 'small', 'extra', 'extra-virgin',
  'fresh', 'dried', 'ground', 'whole', 'pure', 'cold', 'warm', 'hot', 'frozen',
  'organic', 'raw', 'lightly', 'finely', 'coarsely', 'packed', 'sifted',
  'softened', 'melted', 'heavy', 'light', 'plain', 'all-purpose', 'unbleached',
  'virgin', 'dark', 'white', 'semi-sweet', 'bittersweet', 'ripe', 'overripe',
  'granulated', 'semisweet', 'dutch', 'dutch-process', 'process',
  'all', 'purpose', // handle unhyphenated "all purpose flour"
]);

// Scraper artifacts that end up as ingredient names but aren't real ingredients
const GHOST_INGREDIENT_RE = /^(room temperature|as needed|to taste|for serving|for topping|for garnish|to coat|for dusting|at room temperature)$/i;

// Always considered in-stock regardless of pantry
const ALWAYS_AVAILABLE = new Set(['water', 'ice water', 'cold water', 'warm water', 'hot water', 'boiling water']);

// Egg-derived ingredients — covered if pantry has eggs
const EGG_DERIVATIVES = new Set(['egg yolk', 'egg yolks', 'egg white', 'egg whites', 'yolk', 'yolks']);

function hasEggsInPantry(pantryItems: PantryItem[]): PantryItem | undefined {
  return pantryItems.find(item => {
    const n = normIngredient(item.name);
    return n === 'egg' || n === 'eggs' || n === 'large egg' || n === 'large eggs';
  });
}

/** Returns true if an ingredient should be excluded from coverage calculations (optional). */
export function isOptionalIngredient(ing: { optional?: boolean; name: string; notes: string | null }): boolean {
  if (ing.optional) return true;
  const combined = (ing.name + ' ' + (ing.notes ?? '')).toLowerCase();
  return combined.includes('(optional)') || /\boptional\b/.test(combined);
}

/** Returns true if an ingredient name is always covered (water, egg derivatives if eggs present). */
function ingredientIsCovered(ingName: string, pantryItems: PantryItem[]): boolean {
  const normalized = normIngredient(ingName);
  if (ALWAYS_AVAILABLE.has(normalized)) return true;
  if (EGG_DERIVATIVES.has(normalized)) {
    return !!hasEggsInPantry(pantryItems);
  }
  return pantryItems.some(item => pantryMatch(ingName, item.name));
}

function normIngredient(s: string): string {
  return s.toLowerCase().split(',')[0].replace(/\([^)]*\)/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}

function ingredientBase(s: string): string {
  const words = s.split(/\s+/);
  const idx = words.findIndex(w => !PANTRY_QUALIFIERS.has(w));
  return idx === -1 ? s : words.slice(idx).join(' ');
}

/**
 * Returns true if a recipe ingredient name is satisfied by a pantry item name.
 *
 * Handles:
 * - Qualifier prefixes: "unsalted butter" → "butter"
 * - Hyphens: "all-purpose flour" → "all purpose flour"
 * - Singular/plural: "egg" ↔ "eggs"
 * - "or" alternatives: "semisweet or bittersweet chocolate chips"
 * - Bidirectional specificity: pantry "granulated sugar" covers ingredient "sugar"
 * - Base-word match: "white sugar" and "granulated sugar" both strip to "sugar"
 */
export function pantryMatch(ingredientName: string, pantryItemName: string): boolean {
  const ing = normIngredient(ingredientName);
  const item = normIngredient(pantryItemName);

  const alts = ing.split(' or ').map(a => a.trim()).filter(Boolean);

  const itemVariants = new Set([item]);
  if (item.endsWith('s')) itemVariants.add(item.slice(0, -1));
  else itemVariants.add(item + 's');

  for (const alt of alts) {
    for (const v of itemVariants) {
      if (alt === v) return true;
      // Forward: ingredient ends with pantry item (qualifying adjectives before it)
      if (alt.endsWith(v)) {
        const prefix = alt.slice(0, alt.length - v.length).trim();
        if (!prefix || prefix.split(/\s+/).every(w => PANTRY_QUALIFIERS.has(w))) return true;
      }
      // Reverse: pantry item is more specific than ingredient
      // e.g. pantry "granulated sugar" satisfies ingredient "sugar"
      if (v.endsWith(alt)) {
        const prefix = v.slice(0, v.length - alt.length).trim();
        if (!prefix || prefix.split(/\s+/).every(w => PANTRY_QUALIFIERS.has(w))) return true;
      }
    }
    // Base-word match: strip qualifiers from both sides
    // e.g. "white sugar" (ingredient) and "granulated sugar" (pantry) both → "sugar"
    const ingBase = ingredientBase(alt);
    const itemBase = ingredientBase(item);
    if (ingBase === itemBase && ingBase.length > 0) return true;
  }
  return false;
}

/** Returns the pantry item that covers this ingredient, or null if none. */
export function findPantryMatch(ingredientName: string, pantryItems: PantryItem[]): PantryItem | null {
  return pantryItems.find(item => pantryMatch(ingredientName, item.name)) ?? null;
}

export type IngStatus = 'in-stock' | 'missing';

/**
 * Returns the status of a single ingredient against the current pantry.
 * - 'missing': no pantry item covers this ingredient, or it's out/low stock
 * - 'in-stock': pantry item exists and is available
 *
 * Water is always in-stock. Egg yolks/whites are in-stock if eggs are in pantry.
 */
export function getIngredientStatus(ingredientName: string, pantryItems: PantryItem[]): IngStatus {
  const normalized = normIngredient(ingredientName);

  // Always available ingredients
  if (ALWAYS_AVAILABLE.has(normalized)) return 'in-stock';

  if (!pantryItems.length) return 'missing';

  // Egg derivatives — covered if eggs are in pantry (and in-stock)
  if (EGG_DERIVATIVES.has(normalized)) {
    const eggsItem = hasEggsInPantry(pantryItems);
    if (!eggsItem) return 'missing';
    const s = eggsItem.status || (eggsItem.needs_purchase ? 'out' : 'in-stock');
    return (s === 'out' || s === 'low') ? 'missing' : 'in-stock';
  }

  const match = findPantryMatch(ingredientName, pantryItems);
  if (!match) return 'missing';
  const s = match.status || (match.needs_purchase ? 'out' : 'in-stock');
  if (s === 'out' || s === 'low') return 'missing';
  return 'in-stock';
}

/** Returns true if every required, non-ghost ingredient has a pantry entry that is in-stock. */
export function recipeAllIngredientsCovered(recipe: Recipe, pantryItems: PantryItem[]): boolean {
  const ings = recipe.ingredient_groups
    .flatMap(g => g.ingredients.filter(i => !isOptionalIngredient(i)));
  const names = ings.map(i => i.name.trim()).filter(n => n.length > 0 && !GHOST_INGREDIENT_RE.test(n));
  if (names.length === 0) return false;
  return names.every(name => ingredientIsCovered(name, pantryItems));
}

/** Returns coverage percentage and list of missing ingredient names. */
export function recipeCoverage(recipe: Recipe, pantryItems: PantryItem[]): { pct: number; missing: string[] } {
  const ings = recipe.ingredient_groups
    .flatMap(g => g.ingredients.filter(i => !isOptionalIngredient(i)));
  const names = ings.map(i => i.name.trim()).filter(n => n.length > 0 && !GHOST_INGREDIENT_RE.test(n));
  if (names.length === 0) return { pct: 0, missing: [] };
  const missing = names.filter(name => !ingredientIsCovered(name, pantryItems));
  const pct = Math.round(((names.length - missing.length) / names.length) * 100);
  return { pct, missing };
}

/** Returns true if any required pantry-tracked ingredient for this recipe is marked out or low. */
export function recipeHasOutOfStock(recipe: Recipe, pantryItems: PantryItem[]): boolean {
  const ings = recipe.ingredient_groups
    .flatMap(g => g.ingredients.filter(i => !isOptionalIngredient(i)));
  const names = ings.map(i => i.name.trim()).filter(n => n.length > 0 && !GHOST_INGREDIENT_RE.test(n));
  for (const name of names) {
    // Always-available and egg derivatives have their own logic
    const normalized = normIngredient(name);
    if (ALWAYS_AVAILABLE.has(normalized)) continue;
    if (EGG_DERIVATIVES.has(normalized)) {
      const eggsItem = hasEggsInPantry(pantryItems);
      if (eggsItem) {
        const s = eggsItem.status || (eggsItem.needs_purchase ? 'out' : 'in-stock');
        if (s === 'out' || s === 'low') return true;
      }
      continue;
    }
    for (const item of pantryItems) {
      if (pantryMatch(name, item.name)) {
        const s = item.status || (item.needs_purchase ? 'out' : 'in-stock');
        if (s === 'out' || s === 'low') return true;
      }
    }
  }
  return false;
}

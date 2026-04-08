/**
 * Splits a compound ingredient like "large eggs + 1 egg yolk" into components.
 * Returns null if the name is not compound (no embedded `+ N` pattern).
 */

const FRACTION_CHARS = '½¼¾⅓⅔⅛⅜⅝⅞';
const COMPOUND_RE = new RegExp(
  `^(.*?)\\s*\\+\\s*([\\d${FRACTION_CHARS}][\\d\\s/${FRACTION_CHARS}]*)\\s+(.+)$`
);

const KNOWN_UNITS = new Set([
  'cup','cups','tbsp','tsp','tablespoon','tablespoons','teaspoon','teaspoons',
  'oz','ounce','ounces','lb','lbs','pound','pounds','g','gram','grams','ml',
  'floz','fluid oz',
]);

export interface CompoundComponent {
  amount: string;
  unit: string;
  name: string;
}

/**
 * If `name` contains a ` + N [unit] ingredient` pattern, returns two components.
 * The first component uses the caller's amount/unit with the primary name.
 * Otherwise returns null (treat as a simple ingredient).
 */
export function splitCompound(amount: string, unit: string, name: string): CompoundComponent[] | null {
  const match = name.match(COMPOUND_RE);
  if (!match) return null;

  const primaryName = match[1].trim();
  const secondaryAmount = match[2].trim();
  const secondaryRest = match[3].trim();

  // Check if the secondary starts with a known unit
  const parts = secondaryRest.split(/\s+/);
  let secondaryUnit = '';
  let secondaryName = secondaryRest;
  if (parts.length > 1 && KNOWN_UNITS.has(parts[0].toLowerCase())) {
    secondaryUnit = parts[0];
    secondaryName = parts.slice(1).join(' ');
  }

  // Don't split if primary name is empty (malformed)
  if (!primaryName) return null;

  return [
    { amount, unit, name: primaryName },
    { amount: secondaryAmount, unit: secondaryUnit, name: secondaryName },
  ];
}

/**
 * Scale an ingredient amount string by a multiplier.
 * Handles integers, decimals, fractions (e.g. "1/2", "1 1/2"), and ranges ("2-3").
 * Returns the original string if it can't be parsed.
 */
export function scaleAmount(amount: string, scale: number, unit = ''): string {
  if (!amount) return amount;

  // Strip unit from amount if it was accidentally included during import (e.g., "1/2 cup" with unit="cup")
  let trimmed = amount.trim();
  if (unit) {
    const tl = trimmed.toLowerCase();
    const ul = unit.toLowerCase();
    if (tl.endsWith(ul) && tl.length > ul.length) {
      trimmed = trimmed.slice(0, trimmed.length - unit.length).trim();
    }
  }

  if (scale === 1) return trimmed;

  // Handle range like "2-3"
  const rangeMatch = trimmed.match(/^([\d./\s]+)-([\d./\s]+)$/);
  if (rangeMatch) {
    const lo = parseAmount(rangeMatch[1]);
    const hi = parseAmount(rangeMatch[2]);
    if (lo !== null && hi !== null) {
      return `${formatNumber(lo * scale)}-${formatNumber(hi * scale)}`;
    }
  }

  const val = parseAmount(trimmed);
  if (val === null) return amount;
  return formatNumber(val * scale);
}

function parseAmount(s: string): number | null {
  s = s.trim();
  // Mixed number like "1 1/2"
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  }
  // Fraction like "1/2"
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) return parseInt(frac[1]) / parseInt(frac[2]);
  // Plain number
  const num = parseFloat(s);
  return isNaN(num) ? null : num;
}

function formatNumber(n: number): string {
  // Try to express as a nice fraction or mixed number
  const fractions: [number, string][] = [
    [0.125, '⅛'], [0.25, '¼'], [0.333, '⅓'], [0.375, '⅜'],
    [0.5, '½'], [0.625, '⅝'], [0.667, '⅔'], [0.75, '¾'], [0.875, '⅞'],
  ];

  const whole = Math.floor(n);
  const frac = n - whole;

  if (frac < 0.01) return String(whole || 0);

  // Check common fractions within tolerance
  for (const [val, sym] of fractions) {
    if (Math.abs(frac - val) < 0.04) {
      return whole > 0 ? `${whole} ${sym}` : sym;
    }
  }

  // Fall back to 2 decimal places, trimmed
  return parseFloat(n.toFixed(2)).toString();
}

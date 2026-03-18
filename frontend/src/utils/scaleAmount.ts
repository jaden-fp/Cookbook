/**
 * Scale an ingredient amount string by a multiplier.
 * Handles integers, decimals, fractions (e.g. "1/2", "1 1/2"), and ranges ("2-3").
 * Returns the original string if it can't be parsed.
 */
export function scaleAmount(amount: string, scale: number): string {
  if (!amount || scale === 1) return amount;

  const trimmed = amount.trim();

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

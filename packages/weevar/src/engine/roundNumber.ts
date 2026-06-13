/** Round to at most 2 decimal places. */
export function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Format a number for display — never more than 2 decimal places. */
export function formatNumberMax2(n: number): string {
  return String(parseFloat(roundTo2(n).toFixed(2)));
}

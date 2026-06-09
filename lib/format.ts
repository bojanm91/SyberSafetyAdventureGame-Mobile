/**
 * Kompaktan prikaz brojeva: 340 → "340", 1000 → "1K", 1500 → "1.5K",
 * 12300 → "12K", 1_000_000 → "1M". Decimala se prikazuje samo ispod 10K/10M.
 */
export function formatCompact(n: number): string {
  const num = Math.max(0, Math.round(n));
  if (num < 1000) return String(num);

  const unit = (value: number, suffix: string) => {
    const fixed = value < 10 ? value.toFixed(1) : String(Math.round(value));
    // ukloni ".0" (npr. 1.0K → 1K)
    return fixed.replace(/\.0$/, "") + suffix;
  };

  if (num < 1_000_000) return unit(num / 1000, "K");
  return unit(num / 1_000_000, "M");
}

// Format angka ke format Rupiah Indonesia

/**
 * Format number to Indonesian Rupiah string
 * @example formatRupiah(1500000) → "Rp 1.500.000"
 * @example formatRupiah(1500000, true) → "1.500.000"
 */
export function formatRupiah(amount: number, withoutPrefix = false): string {
  const formatted = Math.abs(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const sign = amount < 0 ? '-' : '';

  if (withoutPrefix) {
    return `${sign}${formatted}`;
  }

  return `${sign}Rp ${formatted}`;
}

/**
 * Parse Rupiah string back to number
 * @example parseRupiah("Rp 1.500.000") → 1500000
 * @example parseRupiah("1.500.000") → 1500000
 */
export function parseRupiah(value: string): number {
  const cleaned = value.replace(/[^0-9-]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Format number with thousand separator
 * @example formatNumber(1500) → "1.500"
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Auto-generate kode barang & nomor transaksi
import { format } from 'date-fns';

/**
 * Generate kode barang: PRD-YYYYMMDD-XXX
 * @param sequentialNumber - nomor urut (1-999)
 * @param date - tanggal (default: hari ini)
 * @example generateKodeBarang(1) → "PRD-20260526-001"
 */
export function generateKodeBarang(
  sequentialNumber: number,
  date: Date = new Date()
): string {
  const dateStr = format(date, 'yyyyMMdd');
  const seq = sequentialNumber.toString().padStart(3, '0');
  return `PRD-${dateStr}-${seq}`;
}

/**
 * Generate nomor transaksi: TRX-YYYYMMDD-XXXX
 * @param sequentialNumber - nomor urut (1-9999)
 * @param date - tanggal (default: hari ini)
 * @example generateNomorTransaksi(1) → "TRX-20260526-0001"
 */
export function generateNomorTransaksi(
  sequentialNumber: number,
  date: Date = new Date()
): string {
  const dateStr = format(date, 'yyyyMMdd');
  const seq = sequentialNumber.toString().padStart(4, '0');
  return `TRX-${dateStr}-${seq}`;
}

/**
 * Extract date from kode barang
 * @example extractDateFromKode("PRD-20260526-001") → Date(2026-05-26)
 */
export function extractDateFromKode(kode: string): Date | null {
  const match = kode.match(/^(?:PRD|TRX)-(\d{8})-/);
  if (!match) return null;

  const dateStr = match[1];
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));

  return new Date(year, month, day);
}

/**
 * Extract sequential number from kode
 * @example extractSequentialNumber("PRD-20260526-001") → 1
 */
export function extractSequentialNumber(kode: string): number {
  const match = kode.match(/-(\d+)$/);
  if (!match) return 0;
  return parseInt(match[1]);
}

// Date helper utilities using date-fns
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, subDays, parse, isValid } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Format tanggal ke format tampilan Indonesia
 * @example formatTanggal(new Date()) → "26 Mei 2026"
 */
export function formatTanggal(date: Date): string {
  return format(date, 'd MMMM yyyy', { locale: id });
}

/**
 * Format tanggal ke format singkat
 * @example formatTanggalShort(new Date()) → "26/05/2026"
 */
export function formatTanggalShort(date: Date): string {
  return format(date, 'dd/MM/yyyy');
}

/**
 * Format tanggal ke ISO date string (YYYY-MM-DD)
 * @example formatDateISO(new Date()) → "2026-05-26"
 */
export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Format bulan dan tahun
 * @example formatBulan(new Date()) → "Mei 2026"
 */
export function formatBulan(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: id });
}

/**
 * Format bulan singkat
 * @example formatBulanShort(new Date()) → "05/2026"
 */
export function formatBulanShort(date: Date): string {
  return format(date, 'MM/yyyy');
}

/**
 * Format jam
 * @example formatWaktu(new Date()) → "14:30"
 */
export function formatWaktu(date: Date): string {
  return format(date, 'HH:mm');
}

/**
 * Format datetime lengkap
 * @example formatDateTime(new Date()) → "26 Mei 2026, 14:30"
 */
export function formatDateTime(date: Date): string {
  return format(date, 'd MMMM yyyy, HH:mm', { locale: id });
}

/**
 * Get ISO datetime string
 * @example getISODateTime() → "2026-05-26T14:30:00.000Z"
 */
export function getISODateTime(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Get tanggal hari ini (start of day)
 */
export function getToday(): Date {
  return startOfDay(new Date());
}

/**
 * Get start of current month
 */
export function getStartOfMonth(date: Date = new Date()): Date {
  return startOfMonth(date);
}

/**
 * Get end of current month
 */
export function getEndOfMonth(date: Date = new Date()): Date {
  return endOfMonth(date);
}

/**
 * Get start of day
 */
export function getStartOfDay(date: Date = new Date()): Date {
  return startOfDay(date);
}

/**
 * Get end of day
 */
export function getEndOfDay(date: Date = new Date()): Date {
  return endOfDay(date);
}

/**
 * Get date N days ago
 */
export function getDaysAgo(days: number): Date {
  return subDays(new Date(), days);
}

/**
 * Parse date string (YYYY-MM-DD) to Date object
 */
export function parseDate(dateStr: string): Date | null {
  const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
  return isValid(parsed) ? parsed : null;
}

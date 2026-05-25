import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date to local format
 */
export function formatDate(date: string | Date | null | undefined) {
  const parsed =
    typeof date === 'string' ? Date.parse(date) : date instanceof Date ? date.getTime() : NaN;

  if (!Number.isFinite(parsed)) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(parsed));
}

/**
 * Formats a currency or number with units
 */
export function formatQuantity(value: number, unit: string) {
  return `${value.toLocaleString()} ${unit}`;
}

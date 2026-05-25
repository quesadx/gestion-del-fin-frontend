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
 * Normalizes a person status string to the canonical enum value.
 * Used consistently across PersonDetail and PopulationRoster to avoid
 * duplicated if-else chains.
 */
export type PersonStatus = 'HEALTHY' | 'SICK' | 'INJURED' | 'AWAY' | 'DEAD';

export function normalizePersonStatus(raw: string | null | undefined): PersonStatus {
  const s = (raw ?? '').toUpperCase();
  if (s === 'SICK') return 'SICK';
  if (s === 'INJURED') return 'INJURED';
  if (s === 'AWAY') return 'AWAY';
  if (s === 'DEAD') return 'DEAD';
  return 'HEALTHY';
}

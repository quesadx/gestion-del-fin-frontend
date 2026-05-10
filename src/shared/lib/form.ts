import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import type { ZodType } from 'zod';

export function resolved<T extends Record<string, unknown>>(schema: ZodType): Resolver<T> {
  return (zodResolver as (s: ZodType) => Resolver<T>)(schema);
}

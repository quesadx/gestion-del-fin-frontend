import React from 'react';
import { cn } from '../lib/utils';
import BorderGlow from './BorderGlow';

export function Skeleton({ className, ...props }: React.HtmlHTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded bg-zinc-800/40', className)} {...props} />;
}

export function SkeletonCard() {
  return (
    <BorderGlow
      className="animate-pulse"
      backgroundColor="#171717"
      borderRadius={14}
      glowColor="356 76 58"
      glowIntensity={0.55}
      glowRadius={24}
      edgeSensitivity={24}
      coneSpread={20}
      animated={false}
    >
      <div className="p-6 space-y-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    </BorderGlow>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <BorderGlow
          key={i}
          className=""
          backgroundColor="#120F17"
          borderRadius={14}
          glowColor="356 76 58"
          glowIntensity={0.5}
          glowRadius={20}
          edgeSensitivity={24}
          coneSpread={20}
          animated={false}
        >
          <div className="flex items-center space-x-4 p-4 bg-surface-raised/30">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        </BorderGlow>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center pb-3 border-b border-zinc-900">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/6" />
        <Skeleton className="h-4 w-1/6" />
        <Skeleton className="h-4 w-1/12" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex justify-between items-center py-3 border-b border-zinc-900/50">
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/10" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
      <BorderGlow
        backgroundColor="#171717"
        borderRadius={16}
        glowColor="356 76 58"
        glowIntensity={0.55}
        glowRadius={24}
        edgeSensitivity={24}
        coneSpread={20}
        animated={false}
      >
        <div className="p-6 space-y-6">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </BorderGlow>
      <BorderGlow
        backgroundColor="#171717"
        borderRadius={16}
        glowColor="356 76 58"
        glowIntensity={0.55}
        glowRadius={24}
        edgeSensitivity={24}
        coneSpread={20}
        animated={false}
      >
        <div className="p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-zinc-900/50"
            >
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-20 rounded" />
            </div>
          ))}
        </div>
      </BorderGlow>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <BorderGlow
          key={i}
          backgroundColor="#171717"
          borderRadius={16}
          glowColor="356 76 58"
          glowIntensity={0.5}
          glowRadius={24}
          edgeSensitivity={24}
          coneSpread={20}
          animated={false}
        >
          <div className="p-6 bg-surface-raised/40 space-y-6">
            <div className="flex justify-between items-start">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-2 w-8" />
                <Skeleton className="h-2 w-24" />
              </div>
            </div>
            <div className="pt-2 flex gap-4">
              <Skeleton className="h-10 flex-1 rounded" />
              <Skeleton className="h-10 flex-1 rounded" />
            </div>
          </div>
        </BorderGlow>
      ))}
    </div>
  );
}

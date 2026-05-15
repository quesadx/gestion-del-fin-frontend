interface SkeletonCardProps {
  height?: string;
}

export function SkeletonCard({ height = 'h-24' }: SkeletonCardProps) {
  return (
    <div
      className={`${height} animate-pulse rounded-sm border border-[oklch(0.68_0.32_340_/_0.15)] bg-[oklch(0.12_0.03_340_/_0.8)]`}
    >
      <div className="p-4 space-y-3">
        <div className="h-3 w-1/3 bg-[oklch(0.25_0.03_340_/_0.5)] rounded-sm" />
        <div className="h-2 w-2/3 bg-[oklch(0.2_0.03_340_/_0.4)] rounded-sm" />
      </div>
    </div>
  );
}

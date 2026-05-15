interface SkeletonTableProps {
  rows: number;
  columns: number;
}

export function SkeletonTable({ rows, columns }: SkeletonTableProps) {
  return (
    <div className="overflow-x-auto animate-fade-in">
      <table className="w-full text-left font-mono-data text-xs">
        <thead>
          <tr className="border-b border-[oklch(0.68_0.32_340_/_0.15)] text-muted-foreground">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={`skel-h-${i}`} className="py-3 px-2">
                <span className="inline-block h-3 w-16 bg-[oklch(0.3_0.02_340_/_0.4)] animate-pulse rounded-sm" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={`skel-r-${r}`} className="border-b border-[oklch(0.68_0.32_340_/_0.08)]">
              {Array.from({ length: columns }).map((_, c) => (
                <td key={`skel-c-${r}-${c}`} className="py-3 px-2">
                  <span
                    className="inline-block h-3 bg-[oklch(0.25_0.03_340_/_0.5)] animate-pulse rounded-sm"
                    style={{ width: `${40 + Math.sin((r + c) * 1.5) * 30}%` }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

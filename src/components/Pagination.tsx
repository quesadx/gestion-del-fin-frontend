import { cn } from '../lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const isFirst = page <= 1;
  const isLast = page >= totalPages;
  const showEdges = totalPages > 3;

  const btn = (label: string, targetPage: number, disabled: boolean, title?: string) => (
    <button
      key={label}
      onClick={() => !disabled && onPageChange(targetPage)}
      disabled={disabled}
      title={title || label}
      aria-label={title || label}
      aria-disabled={disabled}
      className={cn(
        'px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] font-mono font-bold uppercase tracking-wider border rounded transition-colors select-none touch-target',
        disabled
          ? 'border-zinc-800 text-zinc-700 cursor-not-allowed'
          : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/60 active:scale-95',
      )}
    >
      {label}
    </button>
  );

  return (
    <nav className={cn('flex items-center gap-1.5', className)} aria-label="Pagination">
      {showEdges && btn('«', 1, isFirst, 'First page')}
      {btn('← Prev', page - 1, isFirst, 'Previous page')}

      <div
        className="px-3 py-1.5 text-[10px] font-mono text-zinc-400 border border-zinc-800 rounded bg-zinc-950/40 whitespace-nowrap"
        aria-current="page"
      >
        Page <span className="font-bold text-zinc-200">{page}</span> of{' '}
        <span className="font-bold text-zinc-200">{totalPages}</span>
      </div>

      {btn('Next →', page + 1, isLast, 'Next page')}
      {showEdges && btn('»', totalPages, isLast, 'Last page')}
    </nav>
  );
}

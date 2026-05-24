import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchInputProps extends Omit<React.ComponentProps<'input'>, 'ref'> {
  icon?: React.ReactNode;
}

export function SearchInput({ className, icon, ...props }: SearchInputProps) {
  return (
    <div className="relative flex-1 min-w-[200px] group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gdf-accent-secondary/50 group-focus-within:text-gdf-accent-secondary transition-colors duration-200">
        {icon || <Search className="h-3.5 w-3.5" />}
      </div>
      <Input
        className={cn(
          'pl-9 pr-3 py-2.5 h-10',
          'bg-gdf-glass-bg backdrop-blur-glass',
          'border border-gdf-glass-border',
          'rounded-md',
          'text-sm text-gdf-text-primary',
          'placeholder:text-gdf-text-muted',
          'font-sans text-xs',
          'focus-visible:outline-none focus-visible:border-gdf-accent-secondary/50',
          'focus-visible:ring-1 focus-visible:ring-gdf-accent-secondary/20',
          'focus-visible:shadow-[0_0_12px_var(--gdf-accent-secondary-glow)]',
          className,
        )}
        {...props}
      />
    </div>
  );
}

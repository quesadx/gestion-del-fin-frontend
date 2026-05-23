import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[60px] w-full rounded-md border border-gdf-border-subtle bg-gdf-surface-base/50 px-3 py-2 text-base shadow-sm placeholder:text-gdf-text-muted focus-visible:outline-none focus-visible:border-gdf-accent-primary focus-visible:ring-1 focus-visible:ring-gdf-accent-primary/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };

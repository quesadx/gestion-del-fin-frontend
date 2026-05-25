import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { motion, AnimatePresence } from 'framer-motion';
import { dropdownEnter } from '@/shared/lib/motion';

import { cn } from '@/lib/utils';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <AnimatePresence mode="wait">
      <PopoverPrimitive.Content
        ref={ref}
        asChild
        forceMount
        align={align}
        sideOffset={sideOffset}
        {...props}
      >
        <motion.div
          variants={dropdownEnter}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            'z-50 w-72 gdf-glass-overlay p-4 text-gdf-text-primary outline-none',
            className,
          )}
        />
      </PopoverPrimitive.Content>
    </AnimatePresence>
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };

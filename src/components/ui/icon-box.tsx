'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const iconBoxVariants = cva(
  'flex items-center justify-center rounded-xl',
  {
    variants: {
      color: {
        primary: 'bg-primary-100 dark:bg-primary-900/30',
        secondary: 'bg-secondary-100 dark:bg-secondary-900/30',
        accent: 'bg-accent-100 dark:bg-accent-900/30',
        success: 'bg-success-100 dark:bg-success-900/30',
        warning: 'bg-warning-100 dark:bg-warning-900/30',
        error: 'bg-error-100 dark:bg-error-900/30',
        info: 'bg-info-100 dark:bg-info-900/30',
        muted: 'bg-muted',
      },
      size: {
        sm: 'p-1.5',
        default: 'p-2',
        lg: 'p-3',
      },
    },
    defaultVariants: {
      color: 'primary',
      size: 'default',
    },
  }
);

const iconColorVariants: Record<string, string> = {
  primary: 'text-primary-600',
  secondary: 'text-secondary-600',
  accent: 'text-accent-600',
  success: 'text-success-600',
  warning: 'text-warning-600',
  error: 'text-error-600',
  info: 'text-info-600',
  muted: 'text-muted-foreground',
};

export interface IconBoxProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof iconBoxVariants> {
  children: React.ReactNode;
}

/**
 * IconBox - A container for icons with consistent styling.
 * Use this component to wrap icons in stat cards, list items, and other UI elements.
 *
 * @example
 * ```tsx
 * <IconBox color="primary">
 *   <Package className="h-4 w-4" />
 * </IconBox>
 *
 * <IconBox color="success" size="lg">
 *   <CheckCircle className="h-5 w-5" />
 * </IconBox>
 * ```
 */
export function IconBox({
  className,
  color = 'primary',
  size,
  children,
  ...props
}: IconBoxProps) {
  return (
    <div
      className={cn(iconBoxVariants({ color, size, className }))}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const colorKey = color || 'primary';
          return React.cloneElement(child as React.ReactElement<{ className?: string }>, {
            className: cn(
              (child as React.ReactElement<{ className?: string }>).props.className,
              iconColorVariants[colorKey]
            ),
          });
        }
        return child;
      })}
    </div>
  );
}

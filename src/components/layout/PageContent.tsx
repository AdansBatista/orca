"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Density = "compact" | "comfortable" | "spacious";

interface PageContentProps {
  children: React.ReactNode;
  /** Content density - affects padding and spacing */
  density?: Density;
  /** Maximum width constraint (false = full width) */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "7xl" | false;
  /** Center content horizontally when maxWidth is set */
  centered?: boolean;
  /** Additional className */
  className?: string;
  /** Remove default padding */
  noPadding?: boolean;
}

const densityStyles: Record<Density, string> = {
  compact: "p-4 space-y-4",
  comfortable: "p-6 space-y-6",
  spacious: "p-8 space-y-8",
};

const maxWidthStyles: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "7xl": "max-w-7xl",
};

/**
 * PageContent - Main content wrapper with density variants
 *
 * Features:
 * - Density variants for different information needs
 * - Optional max-width constraint
 * - Scrollable container
 *
 * Usage:
 * ```tsx
 * <PageContent density="comfortable">
 *   <DashboardGrid>...</DashboardGrid>
 * </PageContent>
 * ```
 */
export function PageContent({
  children,
  density = "comfortable",
  maxWidth = false,
  centered = true,
  noPadding = false,
  className,
}: PageContentProps) {
  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto scrollbar-thin",
        !noPadding && densityStyles[density],
        className
      )}
    >
      <div
        className={cn(
          maxWidth && maxWidthStyles[maxWidth],
          maxWidth && centered && "mx-auto"
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * PageSection - Grouped content section within a page
 */
interface PageSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageSection({
  children,
  title,
  description,
  actions,
  className,
}: PageSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || description || actions) && (
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * PageFooter - Fixed footer for forms or actions
 */
interface PageFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function PageFooter({ children, className }: PageFooterProps) {
  return (
    <footer
      className={cn(
        "sticky bottom-0 border-t border-border/50 bg-background/80 backdrop-blur-md px-6 py-4",
        "flex items-center justify-end gap-3",
        className
      )}
    >
      {children}
    </footer>
  );
}

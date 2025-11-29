"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional subtitle/description */
  description?: string;
  /** Breadcrumb items (last item is current page) */
  breadcrumbs?: BreadcrumbItem[];
  /** Action buttons or controls to display on the right */
  actions?: React.ReactNode;
  /** Additional content below the title (e.g., tabs, filters) */
  children?: React.ReactNode;
  /** Make header sticky */
  sticky?: boolean;
  /** Compact mode - inline breadcrumbs with title, reduced padding */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * PageHeader - Consistent page header with title, breadcrumbs, and actions
 *
 * Features:
 * - Optional sticky positioning with backdrop blur
 * - Breadcrumb navigation
 * - Right-aligned action area
 * - Optional children slot for tabs/filters
 *
 * Usage:
 * ```tsx
 * <PageHeader
 *   title="Patients"
 *   description="Manage patient records"
 *   breadcrumbs={[
 *     { label: "Home", href: "/" },
 *     { label: "Patients" }
 *   ]}
 *   actions={
 *     <Button>Add Patient</Button>
 *   }
 * />
 * ```
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  children,
  sticky = true,
  compact = false,
  className,
}: PageHeaderProps) {
  // Compact mode: single row with breadcrumbs and title inline
  if (compact) {
    return (
      <header
        className={cn(
          "border-b border-border/50 bg-background/80 backdrop-blur-md",
          sticky && "sticky top-0 z-30",
          className
        )}
      >
        <div className="px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* Breadcrumbs inline */}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumb>
                  <BreadcrumbList className="text-xs">
                    {breadcrumbs.map((item, index) => (
                      <React.Fragment key={index}>
                        <BreadcrumbItem>
                          {item.href ? (
                            <BreadcrumbLink href={item.href} className="text-xs">
                              {item.label}
                            </BreadcrumbLink>
                          ) : (
                            <BreadcrumbPage className="text-xs font-medium">
                              {item.label}
                            </BreadcrumbPage>
                          )}
                        </BreadcrumbItem>
                        {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                      </React.Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              )}
            </div>

            {/* Actions */}
            {actions && (
              <div className="flex items-center gap-2 shrink-0">{actions}</div>
            )}
          </div>
        </div>

        {/* Additional content (tabs, filters, etc.) */}
        {children && <div className="px-6 pb-3">{children}</div>}
      </header>
    );
  }

  // Default mode
  return (
    <header
      className={cn(
        "border-b border-border/50 bg-background/80 backdrop-blur-md",
        sticky && "sticky top-0 z-30",
        className
      )}
    >
      <div className="px-6 py-4">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb className="mb-2">
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  <BreadcrumbItem>
                    {item.href ? (
                      <BreadcrumbLink href={item.href}>
                        {item.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        {/* Title Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight truncate">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground truncate">
                {description}
              </p>
            )}
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          )}
        </div>
      </div>

      {/* Additional content (tabs, filters, etc.) */}
      {children && <div className="px-6 pb-4">{children}</div>}
    </header>
  );
}

/**
 * PageHeaderCompact - Smaller header variant for detail views or modals
 */
interface PageHeaderCompactProps {
  title: string;
  actions?: React.ReactNode;
  backHref?: string;
  onBack?: () => void;
  className?: string;
}

export function PageHeaderCompact({
  title,
  actions,
  backHref,
  onBack,
  className,
}: PageHeaderCompactProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-4 px-6 py-3 border-b border-border/50",
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {(backHref || onBack) && (
          <a
            href={backHref}
            onClick={onBack ? (e) => { e.preventDefault(); onBack(); } : undefined}
            className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </a>
        )}
        <h2 className="text-lg font-semibold truncate">{title}</h2>
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </header>
  );
}

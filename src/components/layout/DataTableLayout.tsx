"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DataTableLayout - Full-width data table layout with toolbar and pagination
 *
 * Features:
 * - Sticky toolbar with search, filters, and actions
 * - Scrollable table container
 * - Fixed pagination footer
 *
 * Usage:
 * ```tsx
 * <DataTableLayout>
 *   <DataTableLayout.Toolbar>
 *     <SearchInput />
 *     <FilterButtons />
 *     <ActionButtons />
 *   </DataTableLayout.Toolbar>
 *   <DataTableLayout.Table>
 *     <Table>...</Table>
 *   </DataTableLayout.Table>
 *   <DataTableLayout.Pagination>
 *     <PaginationControls />
 *   </DataTableLayout.Pagination>
 * </DataTableLayout>
 * ```
 */

interface DataTableLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTableLayout({ children, className }: DataTableLayoutProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>{children}</div>
  );
}

/**
 * Toolbar - Search, filters, and bulk actions
 */
interface ToolbarProps {
  children: React.ReactNode;
  className?: string;
}

function Toolbar({ children, className }: ToolbarProps) {
  return (
    <div
      className={cn(
        "shrink-0 flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border/50 bg-card/50",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * ToolbarSection - Group related toolbar items
 */
interface ToolbarSectionProps {
  children: React.ReactNode;
  /** Alignment within toolbar */
  align?: "start" | "end";
  className?: string;
}

function ToolbarSection({
  children,
  align = "start",
  className,
}: ToolbarSectionProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        align === "end" && "ml-auto",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Table container - Scrollable area for the data table
 */
interface TableContainerProps {
  children: React.ReactNode;
  className?: string;
}

function TableContainer({ children, className }: TableContainerProps) {
  return (
    <div className={cn("flex-1 overflow-auto scrollbar-thin", className)}>
      {children}
    </div>
  );
}

/**
 * Pagination footer - Fixed at bottom
 */
interface PaginationProps {
  children: React.ReactNode;
  className?: string;
}

function Pagination({ children, className }: PaginationProps) {
  return (
    <div
      className={cn(
        "shrink-0 flex items-center justify-between gap-4 px-4 py-3",
        "border-t border-border/50 bg-card/50",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Empty state - Shown when table has no data
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground/50">{icon}</div>
      )}
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * Selection info bar - Shows when items are selected
 */
interface SelectionBarProps {
  count: number;
  children: React.ReactNode;
  onClear?: () => void;
  className?: string;
}

function SelectionBar({
  count,
  children,
  onClear,
  className,
}: SelectionBarProps) {
  if (count === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2 bg-primary-50 dark:bg-primary-900/20",
        "border-b border-primary-200 dark:border-primary-800",
        className
      )}
    >
      <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
        {count} selected
      </span>
      {onClear && (
        <button
          onClick={onClear}
          className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          Clear
        </button>
      )}
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  );
}

// Attach sub-components
DataTableLayout.Toolbar = Toolbar;
DataTableLayout.ToolbarSection = ToolbarSection;
DataTableLayout.Table = TableContainer;
DataTableLayout.Pagination = Pagination;
DataTableLayout.EmptyState = EmptyState;
DataTableLayout.SelectionBar = SelectionBar;

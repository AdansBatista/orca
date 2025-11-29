"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * MasterDetail - Split view layout with list panel and detail panel
 *
 * Features:
 * - Resizable list panel (fixed widths)
 * - Flexible detail panel
 * - Optional collapsed state for list
 * - Customizable divider
 *
 * Usage:
 * ```tsx
 * <MasterDetail>
 *   <MasterDetail.List>
 *     <SearchInput />
 *     <PatientList />
 *   </MasterDetail.List>
 *   <MasterDetail.Detail>
 *     <PatientProfile />
 *   </MasterDetail.Detail>
 * </MasterDetail>
 * ```
 */

type ListWidth = "narrow" | "default" | "wide";

interface MasterDetailContextValue {
  listWidth: ListWidth;
  isListCollapsed: boolean;
  setListCollapsed: (collapsed: boolean) => void;
}

const MasterDetailContext = React.createContext<
  MasterDetailContextValue | undefined
>(undefined);

function useMasterDetail() {
  const context = React.useContext(MasterDetailContext);
  if (!context) {
    throw new Error(
      "MasterDetail components must be used within a MasterDetail"
    );
  }
  return context;
}

interface MasterDetailProps {
  children: React.ReactNode;
  /** Width of the list panel */
  listWidth?: ListWidth;
  /** Start with list collapsed */
  defaultCollapsed?: boolean;
  className?: string;
}

const listWidthStyles: Record<ListWidth, string> = {
  narrow: "w-72",
  default: "w-80 lg:w-96",
  wide: "w-96 lg:w-[28rem]",
};

export function MasterDetail({
  children,
  listWidth = "default",
  defaultCollapsed = false,
  className,
}: MasterDetailProps) {
  const [isListCollapsed, setListCollapsed] =
    React.useState(defaultCollapsed);

  return (
    <MasterDetailContext.Provider
      value={{ listWidth, isListCollapsed, setListCollapsed }}
    >
      <div className={cn("flex h-full", className)}>{children}</div>
    </MasterDetailContext.Provider>
  );
}

/**
 * List panel - shows the master list (e.g., patients, conversations)
 */
interface ListPanelProps {
  children: React.ReactNode;
  className?: string;
}

function ListPanel({ children, className }: ListPanelProps) {
  const { listWidth, isListCollapsed } = useMasterDetail();

  if (isListCollapsed) {
    return null;
  }

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-border/50 bg-card/50",
        "flex flex-col overflow-hidden",
        listWidthStyles[listWidth],
        className
      )}
    >
      {children}
    </aside>
  );
}

/**
 * List header - top of the list panel (search, filters)
 */
interface ListHeaderProps {
  children: React.ReactNode;
  className?: string;
}

function ListHeader({ children, className }: ListHeaderProps) {
  return (
    <div
      className={cn(
        "shrink-0 border-b border-border/50 p-4 space-y-3",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * List content - scrollable list items
 */
interface ListContentProps {
  children: React.ReactNode;
  className?: string;
}

function ListContent({ children, className }: ListContentProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto scrollbar-thin", className)}>
      {children}
    </div>
  );
}

/**
 * List item - individual item in the list
 */
interface ListItemProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

function ListItem({ children, active, onClick, className }: ListItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "px-4 py-3 cursor-pointer transition-colors border-b border-border/30",
        "hover:bg-primary-50 dark:hover:bg-primary-900/10",
        active && "bg-primary-100 dark:bg-primary-900/20 border-l-2 border-l-primary-500",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Detail panel - shows the detail view
 */
interface DetailPanelProps {
  children: React.ReactNode;
  /** Show empty state when no item selected */
  emptyState?: React.ReactNode;
  /** Whether an item is selected */
  hasSelection?: boolean;
  className?: string;
}

function DetailPanel({
  children,
  emptyState,
  hasSelection = true,
  className,
}: DetailPanelProps) {
  if (!hasSelection && emptyState) {
    return (
      <div
        className={cn(
          "flex-1 flex items-center justify-center bg-muted/30",
          className
        )}
      >
        {emptyState}
      </div>
    );
  }

  return (
    <div className={cn("flex-1 flex flex-col overflow-hidden", className)}>
      {children}
    </div>
  );
}

/**
 * Detail header - top of detail panel
 */
interface DetailHeaderProps {
  children: React.ReactNode;
  className?: string;
}

function DetailHeader({ children, className }: DetailHeaderProps) {
  return (
    <div
      className={cn(
        "shrink-0 border-b border-border/50 px-6 py-4",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Detail content - scrollable detail content
 */
interface DetailContentProps {
  children: React.ReactNode;
  className?: string;
}

function DetailContent({ children, className }: DetailContentProps) {
  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto scrollbar-thin p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

// Attach sub-components
MasterDetail.List = ListPanel;
MasterDetail.ListHeader = ListHeader;
MasterDetail.ListContent = ListContent;
MasterDetail.ListItem = ListItem;
MasterDetail.Detail = DetailPanel;
MasterDetail.DetailHeader = DetailHeader;
MasterDetail.DetailContent = DetailContent;

/**
 * Hook to control master-detail from detail panel
 */
export { useMasterDetail };

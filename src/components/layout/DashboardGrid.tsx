"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DashboardGrid - Grid layout for dashboard widgets and cards
 *
 * Features:
 * - Responsive grid that adapts to available space
 * - Predefined column configurations
 * - Gap variants for different densities
 *
 * Usage:
 * ```tsx
 * <DashboardGrid>
 *   <StatsRow>
 *     <StatCard />
 *     <StatCard />
 *   </StatsRow>
 *   <DashboardGrid.TwoThirds>
 *     <MainWidget />
 *   </DashboardGrid.TwoThirds>
 *   <DashboardGrid.OneThird>
 *     <SideWidget />
 *   </DashboardGrid.OneThird>
 * </DashboardGrid>
 * ```
 */

type GapSize = "tight" | "default" | "loose";

interface DashboardGridProps {
  children: React.ReactNode;
  /** Gap between grid items */
  gap?: GapSize;
  className?: string;
}

const gapStyles: Record<GapSize, string> = {
  tight: "gap-3",
  default: "gap-4 lg:gap-6",
  loose: "gap-6 lg:gap-8",
};

export function DashboardGrid({
  children,
  gap = "default",
  className,
}: DashboardGridProps) {
  return (
    <div className={cn("grid grid-cols-12", gapStyles[gap], className)}>
      {children}
    </div>
  );
}

/**
 * Grid item that spans full width
 */
interface GridItemProps {
  children: React.ReactNode;
  className?: string;
}

function FullWidth({ children, className }: GridItemProps) {
  return <div className={cn("col-span-12", className)}>{children}</div>;
}

/**
 * Grid item that spans 2/3 width on large screens
 */
function TwoThirds({ children, className }: GridItemProps) {
  return (
    <div className={cn("col-span-12 lg:col-span-8", className)}>{children}</div>
  );
}

/**
 * Grid item that spans 1/3 width on large screens
 */
function OneThird({ children, className }: GridItemProps) {
  return (
    <div className={cn("col-span-12 lg:col-span-4", className)}>{children}</div>
  );
}

/**
 * Grid item that spans half width on medium+ screens
 */
function Half({ children, className }: GridItemProps) {
  return (
    <div className={cn("col-span-12 md:col-span-6", className)}>{children}</div>
  );
}

/**
 * Grid item that spans 1/4 width on large screens
 */
function Quarter({ children, className }: GridItemProps) {
  return (
    <div className={cn("col-span-12 sm:col-span-6 lg:col-span-3", className)}>
      {children}
    </div>
  );
}

// Attach sub-components
DashboardGrid.FullWidth = FullWidth;
DashboardGrid.TwoThirds = TwoThirds;
DashboardGrid.OneThird = OneThird;
DashboardGrid.Half = Half;
DashboardGrid.Quarter = Quarter;

/**
 * StatsRow - Horizontal row of stat cards
 *
 * Automatically handles responsive layout for 2-6 stat items
 */
interface StatsRowProps {
  children: React.ReactNode;
  className?: string;
}

export function StatsRow({ children, className }: StatsRowProps) {
  const count = React.Children.count(children);

  // Dynamic grid columns based on number of children
  const gridCols = cn(
    "grid gap-4",
    count <= 2 && "grid-cols-1 sm:grid-cols-2",
    count === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    count === 4 && "grid-cols-2 lg:grid-cols-4",
    count === 5 && "grid-cols-2 lg:grid-cols-5",
    count >= 6 && "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
  );

  return <div className={cn(gridCols, className)}>{children}</div>;
}

/**
 * CardGrid - Grid for card-based content (patients, appointments, etc.)
 */
interface CardGridProps {
  children: React.ReactNode;
  /** Number of columns on large screens */
  columns?: 2 | 3 | 4;
  gap?: GapSize;
  className?: string;
}

export function CardGrid({
  children,
  columns = 3,
  gap = "default",
  className,
}: CardGridProps) {
  const columnStyles = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div className={cn("grid", columnStyles[columns], gapStyles[gap], className)}>
      {children}
    </div>
  );
}

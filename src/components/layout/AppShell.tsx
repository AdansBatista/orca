"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sidebar, SidebarProvider, useSidebar } from "./Sidebar";
import { ChairStatusSidebar } from "@/components/orchestration";
import { useChairSidebar } from "@/contexts/chair-sidebar-context";

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * AppShell - Main application layout wrapper
 *
 * Provides the overall application structure with:
 * - Collapsible sidebar navigation
 * - Main content area
 * - Responsive behavior (desktop-only for now)
 *
 * Usage:
 * ```tsx
 * <AppShell>
 *   <PageHeader title="Dashboard" />
 *   <PageContent>
 *     {content}
 *   </PageContent>
 * </AppShell>
 * ```
 */
function AppShellContent({ children, className }: AppShellProps) {
  const { isCollapsed } = useSidebar();
  const { level: chairSidebarLevel } = useChairSidebar();

  // Calculate right margin based on chair sidebar expansion level
  // Level 0: 50px, Level 1: 50px, Level 2: 320px (w-80)
  const rightMargin =
    chairSidebarLevel === 0
      ? "md:mr-[50px]"
      : chairSidebarLevel === 1
        ? "md:mr-[50px]"
        : "md:mr-80";

  return (
    <div className={cn("flex min-h-screen bg-background", className)}>
      <Sidebar />
      <main
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
          isCollapsed ? "ml-16" : "ml-64",
          rightMargin
        )}
      >
        {children}
      </main>
      {/* Chair Status Sidebar - Right side */}
      <ChairStatusSidebar />
    </div>
  );
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppShellContent className={className}>{children}</AppShellContent>
    </SidebarProvider>
  );
}

export { useSidebar } from "./Sidebar";

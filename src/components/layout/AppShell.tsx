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
  const { level: chairLevel } = useChairSidebar();

  // Add right margin only when chair sidebar panel is open
  // Level 0: floating button (no margin)
  // Level 1: thin panel (50px margin)
  // Level 2: wide panel (320px margin)
  const rightMargin =
    chairLevel === 0
      ? ""
      : chairLevel === 1
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
      {/* Chair Status Sidebar - Floating button at top-right, expands to panel */}
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

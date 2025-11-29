"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sidebar, SidebarProvider, useSidebar } from "./Sidebar";

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

  return (
    <div className={cn("flex min-h-screen bg-background", className)}>
      <Sidebar />
      <main
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
          isCollapsed ? "ml-16" : "ml-64"
        )}
      >
        {children}
      </main>
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

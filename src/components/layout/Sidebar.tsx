"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Users,
  Calendar,
  FileText,
  Settings,
  HelpCircle,
  ClipboardList,
  DollarSign,
  BarChart3,
  MessageSquare,
  LogOut,
  User,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Monitor,
  UserCog,
  CalendarClock,
  CalendarOff,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { usePhiFog } from "@/contexts/phi-fog-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Sidebar Context
interface SidebarContextValue {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggle: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(
  undefined
);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

interface SidebarProviderProps {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

export function SidebarProvider({
  children,
  defaultCollapsed = false,
}: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const toggle = React.useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, toggle }}>
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </SidebarContext.Provider>
  );
}

// Navigation Item Types
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  active?: boolean;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

// Default navigation for the Orca app
const defaultNavGroups: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: Home },
      { label: "Patients", href: "/patients", icon: Users },
      { label: "Schedule", href: "/schedule", icon: Calendar },
      { label: "Treatments", href: "/treatments", icon: ClipboardList },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Staff", href: "/staff", icon: UserCog },
      { label: "Schedules", href: "/staff/schedules", icon: CalendarClock },
      { label: "Time Off", href: "/staff/time-off", icon: CalendarOff },
      { label: "Roles", href: "/staff/roles", icon: Shield },
      { label: "Billing", href: "/billing", icon: DollarSign },
      { label: "Reports", href: "/reports", icon: BarChart3 },
      { label: "Documents", href: "/documents", icon: FileText },
      { label: "Messages", href: "/messages", icon: MessageSquare },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "Help", href: "/help", icon: HelpCircle },
    ],
  },
];

interface SidebarProps {
  navGroups?: NavGroup[];
  logo?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Sidebar({
  navGroups = defaultNavGroups,
  logo,
  footer,
  className,
}: SidebarProps) {
  const { isCollapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border/50",
        "flex flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo / Brand Area */}
      <div
        className={cn(
          "flex h-16 items-center px-4",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        {logo ? (
          logo
        ) : (
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2 transition-all duration-200",
              isCollapsed && "justify-center"
            )}
          >
            <Image
              src="/images/logo/orca-icon.png"
              alt="Orca"
              width={36}
              height={36}
              className="shrink-0"
            />
            {!isCollapsed && (
              <span className="font-bold text-primary-700 text-lg">ORCA</span>
            )}
          </Link>
        )}

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggle}
          className={cn(
            "shrink-0",
            isCollapsed && "absolute -right-3 top-6 bg-card border border-border/50 shadow-sm"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-4">
            {/* Group Label */}
            {group.label && !isCollapsed && (
              <div className="px-4 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </span>
              </div>
            )}

            {/* Group Items */}
            <div className="space-y-1 px-2">
              {group.items.map((item) => (
                <NavItemComponent
                  key={item.href}
                  item={item}
                  isCollapsed={isCollapsed}
                />
              ))}
              
              {/* Add PHI Fog Toggle after System group */}
              {group.label === "System" && (
                <PhiFogToggleButton isCollapsed={isCollapsed} />
              )}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer - User Profile */}
      {footer ? (
        <div className="border-t border-border/50 p-4">{footer}</div>
      ) : (
        <UserProfileFooter isCollapsed={isCollapsed} />
      )}
    </aside>
  );
}

/**
 * Default user profile footer with logout
 */
function UserProfileFooter({ isCollapsed }: { isCollapsed: boolean }) {
  const { theme, setTheme } = useTheme();

  const userContent = (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg cursor-pointer",
        "hover:bg-muted/50 transition-colors",
        isCollapsed && "justify-center p-2"
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-gradient-primary text-white text-xs">
          DS
        </AvatarFallback>
      </Avatar>
      {!isCollapsed && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">Dr. Smith</p>
          <p className="text-xs text-muted-foreground truncate">Orthodontist</p>
        </div>
      )}
    </div>
  );

  if (isCollapsed) {
    return (
      <div className="border-t border-border/50 p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div>
              <Tooltip>
                <TooltipTrigger asChild>{userContent}</TooltipTrigger>
                <TooltipContent side="right">
                  <p>Dr. Smith</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>Dr. Smith</span>
                <span className="text-xs font-normal text-muted-foreground">dr.smith@orca.clinic</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                {theme === "dark" ? (
                  <Moon className="mr-2 h-4 w-4" />
                ) : theme === "light" ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Monitor className="mr-2 h-4 w-4" />
                )}
                Theme
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                  {theme === "light" && <span className="ml-auto text-xs">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                  {theme === "dark" && <span className="ml-auto text-xs">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                  {theme === "system" && <span className="ml-auto text-xs">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
              <Link href="/login">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="border-t border-border/50 p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{userContent}</DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>Dr. Smith</span>
              <span className="text-xs font-normal text-muted-foreground">dr.smith@orca.clinic</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <User className="mr-2 h-4 w-4" />
              Profile Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {theme === "dark" ? (
                <Moon className="mr-2 h-4 w-4" />
              ) : theme === "light" ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Monitor className="mr-2 h-4 w-4" />
              )}
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                Light
                {theme === "light" && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
                {theme === "dark" && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" />
                System
                {theme === "system" && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
            <Link href="/login">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface NavItemComponentProps {
  item: NavItem;
  isCollapsed: boolean;
}

function NavItemComponent({ item, isCollapsed }: NavItemComponentProps) {
  const pathname = usePathname();
  const Icon = item.icon;

  // Check if this item is active based on current pathname
  // Special handling for /staff to avoid matching /staff/schedules and /staff/time-off
  const isActive = item.active ?? (() => {
    if (pathname === item.href) return true;
    if (item.href === "/staff") {
      // Only match /staff or /staff/[id] (UUID pattern), not /staff/schedules, /staff/time-off, etc.
      return pathname === "/staff" || /^\/staff\/[a-f0-9-]+/.test(pathname);
    }
    return pathname.startsWith(item.href + "/");
  })();

  const content = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        "hover:bg-primary-100 hover:text-primary-700",
        "dark:hover:bg-primary-900/20 dark:hover:text-primary-400",
        isActive && "bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400",
        !isActive && "text-muted-foreground",
        isCollapsed && "justify-center px-2"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!isCollapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge !== undefined && (
            <span className="rounded-full bg-primary-500 px-2 py-0.5 text-xs text-white">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.label}
          {item.badge !== undefined && (
            <span className="rounded-full bg-primary-500 px-2 py-0.5 text-xs text-white">
              {item.badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

/**
 * PHI Fog Toggle Button for Sidebar
 */
function PhiFogToggleButton({ isCollapsed }: { isCollapsed: boolean }) {
  const { isFogEnabled, toggleFog } = usePhiFog();
  
  const content = (
    <button
      onClick={toggleFog}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors w-full",
        "hover:bg-warning-100 hover:text-warning-700",
        "dark:hover:bg-warning-900/20 dark:hover:text-warning-400",
        isFogEnabled && "bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
        !isFogEnabled && "text-muted-foreground",
        isCollapsed && "justify-center px-2"
      )}
    >
      {isFogEnabled ? (
        <EyeOff className="h-5 w-5 shrink-0" />
      ) : (
        <Eye className="h-5 w-5 shrink-0" />
      )}
      {!isCollapsed && (
        <>
          <span className="flex-1 text-left">{isFogEnabled ? "Show PHI" : "Protect PHI"}</span>
          {isFogEnabled && (
            <span className="rounded-full bg-warning-500 px-2 py-0.5 text-xs text-white">
              ON
            </span>
          )}
        </>
      )}
    </button>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {isFogEnabled ? "PHI Hidden" : "Protect PHI Data"}
          {isFogEnabled && (
            <span className="rounded-full bg-warning-500 px-2 py-0.5 text-xs text-white">
              ON
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

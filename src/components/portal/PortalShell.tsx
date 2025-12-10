'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Calendar,
  MessageSquare,
  User,
  Menu,
  X,
  LogOut,
  Bell,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface PortalShellProps {
  children: React.ReactNode;
  patientName: string;
  unreadCount?: number;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

/**
 * Mobile-first portal shell with bottom navigation
 * Designed for PWA experience on mobile devices
 */
export function PortalShell({ children, patientName, unreadCount = 0 }: PortalShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Get initials from name
  const initials = patientName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const navItems: NavItem[] = [
    { href: '/portal', label: 'Home', icon: Home },
    { href: '/portal/appointments', label: 'Appts', icon: Calendar },
    { href: '/portal/messages', label: 'Msgs', icon: MessageSquare, badge: unreadCount },
    { href: '/portal/profile', label: 'Profile', icon: User },
  ];

  const isActive = (href: string) => {
    if (href === '/portal') {
      return pathname === '/portal';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Top Header - Mobile */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border safe-area-top">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Logo / Back button */}
          <div className="flex items-center gap-2">
            {pathname !== '/portal' ? (
              <Link
                href="/portal"
                className="flex items-center justify-center h-11 w-11 -ml-2 hover:bg-muted rounded-xl active:scale-95 transition-transform touch-action-manipulation"
              >
                <ChevronLeft className="h-6 w-6" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">O</span>
                </div>
                <span className="font-semibold text-lg">Portal</span>
              </div>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1">
            {/* Notifications */}
            <Link
              href="/portal/messages"
              className="relative flex items-center justify-center h-11 w-11 hover:bg-muted rounded-xl active:scale-95 transition-transform touch-action-manipulation"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center h-11 w-11 hover:bg-muted rounded-xl active:scale-95 transition-transform touch-action-manipulation"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Slide-out menu */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-[85%] max-w-80 bg-background z-50 shadow-xl transform transition-transform duration-300 ease-out safe-area-top',
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Menu header */}
          <div className="p-5 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center h-10 w-10 -ml-2 hover:bg-muted rounded-xl active:scale-95 transition-transform touch-action-manipulation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{patientName}</p>
                <p className="text-sm text-muted-foreground">Patient</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-4 rounded-xl transition-all active:scale-[0.98] touch-action-manipulation',
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted active:bg-muted'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">
                  {item.href === '/portal/appointments' ? 'Appointments' : item.label}
                </span>
                {item.badge && item.badge > 0 && (
                  <Badge variant="destructive" size="sm" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border safe-area-bottom">
            <form action="/api/portal/auth/logout" method="POST">
              <Button
                type="submit"
                variant="ghost"
                className="w-full justify-start gap-3 h-12 text-base active:scale-[0.98] touch-action-manipulation"
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 pb-24">{children}</main>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border">
        <div className="flex items-center justify-around h-[72px] safe-area-bottom">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 w-16 h-full py-2 transition-colors relative active:scale-95 touch-action-manipulation',
                isActive(item.href)
                  ? 'text-primary'
                  : 'text-muted-foreground active:text-foreground'
              )}
            >
              <div className="relative flex items-center justify-center w-8 h-6">
                <item.icon className="h-6 w-6" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium">{item.label}</span>
              {isActive(item.href) && (
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

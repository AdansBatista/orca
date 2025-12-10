'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortalCardProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Mobile-optimized card component for the portal
 * Supports touch-friendly interactions with proper touch targets
 */
export function PortalCard({ children, className, href, onClick, style }: PortalCardProps) {
  const cardClasses = cn(
    'bg-card rounded-2xl border border-border p-4',
    'transition-all duration-200',
    (href || onClick) && 'active:scale-[0.98] hover:bg-muted/50 cursor-pointer touch-action-manipulation',
    className
  );

  if (href) {
    return (
      <Link href={href} className={cardClasses} style={style}>
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={cn(cardClasses, 'w-full text-left')} style={style}>
        {children}
      </button>
    );
  }

  return <div className={cardClasses} style={style}>{children}</div>;
}

interface PortalListItemProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  showArrow?: boolean;
  className?: string;
}

/**
 * Mobile-optimized list item for the portal
 * Minimum 44px touch target height per Apple HIG
 */
export function PortalListItem({
  children,
  href,
  onClick,
  leading,
  trailing,
  showArrow = true,
  className,
}: PortalListItemProps) {
  const content = (
    <div className={cn('flex items-center gap-3 py-3.5 min-h-[52px]', className)}>
      {leading && <div className="flex-shrink-0">{leading}</div>}
      <div className="flex-1 min-w-0">{children}</div>
      {trailing && <div className="flex-shrink-0">{trailing}</div>}
      {showArrow && (href || onClick) && (
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      )}
    </div>
  );

  const wrapperClasses = cn(
    'block -mx-4 px-4 transition-colors touch-action-manipulation',
    (href || onClick) && 'active:bg-muted/70 hover:bg-muted/50 cursor-pointer'
  );

  if (href) {
    return (
      <Link href={href} className={wrapperClasses}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={cn(wrapperClasses, 'w-full text-left')}>
        {content}
      </button>
    );
  }

  return <div className={cn('-mx-4 px-4', className)}>{content}</div>;
}

interface PortalSectionProps {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Section container with optional title
 */
export function PortalSection({ children, title, action, className }: PortalSectionProps) {
  return (
    <section className={cn('px-4', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {action && <div className="touch-action-manipulation">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

interface PortalEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

/**
 * Empty state for portal lists
 * Note: Pass pre-rendered icon as ReactNode (e.g., <CalendarX className="h-10 w-10 text-muted-foreground" />)
 */
export function PortalEmptyState({ icon, title, description, action }: PortalEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-base mb-6 max-w-xs">{description}</p>
      {action}
    </div>
  );
}

'use client';

import { useSession } from 'next-auth/react';
import { Armchair } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { hasPermission } from '@/lib/auth';
import { useChairSidebar } from '@/contexts/chair-sidebar-context';
import { useChairStatus } from './hooks/useChairStatus';
import { CollapsedView } from './CollapsedView';
import { VerticalStackView } from './VerticalStackView';
import { FullCardsView } from './FullCardsView';

/**
 * Global Chair Status Sidebar
 *
 * A fixed sidebar on the right edge of the screen that provides
 * at-a-glance visibility into all chair statuses.
 *
 * Three expansion levels:
 * - Level 0 (Collapsed): Donut chart showing status overview
 * - Level 1 (Semi-expanded): Vertical stack with chair segments
 * - Level 2 (Fully expanded): Full chair cards with details
 *
 * Permission-gated: Only visible to users with 'ops:read' permission
 * Responsive: Hidden on mobile (< md breakpoint)
 */
export function ChairStatusSidebar() {
	const { data: session, status: sessionStatus } = useSession();
	const { level, setLevel, collapse, semiExpand, expand } = useChairSidebar();
	const { chairs, summary, loading, error } = useChairStatus();

	// Check permission - need ops:read
	const hasOpsPermission =
		session?.user?.role && hasPermission(session.user.role, 'ops:read');

	// Don't render if loading session or no permission
	if (sessionStatus === 'loading') return null;
	if (!hasOpsPermission) return null;

	// Calculate if any chairs are ready for doctor
	const hasReadyChairs = (summary?.readyForDoctor ?? 0) > 0;

	// Width based on expansion level
	const getWidth = () => {
		switch (level) {
			case 0:
				return 'w-[50px]';
			case 1:
				return 'w-[50px]';
			case 2:
				return 'w-80';
			default:
				return 'w-[50px]';
		}
	};

	// Handle chair click from vertical stack - expand and potentially scroll
	const handleChairClick = (chairId: string) => {
		expand();
		// Could scroll to specific chair in full view if needed
	};

	return (
		<aside
			className={cn(
				'fixed right-0 top-0 z-30 h-screen',
				'hidden md:flex', // Hidden on mobile
				'transition-all duration-300 ease-out',
				getWidth()
			)}
		>
			{/* Loading state */}
			{loading && level === 0 && (
				<div className="w-[50px] h-full flex flex-col items-center py-4 bg-card border-l border-border/50">
					<Skeleton className="w-10 h-10 rounded-full" />
					<Skeleton className="w-6 h-3 mt-4" />
					<Skeleton className="w-4 h-2 mt-1" />
				</div>
			)}

			{/* Error state - show minimal indicator */}
			{error && !loading && level === 0 && (
				<div className="w-[50px] h-full flex flex-col items-center justify-center bg-card border-l border-border/50">
					<div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">
						<Armchair className="h-5 w-5 text-muted-foreground" />
					</div>
					<span className="text-[9px] text-muted-foreground mt-2">--</span>
				</div>
			)}

			{/* Collapsed view (Level 0) */}
			{!loading && !error && level === 0 && (
				<CollapsedView
					chairs={chairs}
					summary={summary}
					onExpand={semiExpand}
					hasReadyChairs={hasReadyChairs}
				/>
			)}

			{/* Vertical stack view (Level 1) */}
			{!loading && level === 1 && (
				<VerticalStackView
					chairs={chairs}
					summary={summary}
					onChairClick={handleChairClick}
					onCollapse={collapse}
				/>
			)}

			{/* Full cards view (Level 2) */}
			{!loading && level === 2 && (
				<FullCardsView
					chairs={chairs}
					summary={summary}
					onCollapse={semiExpand}
					onClose={collapse}
				/>
			)}
		</aside>
	);
}

/**
 * Edge toggle button shown when sidebar is fully hidden (future use)
 * Can be used to show a minimal entry point on the screen edge
 */
export function ChairSidebarToggle() {
	const { expand } = useChairSidebar();
	const { data: session } = useSession();

	const hasOpsPermission =
		session?.user?.role && hasPermission(session.user.role, 'ops:read');

	if (!hasOpsPermission) return null;

	return (
		<div className="fixed right-0 top-1/2 -translate-y-1/2 z-30 hidden md:block">
			<Button
				variant="secondary"
				size="icon"
				onClick={expand}
				className="rounded-l-lg rounded-r-none shadow-md border-r-0"
			>
				<Armchair className="h-4 w-4" />
			</Button>
		</div>
	);
}

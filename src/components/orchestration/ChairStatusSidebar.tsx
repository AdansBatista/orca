'use client';

import { useSession } from 'next-auth/react';
import { Armchair } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { hasPermission } from '@/lib/auth';
import { useChairSidebar } from '@/contexts/chair-sidebar-context';
import { useChairStatus } from './hooks/useChairStatus';
import { ChairStatusCircle } from './ChairStatusCircle';
import { VerticalStackView } from './VerticalStackView';
import { FullCardsView } from './FullCardsView';

/**
 * Global Chair Status Sidebar
 *
 * A floating button that expands into a panel when clicked.
 * Does not take up screen space when collapsed.
 *
 * States:
 * - Collapsed: Floating button showing chair count and ready-for-doctor indicator
 * - Expanded (Level 1): Vertical stack with chair segments
 * - Fully Expanded (Level 2): Full chair cards with details
 *
 * Permission-gated: Only visible to users with 'ops:read' permission
 * Responsive: Hidden on mobile (< md breakpoint)
 */
export function ChairStatusSidebar() {
	const { data: session, status: sessionStatus } = useSession();
	const { level, collapse, semiExpand, expand } = useChairSidebar();
	const { chairs, summary, loading, error, refetch } = useChairStatus();

	// Derive isOpen from context level - level > 0 means panel is open
	const isOpen = level > 0;

	// Check permission - need ops:read
	const hasOpsPermission =
		session?.user?.role && hasPermission(session.user.role, 'ops:read');

	// Don't render if loading session or no permission
	if (sessionStatus === 'loading') return null;
	if (!hasOpsPermission) return null;

	// Calculate if any chairs are ready for doctor
	const hasReadyChairs = (summary?.readyForDoctor ?? 0) > 0;

	// Handle chair click from vertical stack - expand and potentially scroll
	const handleChairClick = () => {
		expand();
	};

	const handleOpen = () => {
		semiExpand(); // Sets level to 1
	};

	const handleClose = () => {
		collapse(); // Sets level to 0
	};

	// Floating button when closed - positioned at top-right, aligned with header actions
	if (!isOpen) {
		return (
			<div className="fixed right-1.5 top-1.5 z-40 hidden md:block">
				<div
					className={cn(
						'transition-all duration-200 hover:scale-110 cursor-pointer',
						hasReadyChairs && 'animate-pulse'
					)}
					onClick={handleOpen}
				>
					{loading ? (
						<Skeleton className="w-10 h-10 rounded-full" />
					) : error ? (
						<div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
							<Armchair className="h-4 w-4 text-muted-foreground" />
						</div>
					) : (
						<ChairStatusCircle
							chairs={chairs}
							size={40}
							strokeWidth={5}
						/>
					)}
				</div>
			</div>
		);
	}

	// Expanded panel
	return (
		<aside
			className={cn(
				'fixed right-0 top-0 z-30 h-screen',
				'hidden md:flex',
				'transition-all duration-300 ease-out',
				level === 2 ? 'w-80' : 'w-[50px]'
			)}
		>
			{/* Loading state */}
			{loading && level === 1 && (
				<div className="w-[50px] h-full flex flex-col items-center py-4 bg-card border-l border-border/50">
					<Skeleton className="w-10 h-10 rounded-full" />
					<Skeleton className="w-6 h-3 mt-4" />
					<Skeleton className="w-4 h-2 mt-1" />
				</div>
			)}

			{/* Vertical stack view (Level 1) */}
			{!loading && level === 1 && (
				<VerticalStackView
					chairs={chairs}
					summary={summary}
					onChairClick={handleChairClick}
					onCollapse={handleClose}
				/>
			)}

			{/* Full cards view (Level 2) */}
			{!loading && level === 2 && (
				<FullCardsView
					chairs={chairs}
					summary={summary}
					onCollapse={semiExpand}
					onClose={handleClose}
					onRefresh={refetch}
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

'use client';

import { Bell, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChairStatusCircle } from './ChairStatusCircle';
import { ChairStatus, ChairStatusSummary } from './hooks/useChairStatus';

interface CollapsedViewProps {
	chairs: ChairStatus[];
	summary: ChairStatusSummary | null;
	onExpand: () => void;
	hasReadyChairs: boolean;
}

/**
 * Collapsed state (Level 0) of the Chair Status Sidebar
 * Shows a donut chart with chair status segments + summary
 */
export function CollapsedView({
	chairs,
	summary,
	onExpand,
	hasReadyChairs,
}: CollapsedViewProps) {
	const readyCount = summary?.readyForDoctor ?? 0;
	const occupiedCount = summary?.occupied ?? 0;
	const totalCount = summary?.total ?? chairs.length;

	return (
		<div
			className={cn(
				'w-[50px] h-full flex flex-col items-center py-4',
				'bg-card border-l border-border/50',
				'transition-colors duration-300',
				// Amber tint on left border when chairs are ready for doctor
				hasReadyChairs && 'border-l-amber-400 dark:border-l-amber-500'
			)}
		>
			{/* Ready for Doctor Badge */}
			{readyCount > 0 && (
				<div className="flex flex-col items-center mb-3 animate-fade-in">
					<div className="relative">
						<Bell className="h-4 w-4 text-amber-500" />
						<span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
					</div>
					<span className="text-xs font-bold text-amber-600 mt-0.5">
						{readyCount}
					</span>
				</div>
			)}

			{/* Main Status Circle */}
			<div className="relative">
				<ChairStatusCircle
					chairs={chairs}
					size={40}
					strokeWidth={8}
					onClick={onExpand}
				/>
			</div>

			{/* Summary Stats */}
			<div className="mt-4 flex flex-col items-center text-center">
				<span className="text-xs font-semibold text-foreground">
					{occupiedCount}/{totalCount}
				</span>
				<span className="text-[9px] text-muted-foreground leading-tight">
					chairs
				</span>
			</div>

			{/* Spacer */}
			<div className="flex-1" />

			{/* Expand Hint */}
			<button
				onClick={onExpand}
				className={cn(
					'p-1.5 rounded-lg transition-colors',
					'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
				)}
				aria-label="Expand chair sidebar"
			>
				<ChevronLeft className="h-4 w-4" />
			</button>
		</div>
	);
}

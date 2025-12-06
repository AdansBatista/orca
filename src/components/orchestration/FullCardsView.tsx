'use client';

import { useState, useCallback } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
	ChairStatus,
	ChairStatusSummary,
	ChairActivitySubStage,
} from './hooks/useChairStatus';
import { ChairCard } from './ChairCard';

interface FullCardsViewProps {
	chairs: ChairStatus[];
	summary: ChairStatusSummary | null;
	onCollapse: () => void;
	onClose: () => void;
	onRefresh?: () => void;
}

type FilterTab = 'all' | 'occupied' | 'ready' | 'available';

/**
 * Fully expanded state (Level 2) of the Chair Status Sidebar
 * Shows full chair cards with all details and actions
 */
export function FullCardsView({
	chairs,
	summary,
	onCollapse,
	onClose,
	onRefresh,
}: FullCardsViewProps) {
	const [filter, setFilter] = useState<FilterTab>('all');

	// Filter chairs based on selected tab
	const filteredChairs = chairs.filter((chair) => {
		switch (filter) {
			case 'occupied':
				return chair.status === 'OCCUPIED';
			case 'ready':
				return chair.activitySubStage === 'READY_FOR_DOCTOR';
			case 'available':
				return chair.status === 'AVAILABLE';
			default:
				return true;
		}
	});

	// Sort: Ready for Doctor first, then by chair number
	const sortedChairs = [...filteredChairs].sort((a, b) => {
		if (a.activitySubStage === 'READY_FOR_DOCTOR' && b.activitySubStage !== 'READY_FOR_DOCTOR') {
			return -1;
		}
		if (a.activitySubStage !== 'READY_FOR_DOCTOR' && b.activitySubStage === 'READY_FOR_DOCTOR') {
			return 1;
		}
		return a.chairNumber.localeCompare(b.chairNumber);
	});

	const readyCount = summary?.readyForDoctor ?? 0;

	// Handle sub-stage update
	const handleSubStageUpdate = useCallback(async (chair: ChairStatus, subStage: ChairActivitySubStage) => {
		try {
			const response = await fetch(`/api/ops/chairs/${chair.id}/sub-stage`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ subStage }),
			});
			const result = await response.json();
			if (result.success) {
				toast.success(`${chair.name} updated`);
				onRefresh?.();
			} else {
				toast.error(result.error?.message || 'Failed to update');
			}
		} catch {
			toast.error('Failed to update chair status');
		}
	}, [onRefresh]);

	return (
		<div className="w-80 h-full flex flex-col bg-card border-l border-border/50">
			{/* Header */}
			<div className="h-14 px-3 flex items-center justify-between border-b border-border/30">
				<div className="flex items-center gap-2">
					<button
						onClick={onCollapse}
						className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground"
					>
						<ChevronRight className="h-4 w-4" />
					</button>
					<span className="font-semibold text-sm">Chair Status</span>
					{readyCount > 0 && (
						<Badge variant="warning" size="sm">
							{readyCount}
						</Badge>
					)}
				</div>
				<button
					onClick={onClose}
					className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground"
				>
					<X className="h-4 w-4" />
				</button>
			</div>

			{/* Filter Tabs */}
			<div className="px-3 py-2 flex gap-1 border-b border-border/30">
				<FilterButton
					active={filter === 'all'}
					onClick={() => setFilter('all')}
					count={chairs.length}
				>
					All
				</FilterButton>
				<FilterButton
					active={filter === 'occupied'}
					onClick={() => setFilter('occupied')}
					count={chairs.filter((c) => c.status === 'OCCUPIED').length}
				>
					In Use
				</FilterButton>
				<FilterButton
					active={filter === 'ready'}
					onClick={() => setFilter('ready')}
					count={readyCount}
					highlight={readyCount > 0}
				>
					Ready
				</FilterButton>
				<FilterButton
					active={filter === 'available'}
					onClick={() => setFilter('available')}
					count={chairs.filter((c) => c.status === 'AVAILABLE').length}
				>
					Free
				</FilterButton>
			</div>

			{/* Chair Cards - Scrollable */}
			<div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
				{sortedChairs.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground text-sm">
						No chairs match filter
					</div>
				) : (
					sortedChairs.map((chair, index) => (
						<ChairCard
							key={chair.id}
							chair={chair}
							compact
							onSubStageUpdate={handleSubStageUpdate}
							style={{ animationDelay: `${index * 50}ms` }}
							className="animate-fade-up"
						/>
					))
				)}
			</div>
		</div>
	);
}

interface FilterButtonProps {
	active: boolean;
	onClick: () => void;
	count: number;
	highlight?: boolean;
	children: React.ReactNode;
}

function FilterButton({ active, onClick, count, highlight, children }: FilterButtonProps) {
	return (
		<button
			onClick={onClick}
			className={cn(
				'px-2 py-1 rounded-md text-xs font-medium transition-colors',
				active
					? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
					: 'text-muted-foreground hover:bg-muted/50',
				highlight && !active && 'text-amber-600'
			)}
		>
			{children}
			<span className="ml-1 opacity-60">{count}</span>
		</button>
	);
}

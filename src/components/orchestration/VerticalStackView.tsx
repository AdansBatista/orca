'use client';

import { Bell, CheckCircle2, ChevronRight, Wrench, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import {
	ChairStatus,
	ChairStatusSummary,
	getChairColor,
	getPatientInitials,
	getSubStageTime,
} from './hooks/useChairStatus';

interface VerticalStackViewProps {
	chairs: ChairStatus[];
	summary: ChairStatusSummary | null;
	onChairClick: (chairId: string) => void;
	onCollapse: () => void;
}

/**
 * Semi-expanded state (Level 1) of the Chair Status Sidebar
 * Shows vertical stack with one segment per chair
 */
export function VerticalStackView({
	chairs,
	summary,
	onChairClick,
	onCollapse,
}: VerticalStackViewProps) {
	return (
		<div className="w-[50px] h-full flex flex-col bg-card border-l border-border/50">
			{/* Header with collapse button */}
			<div className="h-12 flex items-center justify-center border-b border-border/30">
				<button
					onClick={onCollapse}
					className={cn(
						'p-1.5 rounded-lg transition-colors',
						'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
					)}
					aria-label="Collapse chair sidebar"
				>
					<ChevronRight className="h-4 w-4" />
				</button>
			</div>

			{/* Chair segments - scrollable */}
			<div className="flex-1 overflow-y-auto scrollbar-thin">
				{chairs.map((chair) => (
					<ChairSegment
						key={chair.id}
						chair={chair}
						onClick={() => onChairClick(chair.id)}
					/>
				))}
			</div>

			{/* Footer with summary */}
			{summary && (
				<div className="h-10 flex items-center justify-center border-t border-border/30">
					<span className="text-[9px] text-muted-foreground">
						{summary.occupied}/{summary.total}
					</span>
				</div>
			)}
		</div>
	);
}

interface ChairSegmentProps {
	chair: ChairStatus;
	onClick: () => void;
}

/**
 * Individual chair segment in the vertical stack
 */
function ChairSegment({ chair, onClick }: ChairSegmentProps) {
	const color = getChairColor(chair);
	const isReadyForDoctor = chair.activitySubStage === 'READY_FOR_DOCTOR';
	const isOccupied = chair.status === 'OCCUPIED';
	const initials = getPatientInitials(chair);
	const stageTime = getSubStageTime(chair.subStageStartedAt);

	// Determine what to show in the segment
	const getContent = () => {
		if (isOccupied && initials) {
			return (
				<span className="text-[10px] font-bold text-white">{initials}</span>
			);
		}

		switch (chair.status) {
			case 'AVAILABLE':
				return <CheckCircle2 className="h-3.5 w-3.5 text-white" />;
			case 'BLOCKED':
				return <XCircle className="h-3.5 w-3.5 text-white" />;
			case 'MAINTENANCE':
				return <Wrench className="h-3.5 w-3.5 text-white" />;
			case 'CLEANING':
				return <Clock className="h-3.5 w-3.5 text-white" />;
			default:
				return (
					<span className="text-[10px] font-bold text-white">
						{chair.chairNumber}
					</span>
				);
		}
	};

	// Get tooltip content
	const getTooltipContent = () => {
		const lines = [`Chair ${chair.chairNumber}`];

		if (isOccupied && chair.patient) {
			lines.push(`${chair.patient.firstName} ${chair.patient.lastName}`);
		}

		if (chair.activitySubStage) {
			const stageLabels: Record<string, string> = {
				SETUP: 'Setup',
				ASSISTANT_WORKING: 'Assistant Working',
				READY_FOR_DOCTOR: 'Ready for Doctor',
				DOCTOR_CHECKING: 'Doctor Checking',
				FINISHING: 'Finishing',
				CLEANING: 'Cleaning',
			};
			lines.push(stageLabels[chair.activitySubStage] || chair.activitySubStage);
		} else {
			lines.push(chair.status.charAt(0) + chair.status.slice(1).toLowerCase());
		}

		if (stageTime) {
			lines.push(stageTime);
		}

		return lines;
	};

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					onClick={onClick}
					className={cn(
						'w-full py-2 px-1 flex flex-col items-center justify-center gap-0.5',
						'border-l-[3px] transition-all duration-200',
						'hover:bg-muted/30',
						isReadyForDoctor && 'bg-amber-50/50 dark:bg-amber-900/10'
					)}
					style={{
						borderLeftColor: color,
					}}
				>
					{/* Chair indicator circle */}
					<div
						className={cn(
							'w-7 h-7 rounded-lg flex items-center justify-center',
							'transition-all duration-200',
							isReadyForDoctor && 'animate-pulse ring-2 ring-amber-400/50'
						)}
						style={{ backgroundColor: color }}
					>
						{getContent()}
					</div>

					{/* Time or bell indicator */}
					{isReadyForDoctor ? (
						<div className="flex items-center gap-0.5 mt-0.5">
							<Bell className="h-2.5 w-2.5 text-amber-500" />
							{stageTime && (
								<span className="text-[8px] font-medium text-amber-600">
									{stageTime}
								</span>
							)}
						</div>
					) : stageTime && isOccupied ? (
						<span className="text-[8px] text-muted-foreground mt-0.5">
							{stageTime}
						</span>
					) : null}
				</button>
			</TooltipTrigger>
			<TooltipContent side="left" className="text-xs">
				{getTooltipContent().map((line, i) => (
					<p key={i} className={i === 0 ? 'font-medium' : 'text-muted-foreground'}>
						{line}
					</p>
				))}
				<p className="text-muted-foreground mt-1">Click for details</p>
			</TooltipContent>
		</Tooltip>
	);
}

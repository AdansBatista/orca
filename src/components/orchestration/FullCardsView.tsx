'use client';

import { useState } from 'react';
import {
	Bell,
	ChevronRight,
	Clock,
	CheckCircle2,
	XCircle,
	Wrench,
	User,
	Stethoscope,
	Sparkles,
	Settings2,
	X,
	AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';
import {
	ChairStatus,
	ChairStatusSummary,
	ChairActivitySubStage,
	getChairColor,
	getTimeRemaining,
	getSubStageTime,
} from './hooks/useChairStatus';

interface FullCardsViewProps {
	chairs: ChairStatus[];
	summary: ChairStatusSummary | null;
	onCollapse: () => void;
	onClose: () => void;
}

type FilterTab = 'all' | 'occupied' | 'ready' | 'available';

// Sub-stage configuration (matching FloorPlanView)
const SUB_STAGE_CONFIG: Record<
	ChairActivitySubStage,
	{
		icon: typeof Settings2;
		label: string;
		badge: 'ghost' | 'secondary' | 'warning' | 'success' | 'info';
	}
> = {
	SETUP: { icon: Settings2, label: 'Setup', badge: 'ghost' },
	ASSISTANT_WORKING: { icon: User, label: 'Assistant', badge: 'secondary' },
	READY_FOR_DOCTOR: { icon: Bell, label: 'Ready for Dr.', badge: 'warning' },
	DOCTOR_CHECKING: { icon: Stethoscope, label: 'Dr. Checking', badge: 'success' },
	FINISHING: { icon: Sparkles, label: 'Finishing', badge: 'info' },
	CLEANING: { icon: Clock, label: 'Cleaning', badge: 'warning' },
};

/**
 * Fully expanded state (Level 2) of the Chair Status Sidebar
 * Shows full chair cards with all details
 */
export function FullCardsView({
	chairs,
	summary,
	onCollapse,
	onClose,
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
							style={{ animationDelay: `${index * 50}ms` }}
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

interface ChairCardProps {
	chair: ChairStatus;
	style?: React.CSSProperties;
}

function ChairCard({ chair, style }: ChairCardProps) {
	const color = getChairColor(chair);
	const isOccupied = chair.status === 'OCCUPIED';
	const isReadyForDoctor = chair.activitySubStage === 'READY_FOR_DOCTOR';
	const subStageConfig = chair.activitySubStage
		? SUB_STAGE_CONFIG[chair.activitySubStage]
		: null;
	const timeRemaining = getTimeRemaining(chair.expectedFreeAt);
	const isOverdue = timeRemaining === 'Overdue';
	const stageTime = getSubStageTime(chair.subStageStartedAt);

	// Calculate progress
	const getProgress = () => {
		if (!chair.appointment?.startTime || !chair.appointment?.endTime) return 0;
		const start = new Date(chair.appointment.startTime).getTime();
		const end = new Date(chair.appointment.endTime).getTime();
		const now = Date.now();
		return Math.min(Math.max(((now - start) / (end - start)) * 100, 0), 100);
	};

	const formatTime = (dateString: string | undefined) => {
		if (!dateString) return '';
		return new Date(dateString).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		});
	};

	const getStatusIcon = () => {
		switch (chair.status) {
			case 'AVAILABLE':
				return CheckCircle2;
			case 'BLOCKED':
				return XCircle;
			case 'MAINTENANCE':
				return Wrench;
			case 'CLEANING':
				return Clock;
			default:
				return subStageConfig?.icon || User;
		}
	};

	const StatusIcon = getStatusIcon();

	return (
		<div
			className={cn(
				'rounded-xl border-2 overflow-hidden',
				'transition-all duration-200 animate-fade-up',
				'hover:shadow-md',
				isReadyForDoctor && [
					'ring-2 ring-amber-400/40 ring-offset-1 ring-offset-background',
					'shadow-md shadow-amber-200/30 dark:shadow-amber-900/20',
				]
			)}
			style={{
				borderColor: color,
				...style,
			}}
		>
			{/* Header */}
			<div
				className="px-3 py-2 flex items-center justify-between"
				style={{ backgroundColor: `${color}15` }}
			>
				<div className="flex items-center gap-2">
					<div
						className="w-6 h-6 rounded-md flex items-center justify-center"
						style={{ backgroundColor: color }}
					>
						<StatusIcon className="h-3.5 w-3.5 text-white" />
					</div>
					<span className="font-semibold text-sm">{chair.name}</span>
				</div>
				{isReadyForDoctor && (
					<Bell className="h-4 w-4 text-amber-500" />
				)}
			</div>

			{/* Content */}
			<div className="p-3 space-y-2 bg-background">
				{/* Sub-stage or Status badge */}
				<div className="flex items-center gap-2">
					{subStageConfig ? (
						<Badge variant={subStageConfig.badge} size="sm">
							{subStageConfig.label}
						</Badge>
					) : (
						<Badge
							variant={chair.status === 'AVAILABLE' ? 'success' : 'ghost'}
							size="sm"
						>
							{chair.status === 'AVAILABLE' ? 'Available' : chair.status.toLowerCase()}
						</Badge>
					)}
					{stageTime && (
						<span className="text-xs text-muted-foreground">{stageTime}</span>
					)}
				</div>

				{/* Patient info */}
				{isOccupied && chair.patient && (
					<div className="space-y-1">
						<p className="text-sm font-medium truncate">
							<PhiProtected fakeData={getFakeName()}>
								{chair.patient.firstName} {chair.patient.lastName}
							</PhiProtected>
						</p>
						{chair.appointment?.appointmentType && (
							<p className="text-xs text-muted-foreground truncate">
								{chair.appointment.appointmentType.name}
							</p>
						)}
						{/* Staff/Provider */}
						<p className="text-xs text-muted-foreground">
							{chair.assignedStaff && (
								<span>
									{chair.assignedStaff.firstName} {chair.assignedStaff.lastName[0]}.
								</span>
							)}
							{chair.assignedStaff && chair.appointment?.provider && ' • '}
							{chair.appointment?.provider && (
								<span>Dr. {chair.appointment.provider.lastName}</span>
							)}
						</p>
					</div>
				)}

				{/* Available state */}
				{chair.status === 'AVAILABLE' && (
					<p className="text-xs text-muted-foreground">Ready for patient</p>
				)}

				{/* Blocked state */}
				{chair.status === 'BLOCKED' && chair.blockReason && (
					<p className="text-xs text-muted-foreground">{chair.blockReason}</p>
				)}

				{/* Progress bar for occupied */}
				{isOccupied && chair.appointment && (
					<div className="pt-2 space-y-1">
						<div className="flex justify-between text-[10px]">
							<span className="text-muted-foreground">
								{formatTime(chair.appointment.startTime)}
							</span>
							{timeRemaining && (
								<span
									className={cn(
										'font-medium flex items-center gap-0.5',
										isOverdue ? 'text-error-600' : 'text-muted-foreground'
									)}
								>
									{isOverdue && <AlertTriangle className="h-2.5 w-2.5" />}
									<Clock className="h-2.5 w-2.5" />
									{timeRemaining}
								</span>
							)}
							<span className="text-muted-foreground">
								{formatTime(chair.appointment.endTime)}
							</span>
						</div>
						<Progress
							value={getProgress()}
							className={cn(
								'h-1',
								isReadyForDoctor && '[&>div]:bg-amber-500',
								isOverdue && '[&>div]:bg-error-500'
							)}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

'use client';

import {
	Bell,
	Clock,
	CheckCircle2,
	XCircle,
	Wrench,
	MoreVertical,
	User,
	Stethoscope,
	Sparkles,
	Settings2,
	AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import {
	ChairStatus,
	ChairActivitySubStage,
	getTimeRemaining,
	getSubStageTime,
} from './hooks/useChairStatus';
import { Armchair } from 'lucide-react';

// Calculate time since patient sat in chair
function getInChairTime(occupiedAt: string | null | undefined): string | null {
	if (!occupiedAt) return null;
	const minutes = Math.floor((Date.now() - new Date(occupiedAt).getTime()) / 60000);
	if (minutes < 1) return '<1m';
	if (minutes >= 60) {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}
	return `${minutes}m`;
}

// Visual configuration for each sub-stage
const SUB_STAGE_CONFIG: Record<
	ChairActivitySubStage,
	{
		cardBg: string;
		border: string;
		iconBg: string;
		icon: typeof Settings2;
		label: string;
		badge: 'soft-primary' | 'warning' | 'success' | 'info' | 'ghost' | 'secondary';
		glow?: string;
	}
> = {
	SETUP: {
		cardBg: 'bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50',
		border: 'border-slate-300 dark:border-slate-600',
		iconBg: 'bg-slate-500',
		icon: Settings2,
		label: 'Setup',
		badge: 'ghost',
	},
	ASSISTANT_WORKING: {
		cardBg: 'bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-900/30 dark:to-violet-800/30',
		border: 'border-violet-400 dark:border-violet-500',
		iconBg: 'bg-violet-500',
		icon: User,
		label: 'Assistant',
		badge: 'secondary',
	},
	READY_FOR_DOCTOR: {
		cardBg: 'bg-gradient-to-br from-amber-50 to-amber-100/80 dark:from-amber-900/30 dark:to-amber-800/30',
		border: 'border-amber-400 dark:border-amber-500',
		iconBg: 'bg-amber-500',
		icon: Bell,
		label: 'Ready for Dr.',
		badge: 'warning',
		glow: 'shadow-md shadow-amber-200/50 dark:shadow-amber-900/30',
	},
	DOCTOR_CHECKING: {
		cardBg: 'bg-gradient-to-br from-green-50 to-emerald-100/50 dark:from-green-900/30 dark:to-emerald-800/30',
		border: 'border-green-500 dark:border-green-400',
		iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
		icon: Stethoscope,
		label: 'Dr. Checking',
		badge: 'success',
	},
	FINISHING: {
		cardBg: 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/30',
		border: 'border-blue-400 dark:border-blue-500',
		iconBg: 'bg-blue-500',
		icon: Sparkles,
		label: 'Finishing',
		badge: 'info',
	},
	CLEANING: {
		cardBg: 'bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/30 dark:to-yellow-800/30',
		border: 'border-yellow-400 dark:border-yellow-500',
		iconBg: 'bg-yellow-500',
		icon: Clock,
		label: 'Cleaning',
		badge: 'warning',
	},
};

// Configuration for non-occupied statuses
const STATUS_CONFIG = {
	AVAILABLE: {
		cardBg: 'bg-gradient-to-br from-success-50 to-success-100/50 dark:from-success-900/20 dark:to-success-800/20',
		border: 'border-success-300 dark:border-success-600',
		iconBg: 'bg-success-500',
		icon: CheckCircle2,
		label: 'Available',
		badge: 'success' as const,
	},
	OCCUPIED: {
		cardBg: 'bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/20',
		border: 'border-primary-300 dark:border-primary-600',
		iconBg: 'bg-primary-500',
		icon: User,
		label: 'Occupied',
		badge: 'soft-primary' as const,
	},
	BLOCKED: {
		cardBg: 'bg-gradient-to-br from-error-50 to-error-100/50 dark:from-error-900/20 dark:to-error-800/20',
		border: 'border-error-300 dark:border-error-500',
		iconBg: 'bg-error-500',
		icon: XCircle,
		label: 'Blocked',
		badge: 'error' as const,
	},
	CLEANING: {
		cardBg: 'bg-gradient-to-br from-warning-50 to-warning-100/50 dark:from-warning-900/20 dark:to-warning-800/20',
		border: 'border-warning-300 dark:border-warning-500',
		iconBg: 'bg-warning-500',
		icon: Clock,
		label: 'Cleaning',
		badge: 'warning' as const,
	},
	MAINTENANCE: {
		cardBg: 'bg-gradient-to-br from-slate-100 to-slate-200/50 dark:from-slate-800 dark:to-slate-700',
		border: 'border-slate-400 dark:border-slate-500',
		iconBg: 'bg-slate-600',
		icon: Wrench,
		label: 'Maintenance',
		badge: 'ghost' as const,
	},
};

// Hero action configuration based on current sub-stage
function getHeroAction(chair: ChairStatus): {
	icon: typeof Bell;
	label: string;
	colorClass: string;
	nextStage: ChairActivitySubStage;
} | null {
	if (chair.status !== 'OCCUPIED') return null;

	switch (chair.activitySubStage) {
		case 'SETUP':
		case 'ASSISTANT_WORKING':
			return {
				icon: Bell,
				label: 'Ready for Dr.',
				colorClass: 'bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/50 dark:hover:bg-amber-800/50 dark:text-amber-300',
				nextStage: 'READY_FOR_DOCTOR',
			};
		case 'READY_FOR_DOCTOR':
			return {
				icon: Stethoscope,
				label: 'Start Dr. Check',
				colorClass: 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/50 dark:hover:bg-green-800/50 dark:text-green-300',
				nextStage: 'DOCTOR_CHECKING',
			};
		case 'DOCTOR_CHECKING':
			return {
				icon: Sparkles,
				label: 'Finish',
				colorClass: 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/50 dark:hover:bg-blue-800/50 dark:text-blue-300',
				nextStage: 'FINISHING',
			};
		case 'FINISHING':
			return {
				icon: CheckCircle2,
				label: 'Complete',
				colorClass: 'bg-success-100 hover:bg-success-200 text-success-700 dark:bg-success-900/50 dark:hover:bg-success-800/50 dark:text-success-300',
				nextStage: 'CLEANING',
			};
		default:
			return null;
	}
}

interface ChairCardProps {
	chair: ChairStatus;
	/** Compact mode for sidebar - narrower width */
	compact?: boolean;
	/** Called when sub-stage is updated */
	onSubStageUpdate?: (chair: ChairStatus, subStage: ChairActivitySubStage) => void;
	/** Additional className */
	className?: string;
	/** Style for animations */
	style?: React.CSSProperties;
}

/**
 * ChairCard - Shared chair status card component
 * Used in FloorPlanView (full size) and FullCardsView sidebar (compact)
 */
export function ChairCard({
	chair,
	compact = false,
	onSubStageUpdate,
	className,
	style,
}: ChairCardProps) {
	const isOccupied = chair.status === 'OCCUPIED';
	const subStageConfig = isOccupied && chair.activitySubStage
		? SUB_STAGE_CONFIG[chair.activitySubStage]
		: null;
	const statusConfig = !isOccupied
		? STATUS_CONFIG[chair.status] || STATUS_CONFIG.AVAILABLE
		: null;

	const config = subStageConfig || statusConfig!;
	const isReadyForDoctor = chair.activitySubStage === 'READY_FOR_DOCTOR';
	const heroAction = getHeroAction(chair);
	const timeRemaining = getTimeRemaining(chair.expectedFreeAt);
	const isOverdue = timeRemaining === 'Overdue';
	const subStageTime = getSubStageTime(chair.subStageStartedAt);
	const inChairTime = getInChairTime(chair.occupiedAt);

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

	const handleSubStageUpdate = (nextStage: ChairActivitySubStage) => {
		onSubStageUpdate?.(chair, nextStage);
	};

	return (
		<div
			id={`chair-${chair.id}`}
			className={cn(
				// Base sizing and styling
				'relative',
				compact ? 'w-full' : 'w-[300px]',
				'min-h-[160px]',
				'rounded-2xl border-2 overflow-hidden',
				'transition-all duration-200 ease-out',
				'hover:shadow-lift hover:-translate-y-0.5',
				// Dynamic background and border
				config.cardBg,
				config.border,
				// Ready for Doctor emphasis
				isReadyForDoctor && [
					'ring-2 ring-amber-400/40 ring-offset-1 ring-offset-background',
					subStageConfig?.glow,
				],
				className
			)}
			style={style}
		>
			{/* Card Content */}
			<div className="p-3 flex flex-col h-full">
				{/* Header with Chair Name, Hero Action, and More Menu */}
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2">
						<div className={cn('rounded-lg p-1.5', config.iconBg)}>
							<config.icon className="h-4 w-4 text-white" />
						</div>
						<span className="font-semibold text-sm">{chair.name}</span>
					</div>
					<div className="flex items-center gap-1">
						{/* Hero Action Button */}
						{heroAction && onSubStageUpdate && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className={cn('h-7 px-2', heroAction.colorClass)}
										onClick={() => handleSubStageUpdate(heroAction.nextStage)}
									>
										<heroAction.icon className="h-3.5 w-3.5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent
									side="left"
									className="rounded-md border border-border bg-card text-card-foreground shadow-lg px-3 py-2"
								>
									{heroAction.label}
								</TooltipContent>
							</Tooltip>
						)}

						{/* More Menu */}
						{onSubStageUpdate && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon-sm" className="h-7 w-7">
										<MoreVertical className="h-3.5 w-3.5" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{isOccupied && (
										<>
											<DropdownMenuItem onClick={() => handleSubStageUpdate('SETUP')}>
												<Settings2 className="h-4 w-4 mr-2" />
												Setup
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => handleSubStageUpdate('ASSISTANT_WORKING')}>
												<User className="h-4 w-4 mr-2" />
												Assistant Working
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => handleSubStageUpdate('READY_FOR_DOCTOR')}>
												<Bell className="h-4 w-4 mr-2" />
												Ready for Doctor
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => handleSubStageUpdate('DOCTOR_CHECKING')}>
												<Stethoscope className="h-4 w-4 mr-2" />
												Doctor Checking
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => handleSubStageUpdate('FINISHING')}>
												<Sparkles className="h-4 w-4 mr-2" />
												Finishing
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem>View Patient</DropdownMenuItem>
											<DropdownMenuItem>Complete Treatment</DropdownMenuItem>
											<DropdownMenuSeparator />
										</>
									)}
									<DropdownMenuItem>Mark Available</DropdownMenuItem>
									<DropdownMenuItem>Block Chair</DropdownMenuItem>
									<DropdownMenuItem>Set Cleaning</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</div>

				{/* Sub-Stage Badge with Time */}
				{isOccupied && subStageConfig && (
					<div className="flex items-center gap-2 mb-2">
						<Badge
							variant={subStageConfig.badge}
							size="sm"
							className={cn(isReadyForDoctor && 'font-semibold')}
						>
							{subStageConfig.label}
						</Badge>
						{subStageTime && (
							<span className="text-xs text-muted-foreground">{subStageTime}</span>
						)}
					</div>
				)}

				{/* Status Badge for non-occupied */}
				{!isOccupied && statusConfig && (
					<Badge variant={statusConfig.badge} size="sm" className="mb-2 w-fit">
						{statusConfig.label}
					</Badge>
				)}

				{/* Patient & Appointment Info */}
				{isOccupied && chair.patient && (
					<div className="space-y-1 flex-1">
						{/* Patient name with hover tooltip */}
						<Tooltip>
							<TooltipTrigger asChild>
								<p className="text-sm font-medium truncate cursor-pointer hover:text-primary transition-colors">
									<PhiProtected fakeData={getFakeName()}>
										{chair.patient.firstName} {chair.patient.lastName}
									</PhiProtected>
								</p>
							</TooltipTrigger>
							<TooltipContent
								side="top"
								align="start"
								className="rounded-md border border-border bg-card text-card-foreground shadow-lg px-3 py-2 max-w-[280px]"
							>
								<div className="space-y-2">
									{/* Patient Name */}
									<p className="font-semibold text-foreground">
										<PhiProtected fakeData={getFakeName()}>
											{chair.patient.firstName} {chair.patient.lastName}
										</PhiProtected>
									</p>

									{/* Appointment Type */}
									{chair.appointment?.appointmentType && (
										<div className="text-sm">
											<span className="text-muted-foreground">Appointment: </span>
											<span className="font-medium">{chair.appointment.appointmentType.name}</span>
										</div>
									)}

									{/* Provider */}
									{chair.appointment?.provider && (
										<div className="text-sm">
											<span className="text-muted-foreground">Provider: </span>
											<span>Dr. {chair.appointment.provider.firstName} {chair.appointment.provider.lastName}</span>
										</div>
									)}

									{/* Assigned Staff */}
									{chair.assignedStaff && (
										<div className="text-sm">
											<span className="text-muted-foreground">Assistant: </span>
											<span>{chair.assignedStaff.firstName} {chair.assignedStaff.lastName}</span>
										</div>
									)}

									{/* Appointment Time */}
									{chair.appointment && (
										<div className="text-sm">
											<span className="text-muted-foreground">Time: </span>
											<span>{formatTime(chair.appointment.startTime)} - {formatTime(chair.appointment.endTime)}</span>
										</div>
									)}

									{/* Room & Chair */}
									<div className="text-sm">
										<span className="text-muted-foreground">Location: </span>
										<span>{chair.room.name} • {chair.name}</span>
									</div>

									{/* Procedure Notes */}
									{chair.procedureNotes && (
										<div className="text-sm pt-1 border-t border-border/50">
											<span className="text-muted-foreground">Notes: </span>
											<span className="italic">{chair.procedureNotes}</span>
										</div>
									)}
								</div>
							</TooltipContent>
						</Tooltip>
						{chair.appointment?.appointmentType && (
							<p className="text-xs text-muted-foreground truncate">
								{chair.appointment.appointmentType.name}
							</p>
						)}
						{/* Staff & Provider */}
						<p className="text-xs text-muted-foreground">
							{chair.assignedStaff && (
								<span>{chair.assignedStaff.firstName} {chair.assignedStaff.lastName[0]}.</span>
							)}
							{chair.assignedStaff && chair.appointment?.provider && ' • '}
							{chair.appointment?.provider && (
								<span>Dr. {chair.appointment.provider.lastName}</span>
							)}
						</p>
						{/* Procedure Notes */}
						{chair.procedureNotes && (
							<p className="text-xs text-muted-foreground/80 italic line-clamp-2 mt-1">
								{chair.procedureNotes}
							</p>
						)}
					</div>
				)}

				{/* Available/Blocked State */}
				{!isOccupied && (
					<div className="flex-1">
						{chair.status === 'AVAILABLE' && (
							<p className="text-xs text-muted-foreground">Ready for patient</p>
						)}
						{chair.status === 'BLOCKED' && chair.blockReason && (
							<p className="text-xs text-muted-foreground">{chair.blockReason}</p>
						)}
					</div>
				)}

				{/* Time Stats & Progress Bar for Occupied Chairs */}
				{isOccupied && chair.appointment && (
					<div className="mt-auto pt-2 space-y-1.5">
						{/* Time Stats Row - Dolphin-style */}
						<div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
							{inChairTime && (
								<>
									<span className="font-medium">In Chair:</span>
									<span>{inChairTime}</span>
								</>
							)}
							{inChairTime && subStageTime && <span className="opacity-50">|</span>}
							{subStageTime && (
								<>
									<span className="font-medium">Stage:</span>
									<span>{subStageTime}</span>
								</>
							)}
							{(inChairTime || subStageTime) && timeRemaining && <span className="opacity-50">|</span>}
							{timeRemaining && (
								<span className={cn('font-medium', isOverdue && 'text-error-600')}>
									{isOverdue ? 'Overdue' : `Left: ${timeRemaining}`}
								</span>
							)}
						</div>
						{/* Progress bar */}
						<Progress
							value={getProgress()}
							className={cn(
								'h-1',
								isReadyForDoctor && '[&>div]:bg-amber-500',
								isOverdue && '[&>div]:bg-error-500'
							)}
						/>
						{/* Start/End times */}
						<div className="flex justify-between text-[10px] text-muted-foreground">
							<span>{formatTime(chair.appointment.startTime)}</span>
							<span>{formatTime(chair.appointment.endTime)}</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

// Export the configs for use in other components
export { SUB_STAGE_CONFIG, STATUS_CONFIG, getHeroAction };

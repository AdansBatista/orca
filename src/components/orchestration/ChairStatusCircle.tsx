'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChairStatus, getChairColor } from './hooks/useChairStatus';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChairStatusCircleProps {
	chairs: ChairStatus[];
	size?: number;
	strokeWidth?: number;
	onClick?: () => void;
	className?: string;
}

/**
 * SVG Donut Chart showing chair statuses
 * Each chair gets an equal segment of the circle, colored by status
 */
export function ChairStatusCircle({
	chairs,
	size = 40,
	strokeWidth = 8,
	onClick,
	className,
}: ChairStatusCircleProps) {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const center = size / 2;

	// Calculate segment data for each chair
	const segments = useMemo(() => {
		if (chairs.length === 0) return [];

		const segmentLength = circumference / chairs.length;
		const gap = 2; // Small gap between segments
		let currentOffset = -circumference / 4; // Start at 12 o'clock

		return chairs.map((chair) => {
			const color = getChairColor(chair);
			const isReadyForDoctor = chair.activitySubStage === 'READY_FOR_DOCTOR';
			const offset = currentOffset;
			currentOffset += segmentLength;

			return {
				chair,
				color,
				isReadyForDoctor,
				dashArray: `${segmentLength - gap} ${circumference - segmentLength + gap}`,
				dashOffset: -offset,
			};
		});
	}, [chairs, circumference]);

	// Count chairs ready for doctor for visual emphasis
	const readyCount = chairs.filter(
		(c) => c.activitySubStage === 'READY_FOR_DOCTOR'
	).length;

	if (chairs.length === 0) {
		return (
			<div
				className={cn(
					'flex items-center justify-center rounded-full bg-muted/30',
					className
				)}
				style={{ width: size, height: size }}
			>
				<span className="text-xs text-muted-foreground">--</span>
			</div>
		);
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					onClick={onClick}
					className={cn(
						'relative focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full',
						'transition-transform hover:scale-105',
						className
					)}
					style={{ width: size, height: size }}
				>
					<svg
						width={size}
						height={size}
						viewBox={`0 0 ${size} ${size}`}
						className="transform -rotate-90"
					>
						{/* Background ring */}
						<circle
							cx={center}
							cy={center}
							r={radius}
							fill="none"
							stroke="currentColor"
							strokeWidth={strokeWidth}
							className="text-muted/20"
						/>

						{/* Chair segments */}
						{segments.map(({ chair, color, isReadyForDoctor, dashArray, dashOffset }) => (
							<circle
								key={chair.id}
								cx={center}
								cy={center}
								r={radius}
								fill="none"
								stroke={color}
								strokeWidth={strokeWidth}
								strokeDasharray={dashArray}
								strokeDashoffset={dashOffset}
								strokeLinecap="round"
								className={cn(
									'transition-all duration-300',
									isReadyForDoctor && 'animate-pulse'
								)}
								style={{
									filter: isReadyForDoctor
										? 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.6))'
										: undefined,
								}}
							/>
						))}
					</svg>

					{/* Center content - chair count or ready indicator */}
					<div className="absolute inset-0 flex items-center justify-center">
						{readyCount > 0 ? (
							<span
								className="text-[10px] font-bold text-amber-600"
								style={{ transform: 'translateY(0.5px)' }}
							>
								{readyCount}
							</span>
						) : (
							<span
								className="text-[9px] font-medium text-muted-foreground"
								style={{ transform: 'translateY(0.5px)' }}
							>
								{chairs.length}
							</span>
						)}
					</div>
				</button>
			</TooltipTrigger>
			<TooltipContent side="left" className="max-w-[200px]">
				<div className="text-sm">
					<p className="font-medium mb-1">Chair Status</p>
					<div className="space-y-0.5 text-xs text-muted-foreground">
						{readyCount > 0 && (
							<p className="text-amber-600 font-medium">
								{readyCount} ready for doctor
							</p>
						)}
						<p>
							{chairs.filter((c) => c.status === 'OCCUPIED').length} occupied
						</p>
						<p>
							{chairs.filter((c) => c.status === 'AVAILABLE').length} available
						</p>
					</div>
					<p className="text-xs text-muted-foreground mt-1">Click to expand</p>
				</div>
			</TooltipContent>
		</Tooltip>
	);
}

/**
 * Chair number labels positioned around the circle
 * Used when there are 4-8 chairs
 */
export function ChairNumberLabels({
	chairs,
	size = 40,
}: {
	chairs: ChairStatus[];
	size?: number;
}) {
	if (chairs.length === 0 || chairs.length > 8) return null;

	const center = size / 2;
	const labelRadius = size / 2 + 12; // Position labels outside the circle
	const anglePerChair = 360 / chairs.length;

	return (
		<div className="absolute inset-0 pointer-events-none">
			{chairs.map((chair, index) => {
				const angle = index * anglePerChair + anglePerChair / 2 - 90;
				const radians = (angle * Math.PI) / 180;
				const x = center + Math.cos(radians) * labelRadius;
				const y = center + Math.sin(radians) * labelRadius;
				const isReadyForDoctor = chair.activitySubStage === 'READY_FOR_DOCTOR';

				return (
					<span
						key={chair.id}
						className={cn(
							'absolute text-[8px] font-bold',
							isReadyForDoctor
								? 'text-amber-600'
								: 'text-muted-foreground'
						)}
						style={{
							left: x,
							top: y,
							transform: 'translate(-50%, -50%)',
						}}
					>
						{chair.chairNumber}
					</span>
				);
			})}
		</div>
	);
}

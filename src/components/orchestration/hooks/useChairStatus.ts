'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Chair activity sub-stages (matches Prisma enum)
 */
export type ChairActivitySubStage =
	| 'SETUP'
	| 'ASSISTANT_WORKING'
	| 'READY_FOR_DOCTOR'
	| 'DOCTOR_CHECKING'
	| 'FINISHING'
	| 'CLEANING';

/**
 * Chair status types
 */
export type ChairStatusType = 'AVAILABLE' | 'OCCUPIED' | 'BLOCKED' | 'CLEANING' | 'MAINTENANCE';

/**
 * Chair status interface matching API response
 */
export interface ChairStatus {
	id: string;
	name: string;
	chairNumber: string;
	status: ChairStatusType;
	condition: string;
	room: {
		id: string;
		name: string;
		roomNumber: string;
	};
	patient?: {
		id: string;
		firstName: string;
		lastName: string;
	} | null;
	appointment?: {
		id: string;
		startTime: string;
		endTime: string;
		appointmentType: {
			id: string;
			name: string;
			code: string;
			color: string | null;
		} | null;
		provider: {
			id: string;
			firstName: string;
			lastName: string;
		} | null;
	} | null;
	occupiedAt?: string | null;
	expectedFreeAt?: string | null;
	blockReason?: string | null;
	blockedUntil?: string | null;
	activitySubStage?: ChairActivitySubStage | null;
	subStageStartedAt?: string | null;
	assignedStaff?: {
		id: string;
		firstName: string;
		lastName: string;
		providerType?: string | null;
	} | null;
	procedureNotes?: string | null;
}

export interface RoomWithChairs {
	room: {
		id: string;
		name: string;
		roomNumber: string;
	};
	chairs: ChairStatus[];
}

export interface ChairStatusSummary {
	total: number;
	available: number;
	occupied: number;
	cleaning: number;
	blocked: number;
	maintenance: number;
	readyForDoctor: number;
	doctorChecking: number;
}

interface ChairStatusData {
	chairs: ChairStatus[];
	byRoom: RoomWithChairs[];
	summary: ChairStatusSummary;
}

const POLLING_INTERVAL = 30000; // 30 seconds (matches FloorPlanView)

/**
 * Hook to fetch and poll chair status data
 * Reuses the /api/ops/resources/status endpoint
 */
export function useChairStatus() {
	const [data, setData] = useState<ChairStatusData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		try {
			const response = await fetch('/api/ops/resources/status');
			const result = await response.json();

			if (result.success) {
				// Flatten chairs from byRoom for convenience
				const allChairs = result.data.byRoom?.flatMap(
					(room: RoomWithChairs) => room.chairs
				) || [];

				setData({
					chairs: allChairs,
					byRoom: result.data.byRoom || [],
					summary: result.data.summary || {
						total: 0,
						available: 0,
						occupied: 0,
						cleaning: 0,
						blocked: 0,
						maintenance: 0,
						readyForDoctor: 0,
						doctorChecking: 0,
					},
				});
				setError(null);
			} else {
				setError(result.error?.message || 'Failed to fetch chair status');
			}
		} catch {
			setError('Network error');
			// Silent fail for sidebar - don't show toast to avoid noise
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();
		const interval = setInterval(fetchData, POLLING_INTERVAL);
		return () => clearInterval(interval);
	}, [fetchData]);

	return {
		data,
		chairs: data?.chairs ?? [],
		byRoom: data?.byRoom ?? [],
		summary: data?.summary ?? null,
		loading,
		error,
		refetch: fetchData,
	};
}

/**
 * Status color mapping for SVG donut chart
 */
export const STATUS_COLORS: Record<string, string> = {
	// Sub-stages (when occupied)
	SETUP: '#64748b',             // slate-500
	ASSISTANT_WORKING: '#8b5cf6', // violet-500
	READY_FOR_DOCTOR: '#f59e0b',  // amber-500
	DOCTOR_CHECKING: '#22c55e',   // green-500
	FINISHING: '#3b82f6',         // blue-500
	CLEANING: '#eab308',          // yellow-500

	// Base statuses
	AVAILABLE: '#22c55e',         // success green
	BLOCKED: '#ef4444',           // error red
	MAINTENANCE: '#64748b',       // slate-500
};

/**
 * Get the color for a chair based on its status and sub-stage
 */
export function getChairColor(chair: ChairStatus): string {
	if (chair.status === 'OCCUPIED' && chair.activitySubStage) {
		return STATUS_COLORS[chair.activitySubStage] || STATUS_COLORS.SETUP;
	}
	return STATUS_COLORS[chair.status] || STATUS_COLORS.AVAILABLE;
}

/**
 * Get patient initials from chair
 */
export function getPatientInitials(chair: ChairStatus): string {
	if (!chair.patient) return '';
	const first = chair.patient.firstName?.[0] || '';
	const last = chair.patient.lastName?.[0] || '';
	return `${first}${last}`.toUpperCase();
}

/**
 * Calculate time remaining for appointment
 */
export function getTimeRemaining(expectedFreeAt: string | null | undefined): string | null {
	if (!expectedFreeAt) return null;
	const remaining = Math.floor(
		(new Date(expectedFreeAt).getTime() - Date.now()) / 60000
	);
	if (remaining <= 0) return 'Overdue';
	return `${remaining}m`;
}

/**
 * Calculate time in current sub-stage
 */
export function getSubStageTime(subStageStartedAt: string | null | undefined): string | null {
	if (!subStageStartedAt) return null;
	const minutes = Math.floor(
		(Date.now() - new Date(subStageStartedAt).getTime()) / 60000
	);
	if (minutes < 1) return '<1m';
	return `${minutes}m`;
}

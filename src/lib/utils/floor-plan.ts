import type { Position, GridConfig, ChairPosition, RoomBoundary, ChairStatus } from '@/types/floor-plan';
import type { OccupancyStatus } from '@/lib/validations/ops';

// =============================================================================
// GRID UTILITIES
// =============================================================================

/**
 * Convert grid units to pixels
 */
export function gridToPixels(units: number, cellSize: number): number {
  return units * cellSize;
}

/**
 * Convert pixels to grid units
 */
export function pixelsToGrid(pixels: number, cellSize: number): number {
  return Math.round(pixels / cellSize);
}

/**
 * Snap position to grid
 */
export function snapToGrid(position: Position, gridConfig: GridConfig): Position {
  if (!gridConfig.snapToGrid) return position;

  return {
    x: Math.round(position.x),
    y: Math.round(position.y),
  };
}

/**
 * Check if position is within grid bounds
 */
export function isWithinBounds(position: Position, gridConfig: GridConfig): boolean {
  return (
    position.x >= 0 &&
    position.x < gridConfig.columns &&
    position.y >= 0 &&
    position.y < gridConfig.rows
  );
}

/**
 * Clamp position to grid bounds
 */
export function clampToGrid(position: Position, gridConfig: GridConfig): Position {
  return {
    x: Math.max(0, Math.min(gridConfig.columns - 1, position.x)),
    y: Math.max(0, Math.min(gridConfig.rows - 1, position.y)),
  };
}

// =============================================================================
// COLLISION DETECTION
// =============================================================================

/**
 * Check if two positions overlap
 */
export function doPositionsOverlap(pos1: Position, pos2: Position): boolean {
  return pos1.x === pos2.x && pos1.y === pos2.y;
}

/**
 * Check if chair position collides with any other chairs
 */
export function checkChairCollision(
  chairPosition: ChairPosition,
  allChairs: ChairPosition[],
  excludeChairId?: string
): boolean {
  return allChairs.some(
    (chair) =>
      chair.chairId !== excludeChairId &&
      chair.chairId !== chairPosition.chairId &&
      doPositionsOverlap(chair, chairPosition)
  );
}

/**
 * Check if position is inside a room boundary
 */
export function isInsideRoom(position: Position, room: RoomBoundary): boolean {
  return (
    position.x >= room.x &&
    position.x < room.x + room.width &&
    position.y >= room.y &&
    position.y < room.y + room.height
  );
}

// =============================================================================
// STATUS COLORS & STYLING
// =============================================================================

export interface StatusColors {
  bg: string;
  border: string;
  text: string;
  icon: string;
  pulse?: boolean;
}

export function getChairStatusColors(status: OccupancyStatus): StatusColors {
  switch (status) {
    case 'AVAILABLE':
      return {
        bg: 'bg-success-100',
        border: 'border-success-500',
        text: 'text-success-700',
        icon: 'text-success-500',
      };
    case 'OCCUPIED':
      return {
        bg: 'bg-primary-100',
        border: 'border-primary-500',
        text: 'text-primary-700',
        icon: 'text-primary-500',
      };
    case 'BLOCKED':
      return {
        bg: 'bg-error-100',
        border: 'border-error-500',
        text: 'text-error-700',
        icon: 'text-error-500',
      };
    case 'MAINTENANCE':
      return {
        bg: 'bg-muted',
        border: 'border-border',
        text: 'text-muted-foreground',
        icon: 'text-muted-foreground',
      };
    case 'CLEANING':
      return {
        bg: 'bg-purple-100',
        border: 'border-purple-500',
        text: 'text-purple-700',
        icon: 'text-purple-500',
      };
    default:
      return {
        bg: 'bg-muted',
        border: 'border-border',
        text: 'text-muted-foreground',
        icon: 'text-muted-foreground',
      };
  }
}

/**
 * Get status color with ready-for-doctor override
 */
export function getChairDisplayColors(chairStatus: ChairStatus): StatusColors {
  // Ready for doctor takes precedence
  if (chairStatus.subStage === 'READY_FOR_DOCTOR') {
    return {
      bg: 'bg-warning-100',
      border: 'border-warning-500',
      text: 'text-warning-700',
      icon: 'text-warning-500',
      pulse: true,
    };
  }

  return getChairStatusColors(chairStatus.occupancyStatus);
}

// =============================================================================
// TIME CALCULATIONS
// =============================================================================

/**
 * Calculate time elapsed in minutes
 */
export function calculateTimeElapsed(startTime: string | null): number | null {
  if (!startTime) return null;

  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  return Math.floor(diffMs / 1000 / 60);
}

/**
 * Calculate remaining time in minutes
 */
export function calculateTimeRemaining(startTime: string | null, duration: number): number | null {
  if (!startTime) return null;

  const elapsed = calculateTimeElapsed(startTime);
  if (elapsed === null) return null;

  return Math.max(0, duration - elapsed);
}

/**
 * Format minutes to human-readable string
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Check if wait time is extended (over threshold)
 */
export function isExtendedWait(startTime: string | null, threshold: number = 15): boolean {
  const elapsed = calculateTimeElapsed(startTime);
  return elapsed !== null && elapsed > threshold;
}

// =============================================================================
// UTILIZATION CALCULATIONS
// =============================================================================

/**
 * Get color for utilization percentage
 */
export function getUtilizationColor(utilization: number): string {
  if (utilization >= 80) return '#22c55e'; // Green (excellent)
  if (utilization >= 60) return '#84cc16'; // Yellow-green (good)
  if (utilization >= 40) return '#eab308'; // Yellow (fair)
  if (utilization >= 20) return '#f97316'; // Orange (poor)
  return '#ef4444'; // Red (very poor)
}

/**
 * Calculate cleaning progress percentage
 */
export function getCleaningProgress(
  cleaningStartedAt: string | null,
  cleaningDuration: number | null
): number {
  if (!cleaningStartedAt || !cleaningDuration) return 0;

  const elapsed = calculateTimeElapsed(cleaningStartedAt);
  if (elapsed === null) return 0;

  const progress = (elapsed / cleaningDuration) * 100;
  return Math.min(100, Math.max(0, progress));
}

// =============================================================================
// LAYOUT VALIDATION
// =============================================================================

/**
 * Validate floor plan layout
 */
export function validateLayout(
  layout: { rooms: RoomBoundary[]; chairs: ChairPosition[] },
  gridConfig: GridConfig
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check rooms are within bounds
  layout.rooms.forEach((room) => {
    if (room.x < 0 || room.y < 0) {
      errors.push(`Room ${room.roomId} has negative position`);
    }
    if (room.x + room.width > gridConfig.columns) {
      errors.push(`Room ${room.roomId} extends beyond grid width`);
    }
    if (room.y + room.height > gridConfig.rows) {
      errors.push(`Room ${room.roomId} extends beyond grid height`);
    }
  });

  // Check chairs are within bounds
  layout.chairs.forEach((chair) => {
    if (!isWithinBounds(chair, gridConfig)) {
      errors.push(`Chair ${chair.chairId} is outside grid bounds`);
    }
  });

  // Check for chair collisions
  layout.chairs.forEach((chair, index) => {
    const otherChairs = layout.chairs.slice(index + 1);
    if (checkChairCollision(chair, otherChairs)) {
      errors.push(`Chair ${chair.chairId} overlaps with another chair`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

export const DEFAULT_GRID_CONFIG: GridConfig = {
  columns: 20,
  rows: 15,
  cellSize: 50,
  snapToGrid: true,
};

export const GRID_CONFIG_LIMITS = {
  minColumns: 5,
  maxColumns: 50,
  minRows: 5,
  maxRows: 50,
  minCellSize: 20,
  maxCellSize: 100,
};

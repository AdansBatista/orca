import type { OccupancyStatus, ChairActivitySubStage, FlowStage } from '@/lib/validations/ops';

// =============================================================================
// GRID & LAYOUT TYPES
// =============================================================================

export interface GridConfig {
  columns: number;
  rows: number;
  cellSize: number;
  snapToGrid: boolean;
}

export interface Position {
  x: number; // Grid units
  y: number; // Grid units
}

export interface Dimensions {
  width: number; // Grid units
  height: number; // Grid units
}

export type Rotation = 0 | 90 | 180 | 270;

// =============================================================================
// CHAIR & ROOM TYPES
// =============================================================================

export interface ChairPosition extends Position {
  chairId: string;
  rotation: Rotation;
}

export interface RoomBoundary extends Position, Dimensions {
  roomId: string;
  rotation: Rotation;
}

export interface FloorPlanLayout {
  id?: string;
  name: string;
  gridConfig: GridConfig;
  rooms: RoomBoundary[];
  chairs: ChairPosition[];
}

// =============================================================================
// CHAIR STATUS TYPES (for real-time display)
// =============================================================================

export interface ChairStatus {
  chairId: string;
  occupancyStatus: OccupancyStatus;
  subStage?: ChairActivitySubStage;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  appointment: {
    id: string;
    startTime: string;
    duration: number;
    appointmentType: {
      name: string;
      color: string | null;
    } | null;
  } | null;
  seatedAt: string | null;
  statusChangedAt: string;
  blockReason: string | null;
  blockedUntil: string | null;
  cleaningStartedAt: string | null;
  cleaningDuration: number | null;
  assignedStaff: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  }[];
}

export interface Chair {
  id: string;
  name: string;
  chairNumber: number;
  roomId: string;
  isActive: boolean;
  position?: ChairPosition;
  status?: ChairStatus;
}

export interface Room {
  id: string;
  name: string;
  roomNumber: string;
  boundary?: RoomBoundary;
  chairs: Chair[];
}

// =============================================================================
// FLOOR PLAN TEMPLATE TYPES
// =============================================================================

export interface FloorPlanTemplate {
  id: string;
  name: string;
  description: string;
  gridConfig: GridConfig;
  rooms: RoomBoundary[];
  chairCount: number;
  previewImage?: string;
}

// =============================================================================
// VIEW & FILTER TYPES
// =============================================================================

export type ViewMode = 'standard' | 'active-only' | 'provider-grouped' | 'priority' | 'heatmap';

export interface FloorPlanFilters {
  status: OccupancyStatus[];
  providerIds: string[];
  treatmentTypes: string[];
  priorities: string[];
  timeRange: 'all' | 'overdue' | 'on-time' | 'ahead';
}

export interface FloorPlanPreset {
  id: string;
  name: string;
  filters: FloorPlanFilters;
  viewMode: ViewMode;
}

// =============================================================================
// UTILIZATION & ANALYTICS TYPES
// =============================================================================

export interface ChairUtilization {
  chairId: string;
  chairName: string;
  utilizationPercentage: number;
  totalMinutes: number;
  occupiedMinutes: number;
  patientCount: number;
  avgTreatmentTime: number;
}

// =============================================================================
// REAL-TIME UPDATE TYPES
// =============================================================================

export interface FloorPlanUpdate {
  type: 'chair_status' | 'patient_seated' | 'patient_completed' | 'chair_blocked' | 'chair_unblocked';
  chairId: string;
  status?: ChairStatus;
  timestamp: string;
}

// =============================================================================
// ACTION TYPES
// =============================================================================

export interface ChairAction {
  key: string;
  label: string;
  icon: any; // Lucide icon component
  variant?: 'default' | 'destructive' | 'success';
  permission?: string;
}

// =============================================================================
// EDIT HISTORY TYPES
// =============================================================================

export interface LayoutHistoryEntry {
  layout: FloorPlanLayout;
  timestamp: number;
  action: string;
}

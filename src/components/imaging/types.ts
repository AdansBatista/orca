/**
 * Imaging Component Types
 *
 * Shared type definitions for imaging components.
 */

// =============================================================================
// Tag Types
// =============================================================================

export interface ImageTag {
  id: string;
  name: string;
  color?: string | null;
  category: string;
}

// =============================================================================
// Treatment Phase Types
// =============================================================================

export interface TreatmentPhaseInfo {
  id: string;
  phaseNumber: number;
  phaseName: string;
  phaseType: string;
  status: string;
}

export interface TreatmentPlanInfo {
  id: string;
  planName: string;
  planNumber?: number;
}

// =============================================================================
// Patient Image Types
// =============================================================================

export interface PatientImage {
  id: string;
  fileName: string;
  fileUrl: string;
  thumbnailUrl?: string | null;
  fileSize: number;
  mimeType: string;
  category: string;
  subcategory?: string | null;
  captureDate?: string | null;
  qualityScore?: number | null;
  visibleToPatient: boolean;
  description?: string | null;
  notes?: string | null;
  capturedBy?: {
    id?: string;
    firstName: string;
    lastName: string;
  } | null;
  createdBy?: {
    id?: string;
    firstName: string;
    lastName: string;
  } | null;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  protocol?: {
    id?: string;
    name: string;
  } | null;
  protocolSlot?: {
    id?: string;
    name: string;
  } | null;
  treatmentPhase?: TreatmentPhaseInfo | null;
  treatmentPlan?: TreatmentPlanInfo | null;
  tags: ImageTag[];
  createdAt: string;
  updatedAt?: string;
}

// =============================================================================
// Image Category Types
// =============================================================================

export type ImageCategory =
  | 'EXTRAORAL_PHOTO'
  | 'INTRAORAL_PHOTO'
  | 'PANORAMIC_XRAY'
  | 'CEPHALOMETRIC_XRAY'
  | 'PERIAPICAL_XRAY'
  | 'CBCT'
  | 'SCAN_3D'
  | 'OTHER';

export const IMAGE_CATEGORY_LABELS: Record<ImageCategory, string> = {
  EXTRAORAL_PHOTO: 'Extraoral Photo',
  INTRAORAL_PHOTO: 'Intraoral Photo',
  PANORAMIC_XRAY: 'Panoramic X-Ray',
  CEPHALOMETRIC_XRAY: 'Cephalometric X-Ray',
  PERIAPICAL_XRAY: 'Periapical X-Ray',
  CBCT: 'CBCT',
  SCAN_3D: '3D Scan',
  OTHER: 'Other',
};

// =============================================================================
// Phase Status Types
// =============================================================================

export type PhaseStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export const PHASE_STATUS_LABELS: Record<PhaseStatus, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  SKIPPED: 'Skipped',
};

export const PHASE_STATUS_VARIANTS: Record<PhaseStatus, 'outline' | 'info' | 'success' | 'warning'> = {
  NOT_STARTED: 'outline',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  SKIPPED: 'warning',
};

// =============================================================================
// Phase Type Types
// =============================================================================

export type TreatmentPhaseType =
  | 'INITIAL_ALIGNMENT'
  | 'LEVELING'
  | 'SPACE_CLOSURE'
  | 'FINISHING'
  | 'DETAILING'
  | 'RETENTION'
  | 'OBSERVATION'
  | 'CUSTOM';

export const PHASE_TYPE_LABELS: Record<TreatmentPhaseType, string> = {
  INITIAL_ALIGNMENT: 'Initial Alignment',
  LEVELING: 'Leveling',
  SPACE_CLOSURE: 'Space Closure',
  FINISHING: 'Finishing',
  DETAILING: 'Detailing',
  RETENTION: 'Retention',
  OBSERVATION: 'Observation',
  CUSTOM: 'Custom',
};

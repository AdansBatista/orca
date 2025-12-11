/**
 * 3D Model Viewer Types
 *
 * Types and interfaces for the 3D model viewer component
 * supporting STL and PLY files from intraoral scanners.
 */

import type { BufferGeometry } from 'three';

// =============================================================================
// MODEL TYPES
// =============================================================================

/**
 * Supported 3D file formats
 */
export type Model3DFormat = 'STL' | 'PLY' | 'OBJ';

/**
 * Model file metadata
 */
export interface Model3DFile {
  id: string;
  patientId: string;
  fileName: string;
  fileUrl: string;
  format: Model3DFormat;
  fileSize: number;
  /** Scanner source (iTero, 3Shape, etc.) */
  source?: string;
  /** Scan type (upper, lower, bite) */
  scanType?: ScanType;
  captureDate?: Date;
  notes?: string;
}

/**
 * Types of dental scans
 */
export type ScanType =
  | 'UPPER_ARCH'
  | 'LOWER_ARCH'
  | 'BITE_SCAN'
  | 'FULL_MOUTH'
  | 'SECTIONAL'
  | 'OTHER';

export const SCAN_TYPE_LABELS: Record<ScanType, string> = {
  UPPER_ARCH: 'Upper Arch',
  LOWER_ARCH: 'Lower Arch',
  BITE_SCAN: 'Bite Scan',
  FULL_MOUTH: 'Full Mouth',
  SECTIONAL: 'Sectional',
  OTHER: 'Other',
};

// =============================================================================
// VIEW STATE
// =============================================================================

/**
 * Camera view presets
 */
export type ViewPreset =
  | 'FRONT'
  | 'BACK'
  | 'LEFT'
  | 'RIGHT'
  | 'TOP'
  | 'BOTTOM'
  | 'ISOMETRIC';

export const VIEW_PRESET_POSITIONS: Record<ViewPreset, { x: number; y: number; z: number }> = {
  FRONT: { x: 0, y: 0, z: 100 },
  BACK: { x: 0, y: 0, z: -100 },
  LEFT: { x: -100, y: 0, z: 0 },
  RIGHT: { x: 100, y: 0, z: 0 },
  TOP: { x: 0, y: 100, z: 0 },
  BOTTOM: { x: 0, y: -100, z: 0 },
  ISOMETRIC: { x: 70, y: 70, z: 70 },
};

/**
 * Render mode for the model
 */
export type RenderMode = 'SOLID' | 'WIREFRAME' | 'POINTS';

/**
 * Material preset for the model
 */
export type MaterialPreset =
  | 'DEFAULT'
  | 'TEETH_WHITE'
  | 'GUMS_PINK'
  | 'METALLIC'
  | 'TRANSPARENT'
  | 'CUSTOM';

export interface MaterialSettings {
  color: string;
  metalness: number;
  roughness: number;
  opacity: number;
  wireframe: boolean;
}

export const MATERIAL_PRESETS: Record<MaterialPreset, MaterialSettings> = {
  DEFAULT: {
    color: '#e8e8e8',
    metalness: 0.1,
    roughness: 0.5,
    opacity: 1,
    wireframe: false,
  },
  TEETH_WHITE: {
    color: '#f5f5f0',
    metalness: 0.05,
    roughness: 0.3,
    opacity: 1,
    wireframe: false,
  },
  GUMS_PINK: {
    color: '#e8a0a0',
    metalness: 0.0,
    roughness: 0.7,
    opacity: 1,
    wireframe: false,
  },
  METALLIC: {
    color: '#c0c0c0',
    metalness: 0.8,
    roughness: 0.2,
    opacity: 1,
    wireframe: false,
  },
  TRANSPARENT: {
    color: '#a0c0e0',
    metalness: 0.1,
    roughness: 0.3,
    opacity: 0.7,
    wireframe: false,
  },
  CUSTOM: {
    color: '#ffffff',
    metalness: 0.1,
    roughness: 0.5,
    opacity: 1,
    wireframe: false,
  },
};

/**
 * Viewer state
 */
export interface ViewerState {
  /** Current camera position */
  cameraPosition: { x: number; y: number; z: number };
  /** Current camera target (look at) */
  cameraTarget: { x: number; y: number; z: number };
  /** Current zoom level */
  zoom: number;
  /** Render mode */
  renderMode: RenderMode;
  /** Material settings */
  material: MaterialSettings;
  /** Show grid */
  showGrid: boolean;
  /** Show axes helper */
  showAxes: boolean;
  /** Auto-rotate */
  autoRotate: boolean;
  /** Clipping plane enabled */
  clippingEnabled: boolean;
  /** Clipping plane position (0-1) */
  clippingPosition: number;
  /** Clipping plane axis */
  clippingAxis: 'x' | 'y' | 'z';
}

export const DEFAULT_VIEWER_STATE: ViewerState = {
  cameraPosition: VIEW_PRESET_POSITIONS.ISOMETRIC,
  cameraTarget: { x: 0, y: 0, z: 0 },
  zoom: 1,
  renderMode: 'SOLID',
  material: MATERIAL_PRESETS.TEETH_WHITE,
  showGrid: true,
  showAxes: false,
  autoRotate: false,
  clippingEnabled: false,
  clippingPosition: 0.5,
  clippingAxis: 'y',
};

// =============================================================================
// MEASUREMENT TYPES
// =============================================================================

/**
 * 3D measurement point
 */
export interface MeasurementPoint3D {
  id: string;
  x: number;
  y: number;
  z: number;
  label?: string;
}

/**
 * 3D measurement (distance between two points)
 */
export interface Measurement3D {
  id: string;
  point1: MeasurementPoint3D;
  point2: MeasurementPoint3D;
  distance: number;
  unit: 'mm' | 'cm';
  label?: string;
}

// =============================================================================
// LOADER TYPES
// =============================================================================

/**
 * Loaded model data
 */
export interface LoadedModel {
  geometry: BufferGeometry;
  format: Model3DFormat;
  /** Bounding box dimensions */
  boundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  /** Center point of the model */
  center: { x: number; y: number; z: number };
  /** Model size (diagonal of bounding box) */
  size: number;
  /** Vertex count */
  vertexCount: number;
  /** Face/triangle count */
  faceCount: number;
  /** Has vertex colors (PLY) */
  hasVertexColors: boolean;
  /** Has normals */
  hasNormals: boolean;
}

/**
 * Model loading state
 */
export interface ModelLoadingState {
  isLoading: boolean;
  progress: number;
  error: string | null;
  model: LoadedModel | null;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Detect file format from filename
 */
export function detectFormat(fileName: string): Model3DFormat | null {
  const ext = fileName.toLowerCase().split('.').pop();
  switch (ext) {
    case 'stl':
      return 'STL';
    case 'ply':
      return 'PLY';
    case 'obj':
      return 'OBJ';
    default:
      return null;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format vertex count for display
 */
export function formatCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}

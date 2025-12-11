// 3D Model Viewer Components and Types

export { Model3DViewer } from './Model3DViewer';
export { Model3DToolbar } from './Model3DToolbar';

// Loaders
export {
  loadModel,
  loadModelFromFile,
  normalizeGeometry,
  calculateDistance,
  getModelStats,
} from './loaders';

// Types
export type {
  Model3DFormat,
  Model3DFile,
  ScanType,
  ViewPreset,
  RenderMode,
  MaterialPreset,
  MaterialSettings,
  ViewerState,
  MeasurementPoint3D,
  Measurement3D,
  LoadedModel,
  ModelLoadingState,
} from './types';

// Constants
export {
  SCAN_TYPE_LABELS,
  VIEW_PRESET_POSITIONS,
  MATERIAL_PRESETS,
  DEFAULT_VIEWER_STATE,
  detectFormat,
  formatFileSize,
  formatCount,
} from './types';

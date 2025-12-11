/**
 * DICOM Viewer Components
 *
 * Components for viewing DICOM medical images (X-rays, CT, etc.)
 */

export { DicomViewer } from './DicomViewer';
export { DicomToolbar } from './DicomToolbar';

// Loader functions
export {
  parseDicomFile,
  extractMetadata,
  extractPixelData,
  loadDicomImage,
  loadDicomFromFile,
  loadDicomFromUrl,
  renderDicomToImageData,
  applyWindowLevel,
  formatDicomDate,
  formatDicomTime,
  formatPatientName,
  isDicomFile,
  isDicomData,
} from './loader';

// Types
export type {
  DicomMetadata,
  DicomModality,
  PhotometricInterpretation,
  WindowLevelPreset,
  ViewerState,
  DicomTool,
  LoadedDicomImage,
  DicomLoadingState,
} from './types';

// Constants
export {
  MODALITY_LABELS,
  WINDOW_LEVEL_PRESETS,
  DEFAULT_VIEWER_STATE,
  DICOM_TAGS,
  formatFileSize,
} from './types';

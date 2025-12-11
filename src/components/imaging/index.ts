export { ImageUploader } from './ImageUploader';
export { ImageCard } from './ImageCard';
export { ImageGallery } from './ImageGallery';
export { ImageViewer } from './ImageViewer';
export {
  ImageAdjustments,
  getFilterStyle,
  DEFAULT_ADJUSTMENTS,
  type ImageAdjustmentsState,
} from './ImageAdjustments';
export { BeforeAfterSlider } from './BeforeAfterSlider';
export {
  ImageComparison,
  type ComparisonMode,
  type ComparisonImage,
} from './ImageComparison';

// Annotation components
export {
  AnnotationCanvas,
  AnnotationToolbar,
  DEFAULT_ANNOTATION_STYLE,
  type AnnotationCanvasRef,
  type StoredAnnotation,
  type PrismaAnnotationType,
  type AnnotationTool,
  type AnnotationStyle,
} from './annotations';

// Measurement components
export {
  MeasurementCanvas,
  MeasurementToolbar,
  DEFAULT_CALIBRATION,
  type MeasurementCanvasRef,
  type StoredMeasurement,
  type PrismaMeasurementType,
  type MeasurementTool,
  type CalibrationSettings,
} from './measurements';

// Collage components
export {
  CollagePreview,
  CollageEditor,
  TemplateSelector,
  DEFAULT_COLLAGE_TEMPLATES,
  ASPECT_RATIO_DIMENSIONS,
  type CollageSlot,
  type CollageLayout,
  type CollageTemplateData,
  type SlotAssignment,
  type CollageCustomization,
  type CollageAnnotation,
} from './collage';

// Progress Report components
export {
  ReportBuilder,
  ReportSectionEditor,
  ReportTemplateSelector,
  DEFAULT_REPORT_TEMPLATES,
  REPORT_TYPE_LABELS,
  SECTION_TYPE_LABELS,
  type ReportType,
  type SectionType,
  type ReportSection,
  type ProgressReportData,
  type PatientImageData,
  type ReportTemplate,
  type ReportTemplateSection,
} from './progress-report';

// Presentation components
export {
  PresentationBuilder,
  PresentationViewer,
  BeforeAfterPairSelector,
  DEFAULT_PRESENTATION_TEMPLATES,
  LAYOUT_LABELS,
  type PresentationLayout,
  type BeforeAfterPair,
  type PresentationSlide,
  type PresentationData,
  type PresentationTemplate,
} from './presentations';

// Cephalometric Analysis components
export {
  CephAnalysis,
  CephCanvas,
  CephToolbar,
  CephMeasurementsPanel,
  CEPH_LANDMARKS,
  CEPH_MEASUREMENTS,
  ANALYSIS_PRESETS,
  LANDMARK_COLORS,
  REFERENCE_LINES,
  CALIBRATION_STANDARDS,
  getLandmarksByCategory,
  getRequiredLandmarks,
  getMeasurementInterpretation,
  canCalculateMeasurement,
  getAnalysisCompletion,
  getLandmarkById,
  getMeasurementById,
  calculateMeasurement,
  calculateAllMeasurements,
  calculatePresetMeasurements,
  calculateSNA,
  calculateSNB,
  calculateANB,
  calculateFMA,
  calculateCalibration,
  getDrawableLines,
  type CephLandmark,
  type PlacedLandmark,
  type LandmarkCategory,
  type CephMeasurement,
  type MeasurementValueType,
  type MeasurementCategory,
  type MeasurementCalculation,
  type NormativeData,
  type CephAnalysisPreset,
  type CephAnalysisState,
  type CalculatedMeasurement,
  type CephTool,
  type CephToolState,
} from './cephalometric';

// 3D Model Viewer components
export {
  Model3DViewer,
  Model3DToolbar,
  loadModel,
  loadModelFromFile,
  normalizeGeometry,
  calculateDistance,
  getModelStats,
  SCAN_TYPE_LABELS,
  VIEW_PRESET_POSITIONS,
  MATERIAL_PRESETS,
  DEFAULT_VIEWER_STATE,
  detectFormat,
  formatFileSize,
  formatCount,
  type Model3DFormat,
  type Model3DFile,
  type ScanType,
  type ViewPreset,
  type RenderMode,
  type MaterialPreset,
  type MaterialSettings,
  type ViewerState,
  type MeasurementPoint3D,
  type Measurement3D,
  type LoadedModel,
  type ModelLoadingState,
} from './model-viewer';

// DICOM Viewer components
export {
  DicomViewer,
  DicomToolbar,
  loadDicomImage,
  loadDicomFromFile,
  loadDicomFromUrl,
  renderDicomToImageData,
  formatDicomDate,
  formatDicomTime,
  formatPatientName,
  isDicomFile,
  isDicomData,
  MODALITY_LABELS,
  WINDOW_LEVEL_PRESETS,
  DEFAULT_VIEWER_STATE as DEFAULT_DICOM_VIEWER_STATE,
  DICOM_TAGS,
  type DicomMetadata,
  type DicomModality,
  type PhotometricInterpretation,
  type WindowLevelPreset,
  type ViewerState as DicomViewerState,
  type DicomTool,
  type LoadedDicomImage,
  type DicomLoadingState,
} from './dicom-viewer';

// AI Analysis components
export {
  AIAnalysisPanel,
  QualityAnalysisPanel,
  CategorizationPanel,
  AIProgressComparison,
  AICephLandmarks,
  AIStatusIndicator,
} from './ai-analysis';

// Treatment Phase components
export {
  TreatmentPhaseSelector,
  TreatmentPhaseBadge,
  CompactPhaseBadge,
  TreatmentPhaseImageGallery,
} from './treatment-phase';

// Retention & Archival components
export {
  RetentionPolicyList,
  RetentionPolicyForm,
  RetentionDashboard,
  ArchiveManagement,
  LegalHoldManager,
} from './retention';

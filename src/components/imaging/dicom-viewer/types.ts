/**
 * DICOM Viewer Types
 *
 * Type definitions for DICOM medical image viewing.
 */

// =============================================================================
// DICOM METADATA TYPES
// =============================================================================

export interface DicomMetadata {
  // Patient Information
  patientName?: string;
  patientId?: string;
  patientBirthDate?: string;
  patientSex?: string;

  // Study Information
  studyDate?: string;
  studyTime?: string;
  studyDescription?: string;
  studyId?: string;
  accessionNumber?: string;

  // Series Information
  seriesDate?: string;
  seriesTime?: string;
  seriesDescription?: string;
  seriesNumber?: number;
  modality?: DicomModality;

  // Image Information
  instanceNumber?: number;
  imageType?: string[];
  acquisitionDate?: string;
  contentDate?: string;

  // Equipment Information
  manufacturer?: string;
  institutionName?: string;
  stationName?: string;
  manufacturerModelName?: string;

  // Image Pixel Description
  rows?: number;
  columns?: number;
  bitsAllocated?: number;
  bitsStored?: number;
  highBit?: number;
  pixelRepresentation?: number;
  samplesPerPixel?: number;
  photometricInterpretation?: PhotometricInterpretation;

  // Window Settings
  windowCenter?: number | number[];
  windowWidth?: number | number[];

  // Rescale Settings
  rescaleIntercept?: number;
  rescaleSlope?: number;

  // Pixel Spacing
  pixelSpacing?: [number, number];
  imagerPixelSpacing?: [number, number];

  // Image Position/Orientation (for 3D)
  imagePositionPatient?: [number, number, number];
  imageOrientationPatient?: [number, number, number, number, number, number];
  sliceThickness?: number;
  sliceLocation?: number;

  // Transfer Syntax
  transferSyntaxUID?: string;

  // SOP Class
  sopClassUID?: string;
  sopInstanceUID?: string;
}

// =============================================================================
// DICOM ENUMS
// =============================================================================

export type DicomModality =
  | 'CR' // Computed Radiography
  | 'CT' // Computed Tomography
  | 'MR' // Magnetic Resonance
  | 'US' // Ultrasound
  | 'OT' // Other
  | 'DX' // Digital Radiography
  | 'IO' // Intra-oral Radiography
  | 'PX' // Panoramic X-Ray
  | 'RG' // Radiographic imaging
  | 'XA' // X-Ray Angiography
  | 'RF' // Radio Fluoroscopy
  | 'MG' // Mammography
  | 'PT' // Positron emission tomography
  | 'NM' // Nuclear Medicine
  | 'CBCT'; // Cone Beam CT (custom for dental)

export type PhotometricInterpretation =
  | 'MONOCHROME1' // Min = white
  | 'MONOCHROME2' // Min = black (most common)
  | 'RGB'
  | 'PALETTE COLOR'
  | 'YBR_FULL'
  | 'YBR_FULL_422';

// =============================================================================
// VIEWER STATE TYPES
// =============================================================================

export interface WindowLevelPreset {
  id: string;
  name: string;
  windowCenter: number;
  windowWidth: number;
  description?: string;
}

export interface ViewerState {
  // Window/Level
  windowCenter: number;
  windowWidth: number;

  // Zoom and Pan
  zoom: number;
  panX: number;
  panY: number;

  // Rotation and Flip
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;

  // Display Options
  invert: boolean;
  interpolation: 'nearest' | 'bilinear';

  // Annotations
  showAnnotations: boolean;
  showMetadata: boolean;

  // Tools
  activeTool: DicomTool;
}

export type DicomTool =
  | 'pan'
  | 'zoom'
  | 'windowLevel'
  | 'measure'
  | 'angle'
  | 'annotate';

// =============================================================================
// LOADED IMAGE TYPES
// =============================================================================

export interface LoadedDicomImage {
  // Pixel data
  pixelData: Int16Array | Uint16Array | Uint8Array;

  // Dimensions
  width: number;
  height: number;

  // Bit depth
  bitsAllocated: number;
  bitsStored: number;

  // Value range
  minPixelValue: number;
  maxPixelValue: number;

  // Rescale values for Hounsfield units
  rescaleSlope: number;
  rescaleIntercept: number;

  // Default window settings
  windowCenter: number;
  windowWidth: number;

  // Photometric interpretation
  photometricInterpretation: PhotometricInterpretation;

  // Is inverted (MONOCHROME1)
  invert: boolean;

  // Pixel spacing (mm)
  pixelSpacing?: [number, number];

  // Full metadata
  metadata: DicomMetadata;

  // Original file size
  fileSize: number;
}

export interface DicomLoadingState {
  isLoading: boolean;
  progress: number;
  error: string | null;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const MODALITY_LABELS: Record<DicomModality, string> = {
  CR: 'Computed Radiography',
  CT: 'CT Scan',
  MR: 'MRI',
  US: 'Ultrasound',
  OT: 'Other',
  DX: 'Digital X-Ray',
  IO: 'Intra-oral X-Ray',
  PX: 'Panoramic X-Ray',
  RG: 'Radiographic',
  XA: 'X-Ray Angiography',
  RF: 'Fluoroscopy',
  MG: 'Mammography',
  PT: 'PET Scan',
  NM: 'Nuclear Medicine',
  CBCT: 'Cone Beam CT',
};

// Window/Level presets for dental imaging
export const WINDOW_LEVEL_PRESETS: WindowLevelPreset[] = [
  {
    id: 'DEFAULT',
    name: 'Default',
    windowCenter: 127,
    windowWidth: 256,
    description: 'Default 8-bit display',
  },
  {
    id: 'DENTAL_SOFT',
    name: 'Soft Tissue',
    windowCenter: 40,
    windowWidth: 400,
    description: 'Optimized for soft tissue viewing',
  },
  {
    id: 'DENTAL_BONE',
    name: 'Bone',
    windowCenter: 300,
    windowWidth: 1500,
    description: 'Optimized for bone structures',
  },
  {
    id: 'DENTAL_TEETH',
    name: 'Teeth',
    windowCenter: 500,
    windowWidth: 2000,
    description: 'Optimized for tooth structures',
  },
  {
    id: 'PANORAMIC',
    name: 'Panoramic',
    windowCenter: 200,
    windowWidth: 800,
    description: 'Panoramic X-ray preset',
  },
  {
    id: 'CEPHALOMETRIC',
    name: 'Cephalometric',
    windowCenter: 150,
    windowWidth: 600,
    description: 'Cephalometric X-ray preset',
  },
  {
    id: 'PERIAPICAL',
    name: 'Periapical',
    windowCenter: 180,
    windowWidth: 700,
    description: 'Periapical X-ray preset',
  },
  {
    id: 'CBCT_BONE',
    name: 'CBCT Bone',
    windowCenter: 400,
    windowWidth: 2000,
    description: 'CBCT bone window',
  },
  {
    id: 'HIGH_CONTRAST',
    name: 'High Contrast',
    windowCenter: 127,
    windowWidth: 128,
    description: 'High contrast display',
  },
  {
    id: 'LOW_CONTRAST',
    name: 'Low Contrast',
    windowCenter: 127,
    windowWidth: 512,
    description: 'Low contrast display',
  },
];

export const DEFAULT_VIEWER_STATE: ViewerState = {
  windowCenter: 127,
  windowWidth: 256,
  zoom: 1,
  panX: 0,
  panY: 0,
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  invert: false,
  interpolation: 'bilinear',
  showAnnotations: true,
  showMetadata: true,
  activeTool: 'windowLevel',
};

// DICOM Tags (commonly used)
export const DICOM_TAGS = {
  // Patient
  PatientName: 'x00100010',
  PatientID: 'x00100020',
  PatientBirthDate: 'x00100030',
  PatientSex: 'x00100040',

  // Study
  StudyDate: 'x00080020',
  StudyTime: 'x00080030',
  StudyDescription: 'x00081030',
  StudyID: 'x00200010',
  AccessionNumber: 'x00080050',

  // Series
  SeriesDate: 'x00080021',
  SeriesTime: 'x00080031',
  SeriesDescription: 'x0008103e',
  SeriesNumber: 'x00200011',
  Modality: 'x00080060',

  // Instance
  InstanceNumber: 'x00200013',
  ImageType: 'x00080008',
  AcquisitionDate: 'x00080022',
  ContentDate: 'x00080023',

  // Equipment
  Manufacturer: 'x00080070',
  InstitutionName: 'x00080080',
  StationName: 'x00081010',
  ManufacturerModelName: 'x00081090',

  // Image Pixel
  Rows: 'x00280010',
  Columns: 'x00280011',
  BitsAllocated: 'x00280100',
  BitsStored: 'x00280101',
  HighBit: 'x00280102',
  PixelRepresentation: 'x00280103',
  SamplesPerPixel: 'x00280002',
  PhotometricInterpretation: 'x00280004',
  PixelData: 'x7fe00010',

  // Window
  WindowCenter: 'x00281050',
  WindowWidth: 'x00281051',

  // Rescale
  RescaleIntercept: 'x00281052',
  RescaleSlope: 'x00281053',

  // Pixel Spacing
  PixelSpacing: 'x00280030',
  ImagerPixelSpacing: 'x00181164',

  // Position/Orientation
  ImagePositionPatient: 'x00200032',
  ImageOrientationPatient: 'x00200037',
  SliceThickness: 'x00180050',
  SliceLocation: 'x00201041',

  // Transfer Syntax
  TransferSyntaxUID: 'x00020010',

  // SOP
  SOPClassUID: 'x00080016',
  SOPInstanceUID: 'x00080018',
} as const;

// File size formatting
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

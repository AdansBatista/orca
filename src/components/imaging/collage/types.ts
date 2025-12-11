// Collage Template Types

export interface CollageSlot {
  id: string;
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  label?: string;
  category?: string; // Expected image category for this slot
  required?: boolean;
}

export interface CollageLayout {
  rows: number;
  cols: number;
}

export interface CollageTemplateData {
  name: string;
  description?: string;
  category: 'PROGRESS' | 'COMPARISON' | 'TREATMENT' | 'PRESENTATION';
  layout: CollageLayout;
  slots: CollageSlot[];
  aspectRatio: '16:9' | '4:3' | '1:1' | 'A4' | 'LETTER';
  background?: string;
  padding?: number;
  gap?: number;
}

export interface SlotAssignment {
  slotId: string;
  imageId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  label?: string;
}

export interface CollageCustomization {
  slotId: string;
  showLabel?: boolean;
  customLabel?: string;
  borderColor?: string;
  borderWidth?: number;
}

export interface CollageAnnotation {
  id: string;
  type: 'text' | 'arrow' | 'highlight';
  position: { x: number; y: number };
  content?: string;
  style?: Record<string, unknown>;
}

// Default system templates for orthodontic practices
export const DEFAULT_COLLAGE_TEMPLATES: CollageTemplateData[] = [
  // 2-Image Before/After
  {
    name: 'Before/After (Side by Side)',
    description: 'Simple two-image comparison for before and after shots',
    category: 'COMPARISON',
    layout: { rows: 1, cols: 2 },
    slots: [
      { id: 'before', row: 0, col: 0, rowSpan: 1, colSpan: 1, label: 'Before', required: true },
      { id: 'after', row: 0, col: 1, rowSpan: 1, colSpan: 1, label: 'After', required: true },
    ],
    aspectRatio: '16:9',
    background: '#ffffff',
    padding: 16,
    gap: 8,
  },

  // 3-Image Progress
  {
    name: 'Treatment Progress (3 Stages)',
    description: 'Show treatment progress at three key stages',
    category: 'PROGRESS',
    layout: { rows: 1, cols: 3 },
    slots: [
      { id: 'start', row: 0, col: 0, rowSpan: 1, colSpan: 1, label: 'Start', required: true },
      { id: 'mid', row: 0, col: 1, rowSpan: 1, colSpan: 1, label: 'Progress', required: false },
      { id: 'end', row: 0, col: 2, rowSpan: 1, colSpan: 1, label: 'Current', required: true },
    ],
    aspectRatio: '16:9',
    background: '#ffffff',
    padding: 16,
    gap: 8,
  },

  // Standard Orthodontic Extraoral Series
  {
    name: 'Extraoral Photo Series',
    description: 'Standard 5-photo extraoral series for orthodontic records',
    category: 'TREATMENT',
    layout: { rows: 2, cols: 3 },
    slots: [
      { id: 'frontal-rest', row: 0, col: 0, rowSpan: 1, colSpan: 1, label: 'Frontal (Rest)', category: 'EXTRAORAL_PHOTO' },
      { id: 'frontal-smile', row: 0, col: 1, rowSpan: 1, colSpan: 1, label: 'Frontal (Smile)', category: 'EXTRAORAL_PHOTO' },
      { id: 'profile-right', row: 0, col: 2, rowSpan: 1, colSpan: 1, label: 'Right Profile', category: 'EXTRAORAL_PHOTO' },
      { id: 'profile-left', row: 1, col: 0, rowSpan: 1, colSpan: 1, label: 'Left Profile', category: 'EXTRAORAL_PHOTO' },
      { id: 'three-quarter', row: 1, col: 1, rowSpan: 1, colSpan: 2, label: '3/4 View', category: 'EXTRAORAL_PHOTO' },
    ],
    aspectRatio: '4:3',
    background: '#1a1a1a',
    padding: 24,
    gap: 12,
  },

  // Standard Orthodontic Intraoral Series
  {
    name: 'Intraoral Photo Series',
    description: 'Standard 5-photo intraoral series for orthodontic records',
    category: 'TREATMENT',
    layout: { rows: 2, cols: 3 },
    slots: [
      { id: 'upper-occlusal', row: 0, col: 0, rowSpan: 1, colSpan: 1, label: 'Upper Occlusal', category: 'INTRAORAL_PHOTO' },
      { id: 'frontal-occlusion', row: 0, col: 1, rowSpan: 1, colSpan: 1, label: 'Frontal', category: 'INTRAORAL_PHOTO' },
      { id: 'lower-occlusal', row: 0, col: 2, rowSpan: 1, colSpan: 1, label: 'Lower Occlusal', category: 'INTRAORAL_PHOTO' },
      { id: 'left-buccal', row: 1, col: 0, rowSpan: 1, colSpan: 1, label: 'Left Buccal', category: 'INTRAORAL_PHOTO' },
      { id: 'overjet', row: 1, col: 1, rowSpan: 1, colSpan: 1, label: 'Overjet', category: 'INTRAORAL_PHOTO' },
      { id: 'right-buccal', row: 1, col: 2, rowSpan: 1, colSpan: 1, label: 'Right Buccal', category: 'INTRAORAL_PHOTO' },
    ],
    aspectRatio: '4:3',
    background: '#1a1a1a',
    padding: 24,
    gap: 12,
  },

  // X-Ray Comparison
  {
    name: 'X-Ray Comparison',
    description: 'Compare panoramic and cephalometric X-rays',
    category: 'COMPARISON',
    layout: { rows: 1, cols: 2 },
    slots: [
      { id: 'pano', row: 0, col: 0, rowSpan: 1, colSpan: 1, label: 'Panoramic', category: 'PANORAMIC_XRAY' },
      { id: 'ceph', row: 0, col: 1, rowSpan: 1, colSpan: 1, label: 'Cephalometric', category: 'CEPHALOMETRIC_XRAY' },
    ],
    aspectRatio: '16:9',
    background: '#000000',
    padding: 16,
    gap: 8,
  },

  // Full Treatment Summary (4x3 grid)
  {
    name: 'Treatment Summary',
    description: 'Comprehensive 12-image treatment documentation',
    category: 'PRESENTATION',
    layout: { rows: 3, cols: 4 },
    slots: [
      // Row 1: Before photos
      { id: 'before-frontal', row: 0, col: 0, rowSpan: 1, colSpan: 1, label: 'Before - Frontal' },
      { id: 'before-profile', row: 0, col: 1, rowSpan: 1, colSpan: 1, label: 'Before - Profile' },
      { id: 'before-upper', row: 0, col: 2, rowSpan: 1, colSpan: 1, label: 'Before - Upper' },
      { id: 'before-lower', row: 0, col: 3, rowSpan: 1, colSpan: 1, label: 'Before - Lower' },
      // Row 2: Progress photos
      { id: 'progress-frontal', row: 1, col: 0, rowSpan: 1, colSpan: 1, label: 'Progress - Frontal' },
      { id: 'progress-profile', row: 1, col: 1, rowSpan: 1, colSpan: 1, label: 'Progress - Profile' },
      { id: 'progress-upper', row: 1, col: 2, rowSpan: 1, colSpan: 1, label: 'Progress - Upper' },
      { id: 'progress-lower', row: 1, col: 3, rowSpan: 1, colSpan: 1, label: 'Progress - Lower' },
      // Row 3: After photos
      { id: 'after-frontal', row: 2, col: 0, rowSpan: 1, colSpan: 1, label: 'After - Frontal' },
      { id: 'after-profile', row: 2, col: 1, rowSpan: 1, colSpan: 1, label: 'After - Profile' },
      { id: 'after-upper', row: 2, col: 2, rowSpan: 1, colSpan: 1, label: 'After - Upper' },
      { id: 'after-lower', row: 2, col: 3, rowSpan: 1, colSpan: 1, label: 'After - Lower' },
    ],
    aspectRatio: '4:3',
    background: '#ffffff',
    padding: 24,
    gap: 8,
  },

  // Patient Presentation (Large before/after with details)
  {
    name: 'Patient Presentation',
    description: 'Large comparison layout ideal for patient consultations',
    category: 'PRESENTATION',
    layout: { rows: 2, cols: 4 },
    slots: [
      { id: 'before-main', row: 0, col: 0, rowSpan: 2, colSpan: 2, label: 'Before', required: true },
      { id: 'after-main', row: 0, col: 2, rowSpan: 2, colSpan: 2, label: 'After', required: true },
    ],
    aspectRatio: '16:9',
    background: '#f8f8f8',
    padding: 32,
    gap: 16,
  },

  // Monthly Progress Grid
  {
    name: 'Monthly Progress (6 Months)',
    description: 'Track monthly progress over 6 months',
    category: 'PROGRESS',
    layout: { rows: 2, cols: 3 },
    slots: [
      { id: 'month-1', row: 0, col: 0, rowSpan: 1, colSpan: 1, label: 'Month 1' },
      { id: 'month-2', row: 0, col: 1, rowSpan: 1, colSpan: 1, label: 'Month 2' },
      { id: 'month-3', row: 0, col: 2, rowSpan: 1, colSpan: 1, label: 'Month 3' },
      { id: 'month-4', row: 1, col: 0, rowSpan: 1, colSpan: 1, label: 'Month 4' },
      { id: 'month-5', row: 1, col: 1, rowSpan: 1, colSpan: 1, label: 'Month 5' },
      { id: 'month-6', row: 1, col: 2, rowSpan: 1, colSpan: 1, label: 'Month 6' },
    ],
    aspectRatio: '16:9',
    background: '#ffffff',
    padding: 16,
    gap: 8,
  },
];

// Aspect ratio dimensions for exports
export const ASPECT_RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '4:3': { width: 1600, height: 1200 },
  '1:1': { width: 1200, height: 1200 },
  'A4': { width: 2480, height: 3508 }, // 210x297mm at 300dpi
  'LETTER': { width: 2550, height: 3300 }, // 8.5x11" at 300dpi
};

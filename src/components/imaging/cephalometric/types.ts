/**
 * Cephalometric Analysis Types and Landmark Definitions
 *
 * Standard orthodontic cephalometric analysis for lateral skull X-rays.
 * Includes landmark definitions, measurements, and analysis presets.
 */

// =============================================================================
// LANDMARK DEFINITIONS
// =============================================================================

/**
 * Standard cephalometric landmarks used in orthodontic analysis
 */
export interface CephLandmark {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  category: LandmarkCategory;
  /** Whether this landmark is required for basic analysis */
  isRequired: boolean;
}

export type LandmarkCategory =
  | 'CRANIAL_BASE'
  | 'MAXILLA'
  | 'MANDIBLE'
  | 'DENTAL'
  | 'SOFT_TISSUE';

/**
 * A placed landmark point on an image
 */
export interface PlacedLandmark {
  landmarkId: string;
  x: number;
  y: number;
  confidence?: number; // For AI-assisted placement
  isAutoPlaced?: boolean;
}

// Standard cephalometric landmarks (30+ points)
export const CEPH_LANDMARKS: CephLandmark[] = [
  // Cranial Base Landmarks
  {
    id: 'S',
    name: 'Sella',
    abbreviation: 'S',
    description: 'Center of sella turcica (pituitary fossa)',
    category: 'CRANIAL_BASE',
    isRequired: true,
  },
  {
    id: 'N',
    name: 'Nasion',
    abbreviation: 'N',
    description: 'Most anterior point of frontonasal suture',
    category: 'CRANIAL_BASE',
    isRequired: true,
  },
  {
    id: 'Ba',
    name: 'Basion',
    abbreviation: 'Ba',
    description: 'Most inferior point on anterior margin of foramen magnum',
    category: 'CRANIAL_BASE',
    isRequired: false,
  },
  {
    id: 'Po',
    name: 'Porion',
    abbreviation: 'Po',
    description: 'Superior point of external auditory meatus',
    category: 'CRANIAL_BASE',
    isRequired: true,
  },
  {
    id: 'Or',
    name: 'Orbitale',
    abbreviation: 'Or',
    description: 'Most inferior point of infraorbital margin',
    category: 'CRANIAL_BASE',
    isRequired: true,
  },

  // Maxilla Landmarks
  {
    id: 'A',
    name: 'Point A (Subspinale)',
    abbreviation: 'A',
    description: 'Deepest point on concavity of anterior maxilla',
    category: 'MAXILLA',
    isRequired: true,
  },
  {
    id: 'ANS',
    name: 'Anterior Nasal Spine',
    abbreviation: 'ANS',
    description: 'Tip of anterior nasal spine',
    category: 'MAXILLA',
    isRequired: true,
  },
  {
    id: 'PNS',
    name: 'Posterior Nasal Spine',
    abbreviation: 'PNS',
    description: 'Most posterior point of hard palate',
    category: 'MAXILLA',
    isRequired: true,
  },
  {
    id: 'Pr',
    name: 'Prosthion',
    abbreviation: 'Pr',
    description: 'Most inferior point on alveolar bone between upper central incisors',
    category: 'MAXILLA',
    isRequired: false,
  },

  // Mandible Landmarks
  {
    id: 'B',
    name: 'Point B (Supramentale)',
    abbreviation: 'B',
    description: 'Deepest point on concavity of anterior mandible',
    category: 'MANDIBLE',
    isRequired: true,
  },
  {
    id: 'Pog',
    name: 'Pogonion',
    abbreviation: 'Pog',
    description: 'Most anterior point on chin',
    category: 'MANDIBLE',
    isRequired: true,
  },
  {
    id: 'Gn',
    name: 'Gnathion',
    abbreviation: 'Gn',
    description: 'Most anteroinferior point on chin',
    category: 'MANDIBLE',
    isRequired: true,
  },
  {
    id: 'Me',
    name: 'Menton',
    abbreviation: 'Me',
    description: 'Most inferior point on symphysis',
    category: 'MANDIBLE',
    isRequired: true,
  },
  {
    id: 'Go',
    name: 'Gonion',
    abbreviation: 'Go',
    description: 'Most posteroinferior point on angle of mandible',
    category: 'MANDIBLE',
    isRequired: true,
  },
  {
    id: 'Co',
    name: 'Condylion',
    abbreviation: 'Co',
    description: 'Most superior point of mandibular condyle',
    category: 'MANDIBLE',
    isRequired: true,
  },
  {
    id: 'Ar',
    name: 'Articulare',
    abbreviation: 'Ar',
    description: 'Intersection of basisphenoid and posterior border of condyle',
    category: 'MANDIBLE',
    isRequired: true,
  },
  {
    id: 'Id',
    name: 'Infradentale',
    abbreviation: 'Id',
    description: 'Most superior point on alveolar bone between lower central incisors',
    category: 'MANDIBLE',
    isRequired: false,
  },
  {
    id: 'D',
    name: 'Point D',
    abbreviation: 'D',
    description: 'Center of symphysis at midline',
    category: 'MANDIBLE',
    isRequired: false,
  },

  // Dental Landmarks
  {
    id: 'U1E',
    name: 'Upper Incisor Edge',
    abbreviation: 'U1E',
    description: 'Incisal edge of most prominent upper central incisor',
    category: 'DENTAL',
    isRequired: true,
  },
  {
    id: 'U1A',
    name: 'Upper Incisor Apex',
    abbreviation: 'U1A',
    description: 'Root apex of upper central incisor',
    category: 'DENTAL',
    isRequired: true,
  },
  {
    id: 'L1E',
    name: 'Lower Incisor Edge',
    abbreviation: 'L1E',
    description: 'Incisal edge of most prominent lower central incisor',
    category: 'DENTAL',
    isRequired: true,
  },
  {
    id: 'L1A',
    name: 'Lower Incisor Apex',
    abbreviation: 'L1A',
    description: 'Root apex of lower central incisor',
    category: 'DENTAL',
    isRequired: true,
  },
  {
    id: 'U6',
    name: 'Upper First Molar',
    abbreviation: 'U6',
    description: 'Mesial cusp tip of upper first molar',
    category: 'DENTAL',
    isRequired: false,
  },
  {
    id: 'L6',
    name: 'Lower First Molar',
    abbreviation: 'L6',
    description: 'Mesial cusp tip of lower first molar',
    category: 'DENTAL',
    isRequired: false,
  },

  // Soft Tissue Landmarks
  {
    id: 'G',
    name: 'Glabella',
    abbreviation: 'G',
    description: 'Most prominent point on forehead',
    category: 'SOFT_TISSUE',
    isRequired: false,
  },
  {
    id: 'Ns',
    name: 'Soft Tissue Nasion',
    abbreviation: 'Ns',
    description: 'Deepest point on soft tissue bridge of nose',
    category: 'SOFT_TISSUE',
    isRequired: false,
  },
  {
    id: 'Prn',
    name: 'Pronasale',
    abbreviation: 'Prn',
    description: 'Most prominent point of nose tip',
    category: 'SOFT_TISSUE',
    isRequired: true,
  },
  {
    id: 'Sn',
    name: 'Subnasale',
    abbreviation: 'Sn',
    description: 'Junction of columella and upper lip',
    category: 'SOFT_TISSUE',
    isRequired: true,
  },
  {
    id: 'Ls',
    name: 'Labrale Superius',
    abbreviation: 'Ls',
    description: 'Most anterior point of upper lip',
    category: 'SOFT_TISSUE',
    isRequired: true,
  },
  {
    id: 'Li',
    name: 'Labrale Inferius',
    abbreviation: 'Li',
    description: 'Most anterior point of lower lip',
    category: 'SOFT_TISSUE',
    isRequired: true,
  },
  {
    id: 'Pgs',
    name: 'Soft Tissue Pogonion',
    abbreviation: 'Pgs',
    description: 'Most anterior point on soft tissue chin',
    category: 'SOFT_TISSUE',
    isRequired: true,
  },
  {
    id: 'Mes',
    name: 'Soft Tissue Menton',
    abbreviation: 'Mes',
    description: 'Most inferior point on soft tissue chin',
    category: 'SOFT_TISSUE',
    isRequired: false,
  },
];

// =============================================================================
// MEASUREMENT DEFINITIONS
// =============================================================================

export type MeasurementValueType = 'ANGLE' | 'LINEAR' | 'RATIO';

/**
 * Cephalometric measurement definition
 */
export interface CephMeasurement {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  type: MeasurementValueType;
  unit: string;
  /** Landmark IDs required for this measurement */
  landmarks: string[];
  /** Calculation function name */
  calculation: MeasurementCalculation;
  /** Normal values for different age groups/gender */
  normative: NormativeData;
  category: MeasurementCategory;
}

export type MeasurementCategory =
  | 'SKELETAL_SAGITTAL'
  | 'SKELETAL_VERTICAL'
  | 'DENTAL'
  | 'SOFT_TISSUE'
  | 'AIRWAY';

export type MeasurementCalculation =
  | 'ANGLE_3POINT'    // Angle formed by 3 points
  | 'ANGLE_2LINE'     // Angle between 2 lines (4 points)
  | 'LINE_TO_POINT'   // Perpendicular distance from line to point
  | 'LINEAR'          // Distance between 2 points
  | 'RATIO';          // Ratio of 2 measurements

/**
 * Normative data for measurement interpretation
 */
export interface NormativeData {
  mean: number;
  stdDev: number;
  min?: number;
  max?: number;
  /** Interpretation ranges */
  ranges?: {
    label: string;
    min: number;
    max: number;
    interpretation: string;
  }[];
}

// Standard cephalometric measurements
export const CEPH_MEASUREMENTS: CephMeasurement[] = [
  // ============ SKELETAL SAGITTAL ============
  {
    id: 'SNA',
    name: 'SNA Angle',
    abbreviation: 'SNA',
    description: 'Anteroposterior position of maxilla relative to cranial base',
    type: 'ANGLE',
    unit: '°',
    landmarks: ['S', 'N', 'A'],
    calculation: 'ANGLE_3POINT',
    category: 'SKELETAL_SAGITTAL',
    normative: {
      mean: 82,
      stdDev: 2,
      ranges: [
        { label: 'Maxillary Retrusion', min: -Infinity, max: 79, interpretation: 'Maxilla is positioned posteriorly' },
        { label: 'Normal', min: 79, max: 85, interpretation: 'Normal maxillary position' },
        { label: 'Maxillary Protrusion', min: 85, max: Infinity, interpretation: 'Maxilla is positioned anteriorly' },
      ],
    },
  },
  {
    id: 'SNB',
    name: 'SNB Angle',
    abbreviation: 'SNB',
    description: 'Anteroposterior position of mandible relative to cranial base',
    type: 'ANGLE',
    unit: '°',
    landmarks: ['S', 'N', 'B'],
    calculation: 'ANGLE_3POINT',
    category: 'SKELETAL_SAGITTAL',
    normative: {
      mean: 80,
      stdDev: 2,
      ranges: [
        { label: 'Mandibular Retrusion', min: -Infinity, max: 77, interpretation: 'Mandible is positioned posteriorly (Class II tendency)' },
        { label: 'Normal', min: 77, max: 83, interpretation: 'Normal mandibular position' },
        { label: 'Mandibular Protrusion', min: 83, max: Infinity, interpretation: 'Mandible is positioned anteriorly (Class III tendency)' },
      ],
    },
  },
  {
    id: 'ANB',
    name: 'ANB Angle',
    abbreviation: 'ANB',
    description: 'Skeletal relationship between maxilla and mandible',
    type: 'ANGLE',
    unit: '°',
    landmarks: ['A', 'N', 'B'],
    calculation: 'ANGLE_3POINT',
    category: 'SKELETAL_SAGITTAL',
    normative: {
      mean: 2,
      stdDev: 2,
      ranges: [
        { label: 'Class III', min: -Infinity, max: 0, interpretation: 'Skeletal Class III relationship' },
        { label: 'Normal (Class I)', min: 0, max: 4, interpretation: 'Normal skeletal relationship' },
        { label: 'Class II', min: 4, max: Infinity, interpretation: 'Skeletal Class II relationship' },
      ],
    },
  },
  {
    id: 'WITS',
    name: 'Wits Appraisal',
    abbreviation: 'Wits',
    description: 'Linear measurement of jaw relationship on occlusal plane',
    type: 'LINEAR',
    unit: 'mm',
    landmarks: ['A', 'B', 'U6', 'L6'], // Projects A and B onto occlusal plane
    calculation: 'LINE_TO_POINT',
    category: 'SKELETAL_SAGITTAL',
    normative: {
      mean: 0,
      stdDev: 2,
      ranges: [
        { label: 'Class III', min: -Infinity, max: -2, interpretation: 'Skeletal Class III' },
        { label: 'Normal', min: -2, max: 2, interpretation: 'Normal jaw relationship' },
        { label: 'Class II', min: 2, max: Infinity, interpretation: 'Skeletal Class II' },
      ],
    },
  },

  // ============ SKELETAL VERTICAL ============
  {
    id: 'FMA',
    name: 'Frankfort Mandibular Plane Angle',
    abbreviation: 'FMA',
    description: 'Vertical growth pattern indicator',
    type: 'ANGLE',
    unit: '°',
    landmarks: ['Po', 'Or', 'Me', 'Go'],
    calculation: 'ANGLE_2LINE',
    category: 'SKELETAL_VERTICAL',
    normative: {
      mean: 25,
      stdDev: 4,
      ranges: [
        { label: 'Horizontal Growth', min: -Infinity, max: 20, interpretation: 'Strong horizontal growth pattern' },
        { label: 'Normal', min: 20, max: 30, interpretation: 'Normal vertical proportion' },
        { label: 'Vertical Growth', min: 30, max: Infinity, interpretation: 'Vertical growth pattern (open bite tendency)' },
      ],
    },
  },
  {
    id: 'SN_MP',
    name: 'SN-Mandibular Plane Angle',
    abbreviation: 'SN-MP',
    description: 'Mandibular plane angle to SN plane',
    type: 'ANGLE',
    unit: '°',
    landmarks: ['S', 'N', 'Me', 'Go'],
    calculation: 'ANGLE_2LINE',
    category: 'SKELETAL_VERTICAL',
    normative: {
      mean: 32,
      stdDev: 4,
      ranges: [
        { label: 'Low Angle', min: -Infinity, max: 27, interpretation: 'Low mandibular plane angle' },
        { label: 'Normal', min: 27, max: 37, interpretation: 'Normal mandibular plane angle' },
        { label: 'High Angle', min: 37, max: Infinity, interpretation: 'High mandibular plane angle' },
      ],
    },
  },
  {
    id: 'Y_AXIS',
    name: 'Y-Axis (Growth Axis)',
    abbreviation: 'Y-Axis',
    description: 'Direction of facial growth',
    type: 'ANGLE',
    unit: '°',
    landmarks: ['S', 'Gn', 'Po', 'Or'],
    calculation: 'ANGLE_2LINE',
    category: 'SKELETAL_VERTICAL',
    normative: {
      mean: 59,
      stdDev: 3,
      ranges: [
        { label: 'Horizontal', min: -Infinity, max: 55, interpretation: 'Horizontal growth tendency' },
        { label: 'Normal', min: 55, max: 63, interpretation: 'Average growth direction' },
        { label: 'Vertical', min: 63, max: Infinity, interpretation: 'Vertical growth tendency' },
      ],
    },
  },
  {
    id: 'GONIAL',
    name: 'Gonial Angle',
    abbreviation: 'Gonial',
    description: 'Angle at gonion between ramus and body of mandible',
    type: 'ANGLE',
    unit: '°',
    landmarks: ['Ar', 'Go', 'Me'],
    calculation: 'ANGLE_3POINT',
    category: 'SKELETAL_VERTICAL',
    normative: {
      mean: 130,
      stdDev: 5,
      ranges: [
        { label: 'Closed', min: -Infinity, max: 123, interpretation: 'Closed gonial angle (horizontal growth)' },
        { label: 'Normal', min: 123, max: 137, interpretation: 'Normal gonial angle' },
        { label: 'Open', min: 137, max: Infinity, interpretation: 'Open gonial angle (vertical growth)' },
      ],
    },
  },

  // ============ DENTAL ============
  {
    id: 'U1_SN',
    name: 'Upper Incisor to SN',
    abbreviation: 'U1-SN',
    description: 'Inclination of upper incisor to SN plane',
    type: 'ANGLE',
    unit: '°',
    landmarks: ['U1E', 'U1A', 'S', 'N'],
    calculation: 'ANGLE_2LINE',
    category: 'DENTAL',
    normative: {
      mean: 104,
      stdDev: 5,
      ranges: [
        { label: 'Retroclined', min: -Infinity, max: 97, interpretation: 'Upper incisors retroclined' },
        { label: 'Normal', min: 97, max: 111, interpretation: 'Normal upper incisor inclination' },
        { label: 'Proclined', min: 111, max: Infinity, interpretation: 'Upper incisors proclined' },
      ],
    },
  },
  {
    id: 'IMPA',
    name: 'Lower Incisor to Mandibular Plane',
    abbreviation: 'IMPA',
    description: 'Inclination of lower incisor to mandibular plane',
    type: 'ANGLE',
    unit: '°',
    landmarks: ['L1E', 'L1A', 'Me', 'Go'],
    calculation: 'ANGLE_2LINE',
    category: 'DENTAL',
    normative: {
      mean: 90,
      stdDev: 5,
      ranges: [
        { label: 'Retroclined', min: -Infinity, max: 83, interpretation: 'Lower incisors retroclined' },
        { label: 'Normal', min: 83, max: 97, interpretation: 'Normal lower incisor inclination' },
        { label: 'Proclined', min: 97, max: Infinity, interpretation: 'Lower incisors proclined' },
      ],
    },
  },
  {
    id: 'INTERINCISAL',
    name: 'Interincisal Angle',
    abbreviation: 'U1-L1',
    description: 'Angle between upper and lower incisor axes',
    type: 'ANGLE',
    unit: '°',
    landmarks: ['U1E', 'U1A', 'L1E', 'L1A'],
    calculation: 'ANGLE_2LINE',
    category: 'DENTAL',
    normative: {
      mean: 131,
      stdDev: 6,
      ranges: [
        { label: 'Decreased', min: -Infinity, max: 123, interpretation: 'Decreased interincisal angle (flared incisors)' },
        { label: 'Normal', min: 123, max: 139, interpretation: 'Normal interincisal relationship' },
        { label: 'Increased', min: 139, max: Infinity, interpretation: 'Increased interincisal angle (retruded incisors)' },
      ],
    },
  },
  {
    id: 'OVERJET',
    name: 'Overjet',
    abbreviation: 'OJ',
    description: 'Horizontal distance between upper and lower incisors',
    type: 'LINEAR',
    unit: 'mm',
    landmarks: ['U1E', 'L1E'],
    calculation: 'LINEAR',
    category: 'DENTAL',
    normative: {
      mean: 2.5,
      stdDev: 1,
      ranges: [
        { label: 'Negative', min: -Infinity, max: 0, interpretation: 'Negative overjet (anterior crossbite)' },
        { label: 'Normal', min: 0, max: 4, interpretation: 'Normal overjet' },
        { label: 'Excessive', min: 4, max: Infinity, interpretation: 'Excessive overjet' },
      ],
    },
  },
  {
    id: 'OVERBITE',
    name: 'Overbite',
    abbreviation: 'OB',
    description: 'Vertical overlap of incisors',
    type: 'LINEAR',
    unit: 'mm',
    landmarks: ['U1E', 'L1E'],
    calculation: 'LINEAR',
    category: 'DENTAL',
    normative: {
      mean: 2.5,
      stdDev: 1,
      ranges: [
        { label: 'Open Bite', min: -Infinity, max: 0, interpretation: 'Anterior open bite' },
        { label: 'Normal', min: 0, max: 4, interpretation: 'Normal overbite' },
        { label: 'Deep Bite', min: 4, max: Infinity, interpretation: 'Deep bite' },
      ],
    },
  },

  // ============ SOFT TISSUE ============
  {
    id: 'NASOLABIAL',
    name: 'Nasolabial Angle',
    abbreviation: 'NLA',
    description: 'Angle between columella and upper lip',
    type: 'ANGLE',
    unit: '°',
    landmarks: ['Prn', 'Sn', 'Ls'],
    calculation: 'ANGLE_3POINT',
    category: 'SOFT_TISSUE',
    normative: {
      mean: 102,
      stdDev: 8,
      ranges: [
        { label: 'Acute', min: -Infinity, max: 90, interpretation: 'Acute nasolabial angle (protruded incisors)' },
        { label: 'Normal', min: 90, max: 115, interpretation: 'Normal nasolabial angle' },
        { label: 'Obtuse', min: 115, max: Infinity, interpretation: 'Obtuse nasolabial angle (retruded incisors)' },
      ],
    },
  },
  {
    id: 'E_LINE_UPPER',
    name: 'Upper Lip to E-Line',
    abbreviation: 'UL-E',
    description: 'Distance from upper lip to Ricketts E-line',
    type: 'LINEAR',
    unit: 'mm',
    landmarks: ['Ls', 'Prn', 'Pgs'],
    calculation: 'LINE_TO_POINT',
    category: 'SOFT_TISSUE',
    normative: {
      mean: -4,
      stdDev: 2,
      ranges: [
        { label: 'Behind', min: -Infinity, max: -6, interpretation: 'Upper lip behind E-line (retrusive lip)' },
        { label: 'Normal', min: -6, max: -2, interpretation: 'Normal upper lip position' },
        { label: 'Ahead', min: -2, max: Infinity, interpretation: 'Upper lip ahead of E-line (protrusive lip)' },
      ],
    },
  },
  {
    id: 'E_LINE_LOWER',
    name: 'Lower Lip to E-Line',
    abbreviation: 'LL-E',
    description: 'Distance from lower lip to Ricketts E-line',
    type: 'LINEAR',
    unit: 'mm',
    landmarks: ['Li', 'Prn', 'Pgs'],
    calculation: 'LINE_TO_POINT',
    category: 'SOFT_TISSUE',
    normative: {
      mean: -2,
      stdDev: 2,
      ranges: [
        { label: 'Behind', min: -Infinity, max: -4, interpretation: 'Lower lip behind E-line' },
        { label: 'Normal', min: -4, max: 0, interpretation: 'Normal lower lip position' },
        { label: 'Ahead', min: 0, max: Infinity, interpretation: 'Lower lip ahead of E-line' },
      ],
    },
  },
  {
    id: 'FACIAL_CONVEXITY',
    name: 'Facial Convexity',
    abbreviation: 'Convexity',
    description: 'Soft tissue profile convexity',
    type: 'ANGLE',
    unit: '°',
    landmarks: ['G', 'Sn', 'Pgs'],
    calculation: 'ANGLE_3POINT',
    category: 'SOFT_TISSUE',
    normative: {
      mean: 12,
      stdDev: 4,
      ranges: [
        { label: 'Concave', min: -Infinity, max: 5, interpretation: 'Concave profile (Class III appearance)' },
        { label: 'Straight', min: 5, max: 10, interpretation: 'Relatively straight profile' },
        { label: 'Normal', min: 10, max: 18, interpretation: 'Normal convexity' },
        { label: 'Convex', min: 18, max: Infinity, interpretation: 'Convex profile (Class II appearance)' },
      ],
    },
  },
];

// =============================================================================
// ANALYSIS PRESETS
// =============================================================================

export interface CephAnalysisPreset {
  id: string;
  name: string;
  description: string;
  measurements: string[];
  landmarks: string[];
}

export const ANALYSIS_PRESETS: CephAnalysisPreset[] = [
  {
    id: 'STEINER',
    name: 'Steiner Analysis',
    description: 'Classic Steiner cephalometric analysis',
    measurements: ['SNA', 'SNB', 'ANB', 'U1_SN', 'IMPA', 'INTERINCISAL', 'OVERJET', 'OVERBITE'],
    landmarks: ['S', 'N', 'A', 'B', 'U1E', 'U1A', 'L1E', 'L1A', 'Me', 'Go'],
  },
  {
    id: 'DOWNS',
    name: "Downs' Analysis",
    description: "Downs' analysis with Frankfort plane reference",
    measurements: ['FMA', 'Y_AXIS', 'FACIAL_CONVEXITY', 'ANB', 'INTERINCISAL'],
    landmarks: ['S', 'N', 'A', 'B', 'Po', 'Or', 'Me', 'Go', 'Gn', 'U1E', 'U1A', 'L1E', 'L1A'],
  },
  {
    id: 'TWEED',
    name: 'Tweed Analysis',
    description: 'Tweed triangle analysis focusing on IMPA',
    measurements: ['FMA', 'IMPA', 'INTERINCISAL'],
    landmarks: ['Po', 'Or', 'Me', 'Go', 'L1E', 'L1A', 'U1E', 'U1A'],
  },
  {
    id: 'RICKETTS',
    name: 'Ricketts Analysis',
    description: 'Comprehensive Ricketts analysis with soft tissue',
    measurements: ['SNA', 'SNB', 'ANB', 'FMA', 'E_LINE_UPPER', 'E_LINE_LOWER', 'NASOLABIAL'],
    landmarks: ['S', 'N', 'A', 'B', 'Po', 'Or', 'Me', 'Go', 'Prn', 'Sn', 'Ls', 'Li', 'Pgs'],
  },
  {
    id: 'QUICK',
    name: 'Quick Analysis',
    description: 'Basic skeletal and dental assessment',
    measurements: ['SNA', 'SNB', 'ANB', 'FMA'],
    landmarks: ['S', 'N', 'A', 'B', 'Po', 'Or', 'Me', 'Go'],
  },
];

// =============================================================================
// ANALYSIS STATE TYPES
// =============================================================================

/**
 * Complete cephalometric analysis state
 */
export interface CephAnalysisState {
  id?: string;
  imageId: string;
  patientId: string;
  clinicId: string;

  /** Analysis preset used */
  presetId: string;

  /** Placed landmarks */
  landmarks: PlacedLandmark[];

  /** Calculated measurements */
  measurements: CalculatedMeasurement[];

  /** Calibration (pixels per mm) */
  calibration?: number;

  /** Analysis notes */
  notes?: string;

  /** Metadata */
  createdAt?: Date;
  updatedAt?: Date;
  createdById?: string;
}

/**
 * A calculated measurement value with interpretation
 */
export interface CalculatedMeasurement {
  measurementId: string;
  value: number;
  deviation: number; // Standard deviations from mean
  interpretation: string;
  category: MeasurementCategory;
}

// =============================================================================
// TOOL STATE
// =============================================================================

export type CephTool =
  | 'SELECT'      // Select/move landmarks
  | 'PLACE'       // Place new landmarks
  | 'CALIBRATE'   // Set calibration
  | 'PAN'         // Pan the image
  | 'ZOOM';       // Zoom control

export interface CephToolState {
  activeTool: CephTool;
  selectedLandmarkId: string | null;
  placingLandmarkId: string | null;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  showLabels: boolean;
  showLines: boolean;
  showMeasurements: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get landmarks by category
 */
export function getLandmarksByCategory(category: LandmarkCategory): CephLandmark[] {
  return CEPH_LANDMARKS.filter(l => l.category === category);
}

/**
 * Get required landmarks for an analysis preset
 */
export function getRequiredLandmarks(presetId: string): CephLandmark[] {
  const preset = ANALYSIS_PRESETS.find(p => p.id === presetId);
  if (!preset) return CEPH_LANDMARKS.filter(l => l.isRequired);
  return CEPH_LANDMARKS.filter(l => preset.landmarks.includes(l.id));
}

/**
 * Get measurement interpretation based on value
 */
export function getMeasurementInterpretation(
  measurement: CephMeasurement,
  value: number
): { label: string; interpretation: string; deviation: number } {
  const deviation = (value - measurement.normative.mean) / measurement.normative.stdDev;

  const range = measurement.normative.ranges?.find(
    r => value >= r.min && value < r.max
  );

  return {
    label: range?.label || 'Unknown',
    interpretation: range?.interpretation || 'Value outside expected ranges',
    deviation,
  };
}

/**
 * Check if all required landmarks for a measurement are placed
 */
export function canCalculateMeasurement(
  measurement: CephMeasurement,
  placedLandmarks: PlacedLandmark[]
): boolean {
  const placedIds = new Set(placedLandmarks.map(l => l.landmarkId));
  return measurement.landmarks.every(id => placedIds.has(id));
}

/**
 * Get completion percentage for an analysis
 */
export function getAnalysisCompletion(
  presetId: string,
  placedLandmarks: PlacedLandmark[]
): number {
  const requiredLandmarks = getRequiredLandmarks(presetId);
  const placedIds = new Set(placedLandmarks.map(l => l.landmarkId));
  const placed = requiredLandmarks.filter(l => placedIds.has(l.id)).length;
  return Math.round((placed / requiredLandmarks.length) * 100);
}

/**
 * Color for landmark category
 */
export const LANDMARK_COLORS: Record<LandmarkCategory, string> = {
  CRANIAL_BASE: '#3b82f6',    // Blue
  MAXILLA: '#ef4444',         // Red
  MANDIBLE: '#22c55e',        // Green
  DENTAL: '#f59e0b',          // Amber
  SOFT_TISSUE: '#a855f7',     // Purple
};

/**
 * Get landmark by ID
 */
export function getLandmarkById(id: string): CephLandmark | undefined {
  return CEPH_LANDMARKS.find(l => l.id === id);
}

/**
 * Get measurement by ID
 */
export function getMeasurementById(id: string): CephMeasurement | undefined {
  return CEPH_MEASUREMENTS.find(m => m.id === id);
}

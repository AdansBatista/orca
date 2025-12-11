/**
 * AI Service Types
 *
 * Type definitions for AI-powered imaging analysis features.
 */

// =============================================================================
// Common Types
// =============================================================================

/**
 * AI analysis status
 */
export type AIAnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Confidence level for AI predictions
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very_high';

/**
 * Get confidence level from numeric value
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.9) return 'very_high';
  if (confidence >= 0.75) return 'medium';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

// =============================================================================
// Image Quality Assessment
// =============================================================================

/**
 * Image quality issue types
 */
export type QualityIssueType =
  | 'blur'
  | 'underexposed'
  | 'overexposed'
  | 'low_contrast'
  | 'noise'
  | 'artifacts'
  | 'motion_blur'
  | 'cropping'
  | 'positioning'
  | 'orientation'
  | 'missing_anatomy'
  | 'foreign_objects';

/**
 * Image quality assessment result
 */
export interface ImageQualityResult {
  /** Overall quality score 0-100 */
  overallScore: number;
  /** Diagnostic quality: is the image suitable for diagnosis? */
  diagnosticQuality: boolean;
  /** Individual quality metrics */
  metrics: {
    sharpness: number;
    exposure: number;
    contrast: number;
    positioning: number;
    coverage: number;
  };
  /** Detected issues */
  issues: Array<{
    type: QualityIssueType;
    severity: 'minor' | 'moderate' | 'severe';
    description: string;
    suggestion?: string;
  }>;
  /** Recommendations for improvement */
  recommendations: string[];
  /** Confidence in the assessment */
  confidence: number;
}

// =============================================================================
// Image Categorization
// =============================================================================

/**
 * Dental image categories
 */
export type DentalImageCategory =
  // Clinical Photos
  | 'INTRAORAL_FRONTAL'
  | 'INTRAORAL_LEFT'
  | 'INTRAORAL_RIGHT'
  | 'INTRAORAL_UPPER_OCCLUSAL'
  | 'INTRAORAL_LOWER_OCCLUSAL'
  | 'EXTRAORAL_FRONTAL'
  | 'EXTRAORAL_PROFILE'
  | 'EXTRAORAL_SMILE'
  | 'EXTRAORAL_45_DEGREE'
  // X-rays
  | 'PANORAMIC_XRAY'
  | 'CEPHALOMETRIC_XRAY'
  | 'PERIAPICAL_XRAY'
  | 'BITEWING_XRAY'
  | 'CBCT'
  // 3D Scans
  | 'INTRAORAL_SCAN'
  | 'FACE_SCAN'
  // Other
  | 'TREATMENT_PROGRESS'
  | 'APPLIANCE'
  | 'DOCUMENT'
  | 'OTHER';

/**
 * Image categorization result
 */
export interface ImageCategorizationResult {
  /** Primary category */
  category: DentalImageCategory;
  /** Confidence for primary category */
  confidence: number;
  /** Alternative categories with lower confidence */
  alternatives: Array<{
    category: DentalImageCategory;
    confidence: number;
  }>;
  /** Detected image characteristics */
  characteristics: {
    isXray: boolean;
    isClinicalPhoto: boolean;
    is3DScan: boolean;
    isIntraoral: boolean;
    hasTeeth: boolean;
    hasBraces: boolean;
    hasRetainer: boolean;
  };
  /** Suggested subcategory */
  subcategory?: string;
}

// =============================================================================
// Cephalometric Landmark Detection
// =============================================================================

/**
 * Cephalometric landmark point
 */
export interface CephLandmarkPoint {
  /** Landmark identifier */
  id: string;
  /** Landmark name */
  name: string;
  /** X coordinate (0-1 normalized) */
  x: number;
  /** Y coordinate (0-1 normalized) */
  y: number;
  /** Detection confidence */
  confidence: number;
  /** Whether the point needs manual verification */
  needsVerification: boolean;
}

/**
 * Cephalometric landmark detection result
 */
export interface CephLandmarkResult {
  /** Detected landmarks */
  landmarks: CephLandmarkPoint[];
  /** Image calibration (if detected) */
  calibration?: {
    /** Detected ruler or reference */
    reference: string;
    /** Pixels per millimeter */
    pixelsPerMm: number;
    /** Calibration confidence */
    confidence: number;
  };
  /** Overall detection confidence */
  overallConfidence: number;
  /** Landmarks that need manual adjustment */
  landmarksNeedingReview: string[];
  /** Analysis recommendations */
  analysisReady: boolean;
  /** Missing required landmarks */
  missingLandmarks: string[];
}

// =============================================================================
// Progress Comparison
// =============================================================================

/**
 * Treatment progress comparison result
 */
export interface ProgressComparisonResult {
  /** Overall change assessment */
  overallChange: 'significant' | 'moderate' | 'minimal' | 'none';
  /** Detected changes */
  changes: Array<{
    area: string;
    description: string;
    type: 'improvement' | 'regression' | 'neutral';
    significance: number;
  }>;
  /** Summary narrative */
  summary: string;
  /** Suggested talking points for patient */
  talkingPoints: string[];
  /** Confidence in comparison */
  confidence: number;
}

// =============================================================================
// Report Generation
// =============================================================================

/**
 * AI-generated report section
 */
export interface AIReportSection {
  title: string;
  content: string;
  bulletPoints?: string[];
}

/**
 * AI-generated report result
 */
export interface AIReportResult {
  /** Report sections */
  sections: AIReportSection[];
  /** Key findings summary */
  keyFindings: string[];
  /** Treatment recommendations */
  recommendations?: string[];
  /** Confidence in analysis */
  confidence: number;
}

// =============================================================================
// AI Provider Interface
// =============================================================================

/**
 * AI provider configuration
 */
export interface AIProviderConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  enabled: boolean;
}

/**
 * Image input for AI analysis
 */
export interface AIImageInput {
  /** Image URL or base64 data */
  imageData: string;
  /** Whether data is base64 encoded */
  isBase64: boolean;
  /** Optional image metadata */
  metadata?: {
    category?: string;
    captureDate?: string;
    patientAge?: number;
    toothNumbers?: number[];
  };
}

/**
 * AI analysis request
 */
export interface AIAnalysisRequest {
  /** Analysis type */
  type: 'quality' | 'categorization' | 'ceph_landmarks' | 'progress_comparison' | 'report';
  /** Image(s) to analyze */
  images: AIImageInput[];
  /** Optional context */
  context?: {
    patientAge?: number;
    treatmentType?: string;
    previousAnalysis?: Record<string, unknown>;
  };
  /** Clinic ID for tracking */
  clinicId: string;
}

/**
 * AI analysis response
 */
export interface AIAnalysisResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  /** Processing time in ms */
  processingTime: number;
  /** Model used */
  model: string;
  /** Tokens used */
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

// =============================================================================
// PHI Anonymization
// =============================================================================

/**
 * PHI fields that may be present in images/metadata
 */
export interface PHIFields {
  patientName?: string;
  patientId?: string;
  dateOfBirth?: string;
  ssn?: string;
  mrn?: string;
  address?: string;
  phone?: string;
  email?: string;
}

/**
 * Anonymized result with PHI stripped
 */
export interface AnonymizedImageData {
  /** Processed image (if DICOM with burned-in PHI) */
  imageData: string;
  /** Anonymized metadata */
  metadata: Record<string, unknown>;
  /** Fields that were anonymized */
  anonymizedFields: string[];
}

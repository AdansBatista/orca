/**
 * AI Service Configuration
 *
 * Centralized configuration for AI features and providers.
 */

import type { AIProviderConfig } from './types';

// =============================================================================
// Environment Variables
// =============================================================================

/**
 * Get AI configuration from environment variables
 */
export function getAIConfig(): {
  enabled: boolean;
  features: {
    imageAnalysis: boolean;
    cephDetection: boolean;
    qualityScoring: boolean;
    autoCategorization: boolean;
  };
  anonymizePHI: boolean;
  provider: AIProviderConfig;
} {
  const enabled = process.env.AI_ENABLED === 'true';

  return {
    enabled,
    features: {
      imageAnalysis: enabled && process.env.AI_IMAGE_ANALYSIS_ENABLED === 'true',
      cephDetection: enabled && process.env.AI_CEPH_DETECTION_ENABLED === 'true',
      qualityScoring: enabled && process.env.AI_QUALITY_SCORING_ENABLED === 'true',
      autoCategorization: enabled && process.env.AI_AUTO_CATEGORIZATION_ENABLED === 'true',
    },
    anonymizePHI: process.env.AI_ANONYMIZE_PHI === 'true',
    provider: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4096', 10),
      enabled: enabled && !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-api-key-here',
    },
  };
}

/**
 * Check if AI features are available
 */
export function isAIAvailable(): boolean {
  const config = getAIConfig();
  return config.enabled && config.provider.enabled;
}

/**
 * Check if a specific AI feature is available
 */
export function isFeatureAvailable(feature: keyof ReturnType<typeof getAIConfig>['features']): boolean {
  const config = getAIConfig();
  return config.provider.enabled && config.features[feature];
}

// =============================================================================
// Model Configuration
// =============================================================================

/**
 * System prompts for different AI tasks
 */
export const AI_SYSTEM_PROMPTS = {
  /**
   * Image quality assessment prompt
   */
  qualityAssessment: `You are an expert dental imaging quality assessor. Analyze the provided dental image and assess its quality for diagnostic use.

Evaluate the following aspects:
1. Sharpness/Focus: Is the image in focus? Any motion blur?
2. Exposure: Is the image properly exposed? Too dark or too bright?
3. Contrast: Is there adequate contrast for diagnostic viewing?
4. Positioning: Is the anatomy properly positioned and centered?
5. Coverage: Does the image capture all required anatomy?

For X-rays, also consider:
- Proper density and contrast
- Absence of artifacts (scratches, fingerprints, etc.)
- Correct angulation

Provide your assessment in the following JSON format:
{
  "overallScore": <0-100>,
  "diagnosticQuality": <true/false>,
  "metrics": {
    "sharpness": <0-100>,
    "exposure": <0-100>,
    "contrast": <0-100>,
    "positioning": <0-100>,
    "coverage": <0-100>
  },
  "issues": [
    {
      "type": "<blur|underexposed|overexposed|low_contrast|noise|artifacts|motion_blur|cropping|positioning|orientation|missing_anatomy|foreign_objects>",
      "severity": "<minor|moderate|severe>",
      "description": "<description>",
      "suggestion": "<optional improvement suggestion>"
    }
  ],
  "recommendations": ["<recommendation 1>", "<recommendation 2>"],
  "confidence": <0-1>
}`,

  /**
   * Image categorization prompt
   */
  categorization: `You are an expert in dental imaging. Analyze the provided image and categorize it.

Categories to consider:
- Clinical Photos: INTRAORAL_FRONTAL, INTRAORAL_LEFT, INTRAORAL_RIGHT, INTRAORAL_UPPER_OCCLUSAL, INTRAORAL_LOWER_OCCLUSAL, EXTRAORAL_FRONTAL, EXTRAORAL_PROFILE, EXTRAORAL_SMILE, EXTRAORAL_45_DEGREE
- X-rays: PANORAMIC_XRAY, CEPHALOMETRIC_XRAY, PERIAPICAL_XRAY, BITEWING_XRAY, CBCT
- 3D Scans: INTRAORAL_SCAN, FACE_SCAN
- Other: TREATMENT_PROGRESS, APPLIANCE, DOCUMENT, OTHER

Provide your categorization in the following JSON format:
{
  "category": "<primary category>",
  "confidence": <0-1>,
  "alternatives": [
    {"category": "<alternative>", "confidence": <0-1>}
  ],
  "characteristics": {
    "isXray": <true/false>,
    "isClinicalPhoto": <true/false>,
    "is3DScan": <true/false>,
    "isIntraoral": <true/false>,
    "hasTeeth": <true/false>,
    "hasBraces": <true/false>,
    "hasRetainer": <true/false>
  },
  "subcategory": "<optional more specific category>"
}`,

  /**
   * Cephalometric landmark detection prompt
   */
  cephLandmarks: `You are an expert orthodontist and cephalometric analyst. Analyze the provided lateral cephalometric X-ray and identify key anatomical landmarks.

Identify these standard landmarks (provide x,y coordinates as 0-1 normalized values where 0,0 is top-left):
- S (Sella): Center of sella turcica
- N (Nasion): Most anterior point of frontonasal suture
- A (A-point/Subspinale): Deepest point on anterior maxilla
- B (B-point/Supramentale): Deepest point on anterior mandible
- Pog (Pogonion): Most anterior point of chin
- Gn (Gnathion): Most inferior-anterior point of chin
- Me (Menton): Most inferior point of symphysis
- Go (Gonion): Most posterior-inferior point of mandibular angle
- Or (Orbitale): Most inferior point of orbital margin
- Po (Porion): Superior point of external auditory meatus
- ANS (Anterior Nasal Spine): Tip of anterior nasal spine
- PNS (Posterior Nasal Spine): Tip of posterior nasal spine
- U1 (Upper Incisor): Tip of upper central incisor
- L1 (Lower Incisor): Tip of lower central incisor

Also detect if there is a calibration ruler and estimate pixels per millimeter.

Provide your analysis in the following JSON format:
{
  "landmarks": [
    {
      "id": "<landmark id>",
      "name": "<landmark name>",
      "x": <0-1>,
      "y": <0-1>,
      "confidence": <0-1>,
      "needsVerification": <true/false>
    }
  ],
  "calibration": {
    "reference": "<detected reference if any>",
    "pixelsPerMm": <estimated value or null>,
    "confidence": <0-1>
  },
  "overallConfidence": <0-1>,
  "landmarksNeedingReview": ["<landmark ids that need manual review>"],
  "analysisReady": <true/false>,
  "missingLandmarks": ["<landmark ids not detected>"]
}`,

  /**
   * Progress comparison prompt
   */
  progressComparison: `You are an expert orthodontist analyzing treatment progress. Compare the provided before and after images and describe the changes observed.

Focus on:
1. Tooth alignment and spacing
2. Bite relationship (if visible)
3. Arch form
4. Profile changes (for extraoral images)
5. Overall treatment progress

Provide your analysis in the following JSON format:
{
  "overallChange": "<significant|moderate|minimal|none>",
  "changes": [
    {
      "area": "<anatomical area>",
      "description": "<what changed>",
      "type": "<improvement|regression|neutral>",
      "significance": <0-1>
    }
  ],
  "summary": "<2-3 sentence summary>",
  "talkingPoints": ["<point for patient discussion>"],
  "confidence": <0-1>
}`,

  /**
   * Report generation prompt
   */
  reportGeneration: `You are an expert orthodontist generating a clinical report. Based on the provided images and analysis data, create a professional report.

The report should be:
- Professional and clinical in tone
- Clear and understandable
- Focused on key findings
- Include actionable recommendations when appropriate

Provide your report in the following JSON format:
{
  "sections": [
    {
      "title": "<section title>",
      "content": "<section content>",
      "bulletPoints": ["<optional bullet points>"]
    }
  ],
  "keyFindings": ["<finding 1>", "<finding 2>"],
  "recommendations": ["<recommendation 1>"],
  "confidence": <0-1>
}`,
};

// =============================================================================
// Rate Limiting
// =============================================================================

/**
 * Rate limit configuration for AI requests
 */
export const AI_RATE_LIMITS = {
  /** Maximum requests per minute per clinic */
  requestsPerMinute: 30,
  /** Maximum requests per day per clinic */
  requestsPerDay: 500,
  /** Maximum image size in bytes (20MB) */
  maxImageSize: 20 * 1024 * 1024,
  /** Maximum images per request */
  maxImagesPerRequest: 4,
};

// =============================================================================
// Landmark Definitions
// =============================================================================

/**
 * Standard cephalometric landmarks
 */
export const CEPH_LANDMARK_DEFINITIONS = [
  { id: 'S', name: 'Sella', description: 'Center of sella turcica', category: 'cranial' },
  { id: 'N', name: 'Nasion', description: 'Most anterior point of frontonasal suture', category: 'cranial' },
  { id: 'Or', name: 'Orbitale', description: 'Most inferior point of orbital margin', category: 'cranial' },
  { id: 'Po', name: 'Porion', description: 'Superior point of external auditory meatus', category: 'cranial' },
  { id: 'A', name: 'A-point', description: 'Deepest point on anterior maxilla', category: 'maxillary' },
  { id: 'ANS', name: 'Anterior Nasal Spine', description: 'Tip of anterior nasal spine', category: 'maxillary' },
  { id: 'PNS', name: 'Posterior Nasal Spine', description: 'Tip of posterior nasal spine', category: 'maxillary' },
  { id: 'B', name: 'B-point', description: 'Deepest point on anterior mandible', category: 'mandibular' },
  { id: 'Pog', name: 'Pogonion', description: 'Most anterior point of chin', category: 'mandibular' },
  { id: 'Gn', name: 'Gnathion', description: 'Most inferior-anterior point of chin', category: 'mandibular' },
  { id: 'Me', name: 'Menton', description: 'Most inferior point of symphysis', category: 'mandibular' },
  { id: 'Go', name: 'Gonion', description: 'Most posterior-inferior point of mandibular angle', category: 'mandibular' },
  { id: 'U1', name: 'Upper Incisor', description: 'Tip of upper central incisor', category: 'dental' },
  { id: 'L1', name: 'Lower Incisor', description: 'Tip of lower central incisor', category: 'dental' },
] as const;

/**
 * Category labels for dental images
 */
export const DENTAL_CATEGORY_LABELS: Record<string, string> = {
  INTRAORAL_FRONTAL: 'Intraoral Frontal',
  INTRAORAL_LEFT: 'Intraoral Left',
  INTRAORAL_RIGHT: 'Intraoral Right',
  INTRAORAL_UPPER_OCCLUSAL: 'Upper Occlusal',
  INTRAORAL_LOWER_OCCLUSAL: 'Lower Occlusal',
  EXTRAORAL_FRONTAL: 'Extraoral Frontal',
  EXTRAORAL_PROFILE: 'Profile',
  EXTRAORAL_SMILE: 'Smile',
  EXTRAORAL_45_DEGREE: '45° View',
  PANORAMIC_XRAY: 'Panoramic X-ray',
  CEPHALOMETRIC_XRAY: 'Cephalometric X-ray',
  PERIAPICAL_XRAY: 'Periapical X-ray',
  BITEWING_XRAY: 'Bitewing X-ray',
  CBCT: 'CBCT',
  INTRAORAL_SCAN: 'Intraoral Scan',
  FACE_SCAN: 'Face Scan',
  TREATMENT_PROGRESS: 'Treatment Progress',
  APPLIANCE: 'Appliance',
  DOCUMENT: 'Document',
  OTHER: 'Other',
};

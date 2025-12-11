/**
 * AI Services
 *
 * Central export for all AI-related services and utilities.
 */

// Configuration
export { getAIConfig, isAIAvailable, isFeatureAvailable } from './config';
export {
  AI_SYSTEM_PROMPTS,
  AI_RATE_LIMITS,
  CEPH_LANDMARK_DEFINITIONS,
  DENTAL_CATEGORY_LABELS,
} from './config';

// Types
export type {
  AIAnalysisStatus,
  ConfidenceLevel,
  QualityIssueType,
  ImageQualityResult,
  DentalImageCategory,
  ImageCategorizationResult,
  CephLandmarkPoint,
  CephLandmarkResult,
  ProgressComparisonResult,
  AIReportSection,
  AIReportResult,
  AIProviderConfig,
  AIImageInput,
  AIAnalysisRequest,
  AIAnalysisResponse,
  PHIFields,
  AnonymizedImageData,
} from './types';
export { getConfidenceLevel } from './types';

// Anonymization
export {
  anonymizeText,
  anonymizeMetadata,
  anonymizeForAI,
  anonymizeContext,
  createAnonymousPatientRef,
  containsPHI,
  logAnonymization,
} from './anonymizer';

// OpenAI Provider
export {
  analyzeImageQuality,
  categorizeImage,
  detectCephLandmarks,
  compareProgress,
  generateReport,
  checkOpenAIHealth,
} from './openai-provider';

// Imaging AI Service
export { getImagingAIService, ImagingAIService } from './imaging-ai-service';

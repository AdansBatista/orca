/**
 * Imaging Validation Schemas
 *
 * Zod schemas for validating imaging-related API requests
 */

import { z } from 'zod';

// Image category enum values (must match Prisma schema)
export const ImageCategoryEnum = z.enum([
  'EXTRAORAL_PHOTO',
  'INTRAORAL_PHOTO',
  'PANORAMIC_XRAY',
  'CEPHALOMETRIC_XRAY',
  'PERIAPICAL_XRAY',
  'CBCT',
  'SCAN_3D',
  'OTHER',
]);

// Tag category enum values
export const TagCategoryEnum = z.enum(['CLINICAL', 'TREATMENT', 'QUALITY', 'CUSTOM']);

// Annotation type enum values
export const AnnotationTypeEnum = z.enum([
  'FREEHAND',
  'LINE',
  'ARROW',
  'CIRCLE',
  'RECTANGLE',
  'TEXT',
  'POLYGON',
]);

// =============================================================================
// Patient Image Schemas
// =============================================================================

export const createPatientImageSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileUrl: z.string().min(1, 'File URL is required'),
  thumbnailUrl: z.string().optional(),
  fileSize: z.number().int().positive('File size must be positive'),
  mimeType: z.string().min(1, 'MIME type is required'),
  category: ImageCategoryEnum,
  subcategory: z.string().optional(),
  captureDate: z.string().datetime().optional(),
  capturedById: z.string().optional(),
  appointmentId: z.string().optional(),
  treatmentPlanId: z.string().optional(),
  treatmentPhaseId: z.string().optional(),
  protocolId: z.string().optional(),
  protocolSlotId: z.string().optional(),
  qualityScore: z.number().int().min(0).max(100).optional(),
  visibleToPatient: z.boolean().default(false),
  description: z.string().optional(),
  notes: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
});

export const updatePatientImageSchema = z.object({
  category: ImageCategoryEnum.optional(),
  subcategory: z.string().optional().nullable(),
  captureDate: z.string().datetime().optional().nullable(),
  capturedById: z.string().optional().nullable(),
  appointmentId: z.string().optional().nullable(),
  treatmentPlanId: z.string().optional().nullable(),
  treatmentPhaseId: z.string().optional().nullable(),
  protocolId: z.string().optional().nullable(),
  protocolSlotId: z.string().optional().nullable(),
  qualityScore: z.number().int().min(0).max(100).optional().nullable(),
  visibleToPatient: z.boolean().optional(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const imageListQuerySchema = z.object({
  patientId: z.string().optional(),
  category: ImageCategoryEnum.optional(),
  subcategory: z.string().optional(),
  tagId: z.string().optional(),
  appointmentId: z.string().optional(),
  treatmentPlanId: z.string().optional(),
  treatmentPhaseId: z.string().optional(),
  protocolId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  visibleToPatient: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['captureDate', 'createdAt', 'fileName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// Photo Protocol Schemas
// =============================================================================

export const createPhotoProtocolSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  slots: z
    .array(
      z.object({
        name: z.string().min(1, 'Slot name is required').max(100),
        category: ImageCategoryEnum,
        subcategory: z.string().optional(),
        sortOrder: z.number().int().min(0),
        isRequired: z.boolean().default(true),
        guideImageUrl: z.string().optional(),
        instructions: z.string().max(500).optional(),
      })
    )
    .optional(),
});

export const updatePhotoProtocolSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export const createProtocolSlotSchema = z.object({
  name: z.string().min(1, 'Slot name is required').max(100),
  category: ImageCategoryEnum,
  subcategory: z.string().optional(),
  sortOrder: z.number().int().min(0),
  isRequired: z.boolean().default(true),
  guideImageUrl: z.string().optional(),
  instructions: z.string().max(500).optional(),
});

export const updateProtocolSlotSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: ImageCategoryEnum.optional(),
  subcategory: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isRequired: z.boolean().optional(),
  guideImageUrl: z.string().optional().nullable(),
  instructions: z.string().max(500).optional().nullable(),
});

// =============================================================================
// Image Tag Schemas
// =============================================================================

export const createImageTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
    .optional(),
  category: TagCategoryEnum.default('CUSTOM'),
});

export const updateImageTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
    .optional()
    .nullable(),
  category: TagCategoryEnum.optional(),
});

export const tagAssignmentSchema = z.object({
  tagIds: z.array(z.string().min(1)),
});

// =============================================================================
// Image Annotation Schemas
// =============================================================================

export const createAnnotationSchema = z.object({
  type: AnnotationTypeEnum,
  geometry: z.record(z.string(), z.unknown()), // JSON object for coordinates
  style: z
    .object({
      color: z.string().optional(),
      strokeWidth: z.number().optional(),
      fill: z.string().optional(),
      opacity: z.number().min(0).max(1).optional(),
    })
    .optional(),
  text: z.string().max(500).optional(),
  label: z.string().max(100).optional(),
});

export const updateAnnotationSchema = z.object({
  geometry: z.record(z.string(), z.unknown()).optional(),
  style: z
    .object({
      color: z.string().optional(),
      strokeWidth: z.number().optional(),
      fill: z.string().optional(),
      opacity: z.number().min(0).max(1).optional(),
    })
    .optional(),
  text: z.string().max(500).optional().nullable(),
  label: z.string().max(100).optional().nullable(),
});

// =============================================================================
// Cephalometric Analysis Schemas
// =============================================================================

export const placedLandmarkSchema = z.object({
  landmarkId: z.string().min(1),
  x: z.number(),
  y: z.number(),
  confidence: z.number().min(0).max(1).optional(),
  isAutoPlaced: z.boolean().optional(),
});

export const calculatedMeasurementSchema = z.object({
  measurementId: z.string().min(1),
  value: z.number(),
  deviation: z.number(),
  interpretation: z.string(),
  category: z.string(),
});

export const cephAnalysisPresetEnum = z.enum([
  'STEINER',
  'DOWNS',
  'TWEED',
  'RICKETTS',
  'QUICK',
]);

export const createCephAnalysisSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  imageId: z.string().min(1, 'Image ID is required'),
  presetId: z.string().min(1, 'Preset ID is required'),
  landmarks: z.array(placedLandmarkSchema),
  measurements: z.array(calculatedMeasurementSchema),
  calibration: z.number().positive().optional(),
  notes: z.string().max(2000).optional(),
  summary: z.string().max(1000).optional(),
  isComplete: z.boolean().default(false),
});

export const updateCephAnalysisSchema = z.object({
  presetId: z.string().optional(),
  landmarks: z.array(placedLandmarkSchema).optional(),
  measurements: z.array(calculatedMeasurementSchema).optional(),
  calibration: z.number().positive().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  summary: z.string().max(1000).optional().nullable(),
  isComplete: z.boolean().optional(),
});

export const cephAnalysisListQuerySchema = z.object({
  patientId: z.string().optional(),
  imageId: z.string().optional(),
  presetId: cephAnalysisPresetEnum.optional(),
  isComplete: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['analysisDate', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// File Upload Schemas
// =============================================================================

export const uploadQuerySchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  category: ImageCategoryEnum,
  subcategory: z.string().optional(),
  protocolId: z.string().optional(),
  protocolSlotId: z.string().optional(),
  appointmentId: z.string().optional(),
  treatmentPlanId: z.string().optional(),
  treatmentPhaseId: z.string().optional(),
  captureDate: z.string().datetime().optional(),
  visibleToPatient: z.enum(['true', 'false']).default('false'),
});

// =============================================================================
// Treatment Phase Linking Schemas
// =============================================================================

export const linkImageToPhaseSchema = z.object({
  imageId: z.string().min(1, 'Image ID is required'),
  treatmentPhaseId: z.string().min(1, 'Treatment phase ID is required'),
  treatmentPlanId: z.string().optional(), // Optional, will auto-fill from phase
});

export const unlinkImageFromPhaseSchema = z.object({
  imageId: z.string().min(1, 'Image ID is required'),
});

export const bulkLinkImagesToPhaseSchema = z.object({
  imageIds: z.array(z.string().min(1)).min(1, 'At least one image ID is required'),
  treatmentPhaseId: z.string().min(1, 'Treatment phase ID is required'),
  treatmentPlanId: z.string().optional(),
});

export const phaseImagesQuerySchema = z.object({
  treatmentPhaseId: z.string().min(1, 'Treatment phase ID is required'),
  category: ImageCategoryEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['captureDate', 'createdAt', 'fileName']).default('captureDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// =============================================================================
// Retention & Archival Schemas
// =============================================================================

export const ImageArchiveActionEnum = z.enum([
  'ARCHIVED',
  'RESTORED',
  'DELETED',
  'LEGAL_HOLD_SET',
  'LEGAL_HOLD_REMOVED',
  'RETENTION_EXTENDED',
]);

export const createRetentionPolicySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  isDefault: z.boolean().default(false),
  imageCategories: z.array(ImageCategoryEnum).default([]),
  retentionYears: z.number().int().min(1).max(100),
  retentionForMinorsYears: z.number().int().min(0).max(50).optional(),
  archiveAfterYears: z.number().int().min(1).max(100).optional(),
  notifyBeforeArchive: z.number().int().min(1).max(365).optional(),
  autoExtendOnAccess: z.boolean().default(false),
});

export const updateRetentionPolicySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  imageCategories: z.array(ImageCategoryEnum).optional(),
  retentionYears: z.number().int().min(1).max(100).optional(),
  retentionForMinorsYears: z.number().int().min(0).max(50).optional().nullable(),
  archiveAfterYears: z.number().int().min(1).max(100).optional().nullable(),
  notifyBeforeArchive: z.number().int().min(1).max(365).optional().nullable(),
  autoExtendOnAccess: z.boolean().optional(),
});

export const retentionPolicyListQuerySchema = z.object({
  isActive: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const setLegalHoldSchema = z.object({
  imageId: z.string().min(1, 'Image ID is required'),
  reason: z.string().min(1, 'Reason is required').max(500),
});

export const removeLegalHoldSchema = z.object({
  imageId: z.string().min(1, 'Image ID is required'),
  reason: z.string().max(500).optional(),
});

export const archiveImageSchema = z.object({
  imageId: z.string().min(1, 'Image ID is required'),
  reason: z.string().max(500).optional(),
});

export const restoreImageSchema = z.object({
  imageId: z.string().min(1, 'Image ID is required'),
  reason: z.string().max(500).optional(),
});

export const bulkArchiveSchema = z.object({
  imageIds: z.array(z.string().min(1)).min(1, 'At least one image ID is required'),
  reason: z.string().max(500).optional(),
});

export const extendRetentionSchema = z.object({
  imageId: z.string().min(1, 'Image ID is required'),
  additionalYears: z.number().int().min(1).max(50),
  reason: z.string().max(500).optional(),
});

export const assignRetentionPolicySchema = z.object({
  imageIds: z.array(z.string().min(1)).min(1, 'At least one image ID is required'),
  policyId: z.string().min(1, 'Policy ID is required'),
});

export const retentionReportQuerySchema = z.object({
  status: z.enum(['expiring_soon', 'expired', 'archived', 'legal_hold', 'all']).default('all'),
  daysUntilExpiry: z.coerce.number().int().min(1).max(365).optional(), // For expiring_soon
  category: ImageCategoryEnum.optional(),
  patientId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
});

export const storageReportQuerySchema = z.object({
  groupBy: z.enum(['category', 'patient', 'policy', 'status']).default('category'),
});

export const archiveHistoryQuerySchema = z.object({
  imageId: z.string().optional(),
  action: ImageArchiveActionEnum.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
});

// =============================================================================
// Export Types
// =============================================================================

export type CreatePatientImageInput = z.infer<typeof createPatientImageSchema>;
export type UpdatePatientImageInput = z.infer<typeof updatePatientImageSchema>;
export type ImageListQuery = z.infer<typeof imageListQuerySchema>;
export type CreatePhotoProtocolInput = z.infer<typeof createPhotoProtocolSchema>;
export type UpdatePhotoProtocolInput = z.infer<typeof updatePhotoProtocolSchema>;
export type CreateProtocolSlotInput = z.infer<typeof createProtocolSlotSchema>;
export type UpdateProtocolSlotInput = z.infer<typeof updateProtocolSlotSchema>;
export type CreateImageTagInput = z.infer<typeof createImageTagSchema>;
export type UpdateImageTagInput = z.infer<typeof updateImageTagSchema>;
export type TagAssignmentInput = z.infer<typeof tagAssignmentSchema>;
export type CreateAnnotationInput = z.infer<typeof createAnnotationSchema>;
export type UpdateAnnotationInput = z.infer<typeof updateAnnotationSchema>;
export type UploadQuery = z.infer<typeof uploadQuerySchema>;
export type PlacedLandmark = z.infer<typeof placedLandmarkSchema>;
export type CalculatedMeasurement = z.infer<typeof calculatedMeasurementSchema>;
export type CreateCephAnalysisInput = z.infer<typeof createCephAnalysisSchema>;
export type UpdateCephAnalysisInput = z.infer<typeof updateCephAnalysisSchema>;
export type CephAnalysisListQuery = z.infer<typeof cephAnalysisListQuerySchema>;
export type LinkImageToPhaseInput = z.infer<typeof linkImageToPhaseSchema>;
export type UnlinkImageFromPhaseInput = z.infer<typeof unlinkImageFromPhaseSchema>;
export type BulkLinkImagesToPhaseInput = z.infer<typeof bulkLinkImagesToPhaseSchema>;
export type PhaseImagesQuery = z.infer<typeof phaseImagesQuerySchema>;

// Retention & Archival types
export type ImageArchiveAction = z.infer<typeof ImageArchiveActionEnum>;
export type CreateRetentionPolicyInput = z.infer<typeof createRetentionPolicySchema>;
export type UpdateRetentionPolicyInput = z.infer<typeof updateRetentionPolicySchema>;
export type RetentionPolicyListQuery = z.infer<typeof retentionPolicyListQuerySchema>;
export type SetLegalHoldInput = z.infer<typeof setLegalHoldSchema>;
export type RemoveLegalHoldInput = z.infer<typeof removeLegalHoldSchema>;
export type ArchiveImageInput = z.infer<typeof archiveImageSchema>;
export type RestoreImageInput = z.infer<typeof restoreImageSchema>;
export type BulkArchiveInput = z.infer<typeof bulkArchiveSchema>;
export type ExtendRetentionInput = z.infer<typeof extendRetentionSchema>;
export type AssignRetentionPolicyInput = z.infer<typeof assignRetentionPolicySchema>;
export type RetentionReportQuery = z.infer<typeof retentionReportQuerySchema>;
export type StorageReportQuery = z.infer<typeof storageReportQuerySchema>;
export type ArchiveHistoryQuery = z.infer<typeof archiveHistoryQuerySchema>;

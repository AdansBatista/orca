import { z } from 'zod';

// =============================================================================
// Enums (matching Prisma schema)
// =============================================================================

export const TreatmentPlanStatusEnum = z.enum([
  'DRAFT',
  'PRESENTED',
  'ACCEPTED',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'DISCONTINUED',
  'TRANSFERRED',
]);

export const TreatmentPhaseTypeEnum = z.enum([
  'INITIAL_ALIGNMENT',
  'LEVELING',
  'SPACE_CLOSURE',
  'FINISHING',
  'DETAILING',
  'RETENTION',
  'OBSERVATION',
  'CUSTOM',
]);

export const PhaseStatusEnum = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'SKIPPED',
]);

export const MilestoneStatusEnum = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'ACHIEVED',
  'MISSED',
  'DEFERRED',
]);

export const ProgressNoteTypeEnum = z.enum([
  'INITIAL_EXAM',
  'CONSULTATION',
  'RECORDS_APPOINTMENT',
  'BONDING',
  'ADJUSTMENT',
  'EMERGENCY',
  'DEBOND',
  'RETENTION_CHECK',
  'OBSERVATION',
  'GENERAL',
]);

export const NoteStatusEnum = z.enum([
  'DRAFT',
  'PENDING_SIGNATURE',
  'SIGNED',
  'PENDING_COSIGN',
  'COSIGNED',
  'AMENDED',
]);

export const ClinicalFindingTypeEnum = z.enum([
  'DECALCIFICATION',
  'CARIES',
  'GINGIVITIS',
  'BRACKET_ISSUE',
  'WIRE_ISSUE',
  'ELASTIC_COMPLIANCE',
  'ORAL_HYGIENE',
  'ROOT_RESORPTION',
  'IMPACTION',
  'ECTOPIC_ERUPTION',
  'ANKYLOSIS',
  'OTHER',
]);

export const SeverityEnum = z.enum(['MILD', 'MODERATE', 'SEVERE']);

export const OrthoMeasurementTypeEnum = z.enum([
  'OVERJET',
  'OVERBITE',
  'OVERBITE_PERCENT',
  'CROWDING_UPPER',
  'CROWDING_LOWER',
  'SPACING_UPPER',
  'SPACING_LOWER',
  'MIDLINE_UPPER',
  'MIDLINE_LOWER',
  'MOLAR_RELATIONSHIP_RIGHT',
  'MOLAR_RELATIONSHIP_LEFT',
  'CANINE_RELATIONSHIP_RIGHT',
  'CANINE_RELATIONSHIP_LEFT',
  'ARCH_LENGTH_UPPER',
  'ARCH_LENGTH_LOWER',
  'INTERCANINE_WIDTH_UPPER',
  'INTERCANINE_WIDTH_LOWER',
  'INTERMOLAR_WIDTH_UPPER',
  'INTERMOLAR_WIDTH_LOWER',
  'CROSSBITE',
  'OPEN_BITE',
]);

export const MeasurementMethodEnum = z.enum([
  'CLINICAL',
  'MODEL_ANALYSIS',
  'DIGITAL_SCAN',
  'CEPHALOMETRIC',
]);

export const QuadrantEnum = z.enum([
  'UPPER_RIGHT',
  'UPPER_LEFT',
  'LOWER_LEFT',
  'LOWER_RIGHT',
]);

export const ArchEnum = z.enum(['UPPER', 'LOWER', 'BOTH']);

export const ProcedureStatusEnum = z.enum([
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'DEFERRED',
]);

// =============================================================================
// Treatment Plan Schemas
// =============================================================================

export const createTreatmentPlanSchema = z.object({
  // Required fields
  patientId: z.string().min(1, 'Patient is required'),
  planName: z.string().min(1, 'Plan name is required').max(200),

  // Optional fields
  planType: z.string().max(100).optional().nullable(),
  chiefComplaint: z.string().max(2000).optional().nullable(),
  diagnosis: z.array(z.string().max(500)).default([]),
  treatmentGoals: z.array(z.string().max(500)).default([]),
  treatmentDescription: z.string().max(5000).optional().nullable(),

  // Provider assignment
  primaryProviderId: z.string().optional().nullable(),
  supervisingProviderId: z.string().optional().nullable(),

  // Duration and estimates
  estimatedDuration: z.number().int().min(1).max(60).optional().nullable(), // months
  estimatedVisits: z.number().int().min(1).max(200).optional().nullable(),
  totalFee: z.number().min(0).optional().nullable(),

  // Dates
  startDate: z.coerce.date().optional().nullable(),
  estimatedEndDate: z.coerce.date().optional().nullable(),

  // Status (usually starts as DRAFT)
  status: TreatmentPlanStatusEnum.default('DRAFT'),
});

export const updateTreatmentPlanSchema = createTreatmentPlanSchema.partial().omit({ patientId: true });

export const treatmentPlanQuerySchema = z.object({
  search: z.string().optional(),
  patientId: z.string().optional(),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    TreatmentPlanStatusEnum.optional()
  ),
  primaryProviderId: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'planName', 'status', 'startDate'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Status change schemas
export const acceptTreatmentPlanSchema = z.object({
  acceptedDate: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
});

export const completeTreatmentPlanSchema = z.object({
  actualEndDate: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
});

// =============================================================================
// Treatment Phase Schemas
// =============================================================================

export const createTreatmentPhaseSchema = z.object({
  // Required fields
  phaseName: z.string().min(1, 'Phase name is required').max(200),
  phaseNumber: z.number().int().min(1),

  // Optional fields
  phaseType: TreatmentPhaseTypeEnum.default('CUSTOM'),
  description: z.string().max(2000).optional().nullable(),
  objectives: z.array(z.string().max(500)).default([]),

  // Timeline
  plannedStartDate: z.coerce.date().optional().nullable(),
  plannedEndDate: z.coerce.date().optional().nullable(),

  // Progress
  estimatedVisits: z.number().int().min(1).max(100).optional().nullable(),

  // Notes
  notes: z.string().max(5000).optional().nullable(),

  // Status
  status: PhaseStatusEnum.default('NOT_STARTED'),
});

export const updateTreatmentPhaseSchema = createTreatmentPhaseSchema.partial();

// =============================================================================
// Treatment Milestone Schemas
// =============================================================================

export const createTreatmentMilestoneSchema = z.object({
  // Required fields
  milestoneName: z.string().min(1, 'Milestone name is required').max(200),

  // Optional fields
  milestoneType: z.string().max(100).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  targetDate: z.coerce.date().optional().nullable(),
  completionCriteria: z.string().max(1000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),

  // Portal visibility
  visibleToPatient: z.boolean().default(true),
  patientDescription: z.string().max(500).optional().nullable(),

  // Status
  status: MilestoneStatusEnum.default('PENDING'),
});

export const updateTreatmentMilestoneSchema = createTreatmentMilestoneSchema.partial();

// =============================================================================
// Progress Note Schemas
// =============================================================================

export const createProgressNoteSchema = z.object({
  // Required fields
  patientId: z.string().min(1, 'Patient is required'),
  noteType: ProgressNoteTypeEnum,
  providerId: z.string().min(1, 'Provider is required'),

  // Optional links
  treatmentPlanId: z.string().optional().nullable(),
  appointmentId: z.string().optional().nullable(),

  // Note content
  noteDate: z.coerce.date().optional(),
  chiefComplaint: z.string().max(2000).optional().nullable(),

  // SOAP format
  subjective: z.string().max(10000).optional().nullable(),
  objective: z.string().max(10000).optional().nullable(),
  assessment: z.string().max(10000).optional().nullable(),
  plan: z.string().max(10000).optional().nullable(),

  // Procedures summary
  proceduresSummary: z.string().max(5000).optional().nullable(),

  // Provider
  supervisingProviderId: z.string().optional().nullable(),

  // Attachments
  imageIds: z.array(z.string()).default([]),

  // Status
  status: NoteStatusEnum.default('DRAFT'),
});

export const updateProgressNoteSchema = createProgressNoteSchema
  .partial()
  .omit({ patientId: true, providerId: true });

export const progressNoteQuerySchema = z.object({
  search: z.string().optional(),
  patientId: z.string().optional(),
  treatmentPlanId: z.string().optional(),
  providerId: z.string().optional(),
  noteType: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    ProgressNoteTypeEnum.optional()
  ),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    NoteStatusEnum.optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['noteDate', 'createdAt', 'updatedAt', 'status']).default('noteDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Note signing schemas
export const signProgressNoteSchema = z.object({
  signedAt: z.coerce.date().optional(),
});

export const coSignProgressNoteSchema = z.object({
  coSignedAt: z.coerce.date().optional(),
});

export const amendProgressNoteSchema = z.object({
  amendmentReason: z.string().min(1, 'Amendment reason is required').max(2000),
  // Updated content
  subjective: z.string().max(10000).optional().nullable(),
  objective: z.string().max(10000).optional().nullable(),
  assessment: z.string().max(10000).optional().nullable(),
  plan: z.string().max(10000).optional().nullable(),
});

// =============================================================================
// Procedure Record Schemas
// =============================================================================

export const createProcedureRecordSchema = z.object({
  // Required fields
  procedureCode: z.string().min(1, 'Procedure code is required').max(20),
  procedureName: z.string().min(1, 'Procedure name is required').max(200),
  performedById: z.string().min(1, 'Performer is required'),

  // Optional fields
  description: z.string().max(2000).optional().nullable(),

  // Location
  toothNumbers: z.array(z.number().int().min(1).max(32)).default([]),
  quadrant: QuadrantEnum.optional().nullable(),
  arch: ArchEnum.optional().nullable(),

  // Provider
  assistedById: z.string().optional().nullable(),

  // Timing
  performedAt: z.coerce.date().optional(),
  duration: z.number().int().min(1).max(480).optional().nullable(), // minutes

  // Status
  status: ProcedureStatusEnum.default('COMPLETED'),

  // Notes
  notes: z.string().max(2000).optional().nullable(),
  complications: z.string().max(2000).optional().nullable(),
});

export const updateProcedureRecordSchema = createProcedureRecordSchema.partial();

// =============================================================================
// Clinical Finding Schemas
// =============================================================================

export const createClinicalFindingSchema = z.object({
  // Required fields
  findingType: ClinicalFindingTypeEnum,
  description: z.string().min(1, 'Description is required').max(2000),

  // Optional fields
  severity: SeverityEnum.optional().nullable(),

  // Location
  toothNumbers: z.array(z.number().int().min(1).max(32)).default([]),
  location: z.string().max(200).optional().nullable(),

  // Clinical action
  actionRequired: z.boolean().default(false),
  actionTaken: z.string().max(1000).optional().nullable(),
  followUpRequired: z.boolean().default(false),
});

export const updateClinicalFindingSchema = createClinicalFindingSchema.partial();

// =============================================================================
// Clinical Measurement Schemas
// =============================================================================

export const createClinicalMeasurementSchema = z.object({
  // Required fields
  patientId: z.string().min(1, 'Patient is required'),
  measurementType: OrthoMeasurementTypeEnum,
  value: z.number(),
  recordedById: z.string().min(1, 'Recorder is required'),

  // Optional fields
  progressNoteId: z.string().optional().nullable(),
  measurementDate: z.coerce.date().optional(),
  unit: z.string().max(20).default('mm'),
  method: MeasurementMethodEnum.optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateClinicalMeasurementSchema = createClinicalMeasurementSchema
  .partial()
  .omit({ patientId: true });

export const measurementQuerySchema = z.object({
  patientId: z.string(),
  measurementType: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    OrthoMeasurementTypeEnum.optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  sortBy: z.enum(['measurementDate', 'createdAt', 'measurementType']).default('measurementDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// Note Template Schemas
// =============================================================================

export const createNoteTemplateSchema = z.object({
  // Required fields
  templateName: z.string().min(1, 'Template name is required').max(200),
  templateType: ProgressNoteTypeEnum,

  // Optional fields
  description: z.string().max(500).optional().nullable(),

  // Default content
  defaultSubjective: z.string().max(10000).optional().nullable(),
  defaultObjective: z.string().max(10000).optional().nullable(),
  defaultAssessment: z.string().max(10000).optional().nullable(),
  defaultPlan: z.string().max(10000).optional().nullable(),
  defaultProcedures: z.array(z.string().max(20)).default([]),

  // Status
  isActive: z.boolean().default(true),
});

export const updateNoteTemplateSchema = createNoteTemplateSchema.partial();

// =============================================================================
// Appliance Management Enums
// =============================================================================

export const ApplianceRecordTypeEnum = z.enum([
  'BRACKETS',
  'BANDS',
  'ALIGNERS',
  'RETAINER_FIXED',
  'RETAINER_REMOVABLE',
  'EXPANDER',
  'HERBST',
  'MARA',
  'HEADGEAR',
  'FACEMASK',
  'TAD',
  'ELASTICS',
  'SPRING',
  'POWER_CHAIN',
  'OTHER',
]);

export const ApplianceStatusEnum = z.enum([
  'ORDERED',
  'RECEIVED',
  'ACTIVE',
  'ADJUSTED',
  'REMOVED',
  'REPLACED',
  'LOST',
  'BROKEN',
]);

export const WireTypeEnum = z.enum(['ROUND', 'RECTANGULAR', 'SQUARE']);

export const WireMaterialEnum = z.enum([
  'NITI',
  'NITI_HEAT',
  'STAINLESS_STEEL',
  'TMA',
  'BETA_TITANIUM',
  'COPPER_NITI',
]);

export const WireStatusEnum = z.enum(['ACTIVE', 'REMOVED', 'BROKEN', 'REPLACED']);

export const AlignerTreatmentStatusEnum = z.enum([
  'SUBMITTED',
  'APPROVED',
  'MANUFACTURING',
  'IN_PROGRESS',
  'REFINEMENT',
  'COMPLETED',
  'DISCONTINUED',
]);

export const RetainerTypeEnum = z.enum([
  'HAWLEY',
  'ESSIX',
  'VIVERA',
  'FIXED_BONDED',
  'SPRING_RETAINER',
  'WRAP_AROUND',
]);

export const RetainerStatusEnum = z.enum([
  'ORDERED',
  'IN_FABRICATION',
  'RECEIVED',
  'DELIVERED',
  'ACTIVE',
  'REPLACED',
  'LOST',
  'BROKEN',
]);

export const RetentionWearScheduleEnum = z.enum([
  'FULL_TIME',
  'NIGHTS_ONLY',
  'EVERY_OTHER_NIGHT',
  'FEW_NIGHTS_WEEK',
  'AS_NEEDED',
]);

// =============================================================================
// Appliance Record Schemas
// =============================================================================

export const createApplianceRecordSchema = z.object({
  // Required fields
  patientId: z.string().min(1, 'Patient is required'),
  applianceType: ApplianceRecordTypeEnum,
  arch: ArchEnum,

  // Optional links
  treatmentPlanId: z.string().optional().nullable(),

  // Appliance details
  applianceSystem: z.string().max(100).optional().nullable(),
  manufacturer: z.string().max(100).optional().nullable(),

  // Configuration (JSON)
  specification: z.record(z.string(), z.unknown()).optional().nullable(),

  // Placement
  toothNumbers: z.array(z.number().int().min(1).max(32)).default([]),

  // Dates
  placedDate: z.coerce.date().optional().nullable(),
  removedDate: z.coerce.date().optional().nullable(),

  // Status
  status: ApplianceStatusEnum.default('ACTIVE'),

  // Provider
  placedById: z.string().optional().nullable(),
  removedById: z.string().optional().nullable(),

  // Notes
  notes: z.string().max(2000).optional().nullable(),
});

export const updateApplianceRecordSchema = createApplianceRecordSchema
  .partial()
  .omit({ patientId: true });

export const applianceRecordQuerySchema = z.object({
  search: z.string().optional(),
  patientId: z.string().optional(),
  treatmentPlanId: z.string().optional(),
  applianceType: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    ApplianceRecordTypeEnum.optional()
  ),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    ApplianceStatusEnum.optional()
  ),
  arch: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    ArchEnum.optional()
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'placedDate', 'applianceType', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// Wire Record Schemas
// =============================================================================

export const createWireRecordSchema = z.object({
  // Required fields
  applianceRecordId: z.string().min(1, 'Appliance record is required'),
  wireType: WireTypeEnum,
  wireSize: z.string().min(1, 'Wire size is required').max(50),
  wireMaterial: WireMaterialEnum,
  arch: ArchEnum,
  placedDate: z.coerce.date(),
  placedById: z.string().min(1, 'Placed by is required'),

  // Optional fields
  manufacturer: z.string().max(100).optional().nullable(),
  removedDate: z.coerce.date().optional().nullable(),
  removedById: z.string().optional().nullable(),
  sequenceNumber: z.number().int().min(1).default(1),

  // Status
  status: WireStatusEnum.default('ACTIVE'),

  // Notes
  notes: z.string().max(2000).optional().nullable(),
  bends: z.string().max(1000).optional().nullable(),
});

export const updateWireRecordSchema = createWireRecordSchema
  .partial()
  .omit({ applianceRecordId: true });

export const wireRecordQuerySchema = z.object({
  applianceRecordId: z.string().optional(),
  patientId: z.string().optional(),
  wireType: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    WireTypeEnum.optional()
  ),
  wireMaterial: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    WireMaterialEnum.optional()
  ),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    WireStatusEnum.optional()
  ),
  arch: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    ArchEnum.optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['placedDate', 'createdAt', 'sequenceNumber']).default('placedDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// Aligner Record Schemas
// =============================================================================

export const createAlignerRecordSchema = z.object({
  // Required fields
  patientId: z.string().min(1, 'Patient is required'),
  alignerSystem: z.string().min(1, 'Aligner system is required').max(100),
  totalAligners: z.number().int().min(1, 'Total aligners must be at least 1'),
  startDate: z.coerce.date(),

  // Optional links
  treatmentPlanId: z.string().optional().nullable(),

  // Case details
  caseNumber: z.string().max(100).optional().nullable(),
  currentAligner: z.number().int().min(1).default(1),
  refinementNumber: z.number().int().min(0).default(0),

  // Status
  status: AlignerTreatmentStatusEnum.default('IN_PROGRESS'),

  // Dates
  estimatedEndDate: z.coerce.date().optional().nullable(),
  actualEndDate: z.coerce.date().optional().nullable(),

  // Delivery
  alignersDelivered: z.number().int().min(0).default(0),
  lastDeliveryDate: z.coerce.date().optional().nullable(),

  // Compliance
  averageWearHours: z.number().min(0).max(24).optional().nullable(),
});

export const updateAlignerRecordSchema = createAlignerRecordSchema
  .partial()
  .omit({ patientId: true });

export const alignerRecordQuerySchema = z.object({
  search: z.string().optional(),
  patientId: z.string().optional(),
  treatmentPlanId: z.string().optional(),
  alignerSystem: z.string().optional(),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    AlignerTreatmentStatusEnum.optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['startDate', 'createdAt', 'status', 'alignerSystem']).default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// Aligner Delivery Schemas
// =============================================================================

export const createAlignerDeliverySchema = z.object({
  // Required fields
  alignerRecordId: z.string().min(1, 'Aligner record is required'),
  deliveryDate: z.coerce.date(),
  alignerNumberStart: z.number().int().min(1, 'Start aligner number is required'),
  alignerNumberEnd: z.number().int().min(1, 'End aligner number is required'),
  deliveredById: z.string().min(1, 'Delivered by is required'),

  // Instructions
  wearSchedule: z.number().int().min(1).max(30).default(14), // Days per aligner
  wearHoursPerDay: z.number().int().min(1).max(24).default(22),

  // Attachments
  attachmentsPlaced: z.boolean().default(false),
  attachmentTeeth: z.array(z.number().int().min(1).max(32)).default([]),

  // IPR
  iprPerformed: z.boolean().default(false),
  iprDetails: z.string().max(1000).optional().nullable(),

  // Notes
  instructions: z.string().max(2000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const alignerDeliveryQuerySchema = z.object({
  alignerRecordId: z.string(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['deliveryDate', 'createdAt']).default('deliveryDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// Retainer Record Schemas
// =============================================================================

export const createRetainerRecordSchema = z.object({
  // Required fields
  patientId: z.string().min(1, 'Patient is required'),
  retainerType: RetainerTypeEnum,
  arch: ArchEnum,

  // Optional links
  treatmentPlanId: z.string().optional().nullable(),

  // Retainer details
  material: z.string().max(100).optional().nullable(),
  labOrderId: z.string().optional().nullable(),

  // Dates
  orderedDate: z.coerce.date().optional().nullable(),
  receivedDate: z.coerce.date().optional().nullable(),
  deliveredDate: z.coerce.date().optional().nullable(),

  // Status
  status: RetainerStatusEnum.default('ORDERED'),

  // Provider
  deliveredById: z.string().optional().nullable(),

  // Retention protocol
  wearSchedule: RetentionWearScheduleEnum.optional().nullable(),
  wearInstructions: z.string().max(1000).optional().nullable(),

  // Replacement
  isReplacement: z.boolean().default(false),
  replacementReason: z.string().max(500).optional().nullable(),
  previousRetainerId: z.string().optional().nullable(),

  // Notes
  notes: z.string().max(2000).optional().nullable(),
});

export const updateRetainerRecordSchema = createRetainerRecordSchema
  .partial()
  .omit({ patientId: true });

export const retainerRecordQuerySchema = z.object({
  search: z.string().optional(),
  patientId: z.string().optional(),
  treatmentPlanId: z.string().optional(),
  retainerType: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    RetainerTypeEnum.optional()
  ),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    RetainerStatusEnum.optional()
  ),
  arch: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    ArchEnum.optional()
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'orderedDate', 'deliveredDate', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// Elastic Prescription Schemas
// =============================================================================

export const ElasticTypeEnum = z.enum([
  'CLASS_II',
  'CLASS_III',
  'VERTICAL',
  'CROSS',
  'BOX',
  'TRIANGLE',
  'ZIG_ZAG',
  'CUSTOM',
]);

export const ElasticSizeEnum = z.enum([
  'LIGHT_1_8',
  'LIGHT_3_16',
  'MEDIUM_1_4',
  'MEDIUM_5_16',
  'HEAVY_3_8',
  'HEAVY_1_2',
]);

export const createElasticPrescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  treatmentPlanId: z.string().optional().nullable(),
  applianceRecordId: z.string().optional().nullable(),

  // Elastic Details
  elasticType: ElasticTypeEnum,
  elasticSize: ElasticSizeEnum,
  elasticForce: z.string().max(50).optional().nullable(),
  manufacturer: z.string().max(100).optional().nullable(),

  // Attachment Points
  fromTooth: z.number().int().min(1).max(32),
  toTooth: z.number().int().min(1).max(32),
  configuration: z.string().max(200).optional().nullable(),

  // Wear Instructions
  wearSchedule: z.string().min(1, 'Wear schedule is required').max(200),
  hoursPerDay: z.number().int().min(1).max(24).default(22),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional().nullable(),

  // Compliance Notes
  complianceNotes: z.string().max(2000).optional().nullable(),
});

export const updateElasticPrescriptionSchema = createElasticPrescriptionSchema.partial().extend({
  isActive: z.boolean().optional(),
  discontinuedDate: z.coerce.date().optional().nullable(),
  discontinuedReason: z.string().max(500).optional().nullable(),
});

export const elasticPrescriptionQuerySchema = z.object({
  search: z.string().optional(),
  patientId: z.string().optional(),
  treatmentPlanId: z.string().optional(),
  applianceRecordId: z.string().optional(),
  elasticType: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    ElasticTypeEnum.optional()
  ),
  isActive: z.preprocess(
    (val) => {
      if (val === '' || val === 'all') return undefined;
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    },
    z.boolean().optional()
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'startDate', 'endDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// Appliance Activation Schemas
// =============================================================================

export const createApplianceActivationSchema = z.object({
  applianceRecordId: z.string().min(1, 'Appliance record is required'),

  // Activation Details
  activationDate: z.coerce.date(),
  activationType: z.string().min(1, 'Activation type is required').max(100),
  turns: z.number().int().min(0).max(20).optional().nullable(),
  millimeters: z.number().min(0).max(20).optional().nullable(),

  // Instructions
  instructions: z.string().max(1000).optional().nullable(),
  nextActivationDate: z.coerce.date().optional().nullable(),

  // Patient-Reported
  isPatientReported: z.boolean().default(false),
  reportedWearHours: z.number().int().min(0).max(24).optional().nullable(),

  // Notes
  notes: z.string().max(2000).optional().nullable(),
});

export const updateApplianceActivationSchema = createApplianceActivationSchema.partial();

export const applianceActivationQuerySchema = z.object({
  applianceRecordId: z.string().optional(),
  activationType: z.string().optional(),
  isPatientReported: z.preprocess(
    (val) => {
      if (val === '' || val === 'all') return undefined;
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    },
    z.boolean().optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['activationDate', 'createdAt']).default('activationDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// Type exports
// =============================================================================

export type CreateTreatmentPlanInput = z.infer<typeof createTreatmentPlanSchema>;
export type UpdateTreatmentPlanInput = z.infer<typeof updateTreatmentPlanSchema>;
export type TreatmentPlanQuery = z.infer<typeof treatmentPlanQuerySchema>;

export type CreateTreatmentPhaseInput = z.infer<typeof createTreatmentPhaseSchema>;
export type UpdateTreatmentPhaseInput = z.infer<typeof updateTreatmentPhaseSchema>;

export type CreateTreatmentMilestoneInput = z.infer<typeof createTreatmentMilestoneSchema>;
export type UpdateTreatmentMilestoneInput = z.infer<typeof updateTreatmentMilestoneSchema>;

export type CreateProgressNoteInput = z.infer<typeof createProgressNoteSchema>;
export type UpdateProgressNoteInput = z.infer<typeof updateProgressNoteSchema>;
export type ProgressNoteQuery = z.infer<typeof progressNoteQuerySchema>;

export type CreateProcedureRecordInput = z.infer<typeof createProcedureRecordSchema>;
export type UpdateProcedureRecordInput = z.infer<typeof updateProcedureRecordSchema>;

export type CreateClinicalFindingInput = z.infer<typeof createClinicalFindingSchema>;
export type UpdateClinicalFindingInput = z.infer<typeof updateClinicalFindingSchema>;

export type CreateClinicalMeasurementInput = z.infer<typeof createClinicalMeasurementSchema>;
export type UpdateClinicalMeasurementInput = z.infer<typeof updateClinicalMeasurementSchema>;
export type MeasurementQuery = z.infer<typeof measurementQuerySchema>;

export type CreateNoteTemplateInput = z.infer<typeof createNoteTemplateSchema>;
export type UpdateNoteTemplateInput = z.infer<typeof updateNoteTemplateSchema>;

export type CreateApplianceRecordInput = z.infer<typeof createApplianceRecordSchema>;
export type UpdateApplianceRecordInput = z.infer<typeof updateApplianceRecordSchema>;
export type ApplianceRecordQuery = z.infer<typeof applianceRecordQuerySchema>;

export type CreateWireRecordInput = z.infer<typeof createWireRecordSchema>;
export type UpdateWireRecordInput = z.infer<typeof updateWireRecordSchema>;
export type WireRecordQuery = z.infer<typeof wireRecordQuerySchema>;

export type CreateAlignerRecordInput = z.infer<typeof createAlignerRecordSchema>;
export type UpdateAlignerRecordInput = z.infer<typeof updateAlignerRecordSchema>;
export type AlignerRecordQuery = z.infer<typeof alignerRecordQuerySchema>;

export type CreateAlignerDeliveryInput = z.infer<typeof createAlignerDeliverySchema>;
export type AlignerDeliveryQuery = z.infer<typeof alignerDeliveryQuerySchema>;

export type CreateRetainerRecordInput = z.infer<typeof createRetainerRecordSchema>;
export type UpdateRetainerRecordInput = z.infer<typeof updateRetainerRecordSchema>;
export type RetainerRecordQuery = z.infer<typeof retainerRecordQuerySchema>;

export type CreateElasticPrescriptionInput = z.infer<typeof createElasticPrescriptionSchema>;
export type UpdateElasticPrescriptionInput = z.infer<typeof updateElasticPrescriptionSchema>;
export type ElasticPrescriptionQuery = z.infer<typeof elasticPrescriptionQuerySchema>;

export type CreateApplianceActivationInput = z.infer<typeof createApplianceActivationSchema>;
export type UpdateApplianceActivationInput = z.infer<typeof updateApplianceActivationSchema>;
export type ApplianceActivationQuery = z.infer<typeof applianceActivationQuerySchema>;

// =============================================================================
// Treatment Option Schemas
// =============================================================================

export const TreatmentOptionStatusEnum = z.enum([
  'DRAFT',
  'PRESENTED',
  'SELECTED',
  'DECLINED',
  'ARCHIVED',
]);

export const ApplianceSystemTypeEnum = z.enum([
  'METAL_BRACKETS',
  'CERAMIC_BRACKETS',
  'SELF_LIGATING',
  'LINGUAL',
  'CLEAR_ALIGNERS',
  'COMBINATION',
  'FUNCTIONAL',
  'SURGICAL',
  'RETENTION_ONLY',
]);

export const createTreatmentOptionSchema = z.object({
  // Required fields
  treatmentPlanId: z.string().min(1, 'Treatment plan is required'),
  optionNumber: z.number().int().min(1),
  optionName: z.string().min(1, 'Option name is required').max(200),
  applianceSystem: ApplianceSystemTypeEnum,

  // Optional fields
  description: z.string().max(5000).optional().nullable(),
  applianceDetails: z.string().max(500).optional().nullable(),

  // Duration and cost
  estimatedDuration: z.number().int().min(1).max(60).optional().nullable(),
  estimatedVisits: z.number().int().min(1).max(200).optional().nullable(),
  estimatedCost: z.number().min(0).optional().nullable(),

  // Recommendation
  isRecommended: z.boolean().default(false),
  recommendationNotes: z.string().max(2000).optional().nullable(),

  // Pros and Cons
  advantages: z.array(z.string().max(500)).default([]),
  disadvantages: z.array(z.string().max(500)).default([]),

  // Status
  status: TreatmentOptionStatusEnum.default('DRAFT'),
});

export const updateTreatmentOptionSchema = createTreatmentOptionSchema.partial().omit({ treatmentPlanId: true });

export const treatmentOptionQuerySchema = z.object({
  treatmentPlanId: z.string().optional(),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    TreatmentOptionStatusEnum.optional()
  ),
  applianceSystem: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    ApplianceSystemTypeEnum.optional()
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'optionNumber', 'optionName']).default('optionNumber'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const selectTreatmentOptionSchema = z.object({
  selectedDate: z.coerce.date().optional(),
  selectionNotes: z.string().max(2000).optional().nullable(),
});

// =============================================================================
// Case Presentation Schemas
// =============================================================================

export const CasePresentationOutcomeEnum = z.enum([
  'ACCEPTED',
  'DECLINED',
  'THINKING',
  'FOLLOW_UP_NEEDED',
  'SECOND_OPINION',
  'RESCHEDULED',
]);

export const createCasePresentationSchema = z.object({
  // Required fields
  treatmentPlanId: z.string().min(1, 'Treatment plan is required'),
  patientId: z.string().min(1, 'Patient is required'),
  presentationDate: z.coerce.date(),
  presentedById: z.string().min(1, 'Presenter is required'),

  // Optional fields
  presentationType: z.enum(['IN_PERSON', 'VIRTUAL']).default('IN_PERSON'),
  location: z.string().max(200).optional().nullable(),

  // Attendees
  attendees: z.array(z.string().max(200)).default([]),
  guardianPresent: z.boolean().default(false),
  guardianName: z.string().max(200).optional().nullable(),

  // Content presented
  treatmentOptionsPresented: z.array(z.string()).default([]),
  visualsUsed: z.array(z.enum(['PHOTOS', 'XRAYS', 'MODELS', 'SIMULATIONS', 'VIDEO'])).default([]),
  materialsProvided: z.array(z.string().max(200)).default([]),

  // Outcome
  outcome: CasePresentationOutcomeEnum.default('THINKING'),
  outcomeNotes: z.string().max(2000).optional().nullable(),
  patientQuestions: z.array(z.string().max(500)).default([]),
  patientConcerns: z.array(z.string().max(500)).default([]),

  // Follow-up
  followUpRequired: z.boolean().default(false),
  followUpDate: z.coerce.date().optional().nullable(),
  followUpNotes: z.string().max(2000).optional().nullable(),

  // Duration
  durationMinutes: z.number().int().min(1).max(480).optional().nullable(),
});

export const updateCasePresentationSchema = createCasePresentationSchema.partial().omit({
  treatmentPlanId: true,
  patientId: true,
});

export const casePresentationQuerySchema = z.object({
  treatmentPlanId: z.string().optional(),
  patientId: z.string().optional(),
  presentedById: z.string().optional(),
  outcome: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    CasePresentationOutcomeEnum.optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'presentationDate', 'outcome']).default('presentationDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// Case Acceptance Schemas
// =============================================================================

export const CaseAcceptanceStatusEnum = z.enum([
  'PENDING',
  'PARTIALLY_SIGNED',
  'FULLY_SIGNED',
  'EXPIRED',
  'WITHDRAWN',
]);

export const createCaseAcceptanceSchema = z.object({
  // Required fields
  treatmentPlanId: z.string().min(1, 'Treatment plan is required'),
  patientId: z.string().min(1, 'Patient is required'),

  // Optional links
  casePresentationId: z.string().optional().nullable(),
  selectedOptionId: z.string().optional().nullable(),

  // Financial terms
  totalTreatmentCost: z.number().min(0).optional().nullable(),
  downPayment: z.number().min(0).optional().nullable(),
  monthlyPayment: z.number().min(0).optional().nullable(),
  paymentPlanMonths: z.number().int().min(1).max(60).optional().nullable(),
  insuranceEstimate: z.number().min(0).optional().nullable(),
  patientResponsibility: z.number().min(0).optional().nullable(),

  // Guardian info (if minor)
  guardianName: z.string().max(200).optional().nullable(),
  guardianRelation: z.string().max(100).optional().nullable(),

  // Notes
  specialConditions: z.string().max(2000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateCaseAcceptanceSchema = z.object({
  // Consent tracking
  informedConsentSigned: z.boolean().optional(),
  informedConsentDate: z.coerce.date().optional().nullable(),
  financialAgreementSigned: z.boolean().optional(),
  financialAgreementDate: z.coerce.date().optional().nullable(),
  hipaaAcknowledged: z.boolean().optional(),
  hipaaAcknowledgedDate: z.coerce.date().optional().nullable(),
  photoReleaseConsent: z.boolean().optional(),
  photoReleaseDate: z.coerce.date().optional().nullable(),

  // Financial terms (updatable)
  totalTreatmentCost: z.number().min(0).optional().nullable(),
  downPayment: z.number().min(0).optional().nullable(),
  monthlyPayment: z.number().min(0).optional().nullable(),
  paymentPlanMonths: z.number().int().min(1).max(60).optional().nullable(),
  insuranceEstimate: z.number().min(0).optional().nullable(),
  patientResponsibility: z.number().min(0).optional().nullable(),

  // Signatures
  patientSignature: z.string().optional().nullable(),
  patientSignedDate: z.coerce.date().optional().nullable(),
  guardianSignature: z.string().optional().nullable(),
  guardianSignedDate: z.coerce.date().optional().nullable(),
  guardianName: z.string().max(200).optional().nullable(),
  guardianRelation: z.string().max(100).optional().nullable(),

  // Witness
  witnessedById: z.string().optional().nullable(),
  witnessedDate: z.coerce.date().optional().nullable(),

  // Documents
  documentUrls: z.array(z.string().url()).optional(),

  // Selected option
  selectedOptionId: z.string().optional().nullable(),

  // Notes
  specialConditions: z.string().max(2000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),

  // Status
  status: CaseAcceptanceStatusEnum.optional(),
});

export const caseAcceptanceQuerySchema = z.object({
  treatmentPlanId: z.string().optional(),
  patientId: z.string().optional(),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    CaseAcceptanceStatusEnum.optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'acceptedDate', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Sign case acceptance (final patient/guardian signature)
export const signCaseAcceptanceSchema = z.object({
  patientSignature: z.string().min(1, 'Patient signature is required'),
  patientSignedDate: z.coerce.date().optional(),
  guardianSignature: z.string().optional().nullable(),
  guardianSignedDate: z.coerce.date().optional().nullable(),
  witnessedById: z.string().optional().nullable(),
});

// =============================================================================
// Plan Modification Schemas
// =============================================================================

export const PlanModificationTypeEnum = z.enum([
  'MINOR_ADJUSTMENT',
  'PHASE_ADDITION',
  'PHASE_REMOVAL',
  'APPLIANCE_CHANGE',
  'DURATION_EXTENSION',
  'DURATION_REDUCTION',
  'TREATMENT_UPGRADE',
  'TREATMENT_DOWNGRADE',
  'FEE_ADJUSTMENT',
  'PROVIDER_CHANGE',
  'GOAL_MODIFICATION',
  'CLINICAL_PROTOCOL',
  'OTHER',
]);

// Types that require a new version (significant changes)
export const VERSION_CREATING_MODIFICATIONS = [
  'APPLIANCE_CHANGE',
  'DURATION_EXTENSION',
  'TREATMENT_UPGRADE',
  'TREATMENT_DOWNGRADE',
  'FEE_ADJUSTMENT',
] as const;

// Types that require patient acknowledgment
export const ACKNOWLEDGMENT_REQUIRED_MODIFICATIONS = [
  'APPLIANCE_CHANGE',
  'DURATION_EXTENSION',
  'TREATMENT_UPGRADE',
  'FEE_ADJUSTMENT',
] as const;

// Types that require new consent
export const CONSENT_REQUIRED_MODIFICATIONS = [
  'APPLIANCE_CHANGE',
  'TREATMENT_UPGRADE',
] as const;

export const createPlanModificationSchema = z.object({
  // Required fields
  treatmentPlanId: z.string().min(1, 'Treatment plan is required'),
  modificationType: PlanModificationTypeEnum,
  changeDescription: z.string().min(1, 'Change description is required').max(2000),
  reason: z.string().min(1, 'Reason for change is required').max(2000),

  // Optional details
  changedFields: z.record(z.string(), z.object({
    old: z.unknown(),
    new: z.unknown(),
  })).optional().nullable(),

  // Financial impact
  previousFee: z.number().min(0).optional().nullable(),
  newFee: z.number().min(0).optional().nullable(),

  // Actual changes to the plan (applied along with modification record)
  planUpdates: z.object({
    planType: z.string().max(100).optional().nullable(),
    treatmentDescription: z.string().max(5000).optional().nullable(),
    treatmentGoals: z.array(z.string().max(500)).optional(),
    primaryProviderId: z.string().optional().nullable(),
    supervisingProviderId: z.string().optional().nullable(),
    estimatedDuration: z.number().int().min(1).max(60).optional().nullable(),
    estimatedVisits: z.number().int().min(1).max(200).optional().nullable(),
    totalFee: z.number().min(0).optional().nullable(),
    estimatedEndDate: z.coerce.date().optional().nullable(),
  }).optional(),

  // Force acknowledgment even if type doesn't require it
  forceAcknowledgment: z.boolean().default(false),
});

export const acknowledgePlanModificationSchema = z.object({
  acknowledgmentMethod: z.enum(['signature', 'verbal', 'portal', 'written']),
  acknowledgmentNotes: z.string().max(2000).optional().nullable(),
  patientSignature: z.string().optional().nullable(), // For signature method
});

export const planModificationQuerySchema = z.object({
  treatmentPlanId: z.string().optional(),
  patientId: z.string().optional(),
  modificationType: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    PlanModificationTypeEnum.optional()
  ),
  createsNewVersion: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  requiresAcknowledgment: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  pendingAcknowledgment: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'modificationDate', 'modificationType']).default('modificationDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports for new schemas
export type CreateTreatmentOptionInput = z.infer<typeof createTreatmentOptionSchema>;
export type UpdateTreatmentOptionInput = z.infer<typeof updateTreatmentOptionSchema>;
export type TreatmentOptionQuery = z.infer<typeof treatmentOptionQuerySchema>;

export type CreateCasePresentationInput = z.infer<typeof createCasePresentationSchema>;
export type UpdateCasePresentationInput = z.infer<typeof updateCasePresentationSchema>;
export type CasePresentationQuery = z.infer<typeof casePresentationQuerySchema>;

export type CreateCaseAcceptanceInput = z.infer<typeof createCaseAcceptanceSchema>;
export type UpdateCaseAcceptanceInput = z.infer<typeof updateCaseAcceptanceSchema>;
export type CaseAcceptanceQuery = z.infer<typeof caseAcceptanceQuerySchema>;

export type CreatePlanModificationInput = z.infer<typeof createPlanModificationSchema>;
export type AcknowledgePlanModificationInput = z.infer<typeof acknowledgePlanModificationSchema>;
export type PlanModificationQuery = z.infer<typeof planModificationQuerySchema>;

// =============================================================================
// Visit Record Schemas
// =============================================================================

export const VisitRecordStatusEnum = z.enum([
  'IN_PROGRESS',
  'COMPLETE',
  'INCOMPLETE',
  'CANCELLED',
]);

export const createVisitRecordSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  appointmentId: z.string().optional().nullable(),
  treatmentPlanId: z.string().optional().nullable(),
  visitDate: z.coerce.date().optional(),
  visitType: ProgressNoteTypeEnum,
  primaryProviderId: z.string().min(1, 'Primary provider is required'),
  assistingStaffIds: z.array(z.string()).default([]),
  chiefComplaint: z.string().max(2000).optional().nullable(),
});

export const updateVisitRecordSchema = z.object({
  visitType: ProgressNoteTypeEnum.optional(),
  status: VisitRecordStatusEnum.optional(),
  primaryProviderId: z.string().optional(),
  assistingStaffIds: z.array(z.string()).optional(),
  chiefComplaint: z.string().max(2000).optional().nullable(),
  visitSummary: z.string().max(5000).optional().nullable(),
  nextVisitRecommendation: z.string().max(2000).optional().nullable(),
  checkInTime: z.coerce.date().optional().nullable(),
  checkOutTime: z.coerce.date().optional().nullable(),
  treatmentDuration: z.number().int().min(0).max(480).optional().nullable(),
  progressNoteId: z.string().optional().nullable(),
  procedureIds: z.array(z.string()).optional(),
  findingIds: z.array(z.string()).optional(),
  measurementIds: z.array(z.string()).optional(),
  imageIds: z.array(z.string()).optional(),
});

export const completeVisitRecordSchema = z.object({
  visitSummary: z.string().min(1, 'Visit summary is required').max(5000),
  nextVisitRecommendation: z.string().max(2000).optional().nullable(),
});

export const visitRecordQuerySchema = z.object({
  patientId: z.string().optional(),
  appointmentId: z.string().optional(),
  treatmentPlanId: z.string().optional(),
  primaryProviderId: z.string().optional(),
  visitType: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    ProgressNoteTypeEnum.optional()
  ),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    VisitRecordStatusEnum.optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  incompleteOnly: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['visitDate', 'createdAt', 'status']).default('visitDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateVisitRecordInput = z.infer<typeof createVisitRecordSchema>;
export type UpdateVisitRecordInput = z.infer<typeof updateVisitRecordSchema>;
export type CompleteVisitRecordInput = z.infer<typeof completeVisitRecordSchema>;
export type VisitRecordQuery = z.infer<typeof visitRecordQuerySchema>;

// =============================================================================
// TREATMENT TRACKING - Progress, Debond, Retention, Outcomes
// =============================================================================

// Progress Status Enum
export const ProgressStatusEnum = z.enum([
  'ON_TRACK',
  'AHEAD',
  'BEHIND',
  'SIGNIFICANTLY_BEHIND',
  'PAUSED',
]);

// Retention Phase Enum
export const RetentionPhaseEnum = z.enum([
  'INITIAL',
  'TRANSITION',
  'MAINTENANCE',
  'LONG_TERM',
]);

// Note: RetentionWearScheduleEnum is already defined earlier in this file (line ~527)

// Patient Compliance Level Enum
export const PatientComplianceLevelEnum = z.enum([
  'EXCELLENT',
  'GOOD',
  'FAIR',
  'POOR',
  'NON_COMPLIANT',
]);

// Retainer Condition Enum
export const RetainerConditionEnum = z.enum([
  'GOOD',
  'WORN',
  'DAMAGED',
  'LOST',
  'NEEDS_REPLACEMENT',
]);

// Stability Status Enum
export const StabilityStatusEnum = z.enum([
  'STABLE',
  'MINOR_RELAPSE',
  'SIGNIFICANT_RELAPSE',
  'REQUIRES_TREATMENT',
]);

// Outcome Rating Enum
export const OutcomeRatingEnum = z.enum([
  'EXCELLENT',
  'GOOD',
  'SATISFACTORY',
  'FAIR',
  'POOR',
  'INCOMPLETE',
]);

// ============================================================================
// Treatment Progress Schemas
// ============================================================================

export const createTreatmentProgressSchema = z.object({
  treatmentPlanId: z.string().min(1, 'Treatment plan is required'),
  patientId: z.string().min(1, 'Patient is required'),
  status: ProgressStatusEnum.default('ON_TRACK'),
  percentComplete: z.number().min(0).max(100),
  currentPhase: z.string().max(200).optional().nullable(),
  currentPhaseNumber: z.number().int().min(1).optional().nullable(),
  completedVisits: z.number().int().min(0).default(0),
  expectedVisits: z.number().int().min(0).optional().nullable(),
  totalPlannedVisits: z.number().int().min(0).optional().nullable(),
  missedAppointments: z.number().int().min(0).default(0),
  daysInTreatment: z.number().int().min(0).optional().nullable(),
  expectedDays: z.number().int().min(0).optional().nullable(),
  estimatedDaysRemaining: z.number().int().min(0).optional().nullable(),
  milestonesAchieved: z.number().int().min(0).default(0),
  totalMilestones: z.number().int().min(0).optional().nullable(),
  nextMilestone: z.string().max(200).optional().nullable(),
  nextMilestoneDate: z.coerce.date().optional().nullable(),
  complianceScore: z.number().min(0).max(100).optional().nullable(),
  complianceNotes: z.string().max(1000).optional().nullable(),
  clinicalProgress: z.string().max(5000).optional().nullable(),
  concerns: z.array(z.string().max(500)).default([]),
  recommendations: z.array(z.string().max(500)).default([]),
  daysAhead: z.number().int().optional().nullable(),
  varianceReason: z.string().max(500).optional().nullable(),
});

export const treatmentProgressQuerySchema = z.object({
  treatmentPlanId: z.string().optional(),
  patientId: z.string().optional(),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    ProgressStatusEnum.optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['snapshotDate', 'percentComplete', 'status']).default('snapshotDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// Debond Readiness Schemas
// ============================================================================

export const createDebondReadinessSchema = z.object({
  treatmentPlanId: z.string().min(1, 'Treatment plan is required'),
  patientId: z.string().min(1, 'Patient is required'),
  alignmentComplete: z.boolean().default(false),
  spaceClosure: z.boolean().default(false),
  overbiteCorrection: z.boolean().default(false),
  overjetCorrection: z.boolean().default(false),
  midlineAlignment: z.boolean().default(false),
  occlusionSatisfactory: z.boolean().default(false),
  patientSatisfied: z.boolean().default(false),
  rootParallelism: z.boolean().default(false),
  marginalRidges: z.boolean().default(false),
  interproximalContacts: z.boolean().default(false),
  additionalCriteria: z.any().optional().nullable(),
  isReady: z.boolean().default(false),
  notReadyReasons: z.array(z.string().max(500)).default([]),
  clinicalNotes: z.string().max(5000).optional().nullable(),
  recommendations: z.array(z.string().max(500)).default([]),
  scheduledDebondDate: z.coerce.date().optional().nullable(),
});

export const updateDebondReadinessSchema = createDebondReadinessSchema.partial().omit({
  treatmentPlanId: true,
  patientId: true,
});

export const approveDebondReadinessSchema = z.object({
  approvalNotes: z.string().max(2000).optional().nullable(),
  scheduledDebondDate: z.coerce.date().optional().nullable(),
});

export const debondReadinessQuerySchema = z.object({
  treatmentPlanId: z.string().optional(),
  patientId: z.string().optional(),
  isReady: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  debondCompleted: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['assessmentDate', 'scheduledDebondDate', 'readinessScore']).default('assessmentDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// Retention Protocol Schemas
// ============================================================================

export const createRetentionProtocolSchema = z.object({
  treatmentPlanId: z.string().min(1, 'Treatment plan is required'),
  patientId: z.string().min(1, 'Patient is required'),
  debondDate: z.coerce.date().optional().nullable(),
  currentPhase: RetentionPhaseEnum.default('INITIAL'),
  wearSchedule: RetentionWearScheduleEnum.default('FULL_TIME'),
  wearHoursPerDay: z.number().int().min(0).max(24).optional().nullable(),
  wearInstructions: z.string().max(2000).optional().nullable(),
  upperRetainerType: z.string().max(100).optional().nullable(),
  lowerRetainerType: z.string().max(100).optional().nullable(),
  upperRetainerId: z.string().optional().nullable(),
  lowerRetainerId: z.string().optional().nullable(),
  complianceStatus: PatientComplianceLevelEnum.default('EXCELLENT'),
  checkIntervalMonths: z.number().int().min(1).max(24).default(6),
  nextCheckDate: z.coerce.date().optional().nullable(),
  stabilityStatus: StabilityStatusEnum.default('STABLE'),
  stabilityNotes: z.string().max(2000).optional().nullable(),
  currentNotes: z.string().max(2000).optional().nullable(),
});

export const updateRetentionProtocolSchema = createRetentionProtocolSchema.partial().omit({
  treatmentPlanId: true,
  patientId: true,
});

export const advanceRetentionPhaseSchema = z.object({
  newPhase: RetentionPhaseEnum,
  newWearSchedule: RetentionWearScheduleEnum.optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const retentionProtocolQuerySchema = z.object({
  treatmentPlanId: z.string().optional(),
  patientId: z.string().optional(),
  currentPhase: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    RetentionPhaseEnum.optional()
  ),
  isActive: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  checksDue: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['startDate', 'nextCheckDate', 'currentPhase']).default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// Retention Check Schemas
// ============================================================================

export const createRetentionCheckSchema = z.object({
  retentionProtocolId: z.string().min(1, 'Retention protocol is required'),
  patientId: z.string().min(1, 'Patient is required'),
  checkNumber: z.number().int().min(1),
  wearScheduleFollowed: z.boolean().optional().nullable(),
  reportedWearHours: z.number().int().min(0).max(24).optional().nullable(),
  complianceStatus: PatientComplianceLevelEnum.optional().nullable(),
  upperRetainerCondition: RetainerConditionEnum.optional().nullable(),
  lowerRetainerCondition: RetainerConditionEnum.optional().nullable(),
  retainerFit: z.string().max(100).optional().nullable(),
  stabilityStatus: StabilityStatusEnum.optional().nullable(),
  movementObserved: z.array(z.string().max(200)).default([]),
  measurementsJson: z.any().optional().nullable(),
  adjustmentsMade: z.array(z.string().max(200)).default([]),
  retainerReplaced: z.boolean().default(false),
  newRetainerOrdered: z.boolean().default(false),
  clinicalFindings: z.string().max(5000).optional().nullable(),
  patientConcerns: z.string().max(2000).optional().nullable(),
  instructions: z.string().max(2000).optional().nullable(),
  recommendations: z.array(z.string().max(500)).default([]),
  phaseAdvanced: z.boolean().default(false),
  newPhase: RetentionPhaseEnum.optional().nullable(),
  newWearSchedule: RetentionWearScheduleEnum.optional().nullable(),
  nextCheckDate: z.coerce.date().optional().nullable(),
});

export const updateRetentionCheckSchema = createRetentionCheckSchema.partial().omit({
  retentionProtocolId: true,
  patientId: true,
  checkNumber: true,
});

export const retentionCheckQuerySchema = z.object({
  retentionProtocolId: z.string().optional(),
  patientId: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['checkDate', 'checkNumber']).default('checkDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// Treatment Outcome Schemas
// ============================================================================

export const createTreatmentOutcomeSchema = z.object({
  treatmentPlanId: z.string().min(1, 'Treatment plan is required'),
  patientId: z.string().min(1, 'Patient is required'),
  treatmentStartDate: z.coerce.date().optional().nullable(),
  treatmentEndDate: z.coerce.date().optional().nullable(),
  totalDurationMonths: z.number().int().min(0).optional().nullable(),
  totalVisits: z.number().int().min(0).optional().nullable(),
  overallRating: OutcomeRatingEnum.default('GOOD'),
  objectivesAchieved: z.array(z.string().max(500)).default([]),
  objectivesPartial: z.array(z.string().max(500)).default([]),
  objectivesNotMet: z.array(z.string().max(500)).default([]),
  alignmentScore: z.number().min(0).max(100).optional().nullable(),
  occlusionScore: z.number().min(0).max(100).optional().nullable(),
  aestheticScore: z.number().min(0).max(100).optional().nullable(),
  functionalScore: z.number().min(0).max(100).optional().nullable(),
  initialMeasurements: z.any().optional().nullable(),
  finalMeasurements: z.any().optional().nullable(),
  patientSatisfactionScore: z.number().int().min(1).max(10).optional().nullable(),
  patientFeedback: z.string().max(5000).optional().nullable(),
  wouldRecommend: z.boolean().optional().nullable(),
  clinicalNotes: z.string().max(5000).optional().nullable(),
  treatmentChallenges: z.array(z.string().max(500)).default([]),
  lessonsLearned: z.string().max(5000).optional().nullable(),
  wouldDoAnythingDifferent: z.string().max(5000).optional().nullable(),
  followUpRecommendations: z.array(z.string().max(500)).default([]),
  retentionProtocolId: z.string().optional().nullable(),
  beforePhotoIds: z.array(z.string()).default([]),
  afterPhotoIds: z.array(z.string()).default([]),
});

export const updateTreatmentOutcomeSchema = createTreatmentOutcomeSchema.partial().omit({
  treatmentPlanId: true,
  patientId: true,
});

export const treatmentOutcomeQuerySchema = z.object({
  treatmentPlanId: z.string().optional(),
  patientId: z.string().optional(),
  overallRating: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    OutcomeRatingEnum.optional()
  ),
  assessedById: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['assessmentDate', 'overallRating', 'patientSatisfactionScore']).default('assessmentDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports for Treatment Tracking
export type CreateTreatmentProgressInput = z.infer<typeof createTreatmentProgressSchema>;
export type TreatmentProgressQuery = z.infer<typeof treatmentProgressQuerySchema>;

export type CreateDebondReadinessInput = z.infer<typeof createDebondReadinessSchema>;
export type UpdateDebondReadinessInput = z.infer<typeof updateDebondReadinessSchema>;
export type ApproveDebondReadinessInput = z.infer<typeof approveDebondReadinessSchema>;
export type DebondReadinessQuery = z.infer<typeof debondReadinessQuerySchema>;

export type CreateRetentionProtocolInput = z.infer<typeof createRetentionProtocolSchema>;
export type UpdateRetentionProtocolInput = z.infer<typeof updateRetentionProtocolSchema>;
export type AdvanceRetentionPhaseInput = z.infer<typeof advanceRetentionPhaseSchema>;
export type RetentionProtocolQuery = z.infer<typeof retentionProtocolQuerySchema>;

export type CreateRetentionCheckInput = z.infer<typeof createRetentionCheckSchema>;
export type UpdateRetentionCheckInput = z.infer<typeof updateRetentionCheckSchema>;
export type RetentionCheckQuery = z.infer<typeof retentionCheckQuerySchema>;

export type CreateTreatmentOutcomeInput = z.infer<typeof createTreatmentOutcomeSchema>;
export type UpdateTreatmentOutcomeInput = z.infer<typeof updateTreatmentOutcomeSchema>;
export type TreatmentOutcomeQuery = z.infer<typeof treatmentOutcomeQuerySchema>;

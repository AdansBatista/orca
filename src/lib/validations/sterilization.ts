import { z } from 'zod';

// =============================================================================
// Enums (matching Prisma schema)
// =============================================================================

export const SterilizationCycleTypeEnum = z.enum([
  'STEAM_GRAVITY',
  'STEAM_PREVACUUM',
  'STEAM_FLASH',
  'CHEMICAL',
  'DRY_HEAT',
  'VALIDATION',
]);

export const CycleStatusEnum = z.enum([
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
  'ABORTED',
  'VOID',
]);

export const LoadItemTypeEnum = z.enum([
  'INSTRUMENT_PACK',
  'INSTRUMENT_SET',
  'HANDPIECE',
  'BUR_BLOCK',
  'IMPLANT_KIT',
  'ORTHODONTIC_TRAY',
  'LOOSE_ITEMS',
  'OTHER',
]);

export const BiologicalTestResultEnum = z.enum([
  'PENDING',
  'PASSED',
  'FAILED',
  'INCONCLUSIVE',
]);

export const ChemicalIndicatorClassEnum = z.enum([
  'CLASS_1',
  'CLASS_2',
  'CLASS_3',
  'CLASS_4',
  'CLASS_5',
  'CLASS_6',
]);

export const ChemicalIndicatorResultEnum = z.enum([
  'PASSED',
  'FAILED',
  'INCONCLUSIVE',
]);

export const InstrumentSetCategoryEnum = z.enum([
  'ORTHODONTIC',
  'BONDING',
  'DEBONDING',
  'ADJUSTMENT',
  'IMPRESSION',
  'SURGICAL',
  'GENERAL',
  'HYGIENE',
  'OTHER',
]);

export const InstrumentSetStatusEnum = z.enum([
  'AVAILABLE',
  'IN_USE',
  'DIRTY',
  'PROCESSING',
  'QUARANTINE',
  'MAINTENANCE',
  'RETIRED',
]);

export const ComplianceLogTypeEnum = z.enum([
  'WEEKLY_BI_TEST',
  'MONTHLY_AUDIT',
  'EQUIPMENT_VALIDATION',
  'INCIDENT_REPORT',
  'CORRECTIVE_ACTION',
  'TRAINING_RECORD',
  'INSPECTION',
  'POLICY_REVIEW',
  'OTHER',
]);

export const PackageTypeEnum = z.enum([
  'CASSETTE_FULL',
  'CASSETTE_EXAM',
  'POUCH',
  'WRAPPED',
  'INDIVIDUAL',
]);

export const PackageStatusEnum = z.enum([
  'STERILE',
  'USED',
  'EXPIRED',
  'COMPROMISED',
  'RECALLED',
]);

// =============================================================================
// Sterilization Cycle Schemas
// =============================================================================

export const createSterilizationCycleSchema = z.object({
  // Required fields
  equipmentId: z.string().min(1, 'Equipment is required'),
  cycleType: SterilizationCycleTypeEnum,
  startTime: z.coerce.date(),

  // Optional fields
  endTime: z.coerce.date().optional().nullable(),
  temperature: z.number().positive().optional().nullable(),
  pressure: z.number().positive().optional().nullable(),
  exposureTime: z.number().int().positive().optional().nullable(),
  dryingTime: z.number().int().positive().optional().nullable(),
  status: CycleStatusEnum.optional().default('IN_PROGRESS'),
  mechanicalPass: z.boolean().optional().nullable(),
  chemicalPass: z.boolean().optional().nullable(),
  biologicalPass: z.boolean().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  failureReason: z.string().max(1000).optional().nullable(),
});

export const updateSterilizationCycleSchema = createSterilizationCycleSchema.partial();

export const completeSterilizationCycleSchema = z.object({
  endTime: z.coerce.date(),
  status: z.enum(['COMPLETED', 'FAILED', 'ABORTED']),
  mechanicalPass: z.boolean().optional().nullable(),
  chemicalPass: z.boolean().optional().nullable(),
  biologicalPass: z.boolean().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  failureReason: z.string().max(1000).optional().nullable(),
});

export const sterilizationCycleQuerySchema = z.object({
  search: z.string().optional(),
  equipmentId: z.string().optional(),
  cycleType: SterilizationCycleTypeEnum.optional(),
  status: CycleStatusEnum.optional(),
  operatorId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum(['cycleNumber', 'startTime', 'status', 'cycleType', 'createdAt'])
    .optional()
    .default('startTime'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// =============================================================================
// Sterilization Load Schemas
// =============================================================================

export const createSterilizationLoadSchema = z.object({
  cycleId: z.string().min(1, 'Cycle is required'),
  loadNumber: z.number().int().positive(),
  itemType: LoadItemTypeEnum,
  itemDescription: z.string().min(1, 'Item description is required').max(500),
  quantity: z.number().int().positive().optional().default(1),
  instrumentSetId: z.string().optional().nullable(),
  packBarcode: z.string().max(100).optional().nullable(),
  position: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const updateSterilizationLoadSchema = createSterilizationLoadSchema.partial().omit({ cycleId: true });

// =============================================================================
// Biological Indicator Schemas
// =============================================================================

export const createBiologicalIndicatorSchema = z.object({
  cycleId: z.string().optional().nullable(),
  lotNumber: z.string().min(1, 'Lot number is required').max(100),
  brand: z.string().max(100).optional().nullable(),
  testDate: z.coerce.date(),
  readDate: z.coerce.date().optional().nullable(),
  incubationHours: z.number().int().positive().optional().nullable(),
  result: BiologicalTestResultEnum.optional().default('PENDING'),
  controlPassed: z.boolean().optional().nullable(),
  readerType: z.string().max(100).optional().nullable(),
  readerId: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateBiologicalIndicatorSchema = createBiologicalIndicatorSchema.partial();

export const recordBiologicalResultSchema = z.object({
  readDate: z.coerce.date(),
  result: z.enum(['PASSED', 'FAILED', 'INCONCLUSIVE']),
  controlPassed: z.boolean().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const biologicalIndicatorQuerySchema = z.object({
  cycleId: z.string().optional(),
  result: BiologicalTestResultEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  lotNumber: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum(['testDate', 'readDate', 'result', 'createdAt'])
    .optional()
    .default('testDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// =============================================================================
// Chemical Indicator Schemas
// =============================================================================

export const createChemicalIndicatorSchema = z.object({
  cycleId: z.string().min(1, 'Cycle is required'),
  indicatorClass: ChemicalIndicatorClassEnum,
  indicatorType: z.string().max(100).optional().nullable(),
  loadPosition: z.string().max(100).optional().nullable(),
  result: ChemicalIndicatorResultEnum,
  colorChange: z.string().max(200).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const updateChemicalIndicatorSchema = createChemicalIndicatorSchema.partial().omit({ cycleId: true });

// =============================================================================
// Instrument Set Schemas
// =============================================================================

export const createInstrumentSetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  setNumber: z
    .string()
    .min(1, 'Set number is required')
    .max(20)
    .regex(/^[A-Z0-9-]+$/, 'Set number must be uppercase letters, numbers, and hyphens only'),
  barcode: z.string().max(100).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  instrumentCount: z.number().int().positive(),
  category: InstrumentSetCategoryEnum,
  status: InstrumentSetStatusEnum.optional().default('AVAILABLE'),
  currentLocation: z.string().max(100).optional().nullable(),
  assemblyDate: z.coerce.date().optional().nullable(),
  expirationDays: z.number().int().positive().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateInstrumentSetSchema = createInstrumentSetSchema.partial();

export const updateInstrumentSetStatusSchema = z.object({
  status: InstrumentSetStatusEnum,
  currentLocation: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const instrumentSetQuerySchema = z.object({
  search: z.string().optional(),
  category: InstrumentSetCategoryEnum.optional(),
  status: InstrumentSetStatusEnum.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum(['name', 'setNumber', 'category', 'status', 'lastSterilizedAt', 'createdAt'])
    .optional()
    .default('setNumber'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// =============================================================================
// Compliance Log Schemas
// =============================================================================

export const createComplianceLogSchema = z.object({
  logType: ComplianceLogTypeEnum,
  logDate: z.coerce.date().optional(),
  referenceType: z.string().max(50).optional().nullable(),
  referenceId: z.string().optional().nullable(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  action: z.string().max(1000).optional().nullable(),
  outcome: z.string().max(1000).optional().nullable(),
  isCompliant: z.boolean().optional().default(true),
  deficiencyFound: z.boolean().optional().default(false),
  correctiveAction: z.string().max(2000).optional().nullable(),
  attachments: z.array(z.string()).optional().default([]),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateComplianceLogSchema = createComplianceLogSchema.partial();

export const complianceLogQuerySchema = z.object({
  logType: ComplianceLogTypeEnum.optional(),
  isCompliant: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  deficiencyFound: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum(['logDate', 'logType', 'isCompliant', 'createdAt'])
    .optional()
    .default('logDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// =============================================================================
// Type Exports
// =============================================================================

export type CreateSterilizationCycleInput = z.infer<typeof createSterilizationCycleSchema>;
export type UpdateSterilizationCycleInput = z.infer<typeof updateSterilizationCycleSchema>;
export type CompleteSterilizationCycleInput = z.infer<typeof completeSterilizationCycleSchema>;
export type SterilizationCycleQueryInput = z.infer<typeof sterilizationCycleQuerySchema>;

export type CreateSterilizationLoadInput = z.infer<typeof createSterilizationLoadSchema>;
export type UpdateSterilizationLoadInput = z.infer<typeof updateSterilizationLoadSchema>;

export type CreateBiologicalIndicatorInput = z.infer<typeof createBiologicalIndicatorSchema>;
export type UpdateBiologicalIndicatorInput = z.infer<typeof updateBiologicalIndicatorSchema>;
export type RecordBiologicalResultInput = z.infer<typeof recordBiologicalResultSchema>;
export type BiologicalIndicatorQueryInput = z.infer<typeof biologicalIndicatorQuerySchema>;

export type CreateChemicalIndicatorInput = z.infer<typeof createChemicalIndicatorSchema>;
export type UpdateChemicalIndicatorInput = z.infer<typeof updateChemicalIndicatorSchema>;

export type CreateInstrumentSetInput = z.infer<typeof createInstrumentSetSchema>;
export type UpdateInstrumentSetInput = z.infer<typeof updateInstrumentSetSchema>;
export type UpdateInstrumentSetStatusInput = z.infer<typeof updateInstrumentSetStatusSchema>;
export type InstrumentSetQueryInput = z.infer<typeof instrumentSetQuerySchema>;

export type CreateComplianceLogInput = z.infer<typeof createComplianceLogSchema>;
export type UpdateComplianceLogInput = z.infer<typeof updateComplianceLogSchema>;
export type ComplianceLogQueryInput = z.infer<typeof complianceLogQuerySchema>;

// =============================================================================
// Instrument Package Schemas
// =============================================================================

export const createInstrumentPackageSchema = z.object({
  cycleId: z.string().min(1, 'Sterilization cycle is required'),
  packageType: PackageTypeEnum,
  instrumentSetId: z.string().optional().nullable(),
  instrumentNames: z.array(z.string()).min(1, 'At least one instrument name is required'),
  itemCount: z.number().int().positive().optional().default(1),
  cassetteName: z.string().max(100).optional().nullable(),
  expirationDays: z.number().int().positive().max(365).optional().default(30),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateInstrumentPackageSchema = z.object({
  packageType: PackageTypeEnum.optional(),
  instrumentSetId: z.string().optional().nullable(),
  instrumentNames: z.array(z.string()).optional(),
  itemCount: z.number().int().positive().optional(),
  cassetteName: z.string().max(100).optional().nullable(),
  status: PackageStatusEnum.optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export const instrumentPackageQuerySchema = z.object({
  search: z.string().optional(),
  cycleId: z.string().optional(),
  packageType: PackageTypeEnum.optional(),
  status: PackageStatusEnum.optional(),
  instrumentSetId: z.string().optional(),
  expiringWithinDays: z.coerce.number().int().positive().optional(),
  expired: z.string().transform((val) => val === 'true').optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum(['packageNumber', 'sterilizedDate', 'expirationDate', 'status', 'createdAt'])
    .optional()
    .default('sterilizedDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const lookupPackageByQRSchema = z.object({
  qrCode: z.string().min(1, 'QR code is required'),
});

// =============================================================================
// Package Usage Schemas (Patient Linking)
// =============================================================================

export const recordPackageUsageSchema = z.object({
  packageId: z.string().min(1, 'Package is required'),
  patientId: z.string().min(1, 'Patient is required'),
  appointmentId: z.string().optional().nullable(),
  procedureType: z.string().max(200).optional().nullable(),
  procedureNotes: z.string().max(1000).optional().nullable(),
  verifiedPackage: z.boolean().optional().default(true),
  verificationNotes: z.string().max(500).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const packageUsageQuerySchema = z.object({
  packageId: z.string().optional(),
  patientId: z.string().optional(),
  appointmentId: z.string().optional(),
  usedById: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum(['usedAt', 'createdAt'])
    .optional()
    .default('usedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// =============================================================================
// Package Type Exports
// =============================================================================

export type CreateInstrumentPackageInput = z.infer<typeof createInstrumentPackageSchema>;
export type UpdateInstrumentPackageInput = z.infer<typeof updateInstrumentPackageSchema>;
export type InstrumentPackageQueryInput = z.infer<typeof instrumentPackageQuerySchema>;
export type LookupPackageByQRInput = z.infer<typeof lookupPackageByQRSchema>;

export type RecordPackageUsageInput = z.infer<typeof recordPackageUsageSchema>;
export type PackageUsageQueryInput = z.infer<typeof packageUsageQuerySchema>;

// =============================================================================
// Equipment Validation Enums & Schemas
// =============================================================================

export const ValidationTypeEnum = z.enum([
  'INSTALLATION_QUALIFICATION',
  'OPERATIONAL_QUALIFICATION',
  'PERFORMANCE_QUALIFICATION',
  'BOWIE_DICK_TEST',
  'LEAK_RATE_TEST',
  'CALIBRATION',
  'PREVENTIVE_MAINTENANCE',
  'REPAIR_VERIFICATION',
  'ANNUAL_VALIDATION',
]);

export const ValidationResultEnum = z.enum([
  'PASS',
  'FAIL',
  'CONDITIONAL',
]);

export const createSterilizerValidationSchema = z.object({
  equipmentId: z.string().min(1, 'Equipment is required'),
  validationType: ValidationTypeEnum,
  validationDate: z.coerce.date(),
  nextValidationDue: z.coerce.date().optional().nullable(),
  result: ValidationResultEnum,
  parameters: z.record(z.string(), z.unknown()).optional().nullable(),
  performedBy: z.string().min(1, 'Performed by is required').max(200),
  performedById: z.string().optional().nullable(),
  vendorName: z.string().max(200).optional().nullable(),
  technicianName: z.string().max(200).optional().nullable(),
  certificateNumber: z.string().max(100).optional().nullable(),
  certificateUrl: z.string().url().optional().nullable(),
  certificateExpiry: z.coerce.date().optional().nullable(),
  failureDetails: z.string().max(2000).optional().nullable(),
  correctiveAction: z.string().max(2000).optional().nullable(),
  retestDate: z.coerce.date().optional().nullable(),
  retestResult: ValidationResultEnum.optional().nullable(),
  maintenanceRecordId: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateSterilizerValidationSchema = createSterilizerValidationSchema.partial();

export const sterilizerValidationQuerySchema = z.object({
  equipmentId: z.string().optional(),
  validationType: ValidationTypeEnum.optional(),
  result: ValidationResultEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  overdue: z.string().transform((val) => val === 'true').optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum(['validationDate', 'nextValidationDue', 'validationType', 'result', 'createdAt'])
    .optional()
    .default('validationDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// =============================================================================
// Validation Schedule Schemas
// =============================================================================

export const createValidationScheduleSchema = z.object({
  equipmentId: z.string().min(1, 'Equipment is required'),
  validationType: ValidationTypeEnum,
  frequencyDays: z.number().int().positive().max(730), // Up to 2 years
  isActive: z.boolean().optional().default(true),
  lastPerformed: z.coerce.date().optional().nullable(),
  nextDue: z.coerce.date().optional().nullable(),
  reminderDays: z.number().int().positive().max(90).optional().default(30),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateValidationScheduleSchema = createValidationScheduleSchema.partial();

export const validationScheduleQuerySchema = z.object({
  equipmentId: z.string().optional(),
  validationType: ValidationTypeEnum.optional(),
  isActive: z.string().transform((val) => val === 'true').optional(),
  overdue: z.string().transform((val) => val === 'true').optional(),
  dueSoon: z.string().transform((val) => val === 'true').optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum(['nextDue', 'validationType', 'frequencyDays', 'createdAt'])
    .optional()
    .default('nextDue'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// =============================================================================
// Validation Type Exports
// =============================================================================

export type CreateSterilizerValidationInput = z.infer<typeof createSterilizerValidationSchema>;
export type UpdateSterilizerValidationInput = z.infer<typeof updateSterilizerValidationSchema>;
export type SterilizerValidationQueryInput = z.infer<typeof sterilizerValidationQuerySchema>;

export type CreateValidationScheduleInput = z.infer<typeof createValidationScheduleSchema>;
export type UpdateValidationScheduleInput = z.infer<typeof updateValidationScheduleSchema>;
export type ValidationScheduleQueryInput = z.infer<typeof validationScheduleQuerySchema>;

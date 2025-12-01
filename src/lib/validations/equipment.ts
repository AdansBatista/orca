import { z } from 'zod';

// =============================================================================
// Enums (matching Prisma schema)
// =============================================================================

export const EquipmentCategoryEnum = z.enum([
  'DIAGNOSTIC',
  'TREATMENT',
  'DIGITAL',
  'CHAIR',
  'STERILIZATION',
  'SAFETY',
  'OTHER',
]);

export const EquipmentStatusEnum = z.enum([
  'ACTIVE',
  'IN_REPAIR',
  'OUT_OF_SERVICE',
  'RETIRED',
  'DISPOSED',
]);

export const EquipmentConditionEnum = z.enum([
  'EXCELLENT',
  'GOOD',
  'FAIR',
  'POOR',
]);

export const DepreciationMethodEnum = z.enum([
  'STRAIGHT_LINE',
  'DECLINING_BALANCE',
  'NONE',
]);

export const MaintenanceTypeEnum = z.enum([
  'PREVENTIVE',
  'CALIBRATION',
  'INSPECTION',
  'CLEANING',
  'CERTIFICATION',
  'OTHER',
]);

export const MaintenanceStatusEnum = z.enum([
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'OVERDUE',
]);

export const RepairSeverityEnum = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]);

export const RepairStatusEnum = z.enum([
  'REPORTED',
  'DIAGNOSED',
  'AWAITING_PARTS',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANNOT_REPAIR',
  'CANCELLED',
]);

export const SupplierStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'ON_HOLD',
  'BLOCKED',
]);

export const SupplierOrderMethodEnum = z.enum([
  'EMAIL',
  'PORTAL',
  'PHONE',
  'FAX',
  'EDI',
]);

// =============================================================================
// Equipment Type Schemas
// =============================================================================

export const createEquipmentTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50)
    .regex(/^[A-Z0-9_]+$/, 'Code must be uppercase letters, numbers, and underscores only'),
  category: EquipmentCategoryEnum,
  description: z.string().max(500).optional().nullable(),
  defaultMaintenanceIntervalDays: z.number().int().positive().optional().nullable(),
  maintenanceChecklist: z.array(z.string()).optional().default([]),
  defaultUsefulLifeMonths: z.number().int().positive().optional().nullable(),
  defaultDepreciationMethod: DepreciationMethodEnum.optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateEquipmentTypeSchema = createEquipmentTypeSchema.partial();

export const equipmentTypeQuerySchema = z.object({
  search: z.string().optional(),
  category: EquipmentCategoryEnum.optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  includeSystem: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val === 'true'),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(50),
});

// =============================================================================
// Equipment Schemas
// =============================================================================

export const createEquipmentSchema = z.object({
  // Required fields
  name: z.string().min(1, 'Name is required').max(200),
  equipmentNumber: z
    .string()
    .min(1, 'Equipment number is required')
    .max(50)
    .regex(/^[A-Z0-9-]+$/, 'Equipment number must be uppercase letters, numbers, and hyphens only'),
  typeId: z.string().min(1, 'Equipment type is required'),
  category: EquipmentCategoryEnum,

  // Optional identification
  serialNumber: z.string().max(100).optional().nullable(),
  modelNumber: z.string().max(100).optional().nullable(),
  barcode: z.string().max(100).optional().nullable(),
  manufacturer: z.string().max(100).optional().nullable(),

  // Location
  roomId: z.string().optional().nullable(),
  locationNotes: z.string().max(500).optional().nullable(),

  // Status
  status: EquipmentStatusEnum.optional().default('ACTIVE'),
  condition: EquipmentConditionEnum.optional().default('GOOD'),

  // Purchase information
  purchaseDate: z.coerce.date().optional().nullable(),
  purchasePrice: z.number().nonnegative().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  purchaseOrderNumber: z.string().max(50).optional().nullable(),

  // Warranty information
  warrantyStartDate: z.coerce.date().optional().nullable(),
  warrantyExpiry: z.coerce.date().optional().nullable(),
  warrantyTerms: z.string().max(1000).optional().nullable(),
  warrantyNotes: z.string().max(1000).optional().nullable(),
  hasExtendedWarranty: z.boolean().optional().default(false),
  extendedWarrantyExpiry: z.coerce.date().optional().nullable(),

  // Depreciation settings
  usefulLifeMonths: z.number().int().positive().optional().nullable(),
  salvageValue: z.number().nonnegative().optional().nullable(),
  depreciationMethod: DepreciationMethodEnum.optional().default('STRAIGHT_LINE'),

  // Maintenance settings
  maintenanceIntervalDays: z.number().int().positive().optional().nullable(),
  nextMaintenanceDate: z.coerce.date().optional().nullable(),

  // Documents & Media
  manualUrl: z.string().url().optional().nullable(),
  photos: z.array(z.string().url()).optional().default([]),
  specifications: z.any().optional().nullable(), // JSON field - any valid JSON

  // Notes
  notes: z.string().max(2000).optional().nullable(),
});

export const updateEquipmentSchema = createEquipmentSchema.partial();

export const equipmentQuerySchema = z.object({
  search: z.string().optional(),
  category: EquipmentCategoryEnum.optional(),
  status: EquipmentStatusEnum.optional(),
  condition: EquipmentConditionEnum.optional(),
  typeId: z.string().optional(),
  roomId: z.string().optional(),
  vendorId: z.string().optional(),
  maintenanceDue: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  warrantyExpiring: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum([
      'name',
      'equipmentNumber',
      'category',
      'status',
      'condition',
      'purchaseDate',
      'nextMaintenanceDate',
      'createdAt',
    ])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// =============================================================================
// Maintenance Schemas
// =============================================================================

export const createMaintenanceRecordSchema = z.object({
  maintenanceType: MaintenanceTypeEnum,
  scheduledDate: z.coerce.date().optional().nullable(),
  completedDate: z.coerce.date().optional().nullable(),
  status: MaintenanceStatusEnum.optional().default('SCHEDULED'),

  // Work details
  description: z.string().max(2000).optional().nullable(),
  checklist: z.array(z.object({
    item: z.string(),
    completed: z.boolean().optional().default(false),
    notes: z.string().optional(),
  })).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),

  // Performer information
  performedBy: z.string().max(100).optional().nullable(),
  performedById: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  technicianName: z.string().max(100).optional().nullable(),

  // Costs
  laborCost: z.number().nonnegative().optional().nullable(),
  partsCost: z.number().nonnegative().optional().nullable(),
  totalCost: z.number().nonnegative().optional().nullable(),

  // Next maintenance
  nextMaintenanceDate: z.coerce.date().optional().nullable(),

  // Documents
  attachments: z.array(z.string().url()).optional().default([]),
});

export const updateMaintenanceRecordSchema = createMaintenanceRecordSchema.partial();

export const maintenanceQuerySchema = z.object({
  equipmentId: z.string().optional(),
  maintenanceType: MaintenanceTypeEnum.optional(),
  status: MaintenanceStatusEnum.optional(),
  vendorId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  overdue: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  upcoming: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  upcomingDays: z.coerce.number().int().positive().optional().default(30),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum(['scheduledDate', 'completedDate', 'maintenanceType', 'status', 'createdAt'])
    .optional()
    .default('scheduledDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// =============================================================================
// Repair Schemas
// =============================================================================

export const createRepairRecordSchema = z.object({
  issueDescription: z.string().min(1, 'Issue description is required').max(2000),
  severity: RepairSeverityEnum.optional().default('MEDIUM'),
  status: RepairStatusEnum.optional().default('REPORTED'),

  // Scheduling
  scheduledDate: z.coerce.date().optional().nullable(),

  // Diagnosis & Resolution
  diagnosis: z.string().max(2000).optional().nullable(),
  workPerformed: z.string().max(2000).optional().nullable(),
  partsReplaced: z.array(z.string()).optional().default([]),
  resolutionNotes: z.string().max(2000).optional().nullable(),

  // Vendor/Service information
  vendorId: z.string().optional().nullable(),
  technicianName: z.string().max(100).optional().nullable(),
  serviceTicketNumber: z.string().max(50).optional().nullable(),

  // Costs
  laborCost: z.number().nonnegative().optional().nullable(),
  partsCost: z.number().nonnegative().optional().nullable(),
  travelCost: z.number().nonnegative().optional().nullable(),
  totalCost: z.number().nonnegative().optional().nullable(),

  // Warranty
  coveredByWarranty: z.boolean().optional().default(false),
  warrantyClaimNumber: z.string().max(50).optional().nullable(),

  // Downtime tracking
  equipmentDownStart: z.coerce.date().optional().nullable(),
  equipmentDownEnd: z.coerce.date().optional().nullable(),

  // Documents
  attachments: z.array(z.string().url()).optional().default([]),
});

export const updateRepairRecordSchema = createRepairRecordSchema.partial();

export const repairQuerySchema = z.object({
  equipmentId: z.string().optional(),
  status: RepairStatusEnum.optional(),
  severity: RepairSeverityEnum.optional(),
  vendorId: z.string().optional(),
  coveredByWarranty: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  activeOnly: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum(['reportedDate', 'scheduledDate', 'completedDate', 'severity', 'status', 'createdAt'])
    .optional()
    .default('reportedDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// =============================================================================
// Supplier Schemas
// =============================================================================

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase letters, numbers, underscores, and hyphens only'),
  accountNumber: z.string().max(50).optional().nullable(),

  // Contact information
  contactName: z.string().max(100).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  fax: z.string().max(20).optional().nullable(),
  website: z.string().url().optional().nullable(),

  // Address
  address: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().max(50).optional().nullable(),

  // Order settings
  minimumOrder: z.number().nonnegative().optional().nullable(),
  freeShippingThreshold: z.number().nonnegative().optional().nullable(),
  defaultLeadTimeDays: z.number().int().positive().optional().default(7),
  orderMethod: SupplierOrderMethodEnum.optional().default('EMAIL'),

  // Payment
  paymentTerms: z.string().max(100).optional().nullable(),
  taxExempt: z.boolean().optional().default(false),

  // Performance
  rating: z.number().int().min(1).max(5).optional().nullable(),

  // Status
  status: SupplierStatusEnum.optional().default('ACTIVE'),
  isPreferred: z.boolean().optional().default(false),

  // Notes
  notes: z.string().max(2000).optional().nullable(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const supplierQuerySchema = z.object({
  search: z.string().optional(),
  status: SupplierStatusEnum.optional(),
  isPreferred: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum(['name', 'code', 'status', 'rating', 'createdAt'])
    .optional()
    .default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// =============================================================================
// Type Exports
// =============================================================================

export type CreateEquipmentTypeInput = z.infer<typeof createEquipmentTypeSchema>;
export type UpdateEquipmentTypeInput = z.infer<typeof updateEquipmentTypeSchema>;
export type EquipmentTypeQueryInput = z.infer<typeof equipmentTypeQuerySchema>;

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
export type EquipmentQueryInput = z.infer<typeof equipmentQuerySchema>;

export type CreateMaintenanceRecordInput = z.infer<typeof createMaintenanceRecordSchema>;
export type UpdateMaintenanceRecordInput = z.infer<typeof updateMaintenanceRecordSchema>;
export type MaintenanceQueryInput = z.infer<typeof maintenanceQuerySchema>;

export type CreateRepairRecordInput = z.infer<typeof createRepairRecordSchema>;
export type UpdateRepairRecordInput = z.infer<typeof updateRepairRecordSchema>;
export type RepairQueryInput = z.infer<typeof repairQuerySchema>;

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type SupplierQueryInput = z.infer<typeof supplierQuerySchema>;

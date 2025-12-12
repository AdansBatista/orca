import { z } from 'zod';

// =============================================================================
// Lab Vendor Management Enums
// =============================================================================

export const LabVendorStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']);

export const LabContactRoleEnum = z.enum([
  'PRIMARY',
  'BILLING',
  'TECHNICAL',
  'SHIPPING',
  'EMERGENCY',
]);

export const LabProductCategoryEnum = z.enum([
  'RETAINER',
  'APPLIANCE',
  'ALIGNER',
  'INDIRECT_BONDING',
  'ARCHWIRE',
  'MODEL',
  'SURGICAL',
  'OTHER',
]);

export const LabContractStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED']);

export const MetricPeriodTypeEnum = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']);

export const ShippingCarrierEnum = z.enum([
  'FEDEX',
  'UPS',
  'USPS',
  'DHL',
  'LAB_COURIER',
  'OTHER',
]);

// =============================================================================
// Lab Order Enums
// =============================================================================

export const LabOrderStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'ACKNOWLEDGED',
  'IN_PROGRESS',
  'COMPLETED',
  'SHIPPED',
  'DELIVERED',
  'RECEIVED',
  'PATIENT_PICKUP',
  'PICKED_UP',
  'CANCELLED',
  'REMAKE_REQUESTED',
  'ON_HOLD',
]);

export const OrderPriorityEnum = z.enum(['LOW', 'STANDARD', 'HIGH', 'URGENT']);

export const RushLevelEnum = z.enum(['EMERGENCY', 'RUSH', 'PRIORITY']);

export const ArchEnum = z.enum(['UPPER', 'LOWER', 'BOTH']);

export const LabOrderItemStatusEnum = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'SHIPPED',
  'DELIVERED',
  'INSPECTED',
  'ACCEPTED',
  'REJECTED',
]);

export const LabAttachmentTypeEnum = z.enum([
  'STL_SCAN',
  'PHOTO',
  'XRAY',
  'DOCUMENT',
  'OTHER',
]);

export const AttachmentSourceEnum = z.enum([
  'MANUAL_UPLOAD',
  'ITERO_SYNC',
  'THREESHAPE_IMPORT',
  'IMAGING_SYSTEM',
]);

export const StatusChangeSourceEnum = z.enum(['USER', 'LAB', 'SYSTEM', 'SHIPPING']);

// =============================================================================
// Order Tracking Enums
// =============================================================================

export const ShipmentStatusEnum = z.enum([
  'PENDING',
  'LABEL_CREATED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'EXCEPTION',
  'RETURNED',
]);

export const ShipmentEventSourceEnum = z.enum(['CARRIER_API', 'MANUAL', 'WEBHOOK']);

export const PickupStatusEnum = z.enum([
  'AWAITING_PICKUP',
  'NOTIFIED',
  'REMINDED',
  'PICKED_UP',
  'RETURNED_TO_LAB',
  'DISCARDED',
]);

export const LabReminderTypeEnum = z.enum([
  'SCHEDULED',
  'WARRANTY_EXPIRING',
  'REPLACEMENT_DUE',
]);

export const ReorderReminderStatusEnum = z.enum([
  'PENDING',
  'SENT',
  'RESPONDED',
  'ORDERED',
  'DECLINED',
  'CANCELLED',
]);

export const DueDateAlertTypeEnum = z.enum([
  'APPROACHING_DUE',
  'DUE_TODAY',
  'OVERDUE',
  'APPOINTMENT_AT_RISK',
  'SHIPMENT_DELAYED',
]);

export const AlertSeverityEnum = z.enum(['INFO', 'WARNING', 'CRITICAL']);

// =============================================================================
// Quality & Remakes Enums
// =============================================================================

export const InspectionResultEnum = z.enum([
  'PASS',
  'PASS_WITH_NOTES',
  'FAIL_REMAKE',
  'FAIL_ADJUSTMENT',
  'PENDING',
]);

export const RemakeStatusEnum = z.enum([
  'REQUESTED',
  'ACKNOWLEDGED',
  'IN_PROGRESS',
  'SHIPPED',
  'RECEIVED',
  'INSPECTED',
  'COMPLETED',
  'CANCELLED',
]);

export const RemakeReasonEnum = z.enum([
  'FIT_ISSUE',
  'DESIGN_ISSUE',
  'MATERIAL_DEFECT',
  'SHIPPING_DAMAGE',
  'WRONG_PATIENT',
  'SPECIFICATION_ERROR',
  'OTHER',
]);

export const CostResponsibilityEnum = z.enum(['LAB', 'CLINIC', 'PATIENT', 'WARRANTY']);

export const WarrantyStatusEnum = z.enum(['ACTIVE', 'EXPIRED', 'CLAIMED', 'VOIDED']);

export const ClaimStatusEnum = z.enum(['PENDING', 'APPROVED', 'DENIED', 'PROCESSED']);

export const QualityCategoryEnum = z.enum([
  'FIT',
  'APPEARANCE',
  'FUNCTION',
  'MATERIAL',
  'DESIGN',
  'LABELING',
  'SHIPPING',
]);

export const IssueSeverityEnum = z.enum(['CRITICAL', 'MAJOR', 'MINOR', 'COSMETIC']);

export const QualityIssueStatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);

export const FeedbackTypeEnum = z.enum([
  'ISSUE_REPORT',
  'POSITIVE_FEEDBACK',
  'SUGGESTION',
  'QUESTION',
]);

export const FeedbackStatusEnum = z.enum([
  'DRAFT',
  'SENT',
  'ACKNOWLEDGED',
  'RESPONDED',
  'CLOSED',
]);

// =============================================================================
// Lab Vendor Schemas
// =============================================================================

export const labVendorAddressSchema = z.object({
  street: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip: z.string().max(20).optional(),
  country: z.string().max(50).optional(),
});

export const createLabVendorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(20)
    .regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase letters, numbers, underscores, and hyphens'),
  legalName: z.string().max(200).optional().nullable(),
  taxId: z.string().max(50).optional().nullable(),
  website: z.string().url().optional().nullable(),
  accountNumber: z.string().max(50).optional().nullable(),
  status: LabVendorStatusEnum.optional().default('ACTIVE'),

  // Contact info
  address: labVendorAddressSchema.optional().nullable(),
  primaryPhone: z.string().max(20).optional().nullable(),
  primaryEmail: z.string().email().optional().nullable(),

  // Integration
  portalUrl: z.string().url().optional().nullable(),
  apiEndpoint: z.string().url().optional().nullable(),

  // Capabilities
  capabilities: z.array(LabProductCategoryEnum).optional().default([]),
  specialties: z.array(z.string()).optional().default([]),

  // Shipping
  defaultCarrier: ShippingCarrierEnum.optional().nullable(),
  shippingAccountNumber: z.string().max(50).optional().nullable(),

  // Billing
  paymentTerms: z.number().int().positive().optional().default(30),
  billingEmail: z.string().email().optional().nullable(),
});

export const updateLabVendorSchema = createLabVendorSchema.partial();

export const labVendorQuerySchema = z.object({
  search: z.string().optional(),
  status: LabVendorStatusEnum.optional(),
  hasCapability: LabProductCategoryEnum.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z.enum(['name', 'code', 'status', 'createdAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// =============================================================================
// Lab Vendor Contact Schemas
// =============================================================================

export const createLabVendorContactSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
  name: z.string().min(1, 'Name is required').max(100),
  title: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  role: LabContactRoleEnum.optional().default('PRIMARY'),
  isPrimary: z.boolean().optional().default(false),
  notes: z.string().max(500).optional().nullable(),
});

export const updateLabVendorContactSchema = createLabVendorContactSchema.omit({ vendorId: true }).partial();

// =============================================================================
// Lab Product Schemas
// =============================================================================

export const createLabProductSchema = z.object({
  vendorId: z.string().optional().nullable(),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  sku: z.string().max(50).optional().nullable(),
  category: LabProductCategoryEnum,

  // Prescription schema (JSON)
  prescriptionSchema: z.any().optional().nullable(),

  // Turnaround
  standardTurnaround: z.number().int().positive().optional().default(7),
  rushTurnaround: z.number().int().positive().optional().nullable(),

  isActive: z.boolean().optional().default(true),
});

export const updateLabProductSchema = createLabProductSchema.partial();

export const labProductQuerySchema = z.object({
  search: z.string().optional(),
  category: LabProductCategoryEnum.optional(),
  vendorId: z.string().optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(50),
  sortBy: z.enum(['name', 'category', 'standardTurnaround', 'createdAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// =============================================================================
// Lab Fee Schedule Schemas
// =============================================================================

export const createLabFeeScheduleSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
  basePrice: z.number().nonnegative('Base price must be non-negative'),
  rushUpchargePercent: z.number().nonnegative().optional().default(50),
  rushUpchargeFlat: z.number().nonnegative().optional().nullable(),
  effectiveDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  volumeDiscounts: z.any().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateLabFeeScheduleSchema = createLabFeeScheduleSchema.partial();

// =============================================================================
// Lab Contract Schemas
// =============================================================================

export const createLabContractSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
  contractNumber: z.string().max(50).optional().nullable(),
  name: z.string().min(1, 'Name is required').max(200),
  status: LabContractStatusEnum.optional().default('ACTIVE'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  autoRenew: z.boolean().optional().default(false),
  renewalNoticeDays: z.number().int().positive().optional().default(30),
  discountPercent: z.number().min(0).max(100).optional().nullable(),
  minimumVolume: z.number().int().positive().optional().nullable(),
  slaTerms: z.string().max(2000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  documentUrl: z.string().url().optional().nullable(),
});

export const updateLabContractSchema = createLabContractSchema.partial();

// =============================================================================
// Lab Order Schemas
// =============================================================================

export const createLabOrderSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  vendorId: z.string().optional().nullable(),
  status: LabOrderStatusEnum.optional(),
  priority: OrderPriorityEnum.optional().default('STANDARD'),

  // Rush handling
  isRush: z.boolean().optional().default(false),
  rushLevel: RushLevelEnum.optional().nullable(),
  rushReason: z.string().max(500).optional().nullable(),

  // Dates
  neededByDate: z.coerce.date().optional().nullable(),

  // Treatment links
  treatmentPlanId: z.string().optional().nullable(),
  milestoneId: z.string().optional().nullable(),
  appointmentId: z.string().optional().nullable(),

  // Notes
  clinicNotes: z.string().max(2000).optional().nullable(),
});

export const updateLabOrderSchema = createLabOrderSchema.omit({ patientId: true }).partial();

export const submitLabOrderSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required to submit'),
});

export const labOrderQuerySchema = z.object({
  search: z.string().optional(),
  status: LabOrderStatusEnum.optional(),
  statuses: z.array(LabOrderStatusEnum).optional(),
  priority: OrderPriorityEnum.optional(),
  vendorId: z.string().optional(),
  patientId: z.string().optional(),
  isRush: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  neededByFrom: z.coerce.date().optional(),
  neededByTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum(['orderNumber', 'orderDate', 'neededByDate', 'status', 'priority', 'totalCost', 'createdAt'])
    .optional()
    .default('orderDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// =============================================================================
// Lab Order Item Schemas
// =============================================================================

export const createLabOrderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive().optional().default(1),
  prescription: z.any().optional().nullable(),
  arch: ArchEnum.optional().nullable(),
  toothNumbers: z.array(z.number().int().min(1).max(32)).optional().default([]),
  unitPrice: z.number().nonnegative(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateLabOrderItemSchema = createLabOrderItemSchema.partial();

// =============================================================================
// Lab Order Attachment Schemas
// =============================================================================

export const createLabOrderAttachmentSchema = z.object({
  fileName: z.string().min(1, 'File name is required').max(255),
  fileType: LabAttachmentTypeEnum,
  mimeType: z.string().min(1).max(100),
  fileSize: z.number().int().positive(),
  storageKey: z.string().min(1),
  source: AttachmentSourceEnum.optional().default('MANUAL_UPLOAD'),
  patientImageId: z.string().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
});

// =============================================================================
// Lab Order Template Schemas
// =============================================================================

export const createLabOrderTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  isClinicWide: z.boolean().optional().default(false),
  vendorId: z.string().optional().nullable(),
  items: z.array(z.any()),
  defaultNotes: z.string().max(2000).optional().nullable(),
});

export const updateLabOrderTemplateSchema = createLabOrderTemplateSchema.partial();

// =============================================================================
// Shipment Schemas
// =============================================================================

export const createLabShipmentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  carrier: ShippingCarrierEnum,
  trackingNumber: z.string().max(100).optional().nullable(),
  trackingUrl: z.string().url().optional().nullable(),
  status: ShipmentStatusEnum.optional().default('PENDING'),
  shippedAt: z.coerce.date().optional().nullable(),
  estimatedDelivery: z.coerce.date().optional().nullable(),
  packageCount: z.number().int().positive().optional().default(1),
  weight: z.number().positive().optional().nullable(),
  dimensions: z.string().max(50).optional().nullable(),
});

export const updateLabShipmentSchema = createLabShipmentSchema.omit({ orderId: true }).partial();

// =============================================================================
// Patient Pickup Schemas
// =============================================================================

export const createPatientPickupItemSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  itemDescription: z.string().min(1, 'Item description is required').max(500),
  storageLocation: z.string().max(100).optional().nullable(),
});

export const confirmPickupSchema = z.object({
  pickedUpBy: z.string().min(1, 'Name of person picking up is required').max(100),
});

// =============================================================================
// Inspection Schemas
// =============================================================================

export const createLabInspectionSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  orderItemId: z.string().min(1, 'Order item ID is required'),
  result: InspectionResultEnum.optional().default('PENDING'),
  checklist: z.any().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateLabInspectionSchema = z.object({
  result: InspectionResultEnum.optional(),
  checklist: z.any().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

// =============================================================================
// Remake Request Schemas
// =============================================================================

export const createRemakeRequestSchema = z.object({
  originalOrderId: z.string().min(1, 'Original order ID is required'),
  originalItemId: z.string().min(1, 'Original item ID is required'),
  reason: RemakeReasonEnum,
  reasonDetails: z.string().max(2000).optional().nullable(),
  isWarrantyClaim: z.boolean().optional().default(false),
  warrantyId: z.string().optional().nullable(),
  costResponsibility: CostResponsibilityEnum.optional().default('LAB'),
  estimatedCost: z.number().nonnegative().optional().nullable(),
  requiresApproval: z.boolean().optional().default(false),
});

export const updateRemakeRequestSchema = z.object({
  status: RemakeStatusEnum.optional(),
  reasonDetails: z.string().max(2000).optional().nullable(),
  costResponsibility: CostResponsibilityEnum.optional(),
  estimatedCost: z.number().nonnegative().optional().nullable(),
  actualCost: z.number().nonnegative().optional().nullable(),
});

export const approveRemakeSchema = z.object({
  approved: z.boolean(),
  notes: z.string().max(500).optional().nullable(),
});

// =============================================================================
// Quality Issue Schemas
// =============================================================================

export const createQualityIssueSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
  orderId: z.string().optional().nullable(),
  orderItemId: z.string().optional().nullable(),
  category: QualityCategoryEnum,
  severity: IssueSeverityEnum,
  description: z.string().min(1, 'Description is required').max(2000),
});

export const updateQualityIssueSchema = z.object({
  status: QualityIssueStatusEnum.optional(),
  resolution: z.string().max(2000).optional().nullable(),
});

// =============================================================================
// Lab Feedback Schemas
// =============================================================================

export const createLabFeedbackSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
  orderId: z.string().optional().nullable(),
  qualityIssueId: z.string().optional().nullable(),
  feedbackType: FeedbackTypeEnum,
  subject: z.string().min(1, 'Subject is required').max(200),
  content: z.string().min(1, 'Content is required').max(5000),
});

export const updateLabFeedbackSchema = z.object({
  status: FeedbackStatusEnum.optional(),
  subject: z.string().max(200).optional(),
  content: z.string().max(5000).optional(),
});

// =============================================================================
// Type Exports
// =============================================================================

// Lab Vendor Types
export type CreateLabVendorInput = z.infer<typeof createLabVendorSchema>;
export type UpdateLabVendorInput = z.infer<typeof updateLabVendorSchema>;
export type LabVendorQueryInput = z.infer<typeof labVendorQuerySchema>;

export type CreateLabVendorContactInput = z.infer<typeof createLabVendorContactSchema>;
export type UpdateLabVendorContactInput = z.infer<typeof updateLabVendorContactSchema>;

export type CreateLabProductInput = z.infer<typeof createLabProductSchema>;
export type UpdateLabProductInput = z.infer<typeof updateLabProductSchema>;
export type LabProductQueryInput = z.infer<typeof labProductQuerySchema>;

export type CreateLabFeeScheduleInput = z.infer<typeof createLabFeeScheduleSchema>;
export type UpdateLabFeeScheduleInput = z.infer<typeof updateLabFeeScheduleSchema>;

export type CreateLabContractInput = z.infer<typeof createLabContractSchema>;
export type UpdateLabContractInput = z.infer<typeof updateLabContractSchema>;

// Lab Order Types
export type CreateLabOrderInput = z.infer<typeof createLabOrderSchema>;
export type UpdateLabOrderInput = z.infer<typeof updateLabOrderSchema>;
export type LabOrderQueryInput = z.infer<typeof labOrderQuerySchema>;

export type CreateLabOrderItemInput = z.infer<typeof createLabOrderItemSchema>;
export type UpdateLabOrderItemInput = z.infer<typeof updateLabOrderItemSchema>;

export type CreateLabOrderAttachmentInput = z.infer<typeof createLabOrderAttachmentSchema>;

export type CreateLabOrderTemplateInput = z.infer<typeof createLabOrderTemplateSchema>;
export type UpdateLabOrderTemplateInput = z.infer<typeof updateLabOrderTemplateSchema>;

// Tracking Types
export type CreateLabShipmentInput = z.infer<typeof createLabShipmentSchema>;
export type UpdateLabShipmentInput = z.infer<typeof updateLabShipmentSchema>;

export type CreatePatientPickupItemInput = z.infer<typeof createPatientPickupItemSchema>;

// Quality Types
export type CreateLabInspectionInput = z.infer<typeof createLabInspectionSchema>;
export type UpdateLabInspectionInput = z.infer<typeof updateLabInspectionSchema>;

export type CreateRemakeRequestInput = z.infer<typeof createRemakeRequestSchema>;
export type UpdateRemakeRequestInput = z.infer<typeof updateRemakeRequestSchema>;

export type CreateQualityIssueInput = z.infer<typeof createQualityIssueSchema>;
export type UpdateQualityIssueInput = z.infer<typeof updateQualityIssueSchema>;

export type CreateLabFeedbackInput = z.infer<typeof createLabFeedbackSchema>;
export type UpdateLabFeedbackInput = z.infer<typeof updateLabFeedbackSchema>;

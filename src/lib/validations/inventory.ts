import { z } from 'zod';

// =============================================================================
// Enums (matching Prisma schema)
// =============================================================================

export const InventoryCategoryEnum = z.enum([
  'BRACKETS',
  'WIRES',
  'ELASTICS',
  'BANDS',
  'BONDING',
  'IMPRESSION',
  'RETAINERS',
  'INSTRUMENTS',
  'DISPOSABLES',
  'PPE',
  'OFFICE_SUPPLIES',
  'CLEANING',
  'OTHER',
]);

export const InventoryItemStatusEnum = z.enum([
  'ACTIVE',
  'DISCONTINUED',
  'BACKORDERED',
  'INACTIVE',
  'PENDING_APPROVAL',
]);

export const LotStatusEnum = z.enum([
  'AVAILABLE',
  'RESERVED',
  'DEPLETED',
  'EXPIRED',
  'RECALLED',
  'QUARANTINE',
  'DAMAGED',
]);

export const StockMovementTypeEnum = z.enum([
  'RECEIVED',
  'USED',
  'ADJUSTMENT_ADD',
  'ADJUSTMENT_REMOVE',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'RETURNED_TO_SUPPLIER',
  'RETURNED_FROM_PATIENT',
  'EXPIRED',
  'DAMAGED',
  'LOST',
  'RECALLED',
  'OPENING_BALANCE',
  'COUNT_VARIANCE',
]);

export const MovementReferenceTypeEnum = z.enum([
  'PURCHASE_ORDER',
  'TRANSFER',
  'ADJUSTMENT',
  'PATIENT_TREATMENT',
  'RETURN',
  'RECALL',
  'INVENTORY_COUNT',
]);

export const PurchaseOrderStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'SUBMITTED',
  'ACKNOWLEDGED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CLOSED',
  'CANCELLED',
]);

export const POItemStatusEnum = z.enum([
  'ORDERED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'BACKORDERED',
  'CANCELLED',
]);

export const TransferStatusEnum = z.enum([
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'PREPARING',
  'IN_TRANSIT',
  'RECEIVED',
  'CANCELLED',
]);

export const TransferItemStatusEnum = z.enum([
  'REQUESTED',
  'APPROVED',
  'PARTIALLY_APPROVED',
  'REJECTED',
  'SHIPPED',
  'RECEIVED',
  'VARIANCE',
]);

export const ReorderAlertTypeEnum = z.enum([
  'LOW_STOCK',
  'CRITICAL_STOCK',
  'OUT_OF_STOCK',
  'APPROACHING_LOW',
]);

export const AlertStatusEnum = z.enum([
  'ACTIVE',
  'DISMISSED',
  'ORDERED',
  'RESOLVED',
]);

export const ExpirationAlertLevelEnum = z.enum([
  'WARNING',
  'CAUTION',
  'URGENT',
  'CRITICAL',
  'EXPIRED',
]);

export const ExpirationAlertStatusEnum = z.enum([
  'ACTIVE',
  'ACKNOWLEDGED',
  'RESOLVED',
]);

export const ExpirationActionEnum = z.enum([
  'USED',
  'RETURNED',
  'DISCARDED',
  'EXTENDED',
  'TRANSFERRED',
]);

export const WasteTypeEnum = z.enum([
  'EXPIRED',
  'DAMAGED',
  'LOST',
  'RECALLED',
  'CONTAMINATED',
  'OTHER',
]);

// =============================================================================
// Inventory Item Schemas
// =============================================================================

export const createInventoryItemSchema = z.object({
  // Required fields
  name: z.string().min(1, 'Name is required').max(200),
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50)
    .regex(/^[A-Z0-9-]+$/, 'SKU must be uppercase letters, numbers, and hyphens only'),
  category: InventoryCategoryEnum,
  unitCost: z.number().nonnegative('Unit cost must be non-negative'),

  // Optional identification
  barcode: z.string().max(100).optional().nullable(),
  upc: z.string().max(50).optional().nullable(),

  // Classification
  subcategory: z.string().max(100).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  manufacturer: z.string().max(100).optional().nullable(),

  // Specifications
  description: z.string().max(1000).optional().nullable(),
  specifications: z.any().optional().nullable(), // JSON field
  size: z.string().max(50).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  material: z.string().max(100).optional().nullable(),

  // Supplier Info
  supplierId: z.string().optional().nullable(),
  supplierSku: z.string().max(50).optional().nullable(),
  alternateSupplierIds: z.array(z.string()).optional().default([]),

  // Pricing
  lastCost: z.number().nonnegative().optional().nullable(),
  averageCost: z.number().nonnegative().optional().nullable(),
  unitOfMeasure: z.string().max(20).optional().default('EACH'),
  unitsPerPackage: z.number().int().positive().optional().default(1),
  packageDescription: z.string().max(100).optional().nullable(),

  // Stock Levels (usually set separately, but can be initialized)
  currentStock: z.number().int().nonnegative().optional().default(0),
  reservedStock: z.number().int().nonnegative().optional().default(0),

  // Reorder Settings
  reorderPoint: z.number().int().nonnegative().optional().default(10),
  reorderQuantity: z.number().int().positive().optional().default(20),
  safetyStock: z.number().int().nonnegative().optional().default(5),
  maxStock: z.number().int().positive().optional().nullable(),
  leadTimeDays: z.number().int().nonnegative().optional().default(7),

  // Tracking Options
  trackLots: z.boolean().optional().default(false),
  trackExpiry: z.boolean().optional().default(true),
  trackSerial: z.boolean().optional().default(false),

  // Storage
  storageLocation: z.string().max(100).optional().nullable(),
  storageRequirements: z.string().max(200).optional().nullable(),

  // Status
  status: InventoryItemStatusEnum.optional().default('ACTIVE'),
  isOrderable: z.boolean().optional().default(true),

  // Documents
  msdsUrl: z.string().url().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  documents: z.array(z.string().url()).optional().default([]),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial();

export const inventoryItemQuerySchema = z.object({
  search: z.string().optional(),
  category: InventoryCategoryEnum.optional(),
  status: InventoryItemStatusEnum.optional(),
  supplierId: z.string().optional(),
  lowStock: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  outOfStock: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  trackLots: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum([
      'name',
      'sku',
      'category',
      'currentStock',
      'unitCost',
      'lastUsedAt',
      'createdAt',
    ])
    .optional()
    .default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// =============================================================================
// Stock Adjustment Schemas
// =============================================================================

export const stockAdjustmentSchema = z.object({
  quantity: z.number().int().refine((val) => val !== 0, { message: 'Quantity cannot be zero' }),
  reason: z.string().min(1, 'Reason is required').max(500),
  notes: z.string().max(1000).optional().nullable(),
  lotId: z.string().optional().nullable(),
});

export const stockUsageSchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive'),
  lotId: z.string().optional().nullable(),
  patientId: z.string().optional().nullable(),
  appointmentId: z.string().optional().nullable(),
  procedureId: z.string().optional().nullable(),
  providerId: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const stockMovementQuerySchema = z.object({
  itemId: z.string().optional(),
  lotId: z.string().optional(),
  movementType: StockMovementTypeEnum.optional(),
  patientId: z.string().optional(),
  providerId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z.enum(['createdAt', 'quantity', 'movementType']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// =============================================================================
// Inventory Lot Schemas
// =============================================================================

export const createInventoryLotSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  lotNumber: z.string().min(1, 'Lot number is required').max(100),
  initialQuantity: z.number().int().positive('Initial quantity must be positive'),
  receivedDate: z.coerce.date(),
  manufacturingDate: z.coerce.date().optional().nullable(),
  expirationDate: z.coerce.date().optional().nullable(),
  purchaseOrderId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  unitCost: z.number().nonnegative().optional().nullable(),
  storageLocation: z.string().max(100).optional().nullable(),
  serialNumbers: z.array(z.string()).optional().default([]),
  notes: z.string().max(500).optional().nullable(),
});

export const updateInventoryLotSchema = z.object({
  storageLocation: z.string().max(100).optional().nullable(),
  status: LotStatusEnum.optional(),
  quarantineReason: z.string().max(500).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  // Extension fields
  expirationDate: z.coerce.date().optional().nullable(),
  extensionReason: z.string().max(500).optional().nullable(),
  extensionDocument: z.string().url().optional().nullable(),
});

export const inventoryLotQuerySchema = z.object({
  itemId: z.string().optional(),
  status: LotStatusEnum.optional(),
  expiringSoon: z.coerce.number().int().positive().optional(), // Days until expiration
  expired: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z.enum(['lotNumber', 'expirationDate', 'currentQuantity', 'receivedDate']).optional().default('expirationDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// =============================================================================
// Purchase Order Schemas
// =============================================================================

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  expectedDate: z.coerce.date().optional().nullable(),
  shippingMethod: z.string().max(100).optional().nullable(),
  paymentTerms: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  internalNotes: z.string().max(2000).optional().nullable(),
  shipTo: z.any().optional().nullable(), // JSON address object
  items: z.array(z.object({
    itemId: z.string().min(1, 'Item is required'),
    orderedQuantity: z.number().int().positive('Quantity must be positive'),
    unitPrice: z.number().nonnegative('Price must be non-negative'),
    discountPercent: z.number().min(0).max(100).optional().default(0),
    notes: z.string().max(500).optional().nullable(),
  })).min(1, 'At least one item is required'),
});

export const updatePurchaseOrderSchema = z.object({
  expectedDate: z.coerce.date().optional().nullable(),
  shippingMethod: z.string().max(100).optional().nullable(),
  trackingNumber: z.string().max(100).optional().nullable(),
  paymentTerms: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  internalNotes: z.string().max(2000).optional().nullable(),
  shipTo: z.any().optional().nullable(),
  externalPoNumber: z.string().max(50).optional().nullable(),
  invoiceNumber: z.string().max(50).optional().nullable(),
  invoiceDate: z.coerce.date().optional().nullable(),
});

export const purchaseOrderQuerySchema = z.object({
  search: z.string().optional(),
  supplierId: z.string().optional(),
  status: PurchaseOrderStatusEnum.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z.enum(['poNumber', 'orderDate', 'expectedDate', 'totalAmount', 'status', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const submitPurchaseOrderSchema = z.object({
  orderDate: z.coerce.date().optional().default(() => new Date()),
});

export const approvePurchaseOrderSchema = z.object({
  notes: z.string().max(500).optional().nullable(),
});

export const rejectPurchaseOrderSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(500),
});

// =============================================================================
// Purchase Order Receipt Schemas
// =============================================================================

export const createPurchaseOrderReceiptSchema = z.object({
  packingSlipNumber: z.string().max(50).optional().nullable(),
  carrierName: z.string().max(100).optional().nullable(),
  trackingNumber: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  damageNotes: z.string().max(1000).optional().nullable(),
  items: z.array(z.object({
    itemId: z.string().min(1, 'Item is required'),
    purchaseOrderItemId: z.string().min(1, 'PO item is required'),
    quantity: z.number().int().positive('Quantity must be positive'),
    lotNumber: z.string().max(100).optional().nullable(),
    expirationDate: z.coerce.date().optional().nullable(),
    storageLocation: z.string().max(100).optional().nullable(),
  })).min(1, 'At least one item is required'),
});

// =============================================================================
// Inventory Transfer Schemas
// =============================================================================

export const createInventoryTransferSchema = z.object({
  toClinicId: z.string().min(1, 'Destination clinic is required'),
  reason: z.string().min(1, 'Reason is required').max(500),
  notes: z.string().max(1000).optional().nullable(),
  isUrgent: z.boolean().optional().default(false),
  urgentReason: z.string().max(500).optional().nullable(),
  items: z.array(z.object({
    itemId: z.string().min(1, 'Item is required'),
    lotId: z.string().optional().nullable(),
    requestedQuantity: z.number().int().positive('Quantity must be positive'),
  })).min(1, 'At least one item is required'),
});

export const approveTransferSchema = z.object({
  items: z.array(z.object({
    transferItemId: z.string().min(1),
    approvedQuantity: z.number().int().nonnegative(),
  })),
  notes: z.string().max(500).optional().nullable(),
});

export const rejectTransferSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(500),
});

export const shipTransferSchema = z.object({
  shippingMethod: z.string().max(100).optional().nullable(),
  trackingNumber: z.string().max(100).optional().nullable(),
  carrierName: z.string().max(100).optional().nullable(),
  items: z.array(z.object({
    transferItemId: z.string().min(1),
    shippedQuantity: z.number().int().nonnegative(),
  })),
});

export const receiveTransferSchema = z.object({
  items: z.array(z.object({
    transferItemId: z.string().min(1),
    receivedQuantity: z.number().int().nonnegative(),
    varianceReason: z.string().max(500).optional().nullable(),
  })),
  notes: z.string().max(500).optional().nullable(),
});

export const transferQuerySchema = z.object({
  status: TransferStatusEnum.optional(),
  direction: z.enum(['incoming', 'outgoing', 'all']).optional().default('all'),
  isUrgent: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z.enum(['transferNumber', 'requestedDate', 'status', 'createdAt']).optional().default('requestedDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// =============================================================================
// Reorder Alert Schemas
// =============================================================================

export const dismissAlertSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
});

export const reorderAlertQuerySchema = z.object({
  alertType: ReorderAlertTypeEnum.optional(),
  status: AlertStatusEnum.optional(),
  itemId: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z.enum(['alertDate', 'alertType', 'currentStock']).optional().default('alertDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// =============================================================================
// Expiration Alert Schemas
// =============================================================================

export const expirationAlertActionSchema = z.object({
  action: ExpirationActionEnum,
  notes: z.string().max(500).optional().nullable(),
});

export const expirationAlertQuerySchema = z.object({
  alertLevel: ExpirationAlertLevelEnum.optional(),
  status: ExpirationAlertStatusEnum.optional(),
  itemId: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z.enum(['alertDate', 'expirationDate', 'alertLevel', 'daysUntilExpiry']).optional().default('expirationDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// =============================================================================
// Inventory Count Schemas
// =============================================================================

export const inventoryCountSchema = z.object({
  counts: z.array(z.object({
    itemId: z.string().min(1, 'Item is required'),
    lotId: z.string().optional().nullable(),
    countedQuantity: z.number().int().nonnegative('Count must be non-negative'),
    notes: z.string().max(500).optional().nullable(),
  })).min(1, 'At least one count is required'),
  countDate: z.coerce.date().optional().default(() => new Date()),
  notes: z.string().max(1000).optional().nullable(),
});

// =============================================================================
// Analytics Query Schemas
// =============================================================================

export const usageAnalyticsQuerySchema = z.object({
  itemId: z.string().optional(),
  category: InventoryCategoryEnum.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'provider', 'procedure']).optional().default('month'),
  providerId: z.string().optional(),
});

export const costAnalyticsQuerySchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  category: InventoryCategoryEnum.optional(),
  groupBy: z.enum(['category', 'supplier', 'month']).optional().default('category'),
});

export const wasteAnalyticsQuerySchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  wasteType: WasteTypeEnum.optional(),
  itemId: z.string().optional(),
});

// =============================================================================
// Type Exports
// =============================================================================

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
export type InventoryItemQueryInput = z.infer<typeof inventoryItemQuerySchema>;

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
export type StockUsageInput = z.infer<typeof stockUsageSchema>;
export type StockMovementQueryInput = z.infer<typeof stockMovementQuerySchema>;

export type CreateInventoryLotInput = z.infer<typeof createInventoryLotSchema>;
export type UpdateInventoryLotInput = z.infer<typeof updateInventoryLotSchema>;
export type InventoryLotQueryInput = z.infer<typeof inventoryLotQuerySchema>;

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
export type PurchaseOrderQueryInput = z.infer<typeof purchaseOrderQuerySchema>;
export type CreatePurchaseOrderReceiptInput = z.infer<typeof createPurchaseOrderReceiptSchema>;

export type CreateInventoryTransferInput = z.infer<typeof createInventoryTransferSchema>;
export type ApproveTransferInput = z.infer<typeof approveTransferSchema>;
export type ShipTransferInput = z.infer<typeof shipTransferSchema>;
export type ReceiveTransferInput = z.infer<typeof receiveTransferSchema>;
export type TransferQueryInput = z.infer<typeof transferQuerySchema>;

export type DismissAlertInput = z.infer<typeof dismissAlertSchema>;
export type ReorderAlertQueryInput = z.infer<typeof reorderAlertQuerySchema>;

export type ExpirationAlertActionInput = z.infer<typeof expirationAlertActionSchema>;
export type ExpirationAlertQueryInput = z.infer<typeof expirationAlertQuerySchema>;

export type InventoryCountInput = z.infer<typeof inventoryCountSchema>;

export type UsageAnalyticsQueryInput = z.infer<typeof usageAnalyticsQuerySchema>;
export type CostAnalyticsQueryInput = z.infer<typeof costAnalyticsQuerySchema>;
export type WasteAnalyticsQueryInput = z.infer<typeof wasteAnalyticsQuerySchema>;

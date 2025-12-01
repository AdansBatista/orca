import { z } from 'zod';

// =============================================================================
// Enums (matching Prisma schema)
// =============================================================================

export const RoomTypeEnum = z.enum([
  'OPERATORY',
  'CONSULTATION',
  'X_RAY',
  'STERILIZATION',
  'LAB',
  'STORAGE',
  'RECEPTION',
  'OFFICE',
]);

export const RoomStatusEnum = z.enum([
  'ACTIVE',
  'MAINTENANCE',
  'CLOSED',
  'RENOVATION',
]);

export const ChairStatusEnum = z.enum([
  'ACTIVE',
  'IN_REPAIR',
  'OUT_OF_SERVICE',
  'RETIRED',
]);

export const EquipmentConditionEnum = z.enum([
  'EXCELLENT',
  'GOOD',
  'FAIR',
  'POOR',
]);

// =============================================================================
// Room Schemas
// =============================================================================

export const createRoomSchema = z.object({
  // Required fields
  name: z.string().min(1, 'Name is required').max(100),
  roomNumber: z
    .string()
    .min(1, 'Room number is required')
    .max(20)
    .regex(/^[A-Z0-9-]+$/, 'Room number must be uppercase letters, numbers, and hyphens only'),
  roomType: RoomTypeEnum,

  // Physical details
  floor: z.string().max(50).optional().nullable(),
  wing: z.string().max(50).optional().nullable(),
  squareFeet: z.number().int().positive().optional().nullable(),
  capacity: z.number().int().positive().optional().default(1),

  // Status
  status: RoomStatusEnum.optional().default('ACTIVE'),
  isAvailable: z.boolean().optional().default(true),

  // Capabilities
  capabilities: z.array(z.string()).optional().default([]),

  // Notes
  setupNotes: z.string().max(2000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateRoomSchema = createRoomSchema.partial();

export const roomQuerySchema = z.object({
  search: z.string().optional(),
  roomType: RoomTypeEnum.optional(),
  status: RoomStatusEnum.optional(),
  isAvailable: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  hasChairs: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum(['name', 'roomNumber', 'roomType', 'status', 'createdAt'])
    .optional()
    .default('roomNumber'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// =============================================================================
// Treatment Chair Schemas
// =============================================================================

export const createTreatmentChairSchema = z.object({
  // Required fields
  roomId: z.string().min(1, 'Room is required'),
  name: z.string().min(1, 'Name is required').max(100),
  chairNumber: z
    .string()
    .min(1, 'Chair number is required')
    .max(20)
    .regex(/^[A-Z0-9-]+$/, 'Chair number must be uppercase letters, numbers, and hyphens only'),

  // Equipment details
  manufacturer: z.string().max(100).optional().nullable(),
  modelNumber: z.string().max(100).optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),

  // Status
  status: ChairStatusEnum.optional().default('ACTIVE'),
  condition: EquipmentConditionEnum.optional().default('GOOD'),

  // Features
  features: z.array(z.string()).optional().default([]),
  hasDeliveryUnit: z.boolean().optional().default(true),
  hasSuction: z.boolean().optional().default(true),
  hasLight: z.boolean().optional().default(true),

  // Purchase/warranty
  purchaseDate: z.coerce.date().optional().nullable(),
  warrantyExpiry: z.coerce.date().optional().nullable(),

  // Maintenance
  nextMaintenanceDate: z.coerce.date().optional().nullable(),

  // Notes
  notes: z.string().max(2000).optional().nullable(),
});

export const updateTreatmentChairSchema = createTreatmentChairSchema.partial();

export const treatmentChairQuerySchema = z.object({
  search: z.string().optional(),
  roomId: z.string().optional(),
  status: ChairStatusEnum.optional(),
  condition: EquipmentConditionEnum.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum(['name', 'chairNumber', 'status', 'condition', 'createdAt'])
    .optional()
    .default('chairNumber'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// =============================================================================
// Room Equipment Assignment Schemas
// =============================================================================

export const assignEquipmentToRoomSchema = z.object({
  equipmentId: z.string().min(1, 'Equipment is required'),
  isPermanent: z.boolean().optional().default(true),
  position: z.string().max(200).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const updateRoomEquipmentSchema = z.object({
  isPermanent: z.boolean().optional(),
  position: z.string().max(200).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

// =============================================================================
// Type Exports
// =============================================================================

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type RoomQueryInput = z.infer<typeof roomQuerySchema>;

export type CreateTreatmentChairInput = z.infer<typeof createTreatmentChairSchema>;
export type UpdateTreatmentChairInput = z.infer<typeof updateTreatmentChairSchema>;
export type TreatmentChairQueryInput = z.infer<typeof treatmentChairQuerySchema>;

export type AssignEquipmentToRoomInput = z.infer<typeof assignEquipmentToRoomSchema>;
export type UpdateRoomEquipmentInput = z.infer<typeof updateRoomEquipmentSchema>;

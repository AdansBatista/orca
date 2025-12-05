import { z } from 'zod';

// =============================================================================
// GRID & LAYOUT SCHEMAS
// =============================================================================

export const gridConfigSchema = z.object({
  columns: z.number().min(5).max(50),
  rows: z.number().min(5).max(50),
  cellSize: z.number().min(20).max(100),
  snapToGrid: z.boolean().default(true),
});

export const positionSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
});

export const rotationSchema = z.union([
  z.literal(0),
  z.literal(90),
  z.literal(180),
  z.literal(270),
]);

export const chairPositionSchema = positionSchema.extend({
  chairId: z.string().min(1),
  rotation: rotationSchema.default(0),
});

export const roomBoundarySchema = positionSchema.extend({
  roomId: z.string().min(1),
  width: z.number().min(1).max(50),
  height: z.number().min(1).max(50),
  rotation: rotationSchema.default(0),
});

export const floorPlanLayoutSchema = z.object({
  name: z.string().min(1).max(100),
  gridConfig: gridConfigSchema,
  rooms: z.array(roomBoundarySchema),
  chairs: z.array(chairPositionSchema),
});

// =============================================================================
// API REQUEST SCHEMAS
// =============================================================================

/**
 * Save floor plan layout
 */
export const saveFloorPlanLayoutSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  gridConfig: gridConfigSchema.optional(),
  rooms: z.array(roomBoundarySchema).optional(),
  chairs: z.array(chairPositionSchema).optional(),
});

/**
 * Create floor plan template
 */
export const createFloorPlanTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  layout: floorPlanLayoutSchema,
  previewImage: z.string().url().optional(),
});

/**
 * Block chair
 */
export const blockChairSchema = z.object({
  reason: z.string().min(1).max(500),
  blockedUntil: z.string().datetime().optional(),
  maintenanceType: z.enum(['cleaning', 'repair', 'other']).optional(),
});

/**
 * Schedule maintenance
 */
export const scheduleMaintenanceSchema = z.object({
  chairId: z.string().min(1),
  reason: z.string().min(1).max(500),
  scheduledAt: z.string().datetime(),
  estimatedDuration: z.number().min(5).max(480), // 5 min to 8 hours
  maintenanceType: z.enum(['cleaning', 'repair', 'inspection', 'other']),
  assignedTo: z.string().optional(),
});

// =============================================================================
// QUERY SCHEMAS
// =============================================================================

/**
 * Query floor plan analytics
 */
export const floorPlanAnalyticsQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  chairIds: z.array(z.string()).optional(),
  providerId: z.string().optional(),
});

/**
 * Export floor plan
 */
export const exportFloorPlanSchema = z.object({
  format: z.enum(['png', 'pdf', 'svg']).default('png'),
  includeStatus: z.boolean().default(true),
  includePatientInfo: z.boolean().default(false), // PHI consideration
  timestamp: z.boolean().default(true),
});

// =============================================================================
// FILTER & VIEW SCHEMAS
// =============================================================================

export const viewModeSchema = z.enum([
  'standard',
  'active-only',
  'provider-grouped',
  'priority',
  'heatmap',
]);

export const floorPlanFiltersSchema = z.object({
  status: z.array(z.string()).default([]),
  providerIds: z.array(z.string()).default([]),
  treatmentTypes: z.array(z.string()).default([]),
  priorities: z.array(z.string()).default([]),
  timeRange: z.enum(['all', 'overdue', 'on-time', 'ahead']).default('all'),
});

export const saveFilterPresetSchema = z.object({
  name: z.string().min(1).max(50),
  filters: floorPlanFiltersSchema,
  viewMode: viewModeSchema.default('standard'),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type GridConfig = z.infer<typeof gridConfigSchema>;
export type Position = z.infer<typeof positionSchema>;
export type Rotation = z.infer<typeof rotationSchema>;
export type ChairPosition = z.infer<typeof chairPositionSchema>;
export type RoomBoundary = z.infer<typeof roomBoundarySchema>;
export type FloorPlanLayout = z.infer<typeof floorPlanLayoutSchema>;

export type SaveFloorPlanLayoutInput = z.infer<typeof saveFloorPlanLayoutSchema>;
export type CreateFloorPlanTemplateInput = z.infer<typeof createFloorPlanTemplateSchema>;
export type BlockChairInput = z.infer<typeof blockChairSchema>;
export type ScheduleMaintenanceInput = z.infer<typeof scheduleMaintenanceSchema>;
export type FloorPlanAnalyticsQuery = z.infer<typeof floorPlanAnalyticsQuerySchema>;
export type ExportFloorPlanInput = z.infer<typeof exportFloorPlanSchema>;
export type ViewMode = z.infer<typeof viewModeSchema>;
export type FloorPlanFilters = z.infer<typeof floorPlanFiltersSchema>;
export type SaveFilterPresetInput = z.infer<typeof saveFilterPresetSchema>;

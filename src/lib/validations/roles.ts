import { z } from 'zod';

// =============================================================================
// Role Validation Schemas
// =============================================================================

/**
 * Schema for creating a new role
 */
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be less than 100 characters'),
  code: z
    .string()
    .min(1, 'Role code is required')
    .max(50, 'Role code must be less than 50 characters')
    .regex(
      /^[a-z][a-z0-9_]*$/,
      'Role code must start with a letter and contain only lowercase letters, numbers, and underscores'
    ),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
  permissions: z.array(z.string()).default([]),
  isSystem: z.boolean().default(false),
  // Hierarchy fields
  level: z.number().int().min(0).max(100).default(0),
  parentRoleId: z.string().nullable().optional(),
});

/**
 * Schema for updating a role
 */
export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be less than 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
  permissions: z.array(z.string()).optional(),
  // Hierarchy fields
  level: z.number().int().min(0).max(100).optional(),
  parentRoleId: z.string().nullable().optional(),
});

/**
 * Schema for querying roles
 */
export const roleQuerySchema = z.object({
  search: z.string().optional(),
  includeSystem: z
    .preprocess((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return val;
    }, z.boolean())
    .default(true),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
});

/**
 * Schema for updating role permissions
 */
export const updateRolePermissionsSchema = z.object({
  permissions: z.array(z.string()),
});

// =============================================================================
// Role Assignment Validation Schemas
// =============================================================================

/**
 * Schema for assigning a role to a staff member
 */
export const createRoleAssignmentSchema = z.object({
  roleId: z.string().min(1, 'Role ID is required'),
  clinicId: z.string().optional(), // If not provided, uses current clinic
  isPrimary: z.boolean().default(false),
  effectiveFrom: z.coerce.date().optional(),
  effectiveUntil: z.coerce.date().optional().nullable(),
});

/**
 * Schema for updating a role assignment
 */
export const updateRoleAssignmentSchema = z.object({
  isPrimary: z.boolean().optional(),
  effectiveUntil: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
});

// =============================================================================
// Role Export/Import Schemas
// =============================================================================

/**
 * Schema for exporting roles
 */
export const exportRolesSchema = z.object({
  roleIds: z.array(z.string()).optional(), // If empty, exports all non-system roles
  includeSystem: z.boolean().default(false),
  format: z.enum(['json', 'csv']).default('json'),
});

/**
 * Exported role data structure
 */
export const exportedRoleSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  permissions: z.array(z.string()),
  level: z.number().default(0),
  parentRoleCode: z.string().nullable().optional(), // Uses code instead of ID for portability
});

/**
 * Schema for importing roles
 */
export const importRolesSchema = z.object({
  roles: z.array(exportedRoleSchema),
  overwriteExisting: z.boolean().default(false), // If true, update existing roles with same code
  skipExisting: z.boolean().default(true), // If true, skip roles that already exist
});

/**
 * Schema for role change history query
 */
export const roleChangeHistoryQuerySchema = z.object({
  roleId: z.string().optional(),
  changeType: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
});

// =============================================================================
// Type Exports
// =============================================================================

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type RoleQuery = z.infer<typeof roleQuerySchema>;
export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>;
export type CreateRoleAssignmentInput = z.infer<typeof createRoleAssignmentSchema>;
export type UpdateRoleAssignmentInput = z.infer<typeof updateRoleAssignmentSchema>;
export type ExportRolesInput = z.infer<typeof exportRolesSchema>;
export type ExportedRole = z.infer<typeof exportedRoleSchema>;
export type ImportRolesInput = z.infer<typeof importRolesSchema>;
export type RoleChangeHistoryQuery = z.infer<typeof roleChangeHistoryQuerySchema>;

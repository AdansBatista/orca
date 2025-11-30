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
// Type Exports
// =============================================================================

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type RoleQuery = z.infer<typeof roleQuerySchema>;
export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>;
export type CreateRoleAssignmentInput = z.infer<typeof createRoleAssignmentSchema>;
export type UpdateRoleAssignmentInput = z.infer<typeof updateRoleAssignmentSchema>;

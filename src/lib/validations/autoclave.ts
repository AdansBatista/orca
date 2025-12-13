import { z } from 'zod';

// IP address regex (simple validation)
const ipAddressRegex = /^(\d{1,3}\.){3}\d{1,3}$/;

/**
 * Schema for creating a new autoclave integration
 */
export const createAutoclaveSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  ipAddress: z
    .string()
    .min(1, 'IP address is required')
    .regex(ipAddressRegex, 'Invalid IP address format'),
  port: z.number().int().min(1).max(65535).default(80),
  equipmentId: z.string().min(1, 'Equipment is required'),
  enabled: z.boolean().default(true),
});

export type CreateAutoclaveInput = z.infer<typeof createAutoclaveSchema>;

/**
 * Schema for updating an autoclave integration
 */
export const updateAutoclaveSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  ipAddress: z
    .string()
    .min(1, 'IP address is required')
    .regex(ipAddressRegex, 'Invalid IP address format')
    .optional(),
  port: z.number().int().min(1).max(65535).optional(),
  equipmentId: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
});

export type UpdateAutoclaveInput = z.infer<typeof updateAutoclaveSchema>;

/**
 * Schema for querying autoclaves
 */
export const autoclaveQuerySchema = z.object({
  enabled: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  status: z
    .enum(['NOT_CONFIGURED', 'PENDING_SETUP', 'PENDING_CONNECTION', 'CONNECTED', 'ERROR', 'INACTIVE'])
    .optional(),
});

export type AutoclaveQueryInput = z.infer<typeof autoclaveQuerySchema>;

/**
 * Schema for importing cycles from an autoclave
 */
export const importCyclesSchema = z.object({
  cycles: z
    .array(
      z.object({
        year: z.string().min(4).max(4),
        month: z.string().min(2).max(2),
        day: z.string().min(2).max(2),
        cycleNumber: z.string().min(1),
      })
    )
    .min(1, 'At least one cycle must be selected'),
});

export type ImportCyclesInput = z.infer<typeof importCyclesSchema>;

/**
 * Schema for fetching cycles for a specific date range
 */
export const fetchCyclesQuerySchema = z.object({
  year: z.string().optional(),
  month: z.string().optional(),
  sinceDate: z.string().optional(), // ISO date string
  sinceCycleNumber: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
});

export type FetchCyclesQueryInput = z.infer<typeof fetchCyclesQuerySchema>;

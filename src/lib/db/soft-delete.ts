/**
 * Soft Delete Helper for MongoDB/Prisma
 *
 * This module provides standardized soft delete filtering across the codebase.
 * Use these helpers EVERYWHERE instead of manual deletedAt checks to ensure consistency.
 *
 * MongoDB with Prisma requires special handling for null checks because:
 * - `deletedAt: null` only matches documents where deletedAt is explicitly null
 * - Documents where deletedAt field doesn't exist (undefined) are NOT matched
 * - We need to check for BOTH null AND unset (isSet: false) to get all non-deleted records
 *
 * @example
 * // Option 1: Use the helper function
 * const patients = await db.patient.findMany({
 *   where: withSoftDelete({ clinicId }),
 * });
 *
 * @example
 * // Option 2: Spread the constant
 * const patients = await db.patient.findMany({
 *   where: { clinicId, ...SOFT_DELETE_FILTER },
 * });
 */

/**
 * Type for the soft delete filter
 */
export type SoftDeleteFilter = {
  OR: [{ deletedAt: { isSet: false } }, { deletedAt: null }];
};

/**
 * Standard soft delete filter for MongoDB/Prisma.
 * Matches records where deletedAt is either null OR not set.
 * Note: Using explicit type instead of `as const` to avoid readonly issues with Prisma.
 */
export const SOFT_DELETE_FILTER: SoftDeleteFilter = {
  OR: [{ deletedAt: { isSet: false } }, { deletedAt: null }],
};

/**
 * Add soft delete filter to a where clause.
 * Use this when you need to combine soft delete with other conditions.
 *
 * @param where - The existing where clause
 * @returns The where clause with soft delete filter added
 *
 * @example
 * const patients = await db.patient.findMany({
 *   where: withSoftDelete({ clinicId, isActive: true }),
 * });
 */
export function withSoftDelete<T extends Record<string, unknown>>(
  where: T
): T & SoftDeleteFilter {
  return { ...where, ...SOFT_DELETE_FILTER };
}

/**
 * Models that support soft delete (have deletedAt field).
 * Use this list to determine if a model needs soft delete filtering.
 */
export const SOFT_DELETABLE_MODELS = [
  'User',
  'Patient',
  'StaffProfile',
  'Supplier',
  'Equipment',
  'Room',
  'TreatmentChair',
  'InstrumentSet',
  'InventoryItem',
  'AppointmentType',
  'Appointment',
] as const;

/**
 * Type for soft deletable model names
 */
export type SoftDeletableModel = (typeof SOFT_DELETABLE_MODELS)[number];

/**
 * Check if a model supports soft delete
 *
 * @param model - The model name to check
 * @returns true if the model has deletedAt field
 */
export function isSoftDeletable(model: string): model is SoftDeletableModel {
  return SOFT_DELETABLE_MODELS.includes(model as SoftDeletableModel);
}

/**
 * Create a soft delete filter with additional AND conditions.
 * Use this when you have complex queries that need AND logic with soft delete.
 *
 * @param conditions - Additional conditions to AND with soft delete
 * @returns A combined filter with soft delete
 *
 * @example
 * const appointments = await db.appointment.findMany({
 *   where: withSoftDeleteAnd([
 *     { clinicId },
 *     { status: { in: ['SCHEDULED', 'CONFIRMED'] } },
 *   ]),
 * });
 */
export function withSoftDeleteAnd(
  conditions: Record<string, unknown>[]
): { AND: (Record<string, unknown> | SoftDeleteFilter)[] } {
  return {
    AND: [...conditions, SOFT_DELETE_FILTER],
  };
}

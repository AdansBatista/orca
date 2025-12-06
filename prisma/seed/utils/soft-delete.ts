/**
 * Soft Delete Helper for Seed Files
 *
 * This module provides standardized soft delete filtering for seed operations.
 * Use these helpers in ALL seed files when querying soft-deletable models.
 *
 * MongoDB with Prisma requires special handling for null checks because:
 * - `deletedAt: null` only matches documents where deletedAt is explicitly null
 * - Documents where deletedAt field doesn't exist (undefined) are NOT matched
 * - We need to check for BOTH null AND unset (isSet: false) to get all non-deleted records
 *
 * @example
 * // Use in seed queries
 * const patients = await db.patient.findMany({
 *   where: withSoftDelete({ clinicId }),
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
 *
 * @param where - The existing where clause
 * @returns The where clause with soft delete filter added
 *
 * @example
 * const patients = await db.patient.findMany({
 *   where: withSoftDelete({ clinicId }),
 * });
 */
export function withSoftDelete<T extends Record<string, unknown>>(
  where: T
): T & SoftDeleteFilter {
  return { ...where, ...SOFT_DELETE_FILTER };
}

/**
 * Models that support soft delete (have deletedAt field).
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
 * Create data object with explicit deletedAt: null.
 * Use this when creating new records to ensure soft delete queries work correctly.
 *
 * @param data - The data to create
 * @returns The data with deletedAt: null added
 *
 * @example
 * await db.patient.create({
 *   data: withDeletedAtNull({
 *     clinicId,
 *     firstName: 'John',
 *     lastName: 'Doe',
 *   }),
 * });
 */
export function withDeletedAtNull<T extends Record<string, unknown>>(
  data: T
): T & { deletedAt: null } {
  return { ...data, deletedAt: null };
}

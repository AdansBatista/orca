import type { Session } from 'next-auth';
import { ROLE_PERMISSIONS } from './types';
import type { UserRole } from '@prisma/client';

/**
 * Check if a session user has the staff:compensation permission
 * This permission is required to view/edit salary and hourly rate data
 */
export function canViewCompensation(session: Session): boolean {
  if (!session?.user?.role) return false;

  const role = session.user.role as UserRole;
  const permissions = ROLE_PERMISSIONS[role] || [];

  // Check for wildcard (super_admin) or specific permission
  return permissions.includes('*') || permissions.includes('staff:compensation');
}

/**
 * Filter compensation fields from employment record data based on session permissions
 * Returns the data with compensation fields removed if user doesn't have permission
 */
export function filterCompensationFields<T extends Record<string, unknown>>(
  data: T,
  session: Session
): T {
  if (canViewCompensation(session)) {
    return data;
  }

  // Create a copy without compensation fields
  const filtered = { ...data };
  const compensationFields = [
    'previousSalary',
    'newSalary',
    'previousHourlyRate',
    'newHourlyRate',
  ];

  for (const field of compensationFields) {
    if (field in filtered) {
      delete filtered[field];
    }
  }

  return filtered;
}

/**
 * Filter an array of records, removing compensation fields from each
 */
export function filterCompensationFieldsArray<T extends Record<string, unknown>>(
  data: T[],
  session: Session
): T[] {
  if (canViewCompensation(session)) {
    return data;
  }

  return data.map(record => filterCompensationFields(record, session));
}

/**
 * Strip compensation fields from input data if user doesn't have permission
 * Used before creating/updating records
 */
export function sanitizeCompensationInput<T extends Record<string, unknown>>(
  data: T,
  session: Session
): T {
  if (canViewCompensation(session)) {
    return data;
  }

  // Create a copy without compensation fields
  const sanitized = { ...data };
  const compensationFields = [
    'previousSalary',
    'newSalary',
    'previousHourlyRate',
    'newHourlyRate',
  ];

  for (const field of compensationFields) {
    if (field in sanitized) {
      delete sanitized[field];
    }
  }

  return sanitized;
}

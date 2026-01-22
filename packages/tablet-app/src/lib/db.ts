import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

/**
 * Get the hard-coded clinic ID from environment
 * In single-clinic tablet mode, we use one fixed clinic ID
 */
export function getClinicId(): string {
  const clinicId = process.env.CLINIC_ID;
  if (!clinicId) {
    throw new Error('CLINIC_ID environment variable is required');
  }
  return clinicId;
}

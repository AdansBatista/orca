import type { Session } from 'next-auth';
import type { Prisma } from '@prisma/client';
import { db } from './db';
import type { AuditAction } from './auth/types';

interface AuditLogInput {
  action: AuditAction;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event
 *
 * @example
 * await logAudit(session, {
 *   action: 'UPDATE',
 *   entity: 'Patient',
 *   entityId: patient.id,
 *   details: { field: 'email', oldValue: 'old@email.com', newValue: 'new@email.com' },
 * });
 */
export async function logAudit(
  session: Session | null,
  input: AuditLogInput
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: session?.user?.id,
        userName: session?.user ? `${session.user.firstName} ${session.user.lastName}` : null,
        userRole: session?.user?.role,
        clinicId: session?.user?.clinicId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        details: (input.details ?? null) as Prisma.InputJsonValue | null,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Log an authentication event (login, logout, failed login)
 */
export async function logAuthEvent(
  action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED',
  email: string,
  userId?: string,
  clinicId?: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: userId,
        userName: email,
        userRole: null,
        clinicId: clinicId,
        action,
        entity: 'Auth',
        entityId: userId,
        details: (details ?? null) as Prisma.InputJsonValue | null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create auth audit log:', error);
  }
}

/**
 * Get request metadata for audit logging
 */
export function getRequestMeta(req: Request): {
  ipAddress: string | undefined;
  userAgent: string | undefined;
} {
  const headers = new Headers(req.headers);
  return {
    ipAddress:
      headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headers.get('x-real-ip') ||
      undefined,
    userAgent: headers.get('user-agent') || undefined,
  };
}

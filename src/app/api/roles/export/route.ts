import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { exportRolesSchema } from '@/lib/validations/roles';

/**
 * POST /api/roles/export
 * Export roles to JSON or CSV format
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = exportRolesSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid export options',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { roleIds, includeSystem, format } = result.data;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (roleIds && roleIds.length > 0) {
      where.id = { in: roleIds };
    }

    if (!includeSystem) {
      where.isSystem = false;
    }

    // Fetch roles with parent role info
    const roles = await db.role.findMany({
      where,
      include: {
        parentRole: {
          select: {
            code: true,
          },
        },
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });

    // Transform to export format
    const exportedRoles = roles.map((role) => ({
      code: role.code,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      level: role.level,
      parentRoleCode: role.parentRole?.code ?? null,
      isSystem: role.isSystem,
    }));

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'EXPORT',
      entity: 'Role',
      details: {
        count: exportedRoles.length,
        format,
        includeSystem,
      },
      ipAddress,
      userAgent,
    });

    if (format === 'csv') {
      // Generate CSV
      const headers = ['code', 'name', 'description', 'permissions', 'level', 'parentRoleCode', 'isSystem'];
      const csvRows = [
        headers.join(','),
        ...exportedRoles.map((role) =>
          [
            escapeCSV(role.code),
            escapeCSV(role.name),
            escapeCSV(role.description ?? ''),
            escapeCSV(role.permissions.join(';')),
            role.level,
            escapeCSV(role.parentRoleCode ?? ''),
            role.isSystem,
          ].join(',')
        ),
      ];

      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="roles-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Return JSON
    return NextResponse.json({
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        count: exportedRoles.length,
        roles: exportedRoles,
      },
    });
  },
  { permissions: ['roles:full'] }
);

/**
 * Escape a value for CSV output
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

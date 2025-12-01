import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { PERMISSION_DEFINITIONS } from '@/lib/permissions';

interface ValidationIssue {
  type: 'warning' | 'error';
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * GET /api/roles/[id]/validate
 * Validate a role's permissions for potential issues
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Find the role
    const role = await db.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Role not found',
          },
        },
        { status: 404 }
      );
    }

    const issues: ValidationIssue[] = [];
    const permissions = role.permissions as string[];

    // Check for invalid permissions (not in PERMISSION_DEFINITIONS)
    const validPermissions = Object.keys(PERMISSION_DEFINITIONS);
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));

    if (invalidPermissions.length > 0) {
      issues.push({
        type: 'error',
        code: 'INVALID_PERMISSIONS',
        message: `Role contains ${invalidPermissions.length} invalid permission(s)`,
        details: { invalidPermissions },
      });
    }

    // Check for no permissions
    if (permissions.length === 0) {
      issues.push({
        type: 'warning',
        code: 'NO_PERMISSIONS',
        message: 'Role has no permissions assigned',
      });
    }

    // Check for permission conflicts or redundancies
    const fullPermissions = permissions.filter(p => p.endsWith(':full'));

    // If :full exists, :view and :edit are redundant
    for (const fullPerm of fullPermissions) {
      const base = fullPerm.replace(':full', '');
      const redundantView = `${base}:view`;
      const redundantEdit = `${base}:edit`;

      if (permissions.includes(redundantView)) {
        issues.push({
          type: 'warning',
          code: 'REDUNDANT_PERMISSION',
          message: `"${redundantView}" is redundant when "${fullPerm}" is granted`,
          details: { redundant: redundantView, supersededBy: fullPerm },
        });
      }

      if (permissions.includes(redundantEdit)) {
        issues.push({
          type: 'warning',
          code: 'REDUNDANT_PERMISSION',
          message: `"${redundantEdit}" is redundant when "${fullPerm}" is granted`,
          details: { redundant: redundantEdit, supersededBy: fullPerm },
        });
      }
    }

    // Check for sensitive permissions
    const sensitivePermissions = [
      'users:full',
      'roles:full',
      'audit:full',
      'settings:full',
      'phi:full',
    ];

    const hasSensitive = permissions.filter(p => sensitivePermissions.includes(p));
    if (hasSensitive.length > 0) {
      issues.push({
        type: 'warning',
        code: 'SENSITIVE_PERMISSIONS',
        message: `Role has ${hasSensitive.length} sensitive permission(s)`,
        details: { sensitivePermissions: hasSensitive },
      });
    }

    // Validation summary
    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;

    return NextResponse.json({
      success: true,
      data: {
        roleId: role.id,
        roleName: role.name,
        roleCode: role.code,
        isSystem: role.isSystem,
        permissionCount: permissions.length,
        assignmentCount: role._count.assignments,
        validation: {
          isValid: errorCount === 0,
          errorCount,
          warningCount,
          issues,
        },
      },
    });
  },
  { permissions: ['roles:view', 'roles:edit', 'roles:full'] }
);

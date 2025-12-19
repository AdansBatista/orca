import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { importRolesSchema } from '@/lib/validations/roles';

interface ImportResult {
  code: string;
  name: string;
  status: 'created' | 'updated' | 'skipped' | 'error';
  error?: string;
}

/**
 * POST /api/roles/import
 * Import roles from JSON
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = importRolesSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid import data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { roles, overwriteExisting, skipExisting } = result.data;

    // Validate that imported roles don't include system role codes
    const systemRoles = await db.role.findMany({
      where: { isSystem: true },
      select: { code: true },
    });
    const systemRoleCodes = new Set(systemRoles.map((r) => r.code));

    const importResults: ImportResult[] = [];
    const createdRoleIds: string[] = [];
    const updatedRoleIds: string[] = [];

    // First pass: Create/update roles without parent relationships
    const roleCodeToId: Map<string, string> = new Map();

    for (const roleData of roles) {
      // Check if it's a system role code
      if (systemRoleCodes.has(roleData.code)) {
        importResults.push({
          code: roleData.code,
          name: roleData.name,
          status: 'skipped',
          error: 'Cannot overwrite system role',
        });
        continue;
      }

      // Check if role exists
      const existingRole = await db.role.findUnique({
        where: { code: roleData.code },
      });

      try {
        if (existingRole) {
          if (skipExisting && !overwriteExisting) {
            importResults.push({
              code: roleData.code,
              name: roleData.name,
              status: 'skipped',
              error: 'Role already exists',
            });
            roleCodeToId.set(roleData.code, existingRole.id);
            continue;
          }

          if (overwriteExisting) {
            // Update existing role
            const updated = await db.role.update({
              where: { id: existingRole.id },
              data: {
                name: roleData.name,
                description: roleData.description,
                permissions: roleData.permissions,
                level: roleData.level ?? 0,
                // Don't set parentRoleId yet - will be set in second pass
              },
            });

            // Record change history
            await db.roleChangeHistory.create({
              data: {
                roleId: updated.id,
                changeType: 'UPDATE',
                changeData: {
                  source: 'import',
                  before: {
                    name: existingRole.name,
                    description: existingRole.description,
                    permissions: existingRole.permissions,
                    level: existingRole.level,
                  },
                  after: {
                    name: updated.name,
                    description: updated.description,
                    permissions: updated.permissions,
                    level: updated.level,
                  },
                },
                description: `Updated role "${updated.name}" via import`,
                changedById: session.user.id,
                changedByName: `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() || undefined,
              },
            });

            roleCodeToId.set(roleData.code, updated.id);
            updatedRoleIds.push(updated.id);
            importResults.push({
              code: roleData.code,
              name: roleData.name,
              status: 'updated',
            });
          } else {
            importResults.push({
              code: roleData.code,
              name: roleData.name,
              status: 'skipped',
              error: 'Role already exists (use overwriteExisting to update)',
            });
            roleCodeToId.set(roleData.code, existingRole.id);
          }
        } else {
          // Create new role
          const created = await db.role.create({
            data: {
              code: roleData.code,
              name: roleData.name,
              description: roleData.description,
              permissions: roleData.permissions,
              level: roleData.level ?? 0,
              isSystem: false,
              // Don't set parentRoleId yet - will be set in second pass
            },
          });

          // Record change history
          await db.roleChangeHistory.create({
            data: {
              roleId: created.id,
              changeType: 'CREATE',
              changeData: {
                source: 'import',
                role: {
                  code: created.code,
                  name: created.name,
                  description: created.description,
                  permissions: created.permissions,
                  level: created.level,
                },
              },
              description: `Created role "${created.name}" via import`,
              changedById: session.user.id,
              changedByName: `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() || undefined,
            },
          });

          roleCodeToId.set(roleData.code, created.id);
          createdRoleIds.push(created.id);
          importResults.push({
            code: roleData.code,
            name: roleData.name,
            status: 'created',
          });
        }
      } catch (error) {
        importResults.push({
          code: roleData.code,
          name: roleData.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Second pass: Set up parent relationships
    for (const roleData of roles) {
      if (!roleData.parentRoleCode) continue;

      const roleId = roleCodeToId.get(roleData.code);
      if (!roleId) continue;

      // Find parent role by code
      const parentRole = await db.role.findUnique({
        where: { code: roleData.parentRoleCode },
        select: { id: true },
      });

      if (parentRole) {
        await db.role.update({
          where: { id: roleId },
          data: { parentRoleId: parentRole.id },
        });
      }
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'IMPORT',
      entity: 'Role',
      details: {
        totalRoles: roles.length,
        created: createdRoleIds.length,
        updated: updatedRoleIds.length,
        skipped: importResults.filter((r) => r.status === 'skipped').length,
        errors: importResults.filter((r) => r.status === 'error').length,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: roles.length,
          created: createdRoleIds.length,
          updated: updatedRoleIds.length,
          skipped: importResults.filter((r) => r.status === 'skipped').length,
          errors: importResults.filter((r) => r.status === 'error').length,
        },
        results: importResults,
      },
    });
  },
  { permissions: ['roles:full'] }
);

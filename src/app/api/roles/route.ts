import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createRoleSchema, roleQuerySchema } from '@/lib/validations/roles';

/**
 * GET /api/roles
 * List all roles with pagination and search
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      includeSystem: searchParams.get('includeSystem') ?? 'true',
      page: searchParams.get('page') ?? '1',
      pageSize: searchParams.get('pageSize') ?? '50',
    };

    const queryResult = roleQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { search, includeSystem, page, pageSize } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {};

    // Filter by system roles if requested
    if (!includeSystem) {
      where.isSystem = false;
    }

    // Search by name or code
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await db.role.count({ where });

    // Get paginated results
    const items = await db.role.findMany({
      where,
      orderBy: [{ isSystem: 'desc' }, { level: 'desc' }, { name: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: { assignments: true },
        },
        parentRole: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: items.map((role) => ({
          ...role,
          assignmentCount: role._count.assignments,
          _count: undefined,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['roles:view', 'roles:edit', 'roles:full'] }
);

/**
 * Helper to record role change history
 */
async function recordRoleChange(
  roleId: string,
  changeType: string,
  changeData: Record<string, unknown>,
  session: { user: { id: string; firstName?: string; lastName?: string } },
  description?: string
) {
  await db.roleChangeHistory.create({
    data: {
      roleId,
      changeType,
      changeData: changeData as Record<string, string | number | boolean | null>,
      description,
      changedById: session.user.id,
      changedByName: session.user.firstName && session.user.lastName
        ? `${session.user.firstName} ${session.user.lastName}`
        : undefined,
    },
  });
}

/**
 * POST /api/roles
 * Create a new role
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createRoleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid role data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for duplicate code
    const existingByCode = await db.role.findUnique({
      where: { code: data.code },
    });

    if (existingByCode) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_CODE',
            message: 'A role with this code already exists',
          },
        },
        { status: 409 }
      );
    }

    // Validate parent role if provided
    if (data.parentRoleId) {
      const parentRole = await db.role.findUnique({
        where: { id: data.parentRoleId },
      });

      if (!parentRole) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_PARENT_ROLE',
              message: 'Parent role not found',
            },
          },
          { status: 400 }
        );
      }
    }

    // Create the role (custom roles are never system roles)
    const role = await db.role.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        permissions: data.permissions,
        isSystem: false, // Custom roles are never system roles
        level: data.level ?? 0,
        parentRoleId: data.parentRoleId ?? null,
      },
    });

    // Record role change history
    await recordRoleChange(
      role.id,
      'CREATE',
      { role },
      session,
      `Created role "${role.name}"`
    );

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'Role',
      entityId: role.id,
      details: {
        name: role.name,
        code: role.code,
        permissionCount: role.permissions.length,
        level: role.level,
        parentRoleId: role.parentRoleId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: role }, { status: 201 });
  },
  { permissions: ['roles:edit', 'roles:full'] }
);

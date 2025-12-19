import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createStaffProfileSchema,
  staffProfileQuerySchema,
} from '@/lib/validations/staff';

/**
 * GET /api/staff
 * List staff profiles with pagination, search, and filters
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters (convert null to undefined)
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      employmentType: searchParams.get('employmentType') ?? undefined,
      isProvider: searchParams.get('isProvider') ?? undefined,
      providerType: searchParams.get('providerType') ?? undefined,
      department: searchParams.get('department') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = staffProfileQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      console.error('Staff query validation error:', queryResult.error.flatten());
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

    const {
      search,
      status,
      employmentType,
      isProvider,
      providerType,
      department,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause with standardized soft delete filter
    const where: Record<string, unknown> = withSoftDelete(getClinicFilter(session));

    if (status) where.status = status;
    if (employmentType) where.employmentType = employmentType;
    if (isProvider !== undefined) where.isProvider = isProvider;
    if (providerType) where.providerType = providerType;
    if (department) where.department = department;

    // Search across name and email
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await db.staffProfile.count({ where });

    // Get paginated results
    const items = await db.staffProfile.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        credentials: {
          where: { status: 'ACTIVE' },
          select: { id: true, type: true, name: true, expirationDate: true, status: true },
        },
        certifications: {
          where: { status: 'ACTIVE' },
          select: { id: true, type: true, name: true, expirationDate: true, status: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['staff:view', 'staff:edit', 'staff:full'] }
);

/**
 * POST /api/staff
 * Create a new staff profile
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createStaffProfileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid staff profile data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for duplicate employee number in this clinic
    const existingByNumber = await db.staffProfile.findFirst({
      where: withSoftDelete({
        clinicId: session.user.clinicId,
        employeeNumber: data.employeeNumber,
      }),
    });

    if (existingByNumber) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_EMPLOYEE_NUMBER',
            message: 'An employee with this employee number already exists',
          },
        },
        { status: 409 }
      );
    }

    // Check for duplicate email in this clinic
    const existingByEmail = await db.staffProfile.findFirst({
      where: withSoftDelete({
        clinicId: session.user.clinicId,
        email: data.email,
      }),
    });

    if (existingByEmail) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_EMAIL',
            message: 'A staff member with this email already exists',
          },
        },
        { status: 409 }
      );
    }

    // Create the staff profile
    const staffProfile = await db.staffProfile.create({
      data: {
        ...data,
        clinicId: session.user.clinicId,
        clinicIds: data.clinicIds || [session.user.clinicId],
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
    });

    // Create initial employment record
    await db.employmentRecord.create({
      data: {
        staffProfileId: staffProfile.id,
        clinicId: session.user.clinicId,
        recordType: 'HIRE',
        effectiveDate: data.hireDate,
        newTitle: data.title,
        newDepartment: data.department,
        newEmploymentType: data.employmentType,
        newStatus: data.status,
        createdBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'StaffProfile',
      entityId: staffProfile.id,
      details: {
        employeeNumber: staffProfile.employeeNumber,
        name: `${staffProfile.firstName} ${staffProfile.lastName}`,
        isProvider: staffProfile.isProvider,
        providerType: staffProfile.providerType,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: staffProfile },
      { status: 201 }
    );
  },
  { permissions: ['staff:edit', 'staff:full'] }
);

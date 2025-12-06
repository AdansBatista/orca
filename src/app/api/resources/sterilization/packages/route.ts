import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { withSoftDelete } from '@/lib/db/soft-delete';
import {
  createInstrumentPackageSchema,
  instrumentPackageQuerySchema,
} from '@/lib/validations/sterilization';
import { generateQRContent, calculateExpirationDate } from '@/lib/sterilization/qr-code';

/**
 * GET /api/resources/sterilization/packages
 * List instrument packages with pagination, search, and filters
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      cycleId: searchParams.get('cycleId') ?? undefined,
      packageType: searchParams.get('packageType') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      instrumentSetId: searchParams.get('instrumentSetId') ?? undefined,
      expiringWithinDays: searchParams.get('expiringWithinDays') ?? undefined,
      expired: searchParams.get('expired') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = instrumentPackageQuerySchema.safeParse(rawParams);

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

    const {
      search,
      cycleId,
      packageType,
      status,
      instrumentSetId,
      expiringWithinDays,
      expired,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (cycleId) where.cycleId = cycleId;
    if (packageType) where.packageType = packageType;
    if (status) where.status = status;
    if (instrumentSetId) where.instrumentSetId = instrumentSetId;

    // Expiration filters
    const now = new Date();
    if (expired) {
      where.expirationDate = { lt: now };
      where.status = 'STERILE'; // Only sterile packages can expire
    } else if (expiringWithinDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + expiringWithinDays);
      where.expirationDate = {
        gte: now,
        lte: futureDate,
      };
      where.status = 'STERILE';
    }

    // Search across package number and instrument names
    if (search) {
      where.OR = [
        { packageNumber: { contains: search, mode: 'insensitive' } },
        { cassetteName: { contains: search, mode: 'insensitive' } },
        { instrumentNames: { hasSome: [search] } },
      ];
    }

    // Get total count
    const total = await db.instrumentPackage.count({ where });

    // Get paginated results
    const items = await db.instrumentPackage.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        cycle: {
          select: {
            id: true,
            cycleNumber: true,
            cycleType: true,
            status: true,
          },
        },
        _count: {
          select: {
            usages: true,
          },
        },
      },
    });

    // Calculate stats
    const stats = await db.instrumentPackage.groupBy({
      by: ['status'],
      where: getClinicFilter(session),
      _count: true,
    });

    const expiringCount = await db.instrumentPackage.count({
      where: {
        ...getClinicFilter(session),
        status: 'STERILE',
        expirationDate: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
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
        stats: {
          byStatus: stats.reduce((acc, s) => {
            acc[s.status] = s._count;
            return acc;
          }, {} as Record<string, number>),
          expiringWithin7Days: expiringCount,
        },
      },
    });
  },
  { permissions: ['sterilization:read'] }
);

/**
 * POST /api/resources/sterilization/packages
 * Create a new instrument package
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createInstrumentPackageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid package data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify cycle exists and is completed
    const cycle = await db.sterilizationCycle.findFirst({
      where: {
        id: data.cycleId,
        clinicId: session.user.clinicId,
      },
    });

    if (!cycle) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CYCLE_NOT_FOUND',
            message: 'Sterilization cycle not found',
          },
        },
        { status: 404 }
      );
    }

    if (cycle.status !== 'COMPLETED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CYCLE_NOT_COMPLETED',
            message: 'Can only create packages from completed sterilization cycles',
          },
        },
        { status: 400 }
      );
    }

    // Verify instrument set if provided
    if (data.instrumentSetId) {
      const instrumentSet = await db.instrumentSet.findFirst({
        where: withSoftDelete({
          id: data.instrumentSetId,
          clinicId: session.user.clinicId,
        }),
      });

      if (!instrumentSet) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INSTRUMENT_SET_NOT_FOUND',
              message: 'Instrument set not found',
            },
          },
          { status: 404 }
        );
      }
    }

    // Generate package number
    const year = new Date().getFullYear();
    const latestPackage = await db.instrumentPackage.findFirst({
      where: {
        clinicId: session.user.clinicId,
        packageNumber: { startsWith: `PKG-${year}-` },
      },
      orderBy: { packageNumber: 'desc' },
    });

    let nextNum = 1;
    if (latestPackage) {
      const match = latestPackage.packageNumber.match(/PKG-\d{4}-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const packageNumber = `PKG-${year}-${String(nextNum).padStart(6, '0')}`;

    // Calculate dates
    const sterilizedDate = cycle.endTime || cycle.startTime;
    const expirationDate = calculateExpirationDate(sterilizedDate, data.expirationDays);

    // Generate QR code content
    const qrCode = generateQRContent({
      cycleId: cycle.id,
      cycleNumber: cycle.cycleNumber,
      cycleDate: sterilizedDate,
    });

    // Create the package
    const pkg = await db.instrumentPackage.create({
      data: {
        clinicId: session.user.clinicId,
        packageNumber,
        qrCode,
        packageType: data.packageType,
        cycleId: data.cycleId,
        sterilizedDate,
        expirationDate,
        instrumentSetId: data.instrumentSetId,
        instrumentNames: data.instrumentNames,
        itemCount: data.itemCount,
        cassetteName: data.cassetteName,
        status: 'STERILE',
        preparedById: session.user.id,
        notes: data.notes,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
      include: {
        cycle: {
          select: {
            id: true,
            cycleNumber: true,
            cycleType: true,
            status: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'InstrumentPackage',
      entityId: pkg.id,
      details: {
        packageNumber: pkg.packageNumber,
        packageType: pkg.packageType,
        cycleId: pkg.cycleId,
        cycleNumber: cycle.cycleNumber,
        instrumentNames: pkg.instrumentNames,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: pkg }, { status: 201 });
  },
  { permissions: ['sterilization:create'] }
);

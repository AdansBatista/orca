import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth';

/**
 * GET /api/patients
 * List patients with search, pagination, and filtering
 *
 * NOTE: This is a basic implementation for booking functionality.
 * Will be expanded when Patient Management area is implemented.
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const skip = (page - 1) * pageSize;

    // Search
    const search = searchParams.get('search')?.trim();

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'lastName';
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';

    // Build where clause
    // For super_admin without clinicId, get patients from first clinic
    let clinicId: string | null | undefined = session.user.clinicId;
    if (!clinicId && session.user.role === 'super_admin') {
      const firstClinic = await db.clinic.findFirst({ select: { id: true } });
      clinicId = firstClinic?.id;
    }

    if (!clinicId) {
      return NextResponse.json({
        success: true,
        data: { items: [], total: 0, page, pageSize, totalPages: 0 },
      });
    }

    const where: Record<string, unknown> = {
      clinicId,
      OR: [{ deletedAt: { isSet: false } }, { deletedAt: null }],
    };

    // Add search filter
    if (search) {
      where.AND = [
        {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    // Get total count
    const total = await db.patient.count({ where });

    // Get patients
    const patients = await db.patient.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: patients,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['patients:read'] }
);

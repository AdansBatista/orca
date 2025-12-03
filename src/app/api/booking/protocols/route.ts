import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { createEmergencyProtocolSchema } from '@/lib/validations/emergency-reminders';

/**
 * GET /api/booking/protocols
 * List emergency protocols for the clinic
 */
export const GET = withAuth(
  async (req, session) => {
    const protocols = await db.emergencyProtocol.findMany({
      where: {
        ...getClinicFilter(session),
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: protocols,
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * POST /api/booking/protocols
 * Create a new emergency protocol
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    const validationResult = createEmergencyProtocolSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid protocol data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if protocol for this emergency type already exists
    const existing = await db.emergencyProtocol.findFirst({
      where: {
        clinicId: session.user.clinicId,
        emergencyType: data.emergencyType,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROTOCOL_EXISTS',
            message: `A protocol for ${data.emergencyType} already exists. Use PUT to update it.`,
          },
        },
        { status: 400 }
      );
    }

    const protocol = await db.emergencyProtocol.create({
      data: {
        ...data,
        clinicId: session.user.clinicId,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: protocol,
    });
  },
  { permissions: ['booking:write'] }
);

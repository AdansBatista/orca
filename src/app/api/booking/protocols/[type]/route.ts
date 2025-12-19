import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { EmergencyType } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { updateEmergencyProtocolSchema, EmergencyTypeEnum } from '@/lib/validations/emergency-reminders';

/**
 * GET /api/booking/protocols/:type
 * Get a specific emergency protocol by type
 */
export const GET = withAuth<{ type: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { type } = await params;

    // Validate emergency type
    const parseResult = EmergencyTypeEnum.safeParse(type);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TYPE',
            message: `Invalid emergency type: ${type}`,
          },
        },
        { status: 400 }
      );
    }

    const protocol = await db.emergencyProtocol.findFirst({
      where: {
        ...getClinicFilter(session),
        emergencyType: type as EmergencyType,
      },
    });

    if (!protocol) {
      // Return default protocol if none exists
      return NextResponse.json({
        success: true,
        data: {
          emergencyType: type,
          name: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
          typicalSeverity: 'MEDIUM',
          maxWaitDays: 2,
          isActive: false,
          isDefault: true, // Flag to indicate this is a default, not saved
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: protocol,
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * PUT /api/booking/protocols/:type
 * Update or create an emergency protocol by type
 */
export const PUT = withAuth<{ type: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { type } = await params;
    const body = await req.json();

    // Validate emergency type
    const typeResult = EmergencyTypeEnum.safeParse(type);
    if (!typeResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TYPE',
            message: `Invalid emergency type: ${type}`,
          },
        },
        { status: 400 }
      );
    }

    const validationResult = updateEmergencyProtocolSchema.safeParse(body);

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

    // Upsert - create if doesn't exist, update if it does
    const protocol = await db.emergencyProtocol.upsert({
      where: {
        clinicId_emergencyType: {
          clinicId: session.user.clinicId,
          emergencyType: type as EmergencyType,
        },
      },
      create: {
        clinicId: session.user.clinicId,
        emergencyType: type as EmergencyType,
        name: data.name || type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
        ...data,
        updatedBy: session.user.id,
      },
      update: {
        ...data,
        version: { increment: 1 },
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

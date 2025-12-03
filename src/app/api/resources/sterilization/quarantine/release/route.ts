import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { db } from '@/lib/db';

const releaseSchema = z.object({
  packageIds: z.array(z.string()).min(1, 'At least one package is required'),
  notes: z.string().optional(),
});

export const POST = withAuth(
  async (req, session) => {
    const clinicFilter = getClinicFilter(session);

    try {
      const body = await req.json();
      const result = releaseSchema.safeParse(body);

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data',
              details: result.error.flatten(),
            },
          },
          { status: 400 }
        );
      }

      const { packageIds, notes } = result.data;

      // Verify all packages exist and are recalled/quarantined
      const packages = await db.instrumentPackage.findMany({
        where: {
          id: { in: packageIds },
          ...clinicFilter,
          status: 'RECALLED', // Using RECALLED as quarantine proxy
        },
      });

      if (packages.length !== packageIds.length) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_PACKAGES',
              message: 'Some packages were not found or are not quarantined',
            },
          },
          { status: 400 }
        );
      }

      // Update packages to STERILE status
      const now = new Date();
      await db.instrumentPackage.updateMany({
        where: {
          id: { in: packageIds },
        },
        data: {
          status: 'STERILE',
          updatedAt: now,
        },
      });

      // Log compliance action
      await db.complianceLog.create({
        data: {
          clinicId: session.user.clinicId,
          logType: 'CORRECTIVE_ACTION',
          title: 'Quarantine Release',
          description: `Released ${packageIds.length} package(s) from quarantine`,
          referenceType: 'InstrumentPackage',
          referenceId: packageIds[0],
          action: 'RELEASE',
          isCompliant: true,
          notes: notes || null,
          performedById: session.user.id,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          releasedCount: packageIds.length,
          releasedAt: now.toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to release packages from quarantine:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RELEASE_FAILED',
            message: 'Failed to release packages from quarantine',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['sterilization:validate'] }
);

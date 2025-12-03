import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Session } from 'next-auth';

import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { db } from '@/lib/db';

const checkoutSchema = z.object({
  patientId: z.string().nullable().optional(),
  procedureType: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const POST = withAuth(
  async (req: NextRequest, session: Session, { params }: { params: Promise<{ id: string }> }) => {
    const clinicFilter = getClinicFilter(session);
    const { id } = await params;

    try {
      const body = await req.json();
      const result = checkoutSchema.safeParse(body);

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

      const { patientId, procedureType, notes } = result.data;

      // Find the package
      const pkg = await db.instrumentPackage.findFirst({
        where: {
          id,
          ...clinicFilter,
        },
      });

      if (!pkg) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Package not found',
            },
          },
          { status: 404 }
        );
      }

      // Validate package is sterile
      if (pkg.status !== 'STERILE') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_STATUS',
              message: `Package cannot be checked out. Current status: ${pkg.status}`,
            },
          },
          { status: 400 }
        );
      }

      // Check if expired
      if (pkg.expirationDate && new Date(pkg.expirationDate) < new Date()) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'EXPIRED',
              message: 'Package has expired and cannot be used',
            },
          },
          { status: 400 }
        );
      }

      const now = new Date();
      const resolvedPatientId = patientId && patientId !== '__none__' ? patientId : null;

      // Create usage record - patientId is required, so only create if we have one
      let usageId: string | null = null;
      if (resolvedPatientId) {
        const usage = await db.packageUsage.create({
          data: {
            clinicId: session.user.clinicId,
            packageId: id,
            patientId: resolvedPatientId,
            usedAt: now,
            usedById: session.user.id,
            procedureType: procedureType && procedureType !== '__none__' ? procedureType : null,
            notes: notes || null,
          },
        });
        usageId = usage.id;
      }

      // Update package status to USED
      await db.instrumentPackage.update({
        where: { id },
        data: {
          status: 'USED',
          updatedAt: now,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          usageId,
          packageId: id,
          checkedOutAt: now.toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to checkout package:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CHECKOUT_FAILED',
            message: 'Failed to check out package',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['sterilization:use'] }
);

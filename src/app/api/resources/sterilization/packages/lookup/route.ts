import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { lookupPackageByQRSchema } from '@/lib/validations/sterilization';
import { isStillSterile, getDaysUntilExpiration } from '@/lib/sterilization/qr-code';

/**
 * POST /api/resources/sterilization/packages/lookup
 * Look up a package by QR code content
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = lookupPackageByQRSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid QR code',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { qrCode } = result.data;

    // Find package by QR code
    const pkg = await db.instrumentPackage.findFirst({
      where: {
        qrCode,
        ...getClinicFilter(session),
      },
      include: {
        cycle: {
          select: {
            id: true,
            cycleNumber: true,
            cycleType: true,
            status: true,
            startTime: true,
            endTime: true,
            temperature: true,
            pressure: true,
            exposureTime: true,
            mechanicalPass: true,
            chemicalPass: true,
            biologicalPass: true,
          },
        },
        usages: {
          orderBy: { usedAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            usages: true,
          },
        },
      },
    });

    if (!pkg) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PACKAGE_NOT_FOUND',
            message: 'Package not found. This QR code may be from another clinic or invalid.',
          },
        },
        { status: 404 }
      );
    }

    // Check package status
    const now = new Date();
    const isExpired = pkg.expirationDate < now;
    const daysUntilExpiration = getDaysUntilExpiration(pkg.sterilizedDate, 30);
    const stillSterile = isStillSterile(pkg.sterilizedDate, 30);

    // Build validation messages
    const validationMessages: string[] = [];
    let canUse = true;

    if (pkg.status === 'USED') {
      validationMessages.push('This package has already been used');
      canUse = false;
    } else if (pkg.status === 'EXPIRED' || isExpired) {
      validationMessages.push('This package has expired');
      canUse = false;
    } else if (pkg.status === 'COMPROMISED') {
      validationMessages.push('This package has been marked as compromised');
      canUse = false;
    } else if (pkg.status === 'RECALLED') {
      validationMessages.push('This package has been recalled');
      canUse = false;
    } else if (daysUntilExpiration <= 7 && daysUntilExpiration > 0) {
      validationMessages.push(`Package expires in ${daysUntilExpiration} day${daysUntilExpiration === 1 ? '' : 's'}`);
    }

    // Check sterilization cycle validity
    if (pkg.cycle.status !== 'COMPLETED') {
      validationMessages.push('Warning: Sterilization cycle was not completed successfully');
      canUse = false;
    }

    if (pkg.cycle.biologicalPass === false) {
      validationMessages.push('Warning: Biological indicator failed for this cycle');
      canUse = false;
    }

    if (pkg.cycle.mechanicalPass === false || pkg.cycle.chemicalPass === false) {
      validationMessages.push('Warning: Some indicators failed for this cycle');
    }

    return NextResponse.json({
      success: true,
      data: {
        package: pkg,
        validation: {
          canUse,
          isExpired,
          daysUntilExpiration,
          stillSterile,
          messages: validationMessages,
        },
      },
    });
  },
  { permissions: ['sterilization:read'] }
);

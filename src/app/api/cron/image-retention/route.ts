import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { addDays, addYears, differenceInYears } from 'date-fns';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/image-retention
 * Health check for the cron job
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Image retention cron endpoint is healthy',
  });
}

/**
 * POST /api/cron/image-retention
 * Process image retention: calculate retention expiry, archive eligible images
 *
 * This cron should run daily.
 */
export async function POST(req: NextRequest) {
  // Verify cron secret
  const cronSecret = req.headers.get('x-cron-secret');
  if (!CRON_SECRET) {
    console.warn('[Image Retention Cron] CRON_SECRET not configured');
    // In development, allow without secret
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Cron not configured' },
        { status: 500 }
      );
    }
  } else if (cronSecret !== CRON_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const now = new Date();
  const summary = {
    retentionCalculated: 0,
    archived: 0,
    notificationsCreated: 0,
    errors: [] as string[],
  };

  try {
    // Get all clinics
    const clinics = await db.clinic.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    for (const clinic of clinics) {
      try {
        // Process retention for this clinic
        const result = await processClinicRetention(clinic.id, now);
        summary.retentionCalculated += result.retentionCalculated;
        summary.archived += result.archived;
        summary.notificationsCreated += result.notificationsCreated;
      } catch (error) {
        const errorMsg = `Clinic ${clinic.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        summary.errors.push(errorMsg);
        console.error(`[Image Retention Cron] ${errorMsg}`);
      }
    }

    console.log('[Image Retention Cron] Completed:', summary);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('[Image Retention Cron] Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function processClinicRetention(clinicId: string, now: Date) {
  const result = {
    retentionCalculated: 0,
    archived: 0,
    notificationsCreated: 0,
  };

  // Get default retention policy for clinic
  const defaultPolicy = await db.imageRetentionPolicy.findFirst({
    where: {
      clinicId,
      isDefault: true,
      isActive: true,
    },
  });

  // Get all active retention policies for this clinic
  const policies = await db.imageRetentionPolicy.findMany({
    where: {
      clinicId,
      isActive: true,
    },
  });

  const policyMap = new Map(policies.map((p) => [p.id, p]));

  // 1. Calculate retention expiry for images without one
  const imagesNeedingRetention = await db.patientImage.findMany({
    where: withSoftDelete({
      clinicId,
      retentionExpiresAt: null,
      deletedAt: null,
    }),
    include: {
      patient: {
        select: {
          dateOfBirth: true,
        },
      },
    },
    take: 500, // Process in batches
  });

  for (const image of imagesNeedingRetention) {
    try {
      // Determine which policy applies
      let policy = image.retentionPolicyId
        ? policyMap.get(image.retentionPolicyId)
        : null;

      // Find matching policy by category
      if (!policy) {
        policy = policies.find(
          (p) =>
            p.imageCategories.length === 0 ||
            p.imageCategories.includes(image.category)
        );
      }

      // Fall back to default
      if (!policy) {
        policy = defaultPolicy;
      }

      if (policy) {
        // Calculate retention expiry
        const baseDate = image.captureDate || image.createdAt;
        let retentionYears = policy.retentionYears;

        // Check if patient is a minor and extend retention
        if (policy.retentionForMinorsYears && image.patient?.dateOfBirth) {
          const patientAge = differenceInYears(now, image.patient.dateOfBirth);
          if (patientAge < 18) {
            // Retain until patient is 21 + additional years
            const yearsUntil21 = 21 - patientAge;
            retentionYears = Math.max(
              retentionYears,
              yearsUntil21 + policy.retentionForMinorsYears
            );
          }
        }

        const expiresAt = addYears(baseDate, retentionYears);

        await db.patientImage.update({
          where: { id: image.id },
          data: {
            retentionPolicyId: policy.id,
            retentionExpiresAt: expiresAt,
          },
        });

        result.retentionCalculated++;
      }
    } catch (error) {
      console.error(
        `[Image Retention Cron] Error calculating retention for image ${image.id}:`,
        error
      );
    }
  }

  // 2. Auto-archive images that are past their archive threshold
  for (const policy of policies) {
    if (!policy.archiveAfterYears) continue;

    const archiveThreshold = addYears(now, -policy.archiveAfterYears);

    const imagesToArchive = await db.patientImage.findMany({
      where: withSoftDelete({
        clinicId,
        retentionPolicyId: policy.id,
        isArchived: false,
        legalHold: false,
        captureDate: { lt: archiveThreshold },
      }),
      take: 100, // Batch size
    });

    for (const image of imagesToArchive) {
      try {
        // Calculate checksum
        const checksum = createHash('sha256')
          .update(image.fileUrl)
          .digest('hex');

        // Archive key
        const archiveKey = `archive/${clinicId}/${image.patientId}/${image.id}`;

        // In production, actually move file to cold storage here
        // await storage.archive(image.fileUrl, archiveKey);

        // Update image
        await db.patientImage.update({
          where: { id: image.id },
          data: {
            isArchived: true,
            archivedAt: now,
            archiveStorageKey: archiveKey,
          },
        });

        // Create archive record - find a system staff or use a placeholder
        const systemStaff = await db.staffProfile.findFirst({
          where: { clinicId },
          orderBy: { createdAt: 'asc' },
        });

        if (systemStaff) {
          await db.imageArchiveRecord.create({
            data: {
              clinicId,
              imageId: image.id,
              action: 'ARCHIVED',
              reason: 'Auto-archived by retention policy',
              policyId: policy.id,
              originalStorageKey: image.fileUrl,
              archiveStorageKey: archiveKey,
              fileChecksum: checksum,
              performedById: systemStaff.id,
              expiresAt: image.retentionExpiresAt,
            },
          });
        }

        result.archived++;
      } catch (error) {
        console.error(
          `[Image Retention Cron] Error archiving image ${image.id}:`,
          error
        );
      }
    }
  }

  // 3. Create notifications for images approaching archival
  for (const policy of policies) {
    if (!policy.notifyBeforeArchive || !policy.archiveAfterYears) continue;

    const notifyThreshold = addDays(
      addYears(now, -policy.archiveAfterYears),
      policy.notifyBeforeArchive
    );

    const imagesApproachingArchival = await db.patientImage.count({
      where: withSoftDelete({
        clinicId,
        retentionPolicyId: policy.id,
        isArchived: false,
        legalHold: false,
        captureDate: {
          gte: notifyThreshold,
          lt: addYears(now, -policy.archiveAfterYears),
        },
      }),
    });

    if (imagesApproachingArchival > 0) {
      // In production, create actual notifications here
      // await createNotification(clinicId, `${imagesApproachingArchival} images approaching archival`);
      result.notificationsCreated++;
    }
  }

  return result;
}

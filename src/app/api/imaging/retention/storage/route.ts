import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { storageReportQuerySchema } from '@/lib/validations/imaging';

/**
 * GET /api/imaging/retention/storage
 * Get storage usage report
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    try {
      const { searchParams } = new URL(req.url);
      const queryResult = storageReportQuerySchema.safeParse(
        Object.fromEntries(searchParams.entries())
      );

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

      const { groupBy } = queryResult.data;
      const clinicFilter = getClinicFilter(session);

      // Get overall storage stats
      const images = await db.patientImage.findMany({
        where: withSoftDelete(clinicFilter),
        select: {
          id: true,
          fileSize: true,
          category: true,
          patientId: true,
          retentionPolicyId: true,
          isArchived: true,
        },
      });

      // Calculate totals
      const totalSize = images.reduce((sum, img) => sum + img.fileSize, 0);
      const hotStorageSize = images
        .filter((img) => !img.isArchived)
        .reduce((sum, img) => sum + img.fileSize, 0);
      const coldStorageSize = images
        .filter((img) => img.isArchived)
        .reduce((sum, img) => sum + img.fileSize, 0);

      // Group by specified field
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let breakdown: any[] = [];

      switch (groupBy) {
        case 'category': {
          const byCategory = images.reduce(
            (acc, img) => {
              if (!acc[img.category]) {
                acc[img.category] = { count: 0, size: 0, archived: 0 };
              }
              acc[img.category].count++;
              acc[img.category].size += img.fileSize;
              if (img.isArchived) acc[img.category].archived++;
              return acc;
            },
            {} as Record<string, { count: number; size: number; archived: number }>
          );

          breakdown = Object.entries(byCategory).map(([category, stats]) => ({
            category,
            imageCount: stats.count,
            totalSize: stats.size,
            archivedCount: stats.archived,
            percentage: Math.round((stats.size / totalSize) * 100),
          }));
          breakdown.sort((a, b) => b.totalSize - a.totalSize);
          break;
        }

        case 'patient': {
          const byPatient = images.reduce(
            (acc, img) => {
              if (!acc[img.patientId]) {
                acc[img.patientId] = { count: 0, size: 0, archived: 0 };
              }
              acc[img.patientId].count++;
              acc[img.patientId].size += img.fileSize;
              if (img.isArchived) acc[img.patientId].archived++;
              return acc;
            },
            {} as Record<string, { count: number; size: number; archived: number }>
          );

          // Get patient details for top 20 by storage
          const topPatientIds = Object.entries(byPatient)
            .sort((a, b) => b[1].size - a[1].size)
            .slice(0, 20)
            .map(([id]) => id);

          const patients = await db.patient.findMany({
            where: {
              id: { in: topPatientIds },
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          });

          const patientMap = new Map(patients.map((p) => [p.id, p]));

          breakdown = topPatientIds.map((patientId) => {
            const patient = patientMap.get(patientId);
            const stats = byPatient[patientId];
            return {
              patientId,
              patientName: patient
                ? `${patient.firstName} ${patient.lastName}`
                : 'Unknown',
              imageCount: stats.count,
              totalSize: stats.size,
              archivedCount: stats.archived,
              percentage: Math.round((stats.size / totalSize) * 100),
            };
          });
          break;
        }

        case 'policy': {
          const byPolicy = images.reduce(
            (acc, img) => {
              const policyId = img.retentionPolicyId || 'none';
              if (!acc[policyId]) {
                acc[policyId] = { count: 0, size: 0, archived: 0 };
              }
              acc[policyId].count++;
              acc[policyId].size += img.fileSize;
              if (img.isArchived) acc[policyId].archived++;
              return acc;
            },
            {} as Record<string, { count: number; size: number; archived: number }>
          );

          // Get policy details
          const policyIds = Object.keys(byPolicy).filter((id) => id !== 'none');
          const policies = await db.imageRetentionPolicy.findMany({
            where: {
              id: { in: policyIds },
            },
            select: {
              id: true,
              name: true,
            },
          });

          const policyMap = new Map(policies.map((p) => [p.id, p]));

          breakdown = Object.entries(byPolicy).map(([policyId, stats]) => ({
            policyId: policyId === 'none' ? null : policyId,
            policyName:
              policyId === 'none'
                ? 'No Policy Assigned'
                : policyMap.get(policyId)?.name || 'Unknown',
            imageCount: stats.count,
            totalSize: stats.size,
            archivedCount: stats.archived,
            percentage: Math.round((stats.size / totalSize) * 100),
          }));
          breakdown.sort((a, b) => b.totalSize - a.totalSize);
          break;
        }

        case 'status': {
          const hotImages = images.filter((img) => !img.isArchived);
          const coldImages = images.filter((img) => img.isArchived);

          breakdown = [
            {
              status: 'hot',
              label: 'Hot Storage (Active)',
              imageCount: hotImages.length,
              totalSize: hotStorageSize,
              percentage: Math.round((hotStorageSize / totalSize) * 100) || 0,
            },
            {
              status: 'cold',
              label: 'Cold Storage (Archived)',
              imageCount: coldImages.length,
              totalSize: coldStorageSize,
              percentage: Math.round((coldStorageSize / totalSize) * 100) || 0,
            },
          ];
          break;
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalImages: images.length,
            totalSize,
            hotStorageSize,
            coldStorageSize,
            hotStoragePercentage:
              Math.round((hotStorageSize / totalSize) * 100) || 0,
            coldStoragePercentage:
              Math.round((coldStorageSize / totalSize) * 100) || 0,
          },
          breakdown,
          groupBy,
        },
      });
    } catch (error) {
      console.error('[Storage Report API] GET Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch storage report',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:admin'] }
);

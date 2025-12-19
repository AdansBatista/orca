import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

/**
 * GET /api/resources/sterilization/reports
 * Get sterilization reports and statistics
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const reportType = searchParams.get('type') || 'summary';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Default to last 30 days
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const clinicFilter = getClinicFilter(session);
    const now = new Date();

    switch (reportType) {
      case 'summary': {
        // Get overall summary statistics
        const [
          totalCycles,
          completedCycles,
          failedCycles,
          totalPackages,
          sterilePackages,
          usedPackages,
          expiredPackages,
          expiringPackages,
          totalUsages,
          recentCycles,
          recentUsages,
        ] = await Promise.all([
          // Total cycles in period
          db.sterilizationCycle.count({
            where: {
              ...clinicFilter,
              startTime: { gte: startDate, lte: endDate },
            },
          }),
          // Completed cycles
          db.sterilizationCycle.count({
            where: {
              ...clinicFilter,
              startTime: { gte: startDate, lte: endDate },
              status: 'COMPLETED',
            },
          }),
          // Failed cycles
          db.sterilizationCycle.count({
            where: {
              ...clinicFilter,
              startTime: { gte: startDate, lte: endDate },
              status: 'FAILED',
            },
          }),
          // Total packages
          db.instrumentPackage.count({
            where: clinicFilter,
          }),
          // Sterile packages (current)
          db.instrumentPackage.count({
            where: {
              ...clinicFilter,
              status: 'STERILE',
              expirationDate: { gt: now },
            },
          }),
          // Used packages in period
          db.instrumentPackage.count({
            where: {
              ...clinicFilter,
              status: 'USED',
              updatedAt: { gte: startDate, lte: endDate },
            },
          }),
          // Expired packages
          db.instrumentPackage.count({
            where: {
              ...clinicFilter,
              OR: [
                { status: 'EXPIRED' },
                { status: 'STERILE', expirationDate: { lt: now } },
              ],
            },
          }),
          // Expiring within 7 days
          db.instrumentPackage.count({
            where: {
              ...clinicFilter,
              status: 'STERILE',
              expirationDate: {
                gte: now,
                lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
              },
            },
          }),
          // Total usages in period
          db.packageUsage.count({
            where: {
              ...clinicFilter,
              usedAt: { gte: startDate, lte: endDate },
            },
          }),
          // Recent cycles
          db.sterilizationCycle.findMany({
            where: clinicFilter,
            orderBy: { startTime: 'desc' },
            take: 5,
            select: {
              id: true,
              cycleNumber: true,
              cycleType: true,
              status: true,
              startTime: true,
              mechanicalPass: true,
              chemicalPass: true,
              biologicalPass: true,
            },
          }),
          // Recent usages
          db.packageUsage.findMany({
            where: clinicFilter,
            orderBy: { usedAt: 'desc' },
            take: 5,
            include: {
              package: {
                select: {
                  packageNumber: true,
                  instrumentNames: true,
                },
              },
            },
          }),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            period: { startDate, endDate },
            cycles: {
              total: totalCycles,
              completed: completedCycles,
              failed: failedCycles,
              successRate: totalCycles > 0 ? (completedCycles / totalCycles) * 100 : 0,
            },
            packages: {
              total: totalPackages,
              sterile: sterilePackages,
              used: usedPackages,
              expired: expiredPackages,
              expiringWithin7Days: expiringPackages,
            },
            usages: {
              total: totalUsages,
            },
            recentCycles,
            recentUsages,
          },
        });
      }

      case 'cycles': {
        // Detailed cycle report
        const cycles = await db.sterilizationCycle.findMany({
          where: {
            ...clinicFilter,
            startTime: { gte: startDate, lte: endDate },
          },
          orderBy: { startTime: 'desc' },
          include: {
            _count: {
              select: {
                loads: true,
                packages: true,
                biologicalIndicators: true,
                chemicalIndicators: true,
              },
            },
          },
        });

        // Group by status
        const byStatus = cycles.reduce((acc, cycle) => {
          acc[cycle.status] = (acc[cycle.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Group by type
        const byType = cycles.reduce((acc, cycle) => {
          acc[cycle.cycleType] = (acc[cycle.cycleType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Calculate indicator pass rates
        const withBI = cycles.filter((c) => c.biologicalPass !== null);
        const biPassRate = withBI.length > 0
          ? (withBI.filter((c) => c.biologicalPass === true).length / withBI.length) * 100
          : null;

        return NextResponse.json({
          success: true,
          data: {
            period: { startDate, endDate },
            total: cycles.length,
            byStatus,
            byType,
            indicatorPassRates: {
              biological: biPassRate,
            },
            cycles,
          },
        });
      }

      case 'packages': {
        // Package inventory report
        const packages = await db.instrumentPackage.findMany({
          where: clinicFilter,
          orderBy: { expirationDate: 'asc' },
          include: {
            cycle: {
              select: {
                cycleNumber: true,
                cycleType: true,
                status: true,
              },
            },
            _count: {
              select: { usages: true },
            },
          },
        });

        // Group by status
        const byStatus = packages.reduce((acc, pkg) => {
          // Check if actually expired
          const status = pkg.status === 'STERILE' && pkg.expirationDate < now
            ? 'EXPIRED'
            : pkg.status;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Group by type
        const byType = packages.reduce((acc, pkg) => {
          acc[pkg.packageType] = (acc[pkg.packageType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Get expiring soon
        const expiringSoon = packages.filter(
          (pkg) =>
            pkg.status === 'STERILE' &&
            pkg.expirationDate >= now &&
            pkg.expirationDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        );

        return NextResponse.json({
          success: true,
          data: {
            total: packages.length,
            byStatus,
            byType,
            expiringSoon: expiringSoon.map((pkg) => ({
              id: pkg.id,
              packageNumber: pkg.packageNumber,
              packageType: pkg.packageType,
              instrumentNames: pkg.instrumentNames,
              expirationDate: pkg.expirationDate,
              daysUntilExpiration: Math.ceil(
                (pkg.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              ),
            })),
          },
        });
      }

      case 'usage': {
        // Usage tracking report
        const usages = await db.packageUsage.findMany({
          where: {
            ...clinicFilter,
            usedAt: { gte: startDate, lte: endDate },
          },
          orderBy: { usedAt: 'desc' },
          include: {
            package: {
              select: {
                packageNumber: true,
                packageType: true,
                instrumentNames: true,
                cycle: {
                  select: {
                    cycleNumber: true,
                  },
                },
              },
            },
          },
        });

        // Group by date
        const byDate = usages.reduce((acc, usage) => {
          const date = usage.usedAt.toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Group by procedure type
        const byProcedure = usages.reduce((acc, usage) => {
          const proc = usage.procedureType || 'Unspecified';
          acc[proc] = (acc[proc] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return NextResponse.json({
          success: true,
          data: {
            period: { startDate, endDate },
            total: usages.length,
            byDate,
            byProcedure,
            usages,
          },
        });
      }

      case 'compliance': {
        // Compliance report
        const [
          weeklyBITests,
          failedCycles,
          complianceLogs,
        ] = await Promise.all([
          // Weekly biological indicator tests
          db.biologicalIndicator.findMany({
            where: {
              ...clinicFilter,
              testDate: { gte: startDate, lte: endDate },
            },
            orderBy: { testDate: 'desc' },
          }),
          // Failed cycles
          db.sterilizationCycle.findMany({
            where: {
              ...clinicFilter,
              startTime: { gte: startDate, lte: endDate },
              status: 'FAILED',
            },
            orderBy: { startTime: 'desc' },
          }),
          // Compliance logs
          db.complianceLog.findMany({
            where: {
              ...clinicFilter,
              logDate: { gte: startDate, lte: endDate },
            },
            orderBy: { logDate: 'desc' },
          }),
        ]);

        // Calculate BI pass rate
        const biResults = weeklyBITests.filter((bi) => bi.result !== 'PENDING');
        const biPassRate = biResults.length > 0
          ? (biResults.filter((bi) => bi.result === 'PASSED').length / biResults.length) * 100
          : null;

        // Check for missing weekly BI tests
        const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const biTestsMissing = weeks - weeklyBITests.length;

        return NextResponse.json({
          success: true,
          data: {
            period: { startDate, endDate },
            biologicalIndicators: {
              total: weeklyBITests.length,
              passed: biResults.filter((bi) => bi.result === 'PASSED').length,
              failed: biResults.filter((bi) => bi.result === 'FAILED').length,
              pending: weeklyBITests.filter((bi) => bi.result === 'PENDING').length,
              passRate: biPassRate,
              weeksMissing: Math.max(0, biTestsMissing),
            },
            failedCycles: {
              count: failedCycles.length,
              cycles: failedCycles.map((c) => ({
                id: c.id,
                cycleNumber: c.cycleNumber,
                startTime: c.startTime,
                failureReason: c.failureReason,
              })),
            },
            complianceLogs: {
              total: complianceLogs.length,
              compliant: complianceLogs.filter((l) => l.isCompliant).length,
              deficiencies: complianceLogs.filter((l) => l.deficiencyFound).length,
            },
          },
        });
      }

      case 'validations': {
        // Equipment validation report
        const [validations, schedules] = await Promise.all([
          db.sterilizerValidation.findMany({
            where: {
              ...clinicFilter,
              validationDate: { gte: startDate, lte: endDate },
            },
            orderBy: { validationDate: 'desc' },
          }),
          db.validationSchedule.findMany({
            where: {
              ...clinicFilter,
              isActive: true,
            },
          }),
        ]);

        // Get equipment info
        const equipmentIds = [...new Set([
          ...validations.map((v) => v.equipmentId),
          ...schedules.map((s) => s.equipmentId),
        ])];
        const equipment = await db.equipment.findMany({
          where: { id: { in: equipmentIds } },
          select: { id: true, name: true, equipmentNumber: true },
        });
        const equipmentMap = new Map(equipment.map((e) => [e.id, e]));

        // Overdue schedules
        const overdueSchedules = schedules.filter(
          (s) => s.nextDue && s.nextDue < now
        );

        return NextResponse.json({
          success: true,
          data: {
            period: { startDate, endDate },
            summary: {
              totalValidations: validations.length,
              passed: validations.filter((v) => v.result === 'PASS').length,
              failed: validations.filter((v) => v.result === 'FAIL').length,
              conditional: validations.filter((v) => v.result === 'CONDITIONAL').length,
              overdueSchedules: overdueSchedules.length,
            },
            validations: validations.map((v) => ({
              date: v.validationDate.toISOString(),
              type: v.validationType.replace(/_/g, ' '),
              equipment: equipmentMap.get(v.equipmentId)?.name || 'Unknown',
              result: v.result,
              performedBy: v.performedBy,
            })),
            overdueSchedules: overdueSchedules.map((s) => ({
              type: s.validationType.replace(/_/g, ' '),
              equipment: equipmentMap.get(s.equipmentId)?.name || 'Unknown',
              dueDate: s.nextDue ? s.nextDue.toISOString() : null,
              daysOverdue: s.nextDue
                ? Math.ceil((now.getTime() - s.nextDue.getTime()) / (1000 * 60 * 60 * 24))
                : 0,
            })),
          },
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_REPORT_TYPE',
              message: 'Invalid report type. Valid types: summary, cycles, packages, usage, compliance, validations',
            },
          },
          { status: 400 }
        );
    }
  },
  { permissions: ['sterilization:read'] }
);

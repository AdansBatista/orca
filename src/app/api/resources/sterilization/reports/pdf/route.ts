import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { format } from 'date-fns';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

/**
 * GET /api/resources/sterilization/reports/pdf
 * Generate a PDF-ready report (returns HTML that can be printed/saved as PDF)
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const reportType = searchParams.get('type') || 'compliance';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Default to last 30 days
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const clinicFilter = getClinicFilter(session);
    const now = new Date();

    // Fetch clinic info
    const clinic = await db.clinic.findFirst({
      where: { id: session.user.clinicId },
      select: { name: true },
    });

    let reportData: Record<string, unknown> = {};
    let reportTitle = '';

    switch (reportType) {
      case 'compliance': {
        reportTitle = 'Sterilization Compliance Report';

        const [
          weeklyBITests,
          failedCycles,
          complianceLogs,
          totalCycles,
          completedCycles,
        ] = await Promise.all([
          db.biologicalIndicator.findMany({
            where: {
              ...clinicFilter,
              testDate: { gte: startDate, lte: endDate },
            },
            orderBy: { testDate: 'desc' },
          }),
          db.sterilizationCycle.findMany({
            where: {
              ...clinicFilter,
              startTime: { gte: startDate, lte: endDate },
              status: 'FAILED',
            },
            orderBy: { startTime: 'desc' },
          }),
          db.complianceLog.findMany({
            where: {
              ...clinicFilter,
              logDate: { gte: startDate, lte: endDate },
            },
            orderBy: { logDate: 'desc' },
          }),
          db.sterilizationCycle.count({
            where: {
              ...clinicFilter,
              startTime: { gte: startDate, lte: endDate },
            },
          }),
          db.sterilizationCycle.count({
            where: {
              ...clinicFilter,
              startTime: { gte: startDate, lte: endDate },
              status: 'COMPLETED',
            },
          }),
        ]);

        // Calculate BI pass rate
        const biResults = weeklyBITests.filter((bi) => bi.result !== 'PENDING');
        const biPassed = biResults.filter((bi) => bi.result === 'PASSED').length;
        const biPassRate = biResults.length > 0 ? (biPassed / biResults.length) * 100 : null;

        // Check for missing weekly BI tests
        const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const biTestsMissing = Math.max(0, weeks - weeklyBITests.length);

        // Calculate compliance score
        const successRate = totalCycles > 0 ? (completedCycles / totalCycles) * 100 : 100;
        const biCompliance = biPassRate !== null ? biPassRate : 100;
        const complianceRate = complianceLogs.length > 0
          ? (complianceLogs.filter((l) => l.isCompliant).length / complianceLogs.length) * 100
          : 100;

        const overallScore = (successRate * 0.4) + (biCompliance * 0.4) + (complianceRate * 0.2);

        reportData = {
          period: { startDate, endDate },
          clinic: clinic?.name || 'Unknown Clinic',
          generatedAt: now,
          generatedBy: session.user.name || session.user.email,
          summary: {
            totalCycles,
            completedCycles,
            failedCycles: failedCycles.length,
            successRate: successRate.toFixed(1),
            overallScore: overallScore.toFixed(1),
          },
          biologicalIndicators: {
            total: weeklyBITests.length,
            passed: biPassed,
            failed: biResults.filter((bi) => bi.result === 'FAILED').length,
            pending: weeklyBITests.filter((bi) => bi.result === 'PENDING').length,
            passRate: biPassRate !== null ? biPassRate.toFixed(1) : 'N/A',
            weeksMissing: biTestsMissing,
            tests: weeklyBITests.slice(0, 10).map((bi) => ({
              date: format(bi.testDate, 'MMM d, yyyy'),
              lotNumber: bi.lotNumber,
              result: bi.result,
            })),
          },
          failedCycles: failedCycles.map((c) => ({
            cycleNumber: c.cycleNumber,
            date: format(c.startTime, 'MMM d, yyyy'),
            reason: c.failureReason || 'Not specified',
          })),
          complianceLogs: {
            total: complianceLogs.length,
            compliant: complianceLogs.filter((l) => l.isCompliant).length,
            deficiencies: complianceLogs.filter((l) => l.deficiencyFound).length,
          },
        };
        break;
      }

      case 'cycles': {
        reportTitle = 'Sterilization Cycles Report';

        const cycles = await db.sterilizationCycle.findMany({
          where: {
            ...clinicFilter,
            startTime: { gte: startDate, lte: endDate },
          },
          orderBy: { startTime: 'desc' },
          include: {
            _count: {
              select: { loads: true, packages: true },
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

        reportData = {
          period: { startDate, endDate },
          clinic: clinic?.name || 'Unknown Clinic',
          generatedAt: now,
          generatedBy: session.user.name || session.user.email,
          summary: {
            total: cycles.length,
            byStatus,
            byType,
          },
          cycles: cycles.map((c) => ({
            cycleNumber: c.cycleNumber,
            date: format(c.startTime, 'MMM d, yyyy HH:mm'),
            type: c.cycleType.replace(/_/g, ' '),
            status: c.status,
            mechanical: c.mechanicalPass === true ? 'PASS' : c.mechanicalPass === false ? 'FAIL' : '-',
            chemical: c.chemicalPass === true ? 'PASS' : c.chemicalPass === false ? 'FAIL' : '-',
            biological: c.biologicalPass === true ? 'PASS' : c.biologicalPass === false ? 'FAIL' : '-',
            loads: c._count.loads,
            packages: c._count.packages,
          })),
        };
        break;
      }

      case 'packages': {
        reportTitle = 'Instrument Packages Report';

        const packages = await db.instrumentPackage.findMany({
          where: clinicFilter,
          orderBy: { expirationDate: 'asc' },
          include: {
            cycle: {
              select: { cycleNumber: true },
            },
          },
        });

        // Group by status
        const byStatus = packages.reduce((acc, pkg) => {
          const status = pkg.status === 'STERILE' && pkg.expirationDate < now
            ? 'EXPIRED'
            : pkg.status;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Expiring soon
        const expiringSoon = packages.filter(
          (pkg) =>
            pkg.status === 'STERILE' &&
            pkg.expirationDate >= now &&
            pkg.expirationDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        );

        reportData = {
          period: { startDate, endDate },
          clinic: clinic?.name || 'Unknown Clinic',
          generatedAt: now,
          generatedBy: session.user.name || session.user.email,
          summary: {
            total: packages.length,
            byStatus,
            expiringSoon: expiringSoon.length,
          },
          expiringSoon: expiringSoon.map((pkg) => ({
            packageNumber: pkg.packageNumber,
            instruments: pkg.instrumentNames.join(', '),
            expirationDate: format(pkg.expirationDate, 'MMM d, yyyy'),
            daysRemaining: Math.ceil(
              (pkg.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            ),
          })),
        };
        break;
      }

      case 'validations': {
        reportTitle = 'Equipment Validation Report';

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

        reportData = {
          period: { startDate, endDate },
          clinic: clinic?.name || 'Unknown Clinic',
          generatedAt: now,
          generatedBy: session.user.name || session.user.email,
          summary: {
            totalValidations: validations.length,
            passed: validations.filter((v) => v.result === 'PASS').length,
            failed: validations.filter((v) => v.result === 'FAIL').length,
            conditional: validations.filter((v) => v.result === 'CONDITIONAL').length,
            overdueSchedules: overdueSchedules.length,
          },
          validations: validations.map((v) => ({
            date: format(v.validationDate, 'MMM d, yyyy'),
            type: v.validationType.replace(/_/g, ' '),
            equipment: equipmentMap.get(v.equipmentId)?.name || 'Unknown',
            result: v.result,
            performedBy: v.performedBy,
            certificateNumber: v.certificateNumber || '-',
          })),
          overdueSchedules: overdueSchedules.map((s) => ({
            type: s.validationType.replace(/_/g, ' '),
            equipment: equipmentMap.get(s.equipmentId)?.name || 'Unknown',
            dueDate: s.nextDue ? format(s.nextDue, 'MMM d, yyyy') : 'Not set',
            daysOverdue: s.nextDue
              ? Math.ceil((now.getTime() - s.nextDue.getTime()) / (1000 * 60 * 60 * 24))
              : 0,
          })),
        };
        break;
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_REPORT_TYPE',
              message: 'Invalid report type',
            },
          },
          { status: 400 }
        );
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'READ',
      entity: 'ComplianceReport',
      entityId: reportType,
      details: {
        reportType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        format: 'pdf',
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        title: reportTitle,
        ...reportData,
      },
    });
  },
  { permissions: ['sterilization:read'] }
);

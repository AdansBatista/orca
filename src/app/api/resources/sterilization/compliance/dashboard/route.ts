import { NextResponse } from 'next/server';
import { startOfDay, endOfDay, subDays, differenceInDays, startOfWeek } from 'date-fns';

import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { db } from '@/lib/db';

export const GET = withAuth(
  async (req, session) => {
    const clinicFilter = getClinicFilter(session);
    const now = new Date();
    const today = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now);
    const thirtyDaysAgo = subDays(now, 30);

    try {
      // Get biological indicator data
      const [biTests, recentBiTests] = await Promise.all([
        db.biologicalIndicator.findMany({
          where: {
            ...clinicFilter,
            testDate: { gte: thirtyDaysAgo },
          },
          orderBy: { testDate: 'desc' },
        }),
        db.biologicalIndicator.findMany({
          where: {
            ...clinicFilter,
          },
          orderBy: { testDate: 'desc' },
          take: 5,
        }),
      ]);

      // Calculate weekly compliance
      const lastTestDate = biTests.length > 0 ? new Date(biTests[0].testDate) : null;
      const daysUntilNextRequired = lastTestDate
        ? Math.max(7 - differenceInDays(now, lastTestDate), 0)
        : 0;
      const weeklyCompliance = lastTestDate
        ? differenceInDays(now, lastTestDate) <= 7
        : false;

      const passedTests = biTests.filter((t) => t.result === 'PASSED').length;
      const totalCompleted = biTests.filter((t) => t.result !== 'PENDING').length;
      const passRate = totalCompleted > 0 ? (passedTests / totalCompleted) * 100 : 100;

      // Get cycle data
      const [todayCycles, weekCycles, activeCycles] = await Promise.all([
        db.sterilizationCycle.count({
          where: {
            ...clinicFilter,
            startTime: { gte: today, lte: todayEnd },
          },
        }),
        db.sterilizationCycle.count({
          where: {
            ...clinicFilter,
            startTime: { gte: weekStart },
          },
        }),
        db.sterilizationCycle.findMany({
          where: {
            ...clinicFilter,
            status: 'IN_PROGRESS',
          },
          orderBy: { startTime: 'desc' },
        }),
      ]);

      // Calculate success rate
      const completedCycles = await db.sterilizationCycle.findMany({
        where: {
          ...clinicFilter,
          startTime: { gte: thirtyDaysAgo },
          status: { in: ['COMPLETED', 'FAILED'] },
        },
      });
      const successfulCycles = completedCycles.filter((c) => c.status === 'COMPLETED').length;
      const successRate = completedCycles.length > 0
        ? (successfulCycles / completedCycles.length) * 100
        : 100;

      // Get package data
      const packageStats = await db.instrumentPackage.groupBy({
        by: ['status'],
        where: {
          ...clinicFilter,
        },
        _count: { status: true },
      });

      const sterileCount = packageStats.find((s) => s.status === 'STERILE')?._count.status || 0;
      // Using RECALLED status as quarantine proxy since no QUARANTINED status exists
      const quarantinedCount = packageStats.find((s) => s.status === 'RECALLED')?._count.status || 0;

      // Get expiring packages
      const expiringToday = await db.instrumentPackage.count({
        where: {
          ...clinicFilter,
          status: 'STERILE',
          expirationDate: { gte: today, lte: todayEnd },
        },
      });

      const expiringThisWeek = await db.instrumentPackage.count({
        where: {
          ...clinicFilter,
          status: 'STERILE',
          expirationDate: { gte: today, lte: subDays(todayEnd, -7) },
        },
      });

      // Get validation data
      const [overdueValidations, upcomingValidations, nextDueValidation] = await Promise.all([
        db.validationSchedule.count({
          where: {
            ...clinicFilter,
            nextDue: { lt: today },
            isActive: true,
          },
        }),
        db.validationSchedule.count({
          where: {
            ...clinicFilter,
            nextDue: { gte: today, lte: subDays(today, -30) },
            isActive: true,
          },
        }),
        db.validationSchedule.findFirst({
          where: {
            ...clinicFilter,
            nextDue: { gte: today },
            isActive: true,
          },
          orderBy: { nextDue: 'asc' },
        }),
      ]);

      // Calculate overall compliance score
      let score = 100;
      if (!weeklyCompliance) score -= 20;
      if (overdueValidations > 0) score -= 15;
      if (successRate < 95) score -= 10;
      if (quarantinedCount > 10) score -= 5;
      score = Math.max(score, 0);

      const status = score >= 90 ? 'COMPLIANT' : score >= 70 ? 'AT_RISK' : 'NON_COMPLIANT';

      // Generate alerts
      const alerts: Array<{
        id: string;
        type: 'WARNING' | 'ERROR' | 'INFO';
        title: string;
        message: string;
        actionUrl?: string;
        createdAt: string;
      }> = [];

      if (!weeklyCompliance) {
        alerts.push({
          id: 'bi-due',
          type: daysUntilNextRequired === 0 ? 'ERROR' : 'WARNING',
          title: 'Biological Indicator Test Due',
          message:
            daysUntilNextRequired === 0
              ? 'Weekly BI test is due today'
              : `Weekly BI test due in ${daysUntilNextRequired} days`,
          actionUrl: '/resources/sterilization/new',
          createdAt: now.toISOString(),
        });
      }

      if (overdueValidations > 0) {
        alerts.push({
          id: 'validation-overdue',
          type: 'ERROR',
          title: 'Overdue Validations',
          message: `${overdueValidations} equipment validation(s) are overdue`,
          actionUrl: '/resources/sterilization/validations',
          createdAt: now.toISOString(),
        });
      }

      if (expiringToday > 0) {
        alerts.push({
          id: 'expiring-today',
          type: 'WARNING',
          title: 'Packages Expiring Today',
          message: `${expiringToday} package(s) expire today`,
          actionUrl: '/resources/sterilization/packages?status=STERILE',
          createdAt: now.toISOString(),
        });
      }

      if (quarantinedCount > 0) {
        alerts.push({
          id: 'quarantined',
          type: 'INFO',
          title: 'Packages in Quarantine',
          message: `${quarantinedCount} package(s) pending biological indicator results`,
          actionUrl: '/resources/sterilization/quarantine',
          createdAt: now.toISOString(),
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          overall: {
            score,
            status,
          },
          biologicalIndicators: {
            lastTest: lastTestDate?.toISOString() || null,
            daysUntilNextRequired,
            weeklyCompliance,
            passRate,
            recentTests: recentBiTests.map((t) => ({
              id: t.id,
              testDate: t.testDate.toISOString(),
              result: t.result,
              lotNumber: t.lotNumber,
            })),
          },
          cycles: {
            today: todayCycles,
            thisWeek: weekCycles,
            successRate,
            activeCycles: activeCycles.map((c) => ({
              id: c.id,
              cycleNumber: c.cycleNumber,
              cycleType: c.cycleType,
              startTime: c.startTime.toISOString(),
              status: c.status,
            })),
          },
          packages: {
            sterile: sterileCount,
            expiringToday,
            expiringThisWeek,
            quarantined: quarantinedCount,
          },
          validations: {
            overdueCount: overdueValidations,
            upcomingCount: upcomingValidations,
            nextDue: nextDueValidation
              ? {
                  type: nextDueValidation.validationType,
                  equipment: nextDueValidation.equipmentId,
                  dueDate: nextDueValidation.nextDue?.toISOString() || '',
                }
              : null,
          },
          alerts,
        },
      });
    } catch (error) {
      console.error('Failed to fetch compliance dashboard:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: 'Failed to fetch compliance dashboard data',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['sterilization:read'] }
);

import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

/**
 * GET /api/lab/analytics
 * Get lab analytics and metrics
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get('vendorId');
    const period = searchParams.get('period') || '30'; // days
    const periodDays = parseInt(period);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const clinicFilter = getClinicFilter(session);

    // Get order statistics
    const [
      totalOrders,
      ordersByStatus,
      ordersByVendor,
      avgTurnaround,
      remakeStats,
      inspectionStats,
      vendorMetrics,
      recentTrends,
    ] = await Promise.all([
      // Total orders in period
      db.labOrder.count({
        where: {
          ...clinicFilter,
          deletedAt: null,
          orderDate: { gte: startDate },
          ...(vendorId && { vendorId }),
        },
      }),

      // Orders by status
      db.labOrder.groupBy({
        by: ['status'],
        where: {
          ...clinicFilter,
          deletedAt: null,
          orderDate: { gte: startDate },
          ...(vendorId && { vendorId }),
        },
        _count: true,
      }),

      // Orders by vendor
      db.labOrder.groupBy({
        by: ['vendorId'],
        where: {
          ...clinicFilter,
          deletedAt: null,
          orderDate: { gte: startDate },
        },
        _count: true,
        _sum: { totalCost: true },
      }),

      // Average turnaround (delivered orders)
      db.labOrder.aggregate({
        where: {
          ...clinicFilter,
          deletedAt: null,
          status: { in: ['DELIVERED', 'RECEIVED', 'PICKED_UP'] },
          orderDate: { gte: startDate },
          actualDelivery: { not: null },
          ...(vendorId && { vendorId }),
        },
        _avg: {
          // Calculate days between order and delivery
        },
      }),

      // Remake statistics
      db.remakeRequest.groupBy({
        by: ['reason', 'costResponsibility'],
        where: {
          ...clinicFilter,
          createdAt: { gte: startDate },
        },
        _count: true,
        _sum: { actualCost: true },
      }),

      // Inspection statistics
      db.labInspection.groupBy({
        by: ['result'],
        where: {
          ...clinicFilter,
          inspectedAt: { gte: startDate },
        },
        _count: true,
      }),

      // Vendor metrics (pre-calculated)
      db.labVendorMetrics.findMany({
        where: {
          ...clinicFilter,
          periodType: periodDays <= 7 ? 'DAILY' : periodDays <= 30 ? 'WEEKLY' : 'MONTHLY',
          periodStart: { gte: startDate },
          ...(vendorId && { vendorId }),
        },
        include: {
          vendor: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { periodStart: 'desc' },
        take: 10,
      }),

      // Recent trends - orders per day/week
      db.labOrder.groupBy({
        by: ['orderDate'],
        where: {
          ...clinicFilter,
          deletedAt: null,
          orderDate: { gte: startDate },
        },
        _count: true,
        _sum: { totalCost: true },
        orderBy: { orderDate: 'asc' },
      }),
    ]);

    // Calculate additional metrics
    const completedOrders = ordersByStatus.find((s) => s.status === 'PICKED_UP')?._count || 0;
    const pendingOrders = ordersByStatus
      .filter((s) => !['PICKED_UP', 'CANCELLED'].includes(s.status))
      .reduce((sum, s) => sum + s._count, 0);

    // Get vendor names for the groupBy results
    const vendorIds = ordersByVendor.map((v) => v.vendorId).filter(Boolean) as string[];
    const vendors = await db.labVendor.findMany({
      where: { id: { in: vendorIds } },
      select: { id: true, name: true, code: true },
    });

    const vendorMap = new Map(vendors.map((v) => [v.id, v]));

    // Calculate inspection pass rate
    const totalInspections = inspectionStats.reduce((sum, s) => sum + s._count, 0);
    const passedInspections = inspectionStats
      .filter((s) => s.result === 'PASS' || s.result === 'PASS_WITH_NOTES')
      .reduce((sum, s) => sum + s._count, 0);
    const inspectionPassRate = totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0;

    // Calculate remake rate
    const totalRemakes = remakeStats.reduce((sum, s) => sum + s._count, 0);
    const remakeRate = totalOrders > 0 ? (totalRemakes / totalOrders) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalOrders,
          completedOrders,
          pendingOrders,
          inspectionPassRate: Math.round(inspectionPassRate * 10) / 10,
          remakeRate: Math.round(remakeRate * 10) / 10,
          periodDays,
        },
        ordersByStatus: ordersByStatus.map((s) => ({
          status: s.status,
          count: s._count,
        })),
        ordersByVendor: ordersByVendor.map((v) => ({
          vendorId: v.vendorId,
          vendor: vendorMap.get(v.vendorId || ''),
          count: v._count,
          totalSpend: v._sum.totalCost || 0,
        })),
        remakesByReason: remakeStats.map((r) => ({
          reason: r.reason,
          costResponsibility: r.costResponsibility,
          count: r._count,
          totalCost: r._sum.actualCost || 0,
        })),
        inspectionResults: inspectionStats.map((i) => ({
          result: i.result,
          count: i._count,
        })),
        vendorMetrics,
        trends: recentTrends.map((t) => ({
          date: t.orderDate,
          count: t._count,
          totalCost: t._sum.totalCost || 0,
        })),
      },
    });
  },
  { permissions: ['lab:view'] }
);

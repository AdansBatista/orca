import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/db';
import { saveFloorPlanLayoutSchema } from '@/lib/validations/floor-plan';
import { logAudit } from '@/lib/audit';

/**
 * GET /api/ops/floor-plan/layout
 * Get current floor plan layout for the clinic
 */
export const GET = withAuth(
  async (req, session) => {
    try {
      const { clinicId } = session.user;

      // Get floor plan config
      const config = await db.floorPlanConfig.findUnique({
        where: { clinicId },
      });

      if (!config) {
        // Return default if none exists
        return NextResponse.json({
          success: true,
          data: {
            name: 'Default Layout',
            gridConfig: {
              columns: 20,
              rows: 15,
              cellSize: 50,
              snapToGrid: true,
            },
            rooms: [],
            chairs: [],
          },
        });
      }

      // Parse layout JSON
      const layout = config.layout as any;

      return NextResponse.json({
        success: true,
        data: {
          id: config.id,
          name: config.name,
          gridConfig: {
            columns: config.gridColumns,
            rows: config.gridRows,
            cellSize: config.cellSize,
            snapToGrid: true,
          },
          rooms: layout.rooms || [],
          chairs: layout.chairs || [],
        },
      });
    } catch (error) {
      console.error('Floor plan layout GET error:', error);
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FETCH_ERROR', message: 'Failed to fetch floor plan layout' },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['ops:view_dashboard'] }
);

/**
 * PUT /api/ops/floor-plan/layout
 * Save/update floor plan layout
 */
export const PUT = withAuth(
  async (req, session) => {
    try {
      const { clinicId, id: userId } = session.user;
      const body = await req.json();

      // Validate input
      const validated = saveFloorPlanLayoutSchema.parse(body);

      // Prepare layout data
      const layoutData = {
        rooms: validated.rooms || [],
        chairs: validated.chairs || [],
      };

      // Update or create floor plan config
      const config = await db.floorPlanConfig.upsert({
        where: { clinicId },
        create: {
          clinicId,
          name: validated.name || 'Main Floor',
          gridColumns: validated.gridConfig?.columns || 20,
          gridRows: validated.gridConfig?.rows || 15,
          cellSize: validated.gridConfig?.cellSize || 50,
          layout: layoutData,
        },
        update: {
          ...(validated.name && { name: validated.name }),
          ...(validated.gridConfig?.columns && { gridColumns: validated.gridConfig.columns }),
          ...(validated.gridConfig?.rows && { gridRows: validated.gridConfig.rows }),
          ...(validated.gridConfig?.cellSize && { cellSize: validated.gridConfig.cellSize }),
          ...(validated.rooms || validated.chairs
            ? { layout: layoutData }
            : {}),
        },
      });

      // Audit log
      await logAudit(session, {
        action: 'UPDATE',
        entity: 'FloorPlanConfig',
        entityId: config.id,
        details: {
          name: config.name,
          rooms: validated.rooms?.length || 0,
          chairs: validated.chairs?.length || 0,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: config.id,
          message: 'Floor plan layout saved successfully',
        },
      });
    } catch (error) {
      console.error('Floor plan layout PUT error:', error);

      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid floor plan data' },
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: { code: 'UPDATE_ERROR', message: 'Failed to save floor plan layout' },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['ops:configure'] }
);

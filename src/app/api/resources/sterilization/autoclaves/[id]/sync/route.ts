import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { withSoftDelete } from '@/lib/db/soft-delete';
import {
  fetchAllCyclesFromArchives,
  fetchCycleData,
  filterCyclesByDate,
  mapRunmodeToType,
  calculateCycleDuration,
  AutoclaveCycleInfo,
} from '@/lib/sterilization/autoclave-service';

/**
 * POST /api/resources/sterilization/autoclaves/[id]/sync
 * Quick sync: Fetch and import today's cycles from the autoclave
 *
 * This is a convenience endpoint for one-click sync of today's cycles.
 * It's idempotent - cycles that are already imported will be skipped.
 *
 * Query params:
 * - date: Optional ISO date string to sync a specific date (defaults to today)
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);

    // Get target date (default to today)
    const dateParam = searchParams.get('date');
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const year = targetDate.getFullYear().toString();
    const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
    const day = targetDate.getDate().toString().padStart(2, '0');

    // Find existing autoclave
    const autoclave = await db.autoclaveIntegration.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!autoclave) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Autoclave not found',
          },
        },
        { status: 404 }
      );
    }

    if (!autoclave.enabled) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTOCLAVE_DISABLED',
            message: 'Autoclave is disabled',
          },
        },
        { status: 400 }
      );
    }

    // Fetch all cycles from archives.php
    let allCyclesInfo: AutoclaveCycleInfo[] = [];
    try {
      allCyclesInfo = await fetchAllCyclesFromArchives(autoclave.ipAddress, autoclave.port);
    } catch (error) {
      console.error('Failed to fetch cycles from autoclave:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONNECTION_ERROR',
            message: 'Failed to connect to autoclave',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
        },
        { status: 502 }
      );
    }

    // Filter to target date
    const todayCycles = filterCyclesByDate(allCyclesInfo, year, month, day);

    if (todayCycles.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          date: `${year}-${month}-${day}`,
          found: 0,
          imported: 0,
          skipped: 0,
          cycles: [],
          message: `No cycles found for ${year}-${month}-${day}`,
        },
      });
    }

    // Check which cycles are already imported
    const cycleNumbers = todayCycles.map((c) => c.cycle_number);
    const existingCycles = await db.sterilizationCycle.findMany({
      where: {
        clinicId: session.user.clinicId,
        autoclaveId: id,
        externalCycleNumber: { in: cycleNumbers },
      },
      select: {
        externalCycleNumber: true,
      },
    });
    const alreadyImported = new Set(
      existingCycles.map((c) => c.externalCycleNumber).filter((n): n is number => n !== null)
    );

    // Filter to only new cycles
    const newCycles = todayCycles.filter((c) => !alreadyImported.has(c.cycle_number));

    if (newCycles.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          date: `${year}-${month}-${day}`,
          found: todayCycles.length,
          imported: 0,
          skipped: todayCycles.length,
          cycles: [],
          message: 'All cycles for this date are already imported',
        },
      });
    }

    // Generate cycle numbers for new cycles
    const currentYear = new Date().getFullYear();
    const latestCycle = await db.sterilizationCycle.findFirst({
      where: {
        clinicId: session.user.clinicId,
        cycleNumber: { startsWith: `CYC-${currentYear}-` },
      },
      orderBy: { cycleNumber: 'desc' },
    });

    let nextNum = 1;
    if (latestCycle) {
      const match = latestCycle.cycleNumber.match(/CYC-\d{4}-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }

    // Build a map of cycle number to cyclesInfo for quick lookup
    const cyclesInfoMap = new Map<number, AutoclaveCycleInfo>();
    for (const info of newCycles) {
      cyclesInfoMap.set(info.cycle_number, info);
    }

    // Import each cycle
    const importedCycles = [];
    const errors = [];
    let maxCycleNum = autoclave.lastCycleNum || 0;

    for (const cycleMetadata of newCycles) {
      try {
        // Extract cycle number from filename
        const match = cycleMetadata.file_name.match(/_(\d+)_/);
        const cycleNumberStr = match ? match[1] : cycleMetadata.cycle_number.toString().padStart(5, '0');

        // Fetch detailed cycle data from autoclave
        const cycleData = await fetchCycleData(
          autoclave.ipAddress,
          autoclave.port,
          year,
          month,
          day,
          cycleNumberStr
        );

        if (!cycleData) {
          errors.push({
            cycleNumber: cycleMetadata.cycle_number,
            error: 'Failed to fetch cycle data',
          });
          continue;
        }

        // Determine cycle type from cyclesInfo metadata
        const cycleType = mapRunmodeToType(
          cycleData.runmode,
          cycleData.status,
          cycleMetadata.cycle_id
        );

        // Calculate duration
        const durationMinutes = calculateCycleDuration(cycleData);

        // Get the start date from cycleMetadata
        const cycleDate = new Date(cycleMetadata.cycle_start_time * 1000);

        // Get max temp from temp profile
        let maxTemp: number | null = null;
        if (cycleData.temp) {
          const temps = cycleData.temp
            .split(',')
            .map((t: string) => parseFloat(t.trim()))
            .filter((t: number) => !isNaN(t));
          if (temps.length > 0) {
            maxTemp = Math.max(...temps);
          }
        }

        // Get max pressure from pressure profile
        let maxPressure: number | null = null;
        if (cycleData.pressure) {
          const pressures = cycleData.pressure
            .split(',')
            .map((p: string) => parseFloat(p.trim()))
            .filter((p: number) => !isNaN(p));
          if (pressures.length > 0) {
            maxPressure = Math.max(...pressures);
          }
        }

        // Format program description from cycle_id
        const programDesc = cycleMetadata.cycle_id
          ? cycleMetadata.cycle_id.replace(/_/g, ' ').replace(/STATCLAVE \d+V?/i, '').trim()
          : 'Unknown program';

        // Generate internal cycle number
        const cycleNumber = `CYC-${currentYear}-${String(nextNum).padStart(4, '0')}`;
        nextNum++;

        // Create the sterilization cycle
        const cycle = await db.sterilizationCycle.create({
          data: {
            clinicId: session.user.clinicId,
            equipmentId: autoclave.equipmentId,
            cycleNumber,
            cycleType: cycleType as 'STEAM_GRAVITY' | 'STEAM_PREVACUUM' | 'STEAM_FLASH',
            startTime: cycleDate,
            endTime: new Date(cycleDate.getTime() + durationMinutes * 60 * 1000),
            temperature: maxTemp,
            pressure: maxPressure ? Math.round(maxPressure * 0.145038) : null, // kPa to PSI
            status: cycleData.succeeded ? 'COMPLETED' : 'FAILED',
            mechanicalPass: cycleData.succeeded,
            operatorId: session.user.id,
            notes: `Imported from ${autoclave.name}. Program: ${programDesc}`,

            // Autoclave-specific fields
            autoclaveId: id,
            externalCycleNumber: cycleMetadata.cycle_number,
            rawLog: cycleData.log || null,
            importedAt: new Date(),
            tempProfile: cycleData.temp,
            pressureProfile: cycleData.pressure,
            isNew: true, // Mark as new for UI badge

            createdBy: session.user.id,
            updatedBy: session.user.id,
          },
        });

        importedCycles.push(cycle);

        // Track max cycle number for sync tracking
        if (cycleMetadata.cycle_number > maxCycleNum) {
          maxCycleNum = cycleMetadata.cycle_number;
        }
      } catch (error) {
        console.error(`Error importing cycle ${cycleMetadata.cycle_number}:`, error);
        errors.push({
          cycleNumber: cycleMetadata.cycle_number,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Update autoclave's last sync info
    await db.autoclaveIntegration.update({
      where: { id },
      data: {
        lastSyncAt: new Date(),
        lastCycleNum: maxCycleNum,
        status: 'CONNECTED',
        errorMessage: null,
      },
    });

    // Audit log
    const { ipAddress: clientIp, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'SterilizationCycle',
      entityId: id,
      details: {
        operation: 'QUICK_SYNC',
        autoclaveId: id,
        autoclaveName: autoclave.name,
        date: `${year}-${month}-${day}`,
        found: todayCycles.length,
        imported: importedCycles.length,
        skipped: alreadyImported.size,
        errors: errors.length,
        cycleIds: importedCycles.map((c) => c.id),
      },
      ipAddress: clientIp,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        date: `${year}-${month}-${day}`,
        found: todayCycles.length,
        imported: importedCycles.length,
        skipped: alreadyImported.size,
        errors: errors.length > 0 ? errors : undefined,
        cycles: importedCycles.map((c) => ({
          id: c.id,
          cycleNumber: c.cycleNumber,
          externalCycleNumber: c.externalCycleNumber,
          startTime: c.startTime,
          status: c.status,
        })),
      },
    });
  },
  { permissions: ['sterilization:create'] }
);

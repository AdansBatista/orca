import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { importCyclesSchema } from '@/lib/validations/autoclave';
import {
  fetchCycleData,
  fetchAllCyclesFromArchives,
  parseCycleLog,
  mapRunmodeToType,
  calculateCycleDuration,
  AutoclaveCycleInfo,
} from '@/lib/sterilization/autoclave-service';

/**
 * POST /api/resources/sterilization/autoclaves/[id]/import
 * Import selected cycles from the autoclave into Orca
 *
 * This endpoint is idempotent - cycles that are already imported will be skipped.
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = importCyclesSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid import data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { cycles: cyclesToImport } = result.data;

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

    // Check which cycles are already imported
    const cycleNumbers = cyclesToImport.map((c) => parseInt(c.cycleNumber, 10));
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
      existingCycles.map((c) => c.externalCycleNumber)
    );

    // Filter to only new cycles
    const newCycles = cyclesToImport.filter(
      (c) => !alreadyImported.has(parseInt(c.cycleNumber, 10))
    );

    if (newCycles.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          imported: 0,
          skipped: cyclesToImport.length,
          cycles: [],
          message: 'All selected cycles were already imported',
        },
      });
    }

    // Generate cycle numbers for new cycles
    const year = new Date().getFullYear();
    const latestCycle = await db.sterilizationCycle.findFirst({
      where: {
        clinicId: session.user.clinicId,
        cycleNumber: { startsWith: `CYC-${year}-` },
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

    // Fetch all cycle metadata from archives.php to get cycle_id (program type)
    let allCyclesInfo: AutoclaveCycleInfo[] = [];
    try {
      allCyclesInfo = await fetchAllCyclesFromArchives(autoclave.ipAddress, autoclave.port);
    } catch (error) {
      console.error('Failed to fetch cycles info from archives.php:', error);
      // Continue without cyclesInfo - we'll use defaults
    }

    // Build a map of cycle number to cyclesInfo for quick lookup
    const cyclesInfoMap = new Map<string, AutoclaveCycleInfo>();
    for (const info of allCyclesInfo) {
      // Extract cycle number from filename: S20251212_00391_710125H00004 -> 00391
      const match = info.file_name.match(/_(\d+)_/);
      if (match) {
        cyclesInfoMap.set(match[1], info);
      }
    }

    // Import each cycle
    const importedCycles = [];
    const errors = [];
    let maxCycleNum = autoclave.lastCycleNum || 0;

    for (const cycleInfo of newCycles) {
      try {
        // Find the cycle metadata from cyclesInfo
        const paddedCycleNum = cycleInfo.cycleNumber.padStart(5, '0');
        const cycleMetadata = cyclesInfoMap.get(paddedCycleNum);

        // Fetch detailed cycle data from autoclave
        const cycleData = await fetchCycleData(
          autoclave.ipAddress,
          autoclave.port,
          cycleInfo.year,
          cycleInfo.month,
          cycleInfo.day,
          cycleInfo.cycleNumber
        );

        if (!cycleData) {
          errors.push({
            cycleNumber: cycleInfo.cycleNumber,
            error: 'Failed to fetch cycle data',
          });
          continue;
        }

        // Parse the log for structured data (may be undefined for this autoclave)
        const parsed = cycleData.log ? parseCycleLog(cycleData.log) : null;

        // Determine cycle type from cyclesInfo metadata (cycle_id contains program name)
        // Example cycle_id: "STATCLAVE_120V_solid_wrapped_132_4min"
        const cycleType = mapRunmodeToType(
          cycleData.runmode,
          cycleData.status,
          cycleMetadata?.cycle_id
        );

        // Calculate duration from temp data points
        // The autoclave returns comma-separated temps, one reading per ~5 seconds
        const durationMinutes = calculateCycleDuration(cycleData);

        // Get the start date from cycleMetadata or construct from input
        const cycleDate = cycleMetadata
          ? new Date(cycleMetadata.cycle_start_time * 1000)
          : new Date(`${cycleInfo.year}-${cycleInfo.month}-${cycleInfo.day}`);

        // Get external cycle number
        const externalCycleNum = cycleMetadata?.cycle_number || parseInt(cycleInfo.cycleNumber, 10);

        // Get max temp from temp profile
        let maxTemp: number | null = null;
        if (cycleData.temp) {
          const temps = cycleData.temp.split(',').map((t: string) => parseFloat(t.trim())).filter((t: number) => !isNaN(t));
          if (temps.length > 0) {
            maxTemp = Math.max(...temps);
          }
        }

        // Get max pressure from pressure profile (if available)
        let maxPressure: number | null = null;
        if (cycleData.pressure) {
          const pressures = cycleData.pressure.split(',').map((p: string) => parseFloat(p.trim())).filter((p: number) => !isNaN(p));
          if (pressures.length > 0) {
            maxPressure = Math.max(...pressures);
          }
        }

        // Format program description from cycle_id
        const programDesc = cycleMetadata?.cycle_id
          ? cycleMetadata.cycle_id.replace(/_/g, ' ').replace(/STATCLAVE \d+V?/i, '').trim()
          : 'Unknown program';

        // Generate internal cycle number
        const cycleNumber = `CYC-${year}-${String(nextNum).padStart(4, '0')}`;
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
            temperature: maxTemp || (parsed?.maxTemp ?? null),
            pressure: maxPressure
              ? Math.round(maxPressure * 0.145038) // kPa to PSI
              : (parsed?.maxPressure ? Math.round(parsed.maxPressure * 0.145038) : null),
            exposureTime: parsed?.targetTime || null,
            dryingTime: parsed?.dryingEnd
              ? parsed.dryingEnd - (parsed.dryingStart || 0)
              : null,
            status: cycleData.succeeded ? 'COMPLETED' : 'FAILED',
            mechanicalPass: cycleData.succeeded,
            operatorId: session.user.id,
            notes: `Imported from ${autoclave.name}. Program: ${programDesc}`,

            // Autoclave-specific fields
            autoclaveId: id,
            externalCycleNumber: externalCycleNum,
            digitalSignature: parsed?.digitalSignature || null,
            rawLog: cycleData.log || null,
            importedAt: new Date(),
            tempProfile: cycleData.temp,
            pressureProfile: cycleData.pressure,

            createdBy: session.user.id,
            updatedBy: session.user.id,
          },
        });

        importedCycles.push(cycle);

        // Track max cycle number for sync tracking
        if (externalCycleNum > maxCycleNum) {
          maxCycleNum = externalCycleNum;
        }
      } catch (error) {
        console.error(`Error importing cycle ${cycleInfo.cycleNumber}:`, error);
        errors.push({
          cycleNumber: cycleInfo.cycleNumber,
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
        operation: 'BULK_IMPORT',
        autoclaveId: id,
        autoclaveName: autoclave.name,
        requested: cyclesToImport.length,
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

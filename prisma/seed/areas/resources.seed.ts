import type { SeedContext } from '../types';
import {
  EQUIPMENT_TYPES,
  SUPPLIERS,
  SAMPLE_EQUIPMENT,
  DEPRECIATION_SETTINGS,
} from '../fixtures/equipment.fixture';
import { SAMPLE_ROOMS, SAMPLE_CHAIRS } from '../fixtures/rooms.fixture';
import {
  SAMPLE_INSTRUMENT_SETS,
  CYCLE_PARAMETERS,
  COMPLIANCE_LOG_TEMPLATES,
  VALIDATION_SCHEDULES,
  VALIDATION_TEMPLATES,
  generateBILotNumber,
  getRandomBIBrand,
  getRandomBIReader,
  generateValidationCertNumber,
} from '../fixtures/sterilization.fixture';

/**
 * Seed resources data: Equipment types, suppliers, and sample equipment.
 *
 * This creates:
 * 1. System-wide equipment types (available to all clinics)
 * 2. Suppliers for each clinic
 * 3. Sample equipment for the primary clinic (standard/full mode only)
 */
export async function seedResources(ctx: SeedContext): Promise<void> {
  const { db, config, idTracker, logger } = ctx;
  const clinicIds = idTracker.getAll('Clinic');

  logger.startArea('Resources (Equipment)');

  let totalCreated = 0;

  // ============================================================================
  // 1. SEED SYSTEM EQUIPMENT TYPES (no clinicId - available to all)
  // ============================================================================
  logger.info('Creating system equipment types...');

  for (const typeData of EQUIPMENT_TYPES) {
    const existingType = await db.equipmentType.findFirst({
      where: { code: typeData.code, isSystem: true },
    });

    if (!existingType) {
      const equipmentType = await db.equipmentType.create({
        data: {
          clinicId: null, // System-wide
          code: typeData.code,
          name: typeData.name,
          category: typeData.category,
          description: typeData.description,
          defaultMaintenanceIntervalDays: typeData.defaultMaintenanceIntervalDays,
          maintenanceChecklist: typeData.maintenanceChecklist,
          isSystem: true,
          isActive: true,
        },
      });
      idTracker.add('EquipmentType', equipmentType.id);
      totalCreated++;
    }
  }

  logger.info(`  Created ${EQUIPMENT_TYPES.length} system equipment types`);

  // ============================================================================
  // 2. SEED SUPPLIERS FOR EACH CLINIC
  // ============================================================================
  for (const clinicId of clinicIds) {
    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    logger.info(`Seeding suppliers for clinic: ${clinic?.name || clinicId}`);

    // Get a user from this clinic to use as createdBy
    const adminUser = await db.user.findFirst({
      where: { clinicId, role: { in: ['clinic_admin', 'super_admin'] } },
    });
    const createdBy = adminUser?.id;

    for (const supplierData of SUPPLIERS) {
      // Check if supplier already exists for this clinic
      const existingSupplier = await db.supplier.findFirst({
        where: { clinicId, code: supplierData.code },
      });

      if (!existingSupplier) {
        const supplier = await db.supplier.create({
          data: {
            clinicId,
            code: supplierData.code,
            name: supplierData.name,
            contactName: `${supplierData.name} Support`,
            email: supplierData.email,
            phone: supplierData.phone,
            website: supplierData.website,
            notes: supplierData.description,
            status: 'ACTIVE',
            createdBy,
            updatedBy: createdBy,
            deletedAt: null, // Explicitly set to null for soft-delete filter
          },
        });
        idTracker.add('Supplier', supplier.id, clinicId);
        totalCreated++;
      }
    }

    logger.info(`  Created ${SUPPLIERS.length} suppliers`);
  }

  // ============================================================================
  // 3. SEED SAMPLE EQUIPMENT (primary clinic, standard/full mode only)
  // ============================================================================
  if (config.mode !== 'minimal' && clinicIds.length > 0) {
    const primaryClinicId = clinicIds[0];
    const clinic = await db.clinic.findUnique({ where: { id: primaryClinicId } });
    logger.info(`Seeding sample equipment for primary clinic: ${clinic?.name || primaryClinicId}`);

    // Get admin user for createdBy
    const adminUser = await db.user.findFirst({
      where: { clinicId: primaryClinicId, role: { in: ['clinic_admin', 'super_admin'] } },
    });
    const createdBy = adminUser?.id;

    // Get all equipment types
    const equipmentTypes = await db.equipmentType.findMany({
      where: { isSystem: true },
    });
    const typeMap = new Map(equipmentTypes.map((t) => [t.code, t]));

    // Get suppliers for this clinic
    const suppliers = await db.supplier.findMany({
      where: { clinicId: primaryClinicId },
    });

    // Map supplier by category for assignment
    const supplierByCategory: Record<string, string> = {};
    for (const supplier of suppliers) {
      if (supplier.code === 'ALIGN_TECH') supplierByCategory['INTRAORAL_SCANNER'] = supplier.id;
      if (supplier.code === 'CARESTREAM') supplierByCategory['CBCT_MACHINE'] = supplier.id;
      if (supplier.code === 'CARESTREAM') supplierByCategory['PANORAMIC_XRAY'] = supplier.id;
      if (supplier.code === 'A_DEC') supplierByCategory['DENTAL_CHAIR'] = supplier.id;
      if (supplier.code === 'TUTTNAUER') supplierByCategory['AUTOCLAVE'] = supplier.id;
      if (supplier.code === 'FORMLABS') supplierByCategory['3D_PRINTER'] = supplier.id;
      if (supplier.code === 'HENRY_SCHEIN') supplierByCategory['DEFAULT'] = supplier.id;
    }

    let equipmentCount = 0;
    const now = new Date();

    for (const equipData of SAMPLE_EQUIPMENT) {
      const equipmentType = typeMap.get(equipData.typeCode);
      if (!equipmentType) {
        logger.warn(`  Equipment type not found: ${equipData.typeCode}`);
        continue;
      }

      // Check if equipment with this serial number already exists
      const existingEquipment = await db.equipment.findFirst({
        where: { clinicId: primaryClinicId, serialNumber: equipData.serialNumber },
      });

      if (existingEquipment) {
        continue;
      }

      // Calculate depreciation settings
      const depSettings = DEPRECIATION_SETTINGS.find(
        (d) => d.category === equipmentType.category
      );

      // Calculate purchase date (1-4 years ago based on warranty)
      const yearsAgo = Math.min(equipData.warrantyYears + 1, 4);
      const purchaseDate = new Date(now);
      purchaseDate.setFullYear(purchaseDate.getFullYear() - yearsAgo + 1);

      // Calculate warranty expiry
      const warrantyExpiry = new Date(purchaseDate);
      warrantyExpiry.setFullYear(warrantyExpiry.getFullYear() + equipData.warrantyYears);

      // Calculate next maintenance date
      let nextMaintenanceDate: Date | null = null;
      if (equipmentType.defaultMaintenanceIntervalDays) {
        nextMaintenanceDate = new Date(now);
        nextMaintenanceDate.setDate(
          nextMaintenanceDate.getDate() +
            Math.floor(Math.random() * equipmentType.defaultMaintenanceIntervalDays)
        );
      }

      // Get vendor for this equipment
      const vendorId =
        supplierByCategory[equipData.typeCode] || supplierByCategory['DEFAULT'] || null;

      // Generate equipment number
      const equipmentNumber = `EQ-${equipmentType.code.substring(0, 3)}-${String(equipmentCount + 1).padStart(3, '0')}`;

      const equipment = await db.equipment.create({
        data: {
          clinicId: primaryClinicId,
          name: equipData.name,
          equipmentNumber,
          typeId: equipmentType.id,
          category: equipmentType.category,
          status: 'ACTIVE',
          condition: 'GOOD',
          manufacturer: equipData.manufacturer,
          modelNumber: equipData.model,
          serialNumber: equipData.serialNumber,
          locationNotes: equipData.location,
          purchaseDate,
          purchasePrice: equipData.purchaseCost,
          vendorId,
          warrantyExpiry,
          hasExtendedWarranty: false,
          maintenanceIntervalDays: equipmentType.defaultMaintenanceIntervalDays,
          nextMaintenanceDate,
          depreciationMethod: depSettings?.method ?? 'STRAIGHT_LINE',
          usefulLifeMonths: (depSettings?.lifespanYears ?? 5) * 12,
          salvageValue: equipData.purchaseCost * ((depSettings?.salvageValuePercent ?? 10) / 100),
          createdBy,
          updatedBy: createdBy,
          deletedAt: null, // Explicitly set to null for soft-delete filter
        },
      });

      idTracker.add('Equipment', equipment.id, primaryClinicId);
      equipmentCount++;
      totalCreated++;
    }

    logger.info(`  Created ${equipmentCount} sample equipment items`);

    // ============================================================================
    // 4. SEED SAMPLE MAINTENANCE RECORDS
    // ============================================================================
    logger.info('Creating sample maintenance records...');

    const equipmentForMaintenance = await db.equipment.findMany({
      where: { clinicId: primaryClinicId, deletedAt: null },
      include: { type: true },
    });

    let maintenanceCount = 0;

    for (const equip of equipmentForMaintenance) {
      // Create upcoming scheduled maintenance (within next 30 days)
      const upcomingDate = new Date(now);
      upcomingDate.setDate(upcomingDate.getDate() + Math.floor(Math.random() * 30) + 1);

      await db.maintenanceRecord.create({
        data: {
          clinicId: primaryClinicId,
          equipmentId: equip.id,
          maintenanceType: 'PREVENTIVE',
          scheduledDate: upcomingDate,
          status: 'SCHEDULED',
          description: `Scheduled preventive maintenance for ${equip.name}`,
          checklist: equip.type.maintenanceChecklist,
          createdBy,
          updatedBy: createdBy,
        },
      });
      maintenanceCount++;
      totalCreated++;

      // Create some overdue maintenance (past due)
      if (Math.random() > 0.6) {
        const overdueDate = new Date(now);
        overdueDate.setDate(overdueDate.getDate() - Math.floor(Math.random() * 14) - 1);

        await db.maintenanceRecord.create({
          data: {
            clinicId: primaryClinicId,
            equipmentId: equip.id,
            maintenanceType: 'INSPECTION',
            scheduledDate: overdueDate,
            status: 'SCHEDULED', // Still scheduled but past due = overdue
            description: `Overdue inspection for ${equip.name}`,
            checklist: equip.type.maintenanceChecklist,
            createdBy,
            updatedBy: createdBy,
          },
        });
        maintenanceCount++;
        totalCreated++;
      }

      // In full mode, also create completed maintenance history
      if (config.mode === 'full') {
        const recordCount = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < recordCount; i++) {
          const completedDate = new Date(now);
          completedDate.setMonth(completedDate.getMonth() - (i + 1) * 3);

          await db.maintenanceRecord.create({
            data: {
              clinicId: primaryClinicId,
              equipmentId: equip.id,
              maintenanceType: i === 0 ? 'PREVENTIVE' : 'INSPECTION',
              scheduledDate: completedDate,
              completedDate,
              status: 'COMPLETED',
              description: `Routine ${i === 0 ? 'preventive maintenance' : 'inspection'}`,
              checklist: equip.type.maintenanceChecklist,
              notes: 'All checks passed. Equipment in good working order.',
              performedBy: 'Internal Staff',
              laborCost: 50,
              partsCost: i === 0 ? 25 : 0,
              totalCost: i === 0 ? 75 : 50,
              createdBy,
              updatedBy: createdBy,
            },
          });
          maintenanceCount++;
          totalCreated++;
        }
      }
    }

    logger.info(`  Created ${maintenanceCount} maintenance records`);

    // ============================================================================
    // 5. SEED ROOMS AND OPERATORIES
    // ============================================================================
    logger.info('Creating sample rooms and operatories...');

    let roomCount = 0;
    const roomIdMap = new Map<string, string>(); // Map roomNumber to roomId

    for (const roomData of SAMPLE_ROOMS) {
      // Check if room already exists
      const existingRoom = await db.room.findFirst({
        where: { clinicId: primaryClinicId, roomNumber: roomData.roomNumber },
      });

      if (existingRoom) {
        roomIdMap.set(roomData.roomNumber, existingRoom.id);
        continue;
      }

      const room = await db.room.create({
        data: {
          clinicId: primaryClinicId,
          name: roomData.name,
          roomNumber: roomData.roomNumber,
          roomType: roomData.roomType,
          floor: roomData.floor,
          wing: roomData.wing,
          squareFeet: roomData.squareFeet,
          capacity: roomData.capacity,
          capabilities: roomData.capabilities,
          setupNotes: roomData.setupNotes,
          notes: roomData.notes,
          status: 'ACTIVE',
          isAvailable: true,
          createdBy,
          updatedBy: createdBy,
          deletedAt: null,
        },
      });

      roomIdMap.set(roomData.roomNumber, room.id);
      idTracker.add('Room', room.id, primaryClinicId);
      roomCount++;
      totalCreated++;
    }

    logger.info(`  Created ${roomCount} rooms`);

    // ============================================================================
    // 6. SEED TREATMENT CHAIRS
    // ============================================================================
    logger.info('Creating treatment chairs...');

    let chairCount = 0;
    const now2 = new Date();

    for (const chairData of SAMPLE_CHAIRS) {
      const roomId = roomIdMap.get(chairData.roomNumber);
      if (!roomId) {
        logger.warn(`  Room not found for chair: ${chairData.chairNumber}`);
        continue;
      }

      // Check if chair already exists
      const existingChair = await db.treatmentChair.findFirst({
        where: { clinicId: primaryClinicId, chairNumber: chairData.chairNumber },
      });

      if (existingChair) {
        continue;
      }

      // Calculate purchase date and warranty
      const purchaseDate = new Date(now2);
      purchaseDate.setFullYear(purchaseDate.getFullYear() - 2);
      const warrantyExpiry = new Date(purchaseDate);
      warrantyExpiry.setFullYear(warrantyExpiry.getFullYear() + 5);
      const nextMaintenanceDate = new Date(now2);
      nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + 3);

      const chair = await db.treatmentChair.create({
        data: {
          clinicId: primaryClinicId,
          roomId,
          name: chairData.name,
          chairNumber: chairData.chairNumber,
          manufacturer: chairData.manufacturer,
          modelNumber: chairData.modelNumber,
          serialNumber: chairData.serialNumber,
          features: chairData.features,
          hasDeliveryUnit: chairData.hasDeliveryUnit,
          hasSuction: chairData.hasSuction,
          hasLight: chairData.hasLight,
          status: 'ACTIVE',
          condition: 'GOOD',
          purchaseDate,
          warrantyExpiry,
          nextMaintenanceDate,
          notes: chairData.notes,
          createdBy,
          updatedBy: createdBy,
          deletedAt: null,
        },
      });

      idTracker.add('TreatmentChair', chair.id, primaryClinicId);
      chairCount++;
      totalCreated++;
    }

    logger.info(`  Created ${chairCount} treatment chairs`);

    // ============================================================================
    // 7. SEED INSTRUMENT SETS
    // ============================================================================
    logger.info('Creating instrument sets...');

    let instrumentSetCount = 0;
    const instrumentSetIds: string[] = [];

    for (const setData of SAMPLE_INSTRUMENT_SETS) {
      // Check if set already exists
      const existingSet = await db.instrumentSet.findFirst({
        where: { clinicId: primaryClinicId, setNumber: setData.setNumber },
      });

      if (existingSet) {
        instrumentSetIds.push(existingSet.id);
        continue;
      }

      const instrumentSet = await db.instrumentSet.create({
        data: {
          clinicId: primaryClinicId,
          name: setData.name,
          setNumber: setData.setNumber,
          barcode: setData.barcode,
          description: setData.description,
          instrumentCount: setData.instrumentCount,
          category: setData.category,
          status: 'AVAILABLE',
          assemblyDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
          expirationDays: setData.expirationDays,
          maxUses: setData.maxUses,
          useCount: Math.floor(Math.random() * 20),
          sterilizationCount: Math.floor(Math.random() * 30) + 5,
          lastSterilizedAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          createdBy,
          updatedBy: createdBy,
          deletedAt: null,
        },
      });

      instrumentSetIds.push(instrumentSet.id);
      idTracker.add('InstrumentSet', instrumentSet.id, primaryClinicId);
      instrumentSetCount++;
      totalCreated++;
    }

    logger.info(`  Created ${instrumentSetCount} instrument sets`);

    // ============================================================================
    // 8. SEED STERILIZATION CYCLES
    // ============================================================================
    logger.info('Creating sterilization cycles...');

    // Get autoclave equipment
    const autoclaves = await db.equipment.findMany({
      where: {
        clinicId: primaryClinicId,
        deletedAt: null,
        type: { code: 'AUTOCLAVE' },
      },
    });

    if (autoclaves.length > 0) {
      const autoclave = autoclaves[0];
      let cycleCount = 0;

      // Create cycles for the past 30 days
      const numCycles = config.mode === 'full' ? 60 : 20;

      for (let i = 0; i < numCycles; i++) {
        const daysAgo = Math.floor(i / 2); // ~2 cycles per day
        const cycleDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        cycleDate.setHours(8 + (i % 2) * 4, Math.floor(Math.random() * 60), 0, 0);

        const cycleType = i % 10 === 0 ? 'STEAM_PREVACUUM' : 'STEAM_GRAVITY';
        const params = CYCLE_PARAMETERS.find((p) => p.cycleType === cycleType) || CYCLE_PARAMETERS[0];

        // Most cycles pass, some fail
        const cycleStatus = i === 3 ? 'FAILED' : i < 2 ? 'IN_PROGRESS' : 'COMPLETED';
        const endTime = cycleStatus !== 'IN_PROGRESS'
          ? new Date(cycleDate.getTime() + (params.exposureTime + params.dryingTime + 15) * 60 * 1000)
          : null;

        const year = cycleDate.getFullYear();
        const cycleNumber = `CYC-${year}-${String(i + 1).padStart(4, '0')}`;

        const cycle = await db.sterilizationCycle.create({
          data: {
            clinicId: primaryClinicId,
            equipmentId: autoclave.id,
            cycleNumber,
            cycleType,
            startTime: cycleDate,
            endTime,
            temperature: params.temperature + (Math.random() * 2 - 1), // ±1°C variance
            pressure: params.pressure + (Math.random() * 0.5 - 0.25), // ±0.25 PSI variance
            exposureTime: params.exposureTime,
            dryingTime: params.dryingTime,
            status: cycleStatus,
            mechanicalPass: cycleStatus === 'COMPLETED' ? true : cycleStatus === 'FAILED' ? false : null,
            chemicalPass: cycleStatus === 'COMPLETED' ? true : cycleStatus === 'FAILED' ? false : null,
            biologicalPass: cycleStatus === 'COMPLETED' && i % 7 === 0 ? true : null, // Weekly BI
            operatorId: createdBy!,
            failureReason: cycleStatus === 'FAILED' ? 'Temperature did not reach required level' : null,
            createdBy,
            updatedBy: createdBy,
          },
        });

        idTracker.add('SterilizationCycle', cycle.id, primaryClinicId);
        cycleCount++;
        totalCreated++;

        // Add loads to completed cycles
        if (cycleStatus === 'COMPLETED' && instrumentSetIds.length > 0) {
          const numLoads = Math.floor(Math.random() * 3) + 1;
          for (let j = 0; j < numLoads; j++) {
            const setId = instrumentSetIds[Math.floor(Math.random() * instrumentSetIds.length)];
            await db.sterilizationLoad.create({
              data: {
                clinicId: primaryClinicId,
                cycleId: cycle.id,
                loadNumber: j + 1,
                itemType: 'INSTRUMENT_PACK',
                itemDescription: `Instrument pack ${j + 1}`,
                quantity: 1,
                instrumentSetId: setId,
                position: j === 0 ? 'Top rack' : j === 1 ? 'Middle rack' : 'Bottom rack',
              },
            });
            totalCreated++;
          }
        }

        // Add chemical indicators
        if (cycleStatus !== 'IN_PROGRESS') {
          await db.chemicalIndicator.create({
            data: {
              clinicId: primaryClinicId,
              cycleId: cycle.id,
              indicatorClass: 'CLASS_5',
              indicatorType: '3M Comply SteriGage',
              loadPosition: 'Center of load',
              result: cycleStatus === 'COMPLETED' ? 'PASSED' : 'FAILED',
              colorChange: cycleStatus === 'COMPLETED' ? 'Complete color change to dark' : 'Incomplete color change',
              performedById: createdBy!,
            },
          });
          totalCreated++;
        }

        // Add biological indicators (weekly tests - every 7th cycle)
        if (i % 7 === 0 && cycleStatus === 'COMPLETED') {
          const incubationStart = new Date(endTime!);
          const readDate = new Date(incubationStart.getTime() + 24 * 60 * 60 * 1000); // 24 hours later

          await db.biologicalIndicator.create({
            data: {
              clinicId: primaryClinicId,
              cycleId: cycle.id,
              lotNumber: generateBILotNumber(),
              brand: getRandomBIBrand(),
              testDate: incubationStart,
              readDate: readDate < now ? readDate : null,
              incubationHours: 24,
              result: readDate < now ? 'PASSED' : 'PENDING',
              controlPassed: readDate < now ? true : null,
              readerType: getRandomBIReader(),
              performedById: createdBy!,
              readById: readDate < now ? createdBy : null,
            },
          });
          totalCreated++;
        }
      }

      logger.info(`  Created ${cycleCount} sterilization cycles with loads and indicators`);
    }

    // ============================================================================
    // 9. SEED COMPLIANCE LOGS
    // ============================================================================
    logger.info('Creating compliance logs...');

    let complianceCount = 0;

    for (const template of COMPLIANCE_LOG_TEMPLATES) {
      // Create a few of each type
      const numLogs = config.mode === 'full' ? 4 : 2;

      for (let i = 0; i < numLogs; i++) {
        const logDate = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000); // Weekly

        await db.complianceLog.create({
          data: {
            clinicId: primaryClinicId,
            logType: template.logType,
            logDate,
            title: `${template.title} - Week ${i + 1}`,
            description: template.description,
            action: template.action,
            outcome: 'All tests passed, equipment operating within normal parameters',
            isCompliant: true,
            deficiencyFound: false,
            performedById: createdBy!,
            reviewedById: createdBy,
            reviewedAt: new Date(logDate.getTime() + 24 * 60 * 60 * 1000),
            attachments: [],
          },
        });

        complianceCount++;
        totalCreated++;
      }
    }

    logger.info(`  Created ${complianceCount} compliance logs`);

    // ============================================================================
    // 10. SEED EQUIPMENT VALIDATIONS AND SCHEDULES
    // ============================================================================
    logger.info('Creating equipment validations and schedules...');

    // Get sterilization equipment (autoclaves)
    const sterilizationEquipment = await db.equipment.findMany({
      where: {
        clinicId: primaryClinicId,
        deletedAt: null,
        type: { code: { in: ['AUTOCLAVE', 'STERILIZER'] } },
      },
    });

    let validationCount = 0;
    let scheduleCount = 0;

    for (const equipment of sterilizationEquipment) {
      // Create validation schedules for each equipment
      for (const scheduleData of VALIDATION_SCHEDULES) {
        // Check if schedule already exists
        const existingSchedule = await db.validationSchedule.findFirst({
          where: {
            equipmentId: equipment.id,
            validationType: scheduleData.validationType,
          },
        });

        if (!existingSchedule) {
          // Calculate next due date based on frequency
          const nextDue = new Date(now);
          nextDue.setDate(nextDue.getDate() + Math.floor(Math.random() * scheduleData.frequencyDays));

          // Calculate last performed (some time in the past)
          const lastPerformed = new Date(now);
          lastPerformed.setDate(
            lastPerformed.getDate() - Math.floor(Math.random() * scheduleData.frequencyDays)
          );

          await db.validationSchedule.create({
            data: {
              clinicId: primaryClinicId,
              equipmentId: equipment.id,
              validationType: scheduleData.validationType,
              frequencyDays: scheduleData.frequencyDays,
              reminderDays: scheduleData.reminderDays,
              isActive: true,
              lastPerformed,
              nextDue,
              notes: scheduleData.description,
              createdBy,
            },
          });
          scheduleCount++;
          totalCreated++;
        }
      }

      // Create historical validation records
      for (const template of VALIDATION_TEMPLATES) {
        // Create 2-4 historical records per validation type (depending on frequency)
        const numRecords = config.mode === 'full' ? 4 : 2;
        const scheduleInfo = VALIDATION_SCHEDULES.find(
          (s) => s.validationType === template.validationType
        );
        const frequency = scheduleInfo?.frequencyDays || 365;

        for (let i = 0; i < numRecords; i++) {
          // Calculate validation date (past dates based on frequency)
          const validationDate = new Date(now);
          validationDate.setDate(validationDate.getDate() - i * frequency - Math.floor(Math.random() * 30));

          // Skip if date is more than 2 years ago
          if (now.getTime() - validationDate.getTime() > 2 * 365 * 24 * 60 * 60 * 1000) {
            continue;
          }

          // Calculate next validation due
          const nextValidationDue = new Date(validationDate);
          nextValidationDue.setDate(nextValidationDue.getDate() + frequency);

          // Most validations pass, occasionally one fails or is conditional
          const resultRand = Math.random();
          const result: 'PASS' | 'FAIL' | 'CONDITIONAL' =
            resultRand > 0.95 ? 'FAIL' : resultRand > 0.9 ? 'CONDITIONAL' : 'PASS';

          // Generate certificate (only for passed/conditional)
          const certificateNumber =
            result !== 'FAIL' ? generateValidationCertNumber(template.certificatePrefix) : null;
          const certificateExpiry =
            result !== 'FAIL'
              ? new Date(validationDate.getTime() + frequency * 24 * 60 * 60 * 1000)
              : null;

          await db.sterilizerValidation.create({
            data: {
              clinicId: primaryClinicId,
              equipmentId: equipment.id,
              validationType: template.validationType,
              validationDate,
              nextValidationDue,
              result,
              parameters: template.parameters as Record<string, string | boolean>,
              performedBy: template.performedBy,
              performedById: createdBy || undefined,
              vendorName: template.vendorName || null,
              technicianName: template.vendorName ? `Tech ${Math.floor(Math.random() * 100) + 1}` : null,
              certificateNumber,
              certificateExpiry,
              failureDetails:
                result === 'FAIL'
                  ? 'Equipment did not meet required parameters. Requires service before re-testing.'
                  : null,
              correctiveAction:
                result === 'FAIL' ? 'Schedule service call with manufacturer.' : null,
              notes:
                result === 'PASS'
                  ? 'All tests completed successfully within acceptable parameters.'
                  : result === 'CONDITIONAL'
                  ? 'Minor deviations noted. Equipment functional but requires monitoring.'
                  : null,
              createdBy: createdBy!,
            },
          });

          validationCount++;
          totalCreated++;
        }
      }
    }

    logger.info(`  Created ${scheduleCount} validation schedules`);
    logger.info(`  Created ${validationCount} validation records`);
  }

  logger.endArea('Resources (Equipment)', totalCreated);
}

/**
 * Clear all resources data.
 */
export async function clearResources(ctx: SeedContext): Promise<void> {
  const { db, logger } = ctx;

  logger.info('Clearing resources data...');

  // Clear equipment validation data
  await db.sterilizerValidation.deleteMany({});
  await db.validationSchedule.deleteMany({});

  // Clear sterilization data (due to foreign keys)
  await db.complianceLog.deleteMany({});
  await db.instrumentPackage.deleteMany({});
  await db.chemicalIndicator.deleteMany({});
  await db.biologicalIndicator.deleteMany({});
  await db.sterilizationLoad.deleteMany({});
  await db.sterilizationCycle.deleteMany({});
  await db.instrumentSet.deleteMany({});

  // Clear room and equipment data
  await db.roomEquipment.deleteMany({});
  await db.treatmentChair.deleteMany({});
  await db.room.deleteMany({});
  await db.repairRecord.deleteMany({});
  await db.maintenanceRecord.deleteMany({});
  await db.equipment.deleteMany({});
  await db.supplier.deleteMany({});
  // Keep system equipment types, only delete clinic-specific ones
  await db.equipmentType.deleteMany({ where: { isSystem: false } });

  logger.info('Resources data cleared');
}

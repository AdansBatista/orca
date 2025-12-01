import type { SeedContext } from '../types';
import {
  EQUIPMENT_TYPES,
  SUPPLIERS,
  SAMPLE_EQUIPMENT,
  DEPRECIATION_SETTINGS,
} from '../fixtures/equipment.fixture';

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
  }

  logger.endArea('Resources (Equipment)', totalCreated);
}

/**
 * Clear all resources data.
 */
export async function clearResources(ctx: SeedContext): Promise<void> {
  const { db, logger } = ctx;

  logger.info('Clearing resources data...');

  // Clear in correct order due to foreign keys
  await db.repairRecord.deleteMany({});
  await db.maintenanceRecord.deleteMany({});
  await db.equipment.deleteMany({});
  await db.supplier.deleteMany({});
  // Keep system equipment types, only delete clinic-specific ones
  await db.equipmentType.deleteMany({ where: { isSystem: false } });

  logger.info('Resources data cleared');
}

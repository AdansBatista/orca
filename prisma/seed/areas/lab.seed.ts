/**
 * Lab Work Management seeder - Creates lab vendors, products, orders, and related data
 *
 * This seeder creates comprehensive lab work data for testing the Lab Work Management area
 * including vendors, products, fee schedules, orders, shipments, inspections, remakes,
 * warranties, contracts, and vendor metrics.
 *
 * Dependencies: core, patients, auth:users, staff
 */

import type { SeedContext } from '../types';
import { withSoftDelete } from '../utils/soft-delete';
import {
  LAB_VENDORS,
  LAB_PRODUCTS,
  INSPECTION_CHECKLIST_ITEMS,
  CONTRACT_TERMS,
  generateTrackingNumber,
} from '../fixtures/lab.fixture';
import type {
  LabOrderStatus,
  ShippingCarrier,
  StatusChangeSource,
  InspectionResult,
  RemakeStatus,
  RemakeReason,
  CostResponsibility,
  LabContactRole,
} from '@prisma/client';

// Order statuses for sample data
const ORDER_STATUSES: LabOrderStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'ACKNOWLEDGED',
  'IN_PROGRESS',
  'COMPLETED',
  'SHIPPED',
  'DELIVERED',
  'RECEIVED',
  'PATIENT_PICKUP',
];

// Shipping carriers matching the ShippingCarrier enum
const CARRIER_LIST: ShippingCarrier[] = ['FEDEX', 'UPS', 'USPS', 'DHL', 'LAB_COURIER'];

// Contact roles matching the LabContactRole enum
const CONTACT_ROLES: LabContactRole[] = ['PRIMARY', 'BILLING', 'TECHNICAL', 'SHIPPING'];

// Remake reasons matching the RemakeReason enum
const REMAKE_REASON_LIST: { code: RemakeReason; label: string; responsibleParty: CostResponsibility }[] = [
  { code: 'FIT_ISSUE', label: 'Fit Issue', responsibleParty: 'LAB' },
  { code: 'DESIGN_ISSUE', label: 'Design Issue', responsibleParty: 'CLINIC' },
  { code: 'MATERIAL_DEFECT', label: 'Material Defect', responsibleParty: 'LAB' },
  { code: 'SHIPPING_DAMAGE', label: 'Shipping Damage', responsibleParty: 'LAB' },
];

/**
 * Seed Lab Work Management data
 */
export async function seedLab(ctx: SeedContext): Promise<void> {
  const { db, idTracker, logger } = ctx;
  const clinicIds = idTracker.getAll('Clinic');

  logger.startArea('Lab Work Management');

  if (clinicIds.length === 0) {
    logger.warn('No clinics found, skipping Lab Work Management seeding');
    logger.endArea('Lab Work Management', 0);
    return;
  }

  let totalCreated = 0;

  for (const clinicId of clinicIds) {
    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    logger.info(`Seeding lab data for clinic: ${clinic?.name || clinicId}`);

    // Get users for createdBy references
    const users = await db.user.findMany({
      where: { clinicId },
      take: 5,
    });

    const createdById = users[0]?.id;
    if (!createdById) {
      logger.warn(`No users found for clinic ${clinicId}, skipping`);
      continue;
    }

    // ========================================================================
    // 1. Create Lab Vendors
    // ========================================================================
    logger.info('  Creating lab vendors...');
    const vendorIds: string[] = [];
    const vendorMap: Map<string, string> = new Map();

    for (const vendorConfig of LAB_VENDORS) {
      // Check if vendor already exists
      const existingVendor = await db.labVendor.findFirst({
        where: withSoftDelete({
          clinicId,
          code: vendorConfig.code,
        }),
      });

      if (existingVendor) {
        vendorIds.push(existingVendor.id);
        vendorMap.set(vendorConfig.code, existingVendor.id);
        idTracker.add('LabVendor', existingVendor.id, clinicId);
        continue;
      }

      const vendor = await db.labVendor.create({
        data: {
          clinicId,
          name: vendorConfig.name,
          code: vendorConfig.code,
          legalName: vendorConfig.legalName,
          taxId: vendorConfig.taxId,
          status: 'ACTIVE',
          capabilities: [...vendorConfig.capabilities],
          website: vendorConfig.website,
          primaryEmail: `orders@${vendorConfig.code.toLowerCase()}.example.com`,
          primaryPhone: `(555) ${100 + vendorIds.length}-${1000 + vendorIds.length * 10}`,
          paymentTerms: vendorConfig.paymentTerms,
          defaultCarrier: 'FEDEX',
          address: {
            street: `${100 + vendorIds.length} Lab Way`,
            city: 'Lab City',
            state: 'CA',
            zip: '90210',
            country: 'USA',
          },
          deletedAt: null, // Explicit null for MongoDB soft delete compatibility
        },
      });

      vendorIds.push(vendor.id);
      vendorMap.set(vendorConfig.code, vendor.id);
      idTracker.add('LabVendor', vendor.id, clinicId);
      totalCreated++;

      // Create primary and secondary contacts for each vendor
      await db.labVendorContact.create({
        data: {
          vendorId: vendor.id,
          name: `${vendorConfig.name.split(' ')[0]} Support`,
          title: 'Lab Coordinator',
          email: `support@${vendorConfig.code.toLowerCase()}.example.com`,
          phone: vendor.primaryPhone,
          role: 'PRIMARY',
          isPrimary: true,
        },
      });
      totalCreated++;

      await db.labVendorContact.create({
        data: {
          vendorId: vendor.id,
          name: `${vendorConfig.name.split(' ')[0]} Billing`,
          title: 'Account Manager',
          email: `billing@${vendorConfig.code.toLowerCase()}.example.com`,
          phone: `(555) ${200 + vendorIds.length}-${2000 + vendorIds.length * 10}`,
          role: 'BILLING',
          isPrimary: false,
        },
      });
      totalCreated++;
    }

    logger.info(`    Created ${vendorIds.length} vendors`);

    // ========================================================================
    // 2. Create Lab Contracts
    // ========================================================================
    logger.info('  Creating vendor contracts...');

    for (let i = 0; i < vendorIds.length; i++) {
      const vendorId = vendorIds[i];
      const contractTerm = CONTRACT_TERMS[i % CONTRACT_TERMS.length];

      // Check if contract already exists
      const existingContract = await db.labContract.findFirst({
        where: { clinicId, vendorId },
      });

      if (existingContract) {
        idTracker.add('LabContract', existingContract.id, clinicId);
        continue;
      }

      const startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000); // 6 months ago
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + contractTerm.durationMonths);

      const contract = await db.labContract.create({
        data: {
          clinicId,
          vendorId,
          name: contractTerm.name,
          status: 'ACTIVE',
          startDate,
          endDate,
          autoRenew: contractTerm.autoRenew,
          discountPercent: contractTerm.discountPercent,
          minimumVolume: Math.floor(contractTerm.minimumOrderValue / 100),
          notes: `Auto-generated contract for testing: ${contractTerm.name}`,
          deletedAt: null, // Explicit null for MongoDB soft delete compatibility
        },
      });

      idTracker.add('LabContract', contract.id, clinicId);
      totalCreated++;
    }

    logger.info(`    Created ${vendorIds.length} contracts`);

    // ========================================================================
    // 3. Create Lab Products
    // ========================================================================
    logger.info('  Creating lab products...');
    const productIds: string[] = [];
    const productMap: Map<string, { id: string; category: string; basePrice: number }> =
      new Map();

    for (let i = 0; i < LAB_PRODUCTS.length; i++) {
      const productConfig = LAB_PRODUCTS[i];
      // Assign vendors based on capabilities
      const compatibleVendorIds = vendorIds.filter((_, idx) => {
        const vendor = LAB_VENDORS[idx];
        return vendor?.capabilities.includes(productConfig.category as never);
      });

      // Use first compatible vendor or null for clinic-wide products
      const vendorId =
        compatibleVendorIds.length > 0
          ? compatibleVendorIds[i % compatibleVendorIds.length]
          : null;

      // Check if product already exists
      const existingProduct = await db.labProduct.findFirst({
        where: withSoftDelete({
          clinicId,
          name: productConfig.name,
          vendorId,
        }),
      });

      if (existingProduct) {
        productIds.push(existingProduct.id);
        productMap.set(existingProduct.id, {
          id: existingProduct.id,
          category: productConfig.category,
          basePrice: productConfig.basePrice,
        });
        idTracker.add('LabProduct', existingProduct.id, clinicId);
        continue;
      }

      const product = await db.labProduct.create({
        data: {
          clinicId,
          vendorId,
          name: productConfig.name,
          sku: productConfig.sku,
          description: productConfig.description,
          category: productConfig.category as
            | 'RETAINER'
            | 'APPLIANCE'
            | 'ALIGNER'
            | 'INDIRECT_BONDING'
            | 'ARCHWIRE'
            | 'MODEL'
            | 'SURGICAL'
            | 'OTHER',
          standardTurnaround: productConfig.standardTurnaround,
          rushTurnaround: productConfig.rushTurnaround,
          isActive: true,
          deletedAt: null, // Explicit null for MongoDB soft delete compatibility
        },
      });

      productIds.push(product.id);
      productMap.set(product.id, {
        id: product.id,
        category: productConfig.category,
        basePrice: productConfig.basePrice,
      });
      idTracker.add('LabProduct', product.id, clinicId);
      totalCreated++;

      // Create fee schedule for vendor-specific products
      if (vendorId) {
        await db.labFeeSchedule.create({
          data: {
            clinicId,
            vendorId,
            productId: product.id,
            basePrice: productConfig.basePrice,
            rushUpchargePercent: productConfig.rushUpcharge,
            effectiveDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
            isActive: true,
          },
        });
        totalCreated++;
      }
    }

    logger.info(`    Created ${productIds.length} products`);

    // ========================================================================
    // 4. Create Sample Orders with full lifecycle
    // ========================================================================
    logger.info('  Creating lab orders...');

    // Get patients for orders
    const patients = await db.patient.findMany({
      where: withSoftDelete({ clinicId }),
      take: 20,
      orderBy: { createdAt: 'asc' },
    });

    if (patients.length === 0) {
      logger.warn('    No patients found, skipping orders');
      continue;
    }

    let orderCount = 0;
    const year = new Date().getFullYear();
    const orderIds: string[] = [];

    for (let i = 0; i < Math.min(patients.length, 16); i++) {
      const patient = patients[i];
      const vendorId = vendorIds[i % vendorIds.length];
      const status = ORDER_STATUSES[i % ORDER_STATUSES.length];

      // Calculate order date (orders spread over last 90 days)
      const daysAgo = Math.floor((i / 16) * 90);
      const orderDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      // Check if order already exists
      const orderNumber = `LAB-${year}-${String(i + 1).padStart(4, '0')}`;
      const existingOrder = await db.labOrder.findFirst({
        where: {
          clinicId,
          orderNumber,
        },
      });

      if (existingOrder) {
        orderIds.push(existingOrder.id);
        idTracker.add('LabOrder', existingOrder.id, clinicId);
        orderCount++;
        continue;
      }

      // Calculate needed by date (5-14 days from order)
      const neededByDays = 5 + Math.floor(Math.random() * 10);
      const neededByDate = new Date(orderDate.getTime() + neededByDays * 24 * 60 * 60 * 1000);

      const isRush = i % 5 === 0; // Every 5th order is rush

      const order = await db.labOrder.create({
        data: {
          clinicId,
          patientId: patient.id,
          vendorId,
          orderNumber,
          status,
          priority: isRush ? 'URGENT' : 'STANDARD',
          isRush,
          rushLevel: isRush ? 'RUSH' : null,
          rushReason: isRush ? 'Patient appointment scheduled' : null,
          orderDate,
          neededByDate,
          submittedAt: status !== 'DRAFT' ? new Date(orderDate.getTime() + 3600000) : null,
          estimatedDelivery: neededByDate,
          actualDelivery:
            ['DELIVERED', 'RECEIVED', 'PATIENT_PICKUP'].includes(status)
              ? new Date(neededByDate.getTime() - 24 * 60 * 60 * 1000)
              : null,
          clinicNotes: i % 4 === 0 ? 'Patient has bite sensitivity - extra careful fitting required' : null,
          deletedAt: null, // Explicit null for MongoDB soft delete compatibility
        },
      });

      orderIds.push(order.id);
      idTracker.add('LabOrder', order.id, clinicId);
      totalCreated++;

      // Add 1-3 items to each order
      const itemCount = 1 + Math.floor(Math.random() * 2);
      let orderSubtotal = 0;

      for (let j = 0; j < itemCount; j++) {
        const productId = productIds[(i + j) % productIds.length];
        const productInfo = productMap.get(productId);

        if (!productInfo) continue;

        const unitPrice = productInfo.basePrice;
        const quantity = 1;
        const totalPrice = unitPrice * quantity;
        orderSubtotal += totalPrice;

        const arches = ['UPPER', 'LOWER', 'BOTH'] as const;
        const toothNumbers = j === 0 ? [3, 4, 5, 14, 19] : [];

        await db.labOrderItem.create({
          data: {
            orderId: order.id,
            productId,
            productName: LAB_PRODUCTS[(i + j) % LAB_PRODUCTS.length].name,
            quantity,
            unitPrice,
            totalPrice,
            arch: arches[j % 3],
            toothNumbers,
            status: status === 'DRAFT' ? 'PENDING' : 'IN_PROGRESS',
            notes: j === 0 && i % 3 === 0 ? 'Standard wire gauge' : null,
          },
        });
        totalCreated++;
      }

      // Update order totals
      const rushUpcharge = isRush ? orderSubtotal * 0.5 : 0;
      await db.labOrder.update({
        where: { id: order.id },
        data: {
          subtotal: orderSubtotal,
          rushUpcharge,
          totalCost: orderSubtotal + rushUpcharge,
        },
      });

      // Create status log entries showing order progression
      const statusProgression = getStatusProgression(status);
      let statusDate = new Date(orderDate);

      for (const statusEntry of statusProgression) {
        await db.labOrderStatusLog.create({
          data: {
            orderId: order.id,
            fromStatus: statusEntry.from as LabOrderStatus | null,
            toStatus: statusEntry.to as LabOrderStatus,
            source: statusEntry.source as StatusChangeSource,
            notes: statusEntry.notes,
            changedBy: createdById,
          },
        });
        totalCreated++;
        statusDate = new Date(statusDate.getTime() + Math.random() * 24 * 60 * 60 * 1000);
      }

      // Create attachments for some orders
      if (i % 3 === 0) {
        await db.labOrderAttachment.create({
          data: {
            orderId: order.id,
            fileName: `scan_${orderNumber.replace(/-/g, '_')}.stl`,
            storageKey: `lab/${clinicId}/${order.id}/scan.stl`,
            fileType: 'STL_SCAN',
            fileSize: 2500000 + Math.floor(Math.random() * 1000000),
            mimeType: 'model/stl',
            uploadedBy: createdById,
          },
        });
        totalCreated++;

        await db.labOrderAttachment.create({
          data: {
            orderId: order.id,
            fileName: `photo_${orderNumber.replace(/-/g, '_')}.jpg`,
            storageKey: `lab/${clinicId}/${order.id}/photo.jpg`,
            fileType: 'PHOTO',
            fileSize: 500000 + Math.floor(Math.random() * 200000),
            mimeType: 'image/jpeg',
            uploadedBy: createdById,
          },
        });
        totalCreated++;
      }

      // Create shipment for shipped/delivered orders
      if (['SHIPPED', 'DELIVERED', 'RECEIVED', 'PATIENT_PICKUP'].includes(status)) {
        const carrier = CARRIER_LIST[i % CARRIER_LIST.length];
        const shipmentStatus = status === 'SHIPPED' ? 'IN_TRANSIT' : 'DELIVERED';
        const shippedAt = new Date(neededByDate.getTime() - 3 * 24 * 60 * 60 * 1000);

        const shipment = await db.labShipment.create({
          data: {
            orderId: order.id,
            carrier,
            trackingNumber: generateTrackingNumber(carrier),
            status: shipmentStatus,
            shippedAt,
            estimatedDelivery: neededByDate,
            actualDelivery:
              status !== 'SHIPPED'
                ? new Date(neededByDate.getTime() - 24 * 60 * 60 * 1000)
                : null,
            packageCount: 1,
            weight: 0.5 + Math.random() * 2,
          },
        });
        idTracker.add('LabShipment', shipment.id, clinicId);
        totalCreated++;

        // Create shipment events
        const events = getShipmentEvents(shipmentStatus, shippedAt, neededByDate);
        for (const event of events) {
          await db.shipmentEvent.create({
            data: {
              shipmentId: shipment.id,
              status: event.status,
              location: event.location,
              description: event.description,
              timestamp: event.timestamp,
            },
          });
          totalCreated++;
        }
      }

      orderCount++;
    }

    logger.info(`    Created ${orderCount} orders`);

    // ========================================================================
    // 5. Create Inspections for received orders
    // ========================================================================
    logger.info('  Creating inspections...');

    const receivedOrders = await db.labOrder.findMany({
      where: {
        clinicId,
        status: { in: ['RECEIVED', 'PATIENT_PICKUP'] },
      },
      include: {
        items: true,
      },
      take: 8,
    });

    let inspectionCount = 0;

    for (let i = 0; i < receivedOrders.length; i++) {
      const order = receivedOrders[i];
      const isPassed = i % 4 !== 3; // 75% pass rate

      // Get first order item
      const orderItem = order.items[0];
      if (!orderItem) continue;

      // Check if inspection already exists
      const existingInspection = await db.labInspection.findFirst({
        where: { orderId: order.id },
      });

      if (existingInspection) {
        idTracker.add('LabInspection', existingInspection.id, clinicId);
        inspectionCount++;
        continue;
      }

      // Create checklist results
      const checklistResults = INSPECTION_CHECKLIST_ITEMS.map((item, idx) => ({
        itemName: item.name,
        category: item.category,
        passed: isPassed || idx < INSPECTION_CHECKLIST_ITEMS.length - 2, // If failed, last 2 items fail
        notes: !isPassed && idx >= INSPECTION_CHECKLIST_ITEMS.length - 2 ? 'Requires correction' : null,
      }));

      const inspectionResult: InspectionResult = isPassed ? 'PASS' : 'FAIL_REMAKE';

      const inspection = await db.labInspection.create({
        data: {
          clinicId,
          orderId: order.id,
          orderItemId: orderItem.id,
          inspectedBy: createdById,
          inspectedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          result: inspectionResult,
          checklist: checklistResults,
          notes: isPassed ? 'All quality standards met' : 'Minor issues found - remake recommended',
        },
      });

      idTracker.add('LabInspection', inspection.id, clinicId);
      totalCreated++;
      inspectionCount++;
    }

    logger.info(`    Created ${inspectionCount} inspections`);

    // ========================================================================
    // 6. Create Remake Requests for failed inspections
    // ========================================================================
    logger.info('  Creating remake requests...');

    const failedInspections = await db.labInspection.findMany({
      where: {
        clinicId,
        result: 'FAIL_REMAKE',
      },
      include: {
        order: {
          include: {
            items: true,
          },
        },
      },
      take: 4,
    });

    let remakeCount = 0;

    for (let i = 0; i < failedInspections.length; i++) {
      const inspection = failedInspections[i];
      const reasonConfig = REMAKE_REASON_LIST[i % REMAKE_REASON_LIST.length];

      // Need an order item
      const orderItem = inspection.order.items[0];
      if (!orderItem) continue;

      // Check if remake already exists
      const existingRemake = await db.remakeRequest.findFirst({
        where: { originalOrderId: inspection.orderId },
      });

      if (existingRemake) {
        idTracker.add('RemakeRequest', existingRemake.id, clinicId);
        remakeCount++;
        continue;
      }

      const statuses: RemakeStatus[] = ['REQUESTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED'];
      const status = statuses[i % statuses.length];

      const remake = await db.remakeRequest.create({
        data: {
          clinicId,
          originalOrderId: inspection.orderId,
          originalItemId: orderItem.id,
          requestNumber: `RMK-${year}-${String(i + 1).padStart(4, '0')}`,
          reason: reasonConfig.code,
          reasonDetails: `Remake required due to ${reasonConfig.label.toLowerCase()}`,
          status,
          costResponsibility: reasonConfig.responsibleParty,
          estimatedCost: 50 + Math.floor(Math.random() * 100),
          actualCost: status === 'COMPLETED' ? 50 + Math.floor(Math.random() * 100) : null,
        },
      });

      idTracker.add('RemakeRequest', remake.id, clinicId);
      totalCreated++;
      remakeCount++;
    }

    logger.info(`    Created ${remakeCount} remake requests`);

    // ========================================================================
    // 7. Create Warranties for completed orders
    // ========================================================================
    logger.info('  Creating warranties...');

    const completedOrders = await db.labOrder.findMany({
      where: {
        clinicId,
        status: { in: ['RECEIVED', 'PATIENT_PICKUP'] },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      take: 10,
    });

    let warrantyCount = 0;

    // Warranty periods by category (months)
    const warrantyPeriods: Record<string, number> = {
      RETAINER: 6,
      APPLIANCE: 12,
      ALIGNER: 3,
      INDIRECT_BONDING: 1,
      ARCHWIRE: 0,
      MODEL: 0,
      SURGICAL: 6,
      OTHER: 3,
    };

    for (const order of completedOrders) {
      for (const item of order.items) {
        if (!item.product) continue;

        const warrantyMonths = warrantyPeriods[item.product.category] || 0;
        if (warrantyMonths === 0) continue;

        // Check if warranty already exists
        const existingWarranty = await db.labWarranty.findFirst({
          where: { orderItemId: item.id },
        });

        if (existingWarranty) {
          idTracker.add('LabWarranty', existingWarranty.id, clinicId);
          warrantyCount++;
          continue;
        }

        const startDate = order.actualDelivery || order.estimatedDelivery || new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + warrantyMonths);

        const warranty = await db.labWarranty.create({
          data: {
            clinicId,
            orderItemId: item.id,
            startDate,
            endDate,
            warrantyMonths,
            status: endDate > new Date() ? 'ACTIVE' : 'EXPIRED',
          },
        });

        idTracker.add('LabWarranty', warranty.id, clinicId);
        totalCreated++;
        warrantyCount++;
      }
    }

    logger.info(`    Created ${warrantyCount} warranties`);

    // ========================================================================
    // 8. Create Vendor Metrics
    // ========================================================================
    logger.info('  Creating vendor metrics...');

    for (let i = 0; i < vendorIds.length; i++) {
      const vendorId = vendorIds[i];
      const vendorConfig = LAB_VENDORS[i];

      // Check if metrics already exist for this month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const existingMetrics = await db.labVendorMetrics.findFirst({
        where: {
          vendorId,
          periodStart: { gte: monthStart },
        },
      });

      if (existingMetrics) {
        idTracker.add('LabVendorMetrics', existingMetrics.id, clinicId);
        continue;
      }

      const orderCnt = 10 + Math.floor(Math.random() * 20);
      const onTimeRate = 0.8 + Math.random() * 0.15;
      const remakeRate = 0.02 + Math.random() * 0.05;

      const metrics = await db.labVendorMetrics.create({
        data: {
          clinicId,
          vendorId,
          periodType: 'MONTHLY',
          periodStart: monthStart,
          periodEnd: new Date(),
          orderCount: orderCnt,
          itemCount: orderCnt * 2,
          totalSpend: orderCnt * (150 + Math.random() * 100),
          avgTurnaroundDays: 5 + Math.random() * 3,
          onTimeRate,
          remakeRate,
          qualityScore: vendorConfig.qualityRating * 20, // Convert to 0-100
        },
      });

      idTracker.add('LabVendorMetrics', metrics.id, clinicId);
      totalCreated++;
    }

    logger.info(`    Created ${vendorIds.length} vendor metrics`);

    // ========================================================================
    // 9. Create Lab Messages
    // ========================================================================
    logger.info('  Creating lab messages...');

    const recentOrders = await db.labOrder.findMany({
      where: { clinicId },
      take: 6,
      orderBy: { createdAt: 'desc' },
    });

    let messageCount = 0;

    const messageSubjects = [
      'Order Confirmation',
      'Shipping Notification',
      'Quality Question',
      'Remake Request',
    ];

    for (let i = 0; i < recentOrders.length; i++) {
      const order = recentOrders[i];

      // Check if message already exists
      const existingMessage = await db.labMessage.findFirst({
        where: {
          orderId: order.id,
        },
      });

      if (existingMessage) {
        messageCount++;
        continue;
      }

      const message = await db.labMessage.create({
        data: {
          clinicId,
          vendorId: order.vendorId!,
          orderId: order.id,
          direction: i % 2 === 0 ? 'OUTBOUND' : 'INBOUND',
          subject: `${messageSubjects[i % messageSubjects.length]} - ${order.orderNumber}`,
          content: `This is a sample message regarding order ${order.orderNumber}.`,
          sentAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          sentBy: createdById,
        },
      });

      idTracker.add('LabMessage', message.id, clinicId);
      totalCreated++;
      messageCount++;
    }

    logger.info(`    Created ${messageCount} messages`);

    // ========================================================================
    // 10. Create Preference Rules
    // ========================================================================
    logger.info('  Creating preference rules...');

    const preferenceRules = [
      {
        name: 'Prefer Ortho Lab for Appliances',
        conditions: { productCategory: 'APPLIANCE' },
        preferredVendorCode: 'OLS',
        priority: 1,
      },
      {
        name: 'Clear Aligner Co for Aligners',
        conditions: { productCategory: 'ALIGNER' },
        preferredVendorCode: 'CAC',
        priority: 1,
      },
      {
        name: 'Rush Orders to Precision',
        conditions: { isRush: true },
        preferredVendorCode: 'PO',
        priority: 2,
      },
    ];

    for (const rule of preferenceRules) {
      const existingRule = await db.labPreferenceRule.findFirst({
        where: { clinicId, name: rule.name },
      });

      if (existingRule) continue;

      const preferredVendorId = vendorMap.get(rule.preferredVendorCode);
      if (!preferredVendorId) continue;

      await db.labPreferenceRule.create({
        data: {
          clinicId,
          vendorId: preferredVendorId,
          name: rule.name,
          conditions: rule.conditions,
          priority: rule.priority,
          isActive: true,
        },
      });
      totalCreated++;
    }

    logger.info(`    Created ${preferenceRules.length} preference rules`);
  }

  logger.success(`Lab Work Management seeding complete: ${totalCreated} records created`);
  logger.endArea('Lab Work Management', totalCreated);
}

/**
 * Get status progression for an order
 */
function getStatusProgression(
  currentStatus: string
): { from: string | null; to: string; source: string; notes: string }[] {
  const progression: { from: string | null; to: string; source: string; notes: string }[] = [];

  const statusOrder = [
    'DRAFT',
    'SUBMITTED',
    'ACKNOWLEDGED',
    'IN_PROGRESS',
    'COMPLETED',
    'SHIPPED',
    'DELIVERED',
    'RECEIVED',
    'PATIENT_PICKUP',
  ];

  const currentIndex = statusOrder.indexOf(currentStatus);

  for (let i = 0; i <= currentIndex; i++) {
    progression.push({
      from: i === 0 ? null : statusOrder[i - 1],
      to: statusOrder[i],
      source: i === 0 ? 'SYSTEM' : i <= 3 ? 'LAB' : 'USER',
      notes: getStatusNote(statusOrder[i]),
    });
  }

  return progression;
}

/**
 * Get note for a status
 */
function getStatusNote(status: string): string {
  const notes: Record<string, string> = {
    DRAFT: 'Order created',
    SUBMITTED: 'Order submitted to lab',
    ACKNOWLEDGED: 'Lab confirmed receipt',
    IN_PROGRESS: 'Fabrication started',
    COMPLETED: 'Fabrication completed',
    SHIPPED: 'Package shipped',
    DELIVERED: 'Package delivered',
    RECEIVED: 'Received at clinic',
    PATIENT_PICKUP: 'Patient picked up appliance',
  };
  return notes[status] || 'Status updated';
}

/**
 * Get shipment events for tracking
 */
function getShipmentEvents(
  status: string,
  shippedAt: Date,
  estimatedDelivery: Date
): { status: string; location: string; description: string; timestamp: Date }[] {
  const events: { status: string; location: string; description: string; timestamp: Date }[] = [];

  events.push({
    status: 'PICKED_UP',
    location: 'Lab City, CA',
    description: 'Package picked up by carrier',
    timestamp: shippedAt,
  });

  events.push({
    status: 'IN_TRANSIT',
    location: 'Distribution Center, CA',
    description: 'In transit to destination',
    timestamp: new Date(shippedAt.getTime() + 12 * 60 * 60 * 1000),
  });

  if (status === 'DELIVERED') {
    events.push({
      status: 'OUT_FOR_DELIVERY',
      location: 'Local Facility',
      description: 'Out for delivery',
      timestamp: new Date(estimatedDelivery.getTime() - 6 * 60 * 60 * 1000),
    });

    events.push({
      status: 'DELIVERED',
      location: 'Clinic Address',
      description: 'Delivered - Signed by staff',
      timestamp: new Date(estimatedDelivery.getTime() - 24 * 60 * 60 * 1000),
    });
  }

  return events;
}

/**
 * Clear Lab Work Management data
 */
export async function clearLab(ctx: SeedContext): Promise<void> {
  const { db, logger } = ctx;

  logger.info('Clearing Lab Work Management data...');

  // Delete in reverse dependency order
  await db.shipmentEvent.deleteMany({});
  await db.labShipment.deleteMany({});
  await db.labFeedback.deleteMany({});
  await db.warrantyClaim.deleteMany({});
  await db.labWarranty.deleteMany({});
  await db.remakeRequest.deleteMany({});
  await db.inspectionPhoto.deleteMany({});
  await db.labInspection.deleteMany({});
  await db.labOrderStatusLog.deleteMany({});
  await db.labOrderAttachment.deleteMany({});
  await db.labOrderItem.deleteMany({});
  await db.labOrder.deleteMany({});
  await db.labOrderTemplate.deleteMany({});
  await db.labMessage.deleteMany({});
  await db.labPreferenceRule.deleteMany({});
  await db.labVendorMetrics.deleteMany({});
  await db.labFeeSchedule.deleteMany({});
  await db.labProduct.deleteMany({});
  await db.labContract.deleteMany({});
  await db.labVendorContact.deleteMany({});
  await db.labVendor.deleteMany({});

  logger.info('  Lab Work Management data cleared');
}

import type { SeedContext } from '../types';
import { DEFAULT_APPOINTMENT_TYPES, generateSampleAppointments } from '../fixtures/booking.fixture';
import {
  DEFAULT_EMERGENCY_PROTOCOLS,
  DEFAULT_REMINDER_TEMPLATES,
  DEFAULT_AFTER_HOURS_SETTINGS,
  DEFAULT_EMERGENCY_FAQS,
  generateSampleEmergencies,
  generateOnCallSchedules,
  generateSampleReminders,
  generateSampleAfterHoursMessages,
} from '../fixtures/emergency-reminders.fixture';
import {
  generateWaitlistEntries,
  generateCancellations,
  generateRiskScores,
} from '../fixtures/waitlist-recovery.fixture';
import {
  DEFAULT_WEEKDAY_SCHEDULES,
  EXTENDED_SCHEDULES,
  DEFAULT_BOOKING_TEMPLATES,
  generateScheduleBlocks,
  generateRecurringAppointments,
} from '../fixtures/advanced-scheduling.fixture';

/**
 * Seed booking data: Appointment types, appointments, and emergency/reminder data
 *
 * This creates:
 * 1. Default appointment types for each clinic
 * 2. Sample appointments for testing (standard/full mode only)
 * 3. Emergency protocols and FAQs
 * 4. Reminder templates
 * 5. After-hours settings
 * 6. Sample emergencies, on-call schedules, and reminders (standard/full mode)
 * 7. Waitlist entries, cancellations, and patient risk scores (standard/full mode)
 */
export async function seedBooking(ctx: SeedContext): Promise<void> {
  const { db, config, idTracker, logger } = ctx;
  const clinicIds = idTracker.getAll('Clinic');

  logger.startArea('Booking');

  let totalTypesCreated = 0;
  let totalAppointmentsCreated = 0;
  let totalEmergencyDataCreated = 0;

  // ============================================================================
  // 1. SEED APPOINTMENT TYPES FOR EACH CLINIC
  // ============================================================================
  for (const clinicId of clinicIds) {
    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    logger.info(`Seeding appointment types for clinic: ${clinic?.name || clinicId}`);

    // Get a user from this clinic to use as createdBy
    const adminUser = await db.user.findFirst({
      where: { clinicId, role: { in: ['clinic_admin', 'super_admin'] } },
    });
    const createdBy = adminUser?.id;

    for (const typeData of DEFAULT_APPOINTMENT_TYPES) {
      // Check if type already exists for this clinic
      const existingType = await db.appointmentType.findFirst({
        where: { clinicId, code: typeData.code },
      });

      if (!existingType) {
        const appointmentType = await db.appointmentType.create({
          data: {
            clinicId,
            code: typeData.code,
            name: typeData.name,
            description: typeData.description,
            defaultDuration: typeData.defaultDuration,
            minDuration: typeData.minDuration,
            maxDuration: typeData.maxDuration,
            color: typeData.color,
            icon: typeData.icon,
            requiresChair: typeData.requiresChair,
            requiresRoom: typeData.requiresRoom,
            prepTime: typeData.prepTime,
            cleanupTime: typeData.cleanupTime,
            isActive: typeData.isActive,
            allowOnline: typeData.allowOnline,
            sortOrder: typeData.sortOrder,
            createdBy,
          },
        });
        idTracker.add('AppointmentType', appointmentType.id);
        totalTypesCreated++;
      } else {
        idTracker.add('AppointmentType', existingType.id);
      }
    }

    logger.info(`  Created ${DEFAULT_APPOINTMENT_TYPES.length} appointment types`);

    // ============================================================================
    // 2. SEED EMERGENCY PROTOCOLS FOR EACH CLINIC
    // ============================================================================
    logger.info(`  Seeding emergency protocols for clinic: ${clinic?.name || clinicId}`);

    for (const protocolData of DEFAULT_EMERGENCY_PROTOCOLS) {
      const existingProtocol = await db.emergencyProtocol.findFirst({
        where: { clinicId, emergencyType: protocolData.emergencyType },
      });

      if (!existingProtocol) {
        const protocol = await db.emergencyProtocol.create({
          data: {
            clinicId,
            emergencyType: protocolData.emergencyType,
            name: protocolData.name,
            description: protocolData.description,
            typicalSeverity: protocolData.typicalSeverity,
            maxWaitDays: protocolData.maxWaitDays,
            triageQuestions: protocolData.triageQuestions,
            selfCareInstructions: protocolData.selfCareInstructions,
            whenToCall: protocolData.whenToCall,
            whenToSeekER: protocolData.whenToSeekER,
            isActive: protocolData.isActive,
            updatedBy: createdBy,
          },
        });
        idTracker.add('EmergencyProtocol', protocol.id);
        totalEmergencyDataCreated++;
      }
    }

    logger.info(`  Created ${DEFAULT_EMERGENCY_PROTOCOLS.length} emergency protocols`);

    // ============================================================================
    // 3. SEED REMINDER TEMPLATES FOR EACH CLINIC
    // ============================================================================
    logger.info(`  Seeding reminder templates for clinic: ${clinic?.name || clinicId}`);

    for (const templateData of DEFAULT_REMINDER_TEMPLATES) {
      const existingTemplate = await db.reminderTemplate.findFirst({
        where: { clinicId, name: templateData.name },
      });

      if (!existingTemplate) {
        const template = await db.reminderTemplate.create({
          data: {
            clinicId,
            name: templateData.name,
            channel: templateData.channel,
            type: templateData.type,
            subject: templateData.subject,
            body: templateData.body,
            includeCalendarLink: templateData.includeCalendarLink,
            includeDirections: templateData.includeDirections,
            includeConfirmLink: templateData.includeConfirmLink,
            includeCancelLink: templateData.includeCancelLink,
            isActive: templateData.isActive,
            isDefault: templateData.isDefault,
            createdBy,
          },
        });
        idTracker.add('ReminderTemplate', template.id);
        totalEmergencyDataCreated++;
      }
    }

    logger.info(`  Created ${DEFAULT_REMINDER_TEMPLATES.length} reminder templates`);

    // ============================================================================
    // 4. SEED AFTER-HOURS SETTINGS FOR EACH CLINIC
    // ============================================================================
    const existingSettings = await db.afterHoursSettings.findFirst({
      where: { clinicId },
    });

    if (!existingSettings) {
      await db.afterHoursSettings.create({
        data: {
          clinicId,
          weekdayOpen: DEFAULT_AFTER_HOURS_SETTINGS.weekdayOpen,
          weekdayClose: DEFAULT_AFTER_HOURS_SETTINGS.weekdayClose,
          saturdayOpen: DEFAULT_AFTER_HOURS_SETTINGS.saturdayOpen,
          saturdayClose: DEFAULT_AFTER_HOURS_SETTINGS.saturdayClose,
          sundayOpen: DEFAULT_AFTER_HOURS_SETTINGS.sundayOpen,
          sundayClose: DEFAULT_AFTER_HOURS_SETTINGS.sundayClose,
          afterHoursPhone: DEFAULT_AFTER_HOURS_SETTINGS.afterHoursPhone,
          answeringServicePhone: DEFAULT_AFTER_HOURS_SETTINGS.answeringServicePhone,
          emergencyLinePhone: DEFAULT_AFTER_HOURS_SETTINGS.emergencyLinePhone,
          smsAutoReply: DEFAULT_AFTER_HOURS_SETTINGS.smsAutoReply,
          emailAutoReply: DEFAULT_AFTER_HOURS_SETTINGS.emailAutoReply,
          voicemailGreeting: DEFAULT_AFTER_HOURS_SETTINGS.voicemailGreeting,
          emergencyKeywords: DEFAULT_AFTER_HOURS_SETTINGS.emergencyKeywords,
          urgentResponseMinutes: DEFAULT_AFTER_HOURS_SETTINGS.urgentResponseMinutes,
          routineResponseHours: DEFAULT_AFTER_HOURS_SETTINGS.routineResponseHours,
          updatedBy: createdBy,
        },
      });
      totalEmergencyDataCreated++;
      logger.info(`  Created after-hours settings`);
    }

    // ============================================================================
    // 5. SEED EMERGENCY FAQs FOR EACH CLINIC
    // ============================================================================
    logger.info(`  Seeding emergency FAQs for clinic: ${clinic?.name || clinicId}`);

    for (const faqData of DEFAULT_EMERGENCY_FAQS) {
      const existingFaq = await db.emergencyFAQ.findFirst({
        where: { clinicId, question: faqData.question },
      });

      if (!existingFaq) {
        const faq = await db.emergencyFAQ.create({
          data: {
            clinicId,
            category: faqData.category,
            question: faqData.question,
            answer: faqData.answer,
            emergencyType: faqData.emergencyType,
            displayOrder: faqData.displayOrder,
            isPublished: faqData.isPublished,
            createdBy,
          },
        });
        idTracker.add('EmergencyFAQ', faq.id);
        totalEmergencyDataCreated++;
      }
    }

    logger.info(`  Created ${DEFAULT_EMERGENCY_FAQS.length} emergency FAQs`);
  }

  // ============================================================================
  // 6. SEED SAMPLE APPOINTMENTS (only in standard/full mode)
  // ============================================================================
  if (config.mode !== 'minimal') {
    logger.info('Seeding sample appointments...');

    // For the primary clinic, create sample appointments
    const primaryClinicId = clinicIds[0];

    if (primaryClinicId) {
      // Get patients from this clinic (not soft-deleted)
      // Note: MongoDB requires OR with isSet:false for null checks
      const patients = await db.patient.findMany({
        where: {
          clinicId: primaryClinicId,
          OR: [{ deletedAt: { isSet: false } }, { deletedAt: null }],
        },
        take: 20,
        select: { id: true },
      });

      // Get providers (staff with provider role) from this clinic
      const providers = await db.staffProfile.findMany({
        where: {
          clinicId: primaryClinicId,
          status: 'ACTIVE',
          providerType: { not: null },
        },
        take: 5,
        select: { id: true, firstName: true, lastName: true },
      });

      // Get chairs from this clinic
      const chairs = await db.treatmentChair.findMany({
        where: {
          room: { clinicId: primaryClinicId },
        },
        take: 10,
        select: { id: true },
      });

      // Get appointment types for this clinic
      const appointmentTypes = await db.appointmentType.findMany({
        where: { clinicId: primaryClinicId, isActive: true },
        select: { id: true, code: true },
      });

      logger.info(`  Found: ${patients.length} patients, ${providers.length} providers, ${appointmentTypes.length} types, ${chairs.length} chairs`);

      if (patients.length > 0 && providers.length > 0 && appointmentTypes.length > 0) {
        const patientIds = patients.map((p) => p.id);
        const providerIds = providers.map((p) => p.id);
        const providerNames = providers.map((p) => `${p.firstName} ${p.lastName}`);
        const chairIds = chairs.map((c) => c.id);
        const appointmentTypeMap = new Map(appointmentTypes.map((t) => [t.code, t.id]));

        // Get a booking user (front desk or admin)
        const bookingUser = await db.user.findFirst({
          where: {
            clinicId: primaryClinicId,
            role: { in: ['front_desk', 'clinic_admin', 'super_admin'] },
          },
        });

        const sampleAppointments = generateSampleAppointments(
          patientIds,
          providerIds,
          appointmentTypeMap,
          chairIds
        );

        const createdAppointments: Array<{ id: string; patientId: string }> = [];

        for (const apptData of sampleAppointments) {
          // Calculate end time
          const endTime = new Date(apptData.startTime.getTime() + apptData.duration * 60 * 1000);

          // Check for conflicts before creating
          // Note: MongoDB null check requires AND + OR combination
          const conflict = await db.appointment.findFirst({
            where: {
              providerId: apptData.providerId,
              status: { notIn: ['CANCELLED', 'NO_SHOW'] },
              AND: [
                { OR: [{ deletedAt: { isSet: false } }, { deletedAt: null }] },
                {
                  OR: [
                    {
                      startTime: { lte: apptData.startTime },
                      endTime: { gt: apptData.startTime },
                    },
                    {
                      startTime: { lt: endTime },
                      endTime: { gte: endTime },
                    },
                  ],
                },
              ],
            },
          });

          if (!conflict) {
            const appointment = await db.appointment.create({
              data: {
                clinicId: primaryClinicId,
                patientId: apptData.patientId,
                providerId: apptData.providerId,
                appointmentTypeId: apptData.appointmentTypeId,
                chairId: apptData.chairId,
                startTime: apptData.startTime,
                endTime,
                duration: apptData.duration,
                status: apptData.status,
                confirmationStatus: apptData.status === 'CONFIRMED' ? 'CONFIRMED' : 'UNCONFIRMED',
                source: apptData.source,
                bookedBy: bookingUser?.id || providerIds[0],
                notes: apptData.notes,
              },
            });
            idTracker.add('Appointment', appointment.id);
            createdAppointments.push({ id: appointment.id, patientId: apptData.patientId });
            totalAppointmentsCreated++;
          }
        }

        logger.info(`  Created ${totalAppointmentsCreated} sample appointments`);

        // ============================================================================
        // 7. SEED SAMPLE EMERGENCY DATA (only in standard/full mode)
        // ============================================================================
        logger.info('  Seeding sample emergency appointments...');

        const sampleEmergencies = generateSampleEmergencies(patientIds, providerIds);

        for (const emergencyData of sampleEmergencies) {
          const emergency = await db.emergencyAppointment.create({
            data: {
              clinicId: primaryClinicId,
              patientId: emergencyData.patientId,
              patientName: emergencyData.patientName,
              patientPhone: emergencyData.patientPhone,
              emergencyType: emergencyData.emergencyType,
              severity: emergencyData.severity,
              triageStatus: emergencyData.triageStatus,
              description: emergencyData.description,
              symptoms: emergencyData.symptoms,
              requestChannel: emergencyData.requestChannel,
              requestedAt: emergencyData.requestedAt,
              resolution: emergencyData.resolution,
              resolvedAt: emergencyData.resolvedAt,
              resolutionNotes: emergencyData.resolutionNotes,
            },
          });
          idTracker.add('EmergencyAppointment', emergency.id);
          totalEmergencyDataCreated++;
        }

        logger.info(`  Created ${sampleEmergencies.length} sample emergencies`);

        // ============================================================================
        // 8. SEED ON-CALL SCHEDULES (only in standard/full mode)
        // ============================================================================
        logger.info('  Seeding on-call schedules...');

        const onCallSchedules = generateOnCallSchedules(providerIds, providerNames);

        for (const scheduleData of onCallSchedules) {
          const schedule = await db.onCallSchedule.create({
            data: {
              clinicId: primaryClinicId,
              providerId: scheduleData.providerId,
              providerName: scheduleData.providerName,
              startDate: scheduleData.startDate,
              endDate: scheduleData.endDate,
              startTime: scheduleData.startTime,
              endTime: scheduleData.endTime,
              type: scheduleData.type,
              status: scheduleData.status,
              notes: scheduleData.notes,
              createdBy: scheduleData.createdBy,
            },
          });
          idTracker.add('OnCallSchedule', schedule.id);
          totalEmergencyDataCreated++;
        }

        logger.info(`  Created ${onCallSchedules.length} on-call schedules`);

        // ============================================================================
        // 9. SEED SAMPLE REMINDERS (only in standard/full mode)
        // ============================================================================
        logger.info('  Seeding sample reminders...');

        const reminderTemplates = await db.reminderTemplate.findMany({
          where: { clinicId: primaryClinicId, isActive: true },
          take: 1,
        });

        if (reminderTemplates.length > 0 && createdAppointments.length > 0) {
          const sampleReminders = generateSampleReminders(createdAppointments, reminderTemplates[0].id);

          for (const reminderData of sampleReminders) {
            const reminder = await db.appointmentReminder.create({
              data: {
                clinicId: primaryClinicId,
                appointmentId: reminderData.appointmentId,
                patientId: reminderData.patientId,
                templateId: reminderData.templateId,
                channel: reminderData.channel,
                reminderType: reminderData.reminderType,
                status: reminderData.status,
                scheduledFor: reminderData.scheduledFor,
                sentAt: reminderData.sentAt,
                deliveredAt: reminderData.deliveredAt,
                responseType: reminderData.responseType,
                respondedAt: reminderData.respondedAt,
              },
            });
            idTracker.add('AppointmentReminder', reminder.id);
            totalEmergencyDataCreated++;
          }

          logger.info(`  Created ${sampleReminders.length} sample reminders`);
        }

        // ============================================================================
        // 10. SEED SAMPLE AFTER-HOURS MESSAGES (only in standard/full mode)
        // ============================================================================
        logger.info('  Seeding sample after-hours messages...');

        const afterHoursMessages = generateSampleAfterHoursMessages(patientIds);

        for (const messageData of afterHoursMessages) {
          const message = await db.afterHoursMessage.create({
            data: {
              clinicId: primaryClinicId,
              patientId: messageData.patientId,
              callerName: messageData.callerName,
              callerPhone: messageData.callerPhone,
              messageType: messageData.messageType,
              urgency: messageData.urgency,
              routing: messageData.routing,
              status: messageData.status,
              message: messageData.message,
              receivedAt: messageData.receivedAt,
            },
          });
          idTracker.add('AfterHoursMessage', message.id);
          totalEmergencyDataCreated++;
        }

        logger.info(`  Created ${afterHoursMessages.length} after-hours messages`);

        // ============================================================================
        // 11. SEED WAITLIST ENTRIES (only in standard/full mode)
        // ============================================================================
        logger.info('  Seeding waitlist entries...');

        const appointmentTypeIds = appointmentTypes.map((t) => t.id);
        const waitlistEntries = generateWaitlistEntries(
          patientIds,
          appointmentTypeIds,
          providerIds,
          bookingUser?.id || providerIds[0]
        );

        let waitlistCount = 0;
        for (const entryData of waitlistEntries) {
          const entry = await db.waitlistEntry.create({
            data: {
              clinicId: primaryClinicId,
              patientId: entryData.patientId,
              appointmentTypeId: entryData.appointmentTypeId,
              priority: entryData.priority,
              status: entryData.status,
              preferredProviderId: entryData.preferredProviderId,
              dateRangeStart: entryData.dateRangeStart,
              dateRangeEnd: entryData.dateRangeEnd,
              preferredTimes: entryData.preferredTimes,
              preferredDays: entryData.preferredDays,
              notes: entryData.notes,
              reasonForWaitlist: entryData.reasonForWaitlist,
              expiresAt: entryData.expiresAt,
              addedBy: entryData.addedBy,
              notificationsSent: entryData.notificationsSent,
              lastNotifiedAt: entryData.lastNotifiedAt,
            },
          });
          idTracker.add('WaitlistEntry', entry.id);
          waitlistCount++;
        }

        logger.info(`  Created ${waitlistCount} waitlist entries`);

        // ============================================================================
        // 12. SEED CANCELLATION RECORDS (only in standard/full mode)
        // ============================================================================
        logger.info('  Seeding cancellation records...');

        // Get some appointments that we can use for cancellation records
        const appointmentsForCancellation = await db.appointment.findMany({
          where: {
            clinicId: primaryClinicId,
            status: { in: ['CANCELLED', 'NO_SHOW'] },
          },
          take: 10,
          select: { id: true, patientId: true, providerId: true, appointmentTypeId: true, startTime: true, endTime: true },
        });

        const cancellationData = generateCancellations(
          patientIds,
          appointmentTypeIds,
          providerIds,
          bookingUser?.id || providerIds[0]
        );

        let cancellationCount = 0;
        for (let i = 0; i < cancellationData.length; i++) {
          const cancelData = cancellationData[i];
          // Use actual appointment if available, otherwise use the placeholder
          const actualAppointment = appointmentsForCancellation[i % appointmentsForCancellation.length];

          const cancellation = await db.appointmentCancellation.create({
            data: {
              clinicId: primaryClinicId,
              appointmentId: actualAppointment?.id || createdAppointments[i % createdAppointments.length]?.id,
              patientId: actualAppointment?.patientId || cancelData.patientId,
              cancellationType: cancelData.cancellationType,
              cancelledBy: cancelData.cancelledBy,
              cancelledByType: cancelData.cancelledByType,
              originalStartTime: actualAppointment?.startTime || cancelData.originalStartTime,
              originalEndTime: actualAppointment?.endTime || cancelData.originalEndTime,
              originalProviderId: actualAppointment?.providerId || cancelData.originalProviderId,
              appointmentTypeId: actualAppointment?.appointmentTypeId || cancelData.appointmentTypeId,
              reason: cancelData.reason,
              reasonDetails: cancelData.reasonDetails,
              noticeHours: cancelData.noticeHours,
              isLateCancel: cancelData.isLateCancel,
              lateCancelFee: cancelData.lateCancelFee,
              feeWaived: cancelData.feeWaived,
              feeWaivedReason: cancelData.feeWaivedReason,
              recoveryStatus: cancelData.recoveryStatus,
              recoveryAttempts: cancelData.recoveryAttempts,
              lastRecoveryAttemptAt: cancelData.lastRecoveryAttemptAt,
              recoveryNotes: cancelData.recoveryNotes,
            },
          });
          idTracker.add('AppointmentCancellation', cancellation.id);
          cancellationCount++;
        }

        logger.info(`  Created ${cancellationCount} cancellation records`);

        // ============================================================================
        // 13. SEED PATIENT RISK SCORES (only in standard/full mode)
        // ============================================================================
        logger.info('  Seeding patient risk scores...');

        const riskScoreData = generateRiskScores(patientIds);

        let riskScoreCount = 0;
        for (const riskData of riskScoreData) {
          const riskScore = await db.patientRiskScore.create({
            data: {
              clinicId: primaryClinicId,
              patientId: riskData.patientId,
              riskScore: riskData.riskScore,
              riskLevel: riskData.riskLevel,
              riskFactors: riskData.riskFactors,
              recommendedActions: riskData.recommendedActions,
              status: riskData.status,
              interventionStatus: riskData.interventionStatus,
              interventionNotes: riskData.interventionNotes,
              noShowCount: riskData.noShowCount,
              cancelCount: riskData.cancelCount,
              missedInRowCount: riskData.missedInRowCount,
              daysSinceLastVisit: riskData.daysSinceLastVisit,
              totalAppointments: riskData.totalAppointments,
            },
          });
          idTracker.add('PatientRiskScore', riskScore.id);
          riskScoreCount++;
        }

        logger.info(`  Created ${riskScoreCount} patient risk scores`);

        // ============================================================================
        // 14. SEED PROVIDER SCHEDULES (only in standard/full mode)
        // ============================================================================
        logger.info('  Seeding provider schedules...');

        let providerScheduleCount = 0;
        for (let i = 0; i < providers.length; i++) {
          const provider = providers[i];
          // Alternate between regular and extended schedules
          const scheduleTemplate = i % 3 === 0 ? EXTENDED_SCHEDULES : DEFAULT_WEEKDAY_SCHEDULES;

          for (const scheduleData of scheduleTemplate) {
            // Check if schedule already exists
            const existingSchedule = await db.providerSchedule.findFirst({
              where: {
                clinicId: primaryClinicId,
                providerId: provider.id,
                dayOfWeek: scheduleData.dayOfWeek,
              },
            });

            if (!existingSchedule) {
              await db.providerSchedule.create({
                data: {
                  clinicId: primaryClinicId,
                  providerId: provider.id,
                  dayOfWeek: scheduleData.dayOfWeek,
                  startTime: scheduleData.startTime,
                  endTime: scheduleData.endTime,
                  isWorkingDay: scheduleData.isWorkingDay,
                  lunchStartTime: scheduleData.lunchStartTime,
                  lunchEndTime: scheduleData.lunchEndTime,
                  autoBlockLunch: scheduleData.autoBlockLunch,
                  createdBy: bookingUser?.id || providerIds[0],
                },
              });
              providerScheduleCount++;
            }
          }
        }

        logger.info(`  Created ${providerScheduleCount} provider schedules`);

        // ============================================================================
        // 15. SEED SCHEDULE BLOCKS (only in standard/full mode)
        // ============================================================================
        logger.info('  Seeding schedule blocks...');

        let scheduleBlockCount = 0;
        // Create schedule blocks for the first provider
        if (providers.length > 0) {
          const scheduleBlocksData = generateScheduleBlocks(
            primaryClinicId,
            providers[0].id,
            bookingUser?.id || providerIds[0]
          );

          for (const blockData of scheduleBlocksData) {
            const block = await db.scheduleBlock.create({
              data: blockData,
            });
            idTracker.add('ScheduleBlock', block.id);
            scheduleBlockCount++;
          }
        }

        logger.info(`  Created ${scheduleBlockCount} schedule blocks`);

        // ============================================================================
        // 16. SEED BOOKING TEMPLATES (only in standard/full mode)
        // ============================================================================
        logger.info('  Seeding booking templates...');

        let bookingTemplateCount = 0;
        for (const templateData of DEFAULT_BOOKING_TEMPLATES) {
          const existingTemplate = await db.bookingTemplate.findFirst({
            where: {
              clinicId: primaryClinicId,
              name: templateData.name,
            },
          });

          if (!existingTemplate) {
            const template = await db.bookingTemplate.create({
              data: {
                clinicId: primaryClinicId,
                name: templateData.name,
                description: templateData.description,
                templateType: templateData.templateType,
                slots: templateData.slots,
                isActive: true,
                isDefault: templateData.name === 'Standard Day',
                createdBy: bookingUser?.id || providerIds[0],
              },
            });
            idTracker.add('BookingTemplate', template.id);
            bookingTemplateCount++;
          }
        }

        logger.info(`  Created ${bookingTemplateCount} booking templates`);

        // ============================================================================
        // 17. SEED RECURRING APPOINTMENTS (only in standard/full mode)
        // ============================================================================
        logger.info('  Seeding recurring appointments...');

        const recurringData = generateRecurringAppointments(
          primaryClinicId,
          patientIds,
          providerIds,
          appointmentTypeMap,
          bookingUser?.id || providerIds[0]
        );

        let recurringCount = 0;
        for (const recurring of recurringData) {
          // Skip if no appointment type ID
          if (!recurring.appointmentTypeId) {
            logger.info(`  Skipping recurring series - no appointment type found`);
            continue;
          }

          const recurringAppt = await db.recurringAppointment.create({
            data: {
              ...recurring,
              appointmentTypeId: recurring.appointmentTypeId, // Ensure non-undefined
            },
          });
          idTracker.add('RecurringAppointment', recurringAppt.id);

          // Generate a few sample occurrences for each recurring series
          const occurrenceDate = new Date(recurring.startDate);
          for (let j = 0; j < 3; j++) {
            occurrenceDate.setDate(occurrenceDate.getDate() + (recurring.interval * 7));

            await db.recurringOccurrence.create({
              data: {
                clinicId: primaryClinicId,
                recurringId: recurringAppt.id,
                occurrenceNumber: j + 1,
                scheduledDate: new Date(occurrenceDate),
                scheduledTime: recurring.preferredTime,
                status: j === 0 ? 'SCHEDULED' : 'PENDING',
              },
            });
          }

          recurringCount++;
        }

        logger.info(`  Created ${recurringCount} recurring appointment series with occurrences`);
      } else {
        logger.info('  Skipping appointments - missing required data (patients, providers, or types)');
      }
    }
  }

  logger.endArea('Booking', totalTypesCreated + totalAppointmentsCreated + totalEmergencyDataCreated);
}

/**
 * Clear booking data
 * Removes appointments, appointment types, and all emergency/reminder data
 */
export async function clearBooking(ctx: SeedContext): Promise<void> {
  const { db, logger } = ctx;

  logger.info('Clearing booking data...');

  // Delete in reverse dependency order

  // Advanced Scheduling data (Phase 3)
  await db.recurringOccurrence.deleteMany({});
  logger.info('  Cleared recurring occurrences');

  await db.recurringAppointment.deleteMany({});
  logger.info('  Cleared recurring appointments');

  await db.templateApplication.deleteMany({});
  logger.info('  Cleared template applications');

  await db.bookingTemplate.deleteMany({});
  logger.info('  Cleared booking templates');

  await db.scheduleBlock.deleteMany({});
  logger.info('  Cleared schedule blocks');

  await db.providerSchedule.deleteMany({});
  logger.info('  Cleared provider schedules');

  // Waitlist & Recovery data
  await db.patientRiskScore.deleteMany({});
  logger.info('  Cleared patient risk scores');

  await db.appointmentCancellation.deleteMany({});
  logger.info('  Cleared appointment cancellations');

  await db.waitlistEntry.deleteMany({});
  logger.info('  Cleared waitlist entries');

  // Emergency & Reminders data
  await db.afterHoursMessage.deleteMany({});
  logger.info('  Cleared after-hours messages');

  await db.appointmentReminder.deleteMany({});
  logger.info('  Cleared appointment reminders');

  await db.reminderSequenceStep.deleteMany({});
  logger.info('  Cleared reminder sequence steps');

  await db.reminderSequence.deleteMany({});
  logger.info('  Cleared reminder sequences');

  await db.reminderTemplate.deleteMany({});
  logger.info('  Cleared reminder templates');

  await db.onCallSwapRequest.deleteMany({});
  logger.info('  Cleared on-call swap requests');

  await db.onCallSchedule.deleteMany({});
  logger.info('  Cleared on-call schedules');

  await db.emergencyAppointment.deleteMany({});
  logger.info('  Cleared emergency appointments');

  await db.emergencyFAQ.deleteMany({});
  logger.info('  Cleared emergency FAQs');

  await db.emergencyProtocol.deleteMany({});
  logger.info('  Cleared emergency protocols');

  await db.afterHoursSettings.deleteMany({});
  logger.info('  Cleared after-hours settings');

  // Core booking data
  await db.appointment.deleteMany({});
  logger.info('  Cleared appointments');

  await db.appointmentType.deleteMany({});
  logger.info('  Cleared appointment types');
}

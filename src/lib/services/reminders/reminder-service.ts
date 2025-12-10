/**
 * Appointment Reminder Service
 *
 * Handles scheduling, processing, and sending appointment reminders.
 * Integrates with the MessagingService for actual message delivery.
 *
 * Features:
 * - Schedule reminders when appointments are booked
 * - Process due reminders via cron job
 * - Support for reminder sequences (48h email, 24h SMS, 2h SMS)
 * - Skip logic for confirmed/cancelled appointments
 * - Confirmation tracking and response handling
 */

import { db } from '@/lib/db';
import { getMessagingService } from '../messaging';
import { format, addHours, subHours, isAfter, isBefore } from 'date-fns';
import type {
  ReminderChannel,
  ReminderType,
  ReminderTiming,
  ScheduleReminderResult,
  ProcessRemindersResult,
  ReminderVariables,
} from './types';
import { DEFAULT_REMINDER_SEQUENCE } from './types';

/**
 * Appointment Reminder Service Class
 */
class AppointmentReminderService {
  /**
   * Schedule reminders for a newly booked appointment
   *
   * Creates reminder records for the default sequence based on appointment time.
   */
  async scheduleRemindersForAppointment(
    appointmentId: string,
    sequence?: ReminderTiming[]
  ): Promise<ScheduleReminderResult[]> {
    const results: ScheduleReminderResult[] = [];
    const reminderSequence = sequence || DEFAULT_REMINDER_SEQUENCE;

    try {
      // Get appointment details
      const appointment = await db.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          clinic: {
            select: {
              id: true,
              name: true,
            },
          },
          appointmentType: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!appointment) {
        return [
          {
            success: false,
            error: { code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found' },
          },
        ];
      }

      // Don't schedule reminders for cancelled or completed appointments
      if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
        return [
          {
            success: false,
            error: { code: 'INVALID_STATUS', message: 'Cannot schedule reminders for this appointment status' },
          },
        ];
      }

      const now = new Date();

      // Schedule each reminder in the sequence
      for (const timing of reminderSequence) {
        const scheduledFor = subHours(appointment.startTime, timing.hoursBefore);

        // Skip if scheduled time is in the past
        if (isBefore(scheduledFor, now)) {
          results.push({
            success: false,
            error: {
              code: 'TIME_PASSED',
              message: `Reminder time (${timing.hoursBefore}h before) has already passed`,
            },
          });
          continue;
        }

        // Check if patient has required contact info
        if (timing.channel === 'SMS' && !appointment.patient.phone) {
          results.push({
            success: false,
            error: { code: 'NO_PHONE', message: 'Patient has no phone number for SMS' },
          });
          continue;
        }

        if (timing.channel === 'EMAIL' && !appointment.patient.email) {
          results.push({
            success: false,
            error: { code: 'NO_EMAIL', message: 'Patient has no email address' },
          });
          continue;
        }

        // Check for existing reminder at same time and channel
        const existingReminder = await db.appointmentReminder.findFirst({
          where: {
            appointmentId,
            channel: timing.channel,
            scheduledFor,
            status: { in: ['SCHEDULED', 'SENDING'] },
          },
        });

        if (existingReminder) {
          results.push({
            success: true,
            reminderId: existingReminder.id,
            scheduledFor,
          });
          continue;
        }

        // Create the reminder
        const reminder = await db.appointmentReminder.create({
          data: {
            clinicId: appointment.clinicId,
            appointmentId,
            patientId: appointment.patientId,
            channel: timing.channel,
            reminderType: timing.type,
            scheduledFor,
            status: 'SCHEDULED',
          },
        });

        results.push({
          success: true,
          reminderId: reminder.id,
          scheduledFor,
        });
      }

      console.log(
        `[ReminderService] Scheduled ${results.filter((r) => r.success).length} reminders for appointment ${appointmentId}`
      );
    } catch (error) {
      console.error('[ReminderService] Error scheduling reminders:', error);
      results.push({
        success: false,
        error: {
          code: 'SCHEDULE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }

    return results;
  }

  /**
   * Cancel all pending reminders for an appointment
   *
   * Called when an appointment is cancelled or rescheduled.
   */
  async cancelRemindersForAppointment(appointmentId: string): Promise<number> {
    const result = await db.appointmentReminder.updateMany({
      where: {
        appointmentId,
        status: { in: ['SCHEDULED', 'SENDING'] },
      },
      data: {
        status: 'CANCELLED',
      },
    });

    console.log(`[ReminderService] Cancelled ${result.count} reminders for appointment ${appointmentId}`);
    return result.count;
  }

  /**
   * Process due reminders
   *
   * Called by cron job to find and send reminders that are due.
   */
  async processDueReminders(): Promise<ProcessRemindersResult> {
    const result: ProcessRemindersResult = {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    const now = new Date();

    try {
      // Find reminders that are due (scheduled for now or earlier)
      const dueReminders = await db.appointmentReminder.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledFor: { lte: now },
        },
        include: {
          appointment: {
            include: {
              patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
              provider: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
              appointmentType: {
                select: {
                  name: true,
                },
              },
              clinic: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  address: true,
                },
              },
            },
          },
        },
        take: 100, // Process in batches
        orderBy: { scheduledFor: 'asc' },
      });

      console.log(`[ReminderService] Processing ${dueReminders.length} due reminders`);

      for (const reminder of dueReminders) {
        result.processed++;

        // Mark as sending
        await db.appointmentReminder.update({
          where: { id: reminder.id },
          data: { status: 'SENDING' },
        });

        // Check if should skip
        const skipReason = this.shouldSkipReminder(reminder);
        if (skipReason) {
          await db.appointmentReminder.update({
            where: { id: reminder.id },
            data: {
              status: 'SKIPPED',
              failureReason: skipReason,
            },
          });
          result.skipped++;
          continue;
        }

        // Build message content
        const variables = this.buildVariables(reminder);
        const content = this.buildMessageContent(reminder.reminderType, reminder.channel, variables);

        // Send the reminder
        const sendResult = await this.sendReminder(reminder, content, variables);

        if (sendResult.success) {
          await db.appointmentReminder.update({
            where: { id: reminder.id },
            data: {
              status: 'SENT',
              sentAt: now,
              contentSent: content.body,
              externalMessageId: sendResult.messageId,
            },
          });
          result.sent++;
        } else {
          await db.appointmentReminder.update({
            where: { id: reminder.id },
            data: {
              status: 'FAILED',
              failureReason: sendResult.error,
              retryCount: { increment: 1 },
            },
          });
          result.failed++;
          result.errors.push({
            reminderId: reminder.id,
            error: sendResult.error || 'Unknown error',
          });
        }
      }
    } catch (error) {
      console.error('[ReminderService] Error processing reminders:', error);
    }

    console.log('[ReminderService] Processing complete:', result);
    return result;
  }

  /**
   * Process confirmation responses
   *
   * Called when a patient responds to a confirmation request via SMS/email.
   */
  async processConfirmationResponse(
    appointmentId: string,
    response: 'CONFIRMED' | 'DECLINED' | 'RESCHEDULE_REQUESTED',
    responseText?: string
  ): Promise<boolean> {
    try {
      const now = new Date();

      // Update appointment confirmation status
      if (response === 'CONFIRMED') {
        await db.appointment.update({
          where: { id: appointmentId },
          data: {
            confirmationStatus: 'CONFIRMED',
            confirmedAt: now,
            confirmedBy: 'patient',
          },
        });
      } else if (response === 'DECLINED') {
        await db.appointment.update({
          where: { id: appointmentId },
          data: {
            confirmationStatus: 'DECLINED',
            status: 'CANCELLED',
            cancelledAt: now,
            cancellationReason: 'Patient declined via reminder',
          },
        });

        // Cancel remaining reminders
        await this.cancelRemindersForAppointment(appointmentId);
      }

      // Update the most recent reminder with the response
      const latestReminder = await db.appointmentReminder.findFirst({
        where: {
          appointmentId,
          reminderType: 'CONFIRMATION',
          status: { in: ['SENT', 'DELIVERED'] },
        },
        orderBy: { sentAt: 'desc' },
      });

      if (latestReminder) {
        await db.appointmentReminder.update({
          where: { id: latestReminder.id },
          data: {
            responseType: response,
            respondedAt: now,
            responseRaw: responseText,
          },
        });
      }

      return true;
    } catch (error) {
      console.error('[ReminderService] Error processing confirmation:', error);
      return false;
    }
  }

  /**
   * Retry failed reminders
   */
  async retryFailedReminders(): Promise<{ retried: number; succeeded: number }> {
    const MAX_RETRIES = 3;
    let retried = 0;
    let succeeded = 0;

    try {
      // Find failed reminders eligible for retry
      const failedReminders = await db.appointmentReminder.findMany({
        where: {
          status: 'FAILED',
          retryCount: { lt: MAX_RETRIES },
        },
        include: {
          appointment: {
            include: {
              patient: true,
              provider: true,
              appointmentType: true,
              clinic: true,
            },
          },
        },
        take: 50,
      });

      for (const reminder of failedReminders) {
        // Skip if appointment is no longer valid
        if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(reminder.appointment.status)) {
          await db.appointmentReminder.update({
            where: { id: reminder.id },
            data: {
              status: 'SKIPPED',
              failureReason: 'Appointment no longer active',
            },
          });
          continue;
        }

        // Skip if appointment has already passed
        if (isBefore(reminder.appointment.startTime, new Date())) {
          await db.appointmentReminder.update({
            where: { id: reminder.id },
            data: {
              status: 'SKIPPED',
              failureReason: 'Appointment has passed',
            },
          });
          continue;
        }

        retried++;

        const variables = this.buildVariables(reminder);
        const content = this.buildMessageContent(reminder.reminderType, reminder.channel, variables);
        const sendResult = await this.sendReminder(reminder, content, variables);

        if (sendResult.success) {
          await db.appointmentReminder.update({
            where: { id: reminder.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              contentSent: content.body,
              externalMessageId: sendResult.messageId,
            },
          });
          succeeded++;
        } else {
          await db.appointmentReminder.update({
            where: { id: reminder.id },
            data: {
              retryCount: { increment: 1 },
              failureReason: sendResult.error,
            },
          });
        }
      }
    } catch (error) {
      console.error('[ReminderService] Error retrying reminders:', error);
    }

    return { retried, succeeded };
  }

  /**
   * Check if a reminder should be skipped
   */
  private shouldSkipReminder(reminder: {
    reminderType: string;
    appointment: {
      status: string;
      confirmationStatus: string;
      startTime: Date;
    };
  }): string | null {
    const { appointment } = reminder;

    // Skip if appointment cancelled or completed
    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
      return `Appointment status: ${appointment.status}`;
    }

    // Skip if appointment has already passed
    if (isBefore(appointment.startTime, new Date())) {
      return 'Appointment has passed';
    }

    // Skip final reminder if already confirmed (optional based on config)
    if (
      reminder.reminderType === 'FINAL' &&
      appointment.confirmationStatus === 'CONFIRMED'
    ) {
      return 'Already confirmed';
    }

    return null;
  }

  /**
   * Build template variables for a reminder
   */
  private buildVariables(reminder: {
    appointment: {
      startTime: Date;
      duration: number;
      patient: {
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string | null;
      };
      provider: {
        firstName: string;
        lastName: string;
      } | null;
      appointmentType: {
        name: string;
      } | null;
      clinic: {
        name: string;
        phone: string | null;
        address: string | null;
      };
    };
  }): ReminderVariables {
    const { appointment } = reminder;

    return {
      patient: {
        firstName: appointment.patient.firstName,
        lastName: appointment.patient.lastName,
        phone: appointment.patient.phone || undefined,
        email: appointment.patient.email || undefined,
      },
      appointment: {
        date: format(appointment.startTime, 'EEEE, MMMM d, yyyy'),
        time: format(appointment.startTime, 'h:mm a'),
        duration: appointment.duration,
        type: appointment.appointmentType?.name || 'Appointment',
      },
      provider: {
        name: appointment.provider
          ? `Dr. ${appointment.provider.firstName} ${appointment.provider.lastName}`
          : 'Your provider',
      },
      clinic: {
        name: appointment.clinic.name,
        phone: appointment.clinic.phone || undefined,
        address: appointment.clinic.address || undefined,
      },
    };
  }

  /**
   * Build message content based on reminder type
   */
  private buildMessageContent(
    type: string,
    channel: string,
    variables: ReminderVariables
  ): { subject?: string; body: string } {
    const { patient, appointment, provider, clinic } = variables;

    switch (type) {
      case 'STANDARD':
        if (channel === 'EMAIL') {
          return {
            subject: `Appointment Reminder - ${appointment.date}`,
            body: `Hi ${patient.firstName},\n\nThis is a friendly reminder about your upcoming appointment:\n\n` +
              `📅 Date: ${appointment.date}\n` +
              `⏰ Time: ${appointment.time}\n` +
              `👨‍⚕️ Provider: ${provider.name}\n` +
              `📍 Location: ${clinic.name}\n\n` +
              `If you need to reschedule or cancel, please contact us at ${clinic.phone || 'our office'}.\n\n` +
              `We look forward to seeing you!\n\n${clinic.name}`,
          };
        }
        return {
          body: `Hi ${patient.firstName}! Reminder: You have an appointment on ${appointment.date} at ${appointment.time} with ${provider.name} at ${clinic.name}. Questions? Call ${clinic.phone || 'us'}.`,
        };

      case 'CONFIRMATION':
        if (channel === 'EMAIL') {
          return {
            subject: `Please Confirm Your Appointment - ${appointment.date}`,
            body: `Hi ${patient.firstName},\n\nPlease confirm your upcoming appointment:\n\n` +
              `📅 Date: ${appointment.date}\n` +
              `⏰ Time: ${appointment.time}\n` +
              `👨‍⚕️ Provider: ${provider.name}\n\n` +
              `Reply CONFIRM to confirm or CANCEL if you cannot make it.\n\n` +
              `${clinic.name}`,
          };
        }
        return {
          body: `Hi ${patient.firstName}! Please confirm your appt on ${appointment.date} at ${appointment.time}. Reply C to confirm or X to cancel. ${clinic.name}`,
        };

      case 'FINAL':
        return {
          body: `Reminder: Your appointment is TODAY at ${appointment.time} with ${provider.name} at ${clinic.name}. See you soon!`,
        };

      case 'PRE_VISIT':
        if (channel === 'EMAIL') {
          return {
            subject: `Prepare for Your Visit - ${appointment.date}`,
            body: `Hi ${patient.firstName},\n\nYour appointment is coming up! Here's what to know:\n\n` +
              `📅 Date: ${appointment.date}\n` +
              `⏰ Time: ${appointment.time}\n\n` +
              `Please arrive 10 minutes early and bring:\n` +
              `• Valid ID\n` +
              `• Insurance card (if applicable)\n` +
              `• List of current medications\n\n` +
              `${clinic.name}`,
          };
        }
        return {
          body: `Hi ${patient.firstName}! Your appt is ${appointment.date} at ${appointment.time}. Please arrive 10 min early with ID & insurance card. ${clinic.name}`,
        };

      case 'FIRST_VISIT':
        if (channel === 'EMAIL') {
          return {
            subject: `Welcome! Your First Appointment - ${appointment.date}`,
            body: `Hi ${patient.firstName},\n\nWe're excited to meet you! Here's your first appointment info:\n\n` +
              `📅 Date: ${appointment.date}\n` +
              `⏰ Time: ${appointment.time}\n` +
              `👨‍⚕️ Provider: ${provider.name}\n` +
              `📍 Location: ${clinic.name}${clinic.address ? `\n   ${clinic.address}` : ''}\n\n` +
              `Please arrive 15 minutes early to complete paperwork.\n\n` +
              `Questions? Call us at ${clinic.phone || 'our office'}.\n\n` +
              `We look forward to meeting you!\n\n${clinic.name}`,
          };
        }
        return {
          body: `Welcome ${patient.firstName}! Your first visit is ${appointment.date} at ${appointment.time} at ${clinic.name}. Please arrive 15 min early. See you soon!`,
        };

      case 'FOLLOW_UP':
        if (channel === 'EMAIL') {
          return {
            subject: `Thank You for Your Visit - ${clinic.name}`,
            body: `Hi ${patient.firstName},\n\nThank you for visiting us today!\n\n` +
              `We hope everything went well. If you have any questions about your visit ` +
              `or treatment, please don't hesitate to contact us.\n\n` +
              `${clinic.name}\n${clinic.phone || ''}`,
          };
        }
        return {
          body: `Thank you for visiting ${clinic.name} today, ${patient.firstName}! Questions about your visit? Contact us anytime.`,
        };

      default:
        return {
          body: `Reminder: You have an appointment on ${appointment.date} at ${appointment.time} at ${clinic.name}.`,
        };
    }
  }

  /**
   * Send a reminder via the messaging service
   */
  private async sendReminder(
    reminder: {
      id: string;
      clinicId: string;
      patientId: string;
      channel: string;
      appointment: {
        id: string;
        patient: {
          email: string | null;
          phone: string | null;
        };
      };
    },
    content: { subject?: string; body: string },
    variables: ReminderVariables
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const messagingService = getMessagingService();

    try {
      const channel = reminder.channel as 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP';

      const result = await messagingService.sendMessage({
        clinicId: reminder.clinicId,
        patientId: reminder.patientId,
        channel,
        subject: content.subject,
        body: content.body,
        relatedType: 'Appointment',
        relatedId: reminder.appointment.id,
        tags: ['reminder', reminder.channel.toLowerCase()],
        createdBy: 'reminder-service',
      });

      if (result.success) {
        return {
          success: true,
          messageId: result.messageId,
        };
      }

      return {
        success: false,
        error: result.error?.message || 'Failed to send message',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get reminder statistics for a clinic
   */
  async getReminderStats(
    clinicId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    skipped: number;
    confirmationRate: number;
  }> {
    const stats = await db.appointmentReminder.groupBy({
      by: ['status'],
      where: {
        clinicId,
        scheduledFor: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: { id: true },
    });

    const statusCounts = stats.reduce(
      (acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate confirmation rate
    const confirmationReminders = await db.appointmentReminder.count({
      where: {
        clinicId,
        reminderType: 'CONFIRMATION',
        status: { in: ['SENT', 'DELIVERED'] },
        scheduledFor: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const confirmed = await db.appointmentReminder.count({
      where: {
        clinicId,
        reminderType: 'CONFIRMATION',
        responseType: 'CONFIRMED',
        scheduledFor: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    const confirmationRate =
      confirmationReminders > 0 ? Math.round((confirmed / confirmationReminders) * 100) : 0;

    return {
      total,
      sent: statusCounts['SENT'] || 0,
      delivered: statusCounts['DELIVERED'] || 0,
      failed: statusCounts['FAILED'] || 0,
      skipped: statusCounts['SKIPPED'] || 0,
      confirmationRate,
    };
  }
}

// Singleton instance
let reminderService: AppointmentReminderService | null = null;

/**
 * Get reminder service instance
 */
export function getReminderService(): AppointmentReminderService {
  if (!reminderService) {
    reminderService = new AppointmentReminderService();
  }
  return reminderService;
}

// Export the class for testing
export { AppointmentReminderService };

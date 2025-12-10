/**
 * Appointment Hooks for Reminder Integration
 *
 * These functions should be called from appointment API routes
 * to automatically manage reminders when appointments change.
 *
 * Usage in API routes:
 * ```typescript
 * import { onAppointmentCreated, onAppointmentCancelled } from '@/lib/services/reminders/appointment-hooks';
 *
 * // After creating appointment:
 * await onAppointmentCreated(appointment.id);
 *
 * // After cancelling:
 * await onAppointmentCancelled(appointment.id);
 * ```
 */

import { getReminderService } from './reminder-service';
import { CampaignEvents } from '../campaigns';

/**
 * Called when a new appointment is created
 *
 * - Schedules reminder sequence
 * - Emits campaign event
 */
export async function onAppointmentCreated(
  appointmentId: string,
  options?: {
    clinicId?: string;
    patientId?: string;
    appointmentDate?: Date;
    appointmentType?: string;
    providerId?: string;
  }
): Promise<void> {
  try {
    // Schedule reminders
    const service = getReminderService();
    await service.scheduleRemindersForAppointment(appointmentId);

    // Emit campaign event if details provided
    if (options?.clinicId && options?.patientId) {
      CampaignEvents.appointmentBooked(options.clinicId, options.patientId, {
        appointmentId,
        appointmentDate: options.appointmentDate || new Date(),
        appointmentType: options.appointmentType,
        providerId: options.providerId,
      });
    }

    console.log(`[AppointmentHooks] Appointment created: ${appointmentId} - reminders scheduled`);
  } catch (error) {
    console.error('[AppointmentHooks] Error on appointment created:', error);
    // Don't throw - reminder scheduling failure shouldn't block appointment creation
  }
}

/**
 * Called when an appointment is confirmed
 *
 * - Emits campaign event for confirmed appointments
 */
export async function onAppointmentConfirmed(
  appointmentId: string,
  options?: {
    clinicId?: string;
    patientId?: string;
    appointmentDate?: Date;
  }
): Promise<void> {
  try {
    if (options?.clinicId && options?.patientId) {
      CampaignEvents.appointmentConfirmed(options.clinicId, options.patientId, {
        appointmentId,
        appointmentDate: options.appointmentDate || new Date(),
      });
    }

    console.log(`[AppointmentHooks] Appointment confirmed: ${appointmentId}`);
  } catch (error) {
    console.error('[AppointmentHooks] Error on appointment confirmed:', error);
  }
}

/**
 * Called when an appointment is cancelled
 *
 * - Cancels all pending reminders
 * - Emits campaign event
 */
export async function onAppointmentCancelled(
  appointmentId: string,
  options?: {
    clinicId?: string;
    patientId?: string;
    reason?: string;
  }
): Promise<void> {
  try {
    // Cancel all pending reminders
    const service = getReminderService();
    await service.cancelRemindersForAppointment(appointmentId);

    // Emit campaign event
    if (options?.clinicId && options?.patientId) {
      CampaignEvents.appointmentCancelled(options.clinicId, options.patientId, {
        appointmentId,
        reason: options.reason,
      });
    }

    console.log(`[AppointmentHooks] Appointment cancelled: ${appointmentId} - reminders cancelled`);
  } catch (error) {
    console.error('[AppointmentHooks] Error on appointment cancelled:', error);
  }
}

/**
 * Called when an appointment is rescheduled
 *
 * - Cancels old reminders
 * - Schedules new reminders for new time
 */
export async function onAppointmentRescheduled(
  appointmentId: string,
  options?: {
    clinicId?: string;
    patientId?: string;
    oldDate?: Date;
    newDate?: Date;
  }
): Promise<void> {
  try {
    const service = getReminderService();

    // Cancel existing reminders
    await service.cancelRemindersForAppointment(appointmentId);

    // Schedule new reminders
    await service.scheduleRemindersForAppointment(appointmentId);

    console.log(`[AppointmentHooks] Appointment rescheduled: ${appointmentId} - reminders updated`);
  } catch (error) {
    console.error('[AppointmentHooks] Error on appointment rescheduled:', error);
  }
}

/**
 * Called when an appointment is completed
 *
 * - Emits campaign event for follow-up campaigns
 */
export async function onAppointmentCompleted(
  appointmentId: string,
  options?: {
    clinicId?: string;
    patientId?: string;
    notes?: string;
  }
): Promise<void> {
  try {
    if (options?.clinicId && options?.patientId) {
      CampaignEvents.appointmentCompleted(options.clinicId, options.patientId, {
        appointmentId,
        notes: options.notes,
      });
    }

    console.log(`[AppointmentHooks] Appointment completed: ${appointmentId}`);
  } catch (error) {
    console.error('[AppointmentHooks] Error on appointment completed:', error);
  }
}

/**
 * Called when a patient is marked as no-show
 *
 * - Cancels remaining reminders
 * - Emits campaign event for re-engagement
 */
export async function onAppointmentNoShow(
  appointmentId: string,
  options?: {
    clinicId?: string;
    patientId?: string;
    appointmentDate?: Date;
  }
): Promise<void> {
  try {
    const service = getReminderService();

    // Cancel any remaining reminders
    await service.cancelRemindersForAppointment(appointmentId);

    // Emit campaign event
    if (options?.clinicId && options?.patientId) {
      CampaignEvents.appointmentNoShow(options.clinicId, options.patientId, {
        appointmentId,
        appointmentDate: options.appointmentDate || new Date(),
      });
    }

    console.log(`[AppointmentHooks] Appointment no-show: ${appointmentId}`);
  } catch (error) {
    console.error('[AppointmentHooks] Error on appointment no-show:', error);
  }
}

/**
 * Reminder Services Index
 *
 * Main export file for the appointment reminder infrastructure.
 */

// Types
export * from './types';

// Reminder Service
export { AppointmentReminderService, getReminderService } from './reminder-service';

// Appointment Hooks
export {
  onAppointmentCreated,
  onAppointmentConfirmed,
  onAppointmentCancelled,
  onAppointmentRescheduled,
  onAppointmentCompleted,
  onAppointmentNoShow,
} from './appointment-hooks';

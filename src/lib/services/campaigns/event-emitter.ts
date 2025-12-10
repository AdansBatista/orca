/**
 * Campaign Event Emitter
 *
 * Central event system for triggering campaigns based on business events.
 * This provides a simple pub/sub mechanism for campaign triggers.
 *
 * Usage:
 * ```typescript
 * import { emitCampaignEvent } from '@/lib/services/campaigns';
 *
 * // When an appointment is booked
 * await emitCampaignEvent({
 *   event: 'appointment.booked',
 *   clinicId: appointment.clinicId,
 *   patientId: appointment.patientId,
 *   timestamp: new Date(),
 *   data: {
 *     appointmentId: appointment.id,
 *     appointmentDate: appointment.startTime,
 *     appointmentType: appointment.type,
 *   },
 * });
 * ```
 */

import { getCampaignExecutionService } from './campaign-execution-service';
import type { BusinessEvent, CampaignEventPayload, CampaignProcessingResult } from './types';

/**
 * Event listener callback type
 */
type EventListener = (payload: CampaignEventPayload) => Promise<void>;

/**
 * Campaign Event Emitter Class
 *
 * Provides a centralized event system for campaign triggers.
 * Supports both synchronous (await result) and asynchronous (fire-and-forget) emission.
 */
class CampaignEventEmitter {
  private listeners: Map<BusinessEvent, Set<EventListener>> = new Map();
  private globalListeners: Set<EventListener> = new Set();

  constructor() {
    // Register the campaign execution service as the default listener
    this.registerGlobalListener(async (payload) => {
      const service = getCampaignExecutionService();
      await service.processEvent(payload);
    });
  }

  /**
   * Register a listener for a specific event
   */
  on(event: BusinessEvent, listener: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  /**
   * Remove a listener for a specific event
   */
  off(event: BusinessEvent, listener: EventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  /**
   * Register a listener that receives all events
   */
  registerGlobalListener(listener: EventListener): void {
    this.globalListeners.add(listener);
  }

  /**
   * Remove a global listener
   */
  removeGlobalListener(listener: EventListener): void {
    this.globalListeners.delete(listener);
  }

  /**
   * Emit an event and wait for all listeners to complete
   *
   * Returns processing results from the campaign execution service.
   */
  async emit(payload: CampaignEventPayload): Promise<CampaignProcessingResult[]> {
    const { event } = payload;
    const results: CampaignProcessingResult[] = [];

    console.log('[CampaignEventEmitter] Emitting event:', {
      event,
      clinicId: payload.clinicId,
      patientId: payload.patientId,
    });

    // Call global listeners
    for (const listener of this.globalListeners) {
      try {
        await listener(payload);
      } catch (error) {
        console.error('[CampaignEventEmitter] Global listener error:', error);
      }
    }

    // Call event-specific listeners
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      for (const listener of eventListeners) {
        try {
          await listener(payload);
        } catch (error) {
          console.error(`[CampaignEventEmitter] Listener error for ${event}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * Emit an event without waiting (fire-and-forget)
   *
   * Use this when you don't need to wait for campaign processing.
   */
  emitAsync(payload: CampaignEventPayload): void {
    // Fire and forget
    this.emit(payload).catch((error) => {
      console.error('[CampaignEventEmitter] Async emit error:', error);
    });
  }
}

// Singleton instance
let eventEmitter: CampaignEventEmitter | null = null;

/**
 * Get the campaign event emitter instance
 */
export function getCampaignEventEmitter(): CampaignEventEmitter {
  if (!eventEmitter) {
    eventEmitter = new CampaignEventEmitter();
  }
  return eventEmitter;
}

/**
 * Convenience function to emit a campaign event
 *
 * This is the primary API for triggering campaign events from other parts of the app.
 *
 * @example
 * ```typescript
 * // In appointment service
 * await emitCampaignEvent({
 *   event: 'appointment.booked',
 *   clinicId: appointment.clinicId,
 *   patientId: appointment.patientId,
 *   timestamp: new Date(),
 *   data: { appointmentId: appointment.id },
 * });
 * ```
 */
export async function emitCampaignEvent(
  payload: CampaignEventPayload
): Promise<CampaignProcessingResult[]> {
  return getCampaignEventEmitter().emit(payload);
}

/**
 * Convenience function to emit a campaign event asynchronously (fire-and-forget)
 *
 * Use this when you don't need to wait for the campaign processing to complete.
 */
export function emitCampaignEventAsync(payload: CampaignEventPayload): void {
  getCampaignEventEmitter().emitAsync(payload);
}

/**
 * Helper functions to create event payloads for common events
 */
export const CampaignEvents = {
  /**
   * Emit when an appointment is booked
   */
  appointmentBooked: (
    clinicId: string,
    patientId: string,
    data: {
      appointmentId: string;
      appointmentDate: Date;
      appointmentType?: string;
      providerId?: string;
    }
  ) =>
    emitCampaignEventAsync({
      event: 'appointment.booked',
      clinicId,
      patientId,
      timestamp: new Date(),
      data,
    }),

  /**
   * Emit when an appointment is confirmed
   */
  appointmentConfirmed: (
    clinicId: string,
    patientId: string,
    data: { appointmentId: string; appointmentDate: Date }
  ) =>
    emitCampaignEventAsync({
      event: 'appointment.confirmed',
      clinicId,
      patientId,
      timestamp: new Date(),
      data,
    }),

  /**
   * Emit when an appointment is cancelled
   */
  appointmentCancelled: (
    clinicId: string,
    patientId: string,
    data: { appointmentId: string; reason?: string }
  ) =>
    emitCampaignEventAsync({
      event: 'appointment.cancelled',
      clinicId,
      patientId,
      timestamp: new Date(),
      data,
    }),

  /**
   * Emit when an appointment is completed
   */
  appointmentCompleted: (
    clinicId: string,
    patientId: string,
    data: { appointmentId: string; notes?: string }
  ) =>
    emitCampaignEventAsync({
      event: 'appointment.completed',
      clinicId,
      patientId,
      timestamp: new Date(),
      data,
    }),

  /**
   * Emit when a patient misses an appointment
   */
  appointmentNoShow: (
    clinicId: string,
    patientId: string,
    data: { appointmentId: string; appointmentDate: Date }
  ) =>
    emitCampaignEventAsync({
      event: 'appointment.noshow',
      clinicId,
      patientId,
      timestamp: new Date(),
      data,
    }),

  /**
   * Emit when treatment is started
   */
  treatmentStarted: (
    clinicId: string,
    patientId: string,
    data: { treatmentPlanId: string; treatmentType: string }
  ) =>
    emitCampaignEventAsync({
      event: 'treatment.started',
      clinicId,
      patientId,
      timestamp: new Date(),
      data,
    }),

  /**
   * Emit when treatment phase changes
   */
  treatmentPhaseChanged: (
    clinicId: string,
    patientId: string,
    data: { treatmentPlanId: string; previousPhase: string; newPhase: string }
  ) =>
    emitCampaignEventAsync({
      event: 'treatment.phase_changed',
      clinicId,
      patientId,
      timestamp: new Date(),
      data,
    }),

  /**
   * Emit when a treatment milestone is reached
   */
  treatmentMilestoneReached: (
    clinicId: string,
    patientId: string,
    data: { treatmentPlanId: string; milestone: string; progress: number }
  ) =>
    emitCampaignEventAsync({
      event: 'treatment.milestone_reached',
      clinicId,
      patientId,
      timestamp: new Date(),
      data,
    }),

  /**
   * Emit when treatment is completed
   */
  treatmentCompleted: (
    clinicId: string,
    patientId: string,
    data: { treatmentPlanId: string; treatmentType: string }
  ) =>
    emitCampaignEventAsync({
      event: 'treatment.completed',
      clinicId,
      patientId,
      timestamp: new Date(),
      data,
    }),

  /**
   * Emit when a new patient is created
   */
  patientCreated: (clinicId: string, patientId: string, data: { source?: string } = {}) =>
    emitCampaignEventAsync({
      event: 'patient.created',
      clinicId,
      patientId,
      timestamp: new Date(),
      data,
    }),

  /**
   * Emit when a patient becomes active
   */
  patientActivated: (
    clinicId: string,
    patientId: string,
    data: { treatmentPlanId?: string } = {}
  ) =>
    emitCampaignEventAsync({
      event: 'patient.activated',
      clinicId,
      patientId,
      timestamp: new Date(),
      data,
    }),

  /**
   * Emit on patient's birthday
   */
  patientBirthday: (clinicId: string, patientId: string, data: { age?: number } = {}) =>
    emitCampaignEventAsync({
      event: 'patient.birthday',
      clinicId,
      patientId,
      timestamp: new Date(),
      data,
    }),

  /**
   * Emit when a payment is due
   */
  paymentDue: (
    clinicId: string,
    patientId: string,
    data: { invoiceId: string; amount: number; dueDate: Date }
  ) =>
    emitCampaignEventAsync({
      event: 'payment.due',
      clinicId,
      patientId,
      timestamp: new Date(),
      data,
    }),

  /**
   * Emit when a payment is overdue
   */
  paymentOverdue: (
    clinicId: string,
    patientId: string,
    data: { invoiceId: string; amount: number; daysOverdue: number }
  ) =>
    emitCampaignEventAsync({
      event: 'payment.overdue',
      clinicId,
      patientId,
      timestamp: new Date(),
      data,
    }),

  /**
   * Emit when a payment is received
   */
  paymentReceived: (
    clinicId: string,
    patientId: string,
    data: { paymentId: string; amount: number; method?: string }
  ) =>
    emitCampaignEventAsync({
      event: 'payment.received',
      clinicId,
      patientId,
      timestamp: new Date(),
      data,
    }),
};

// Export the class for testing
export { CampaignEventEmitter };

/**
 * Booking fixture data for seeding
 * Includes appointment types for orthodontic practice
 */

import type { AppointmentStatus, AppointmentSource } from '@prisma/client';

/**
 * Default appointment types for an orthodontic clinic
 */
export const DEFAULT_APPOINTMENT_TYPES = [
  // Initial Consultations
  {
    code: 'NEW_PATIENT',
    name: 'New Patient Consultation',
    description: 'Initial consultation for new patients including records, X-rays, and treatment planning discussion',
    defaultDuration: 60,
    minDuration: 45,
    maxDuration: 90,
    color: '#8B5CF6', // violet
    icon: 'user-plus',
    requiresChair: true,
    requiresRoom: false,
    prepTime: 10,
    cleanupTime: 10,
    isActive: true,
    allowOnline: true,
    sortOrder: 0,
  },
  {
    code: 'CONSULT',
    name: 'Consultation',
    description: 'General consultation or treatment discussion',
    defaultDuration: 30,
    minDuration: 20,
    maxDuration: 45,
    color: '#06B6D4', // cyan
    icon: 'message-square',
    requiresChair: false,
    requiresRoom: true,
    prepTime: 5,
    cleanupTime: 5,
    isActive: true,
    allowOnline: true,
    sortOrder: 1,
  },

  // Records & Imaging
  {
    code: 'RECORDS',
    name: 'Records Appointment',
    description: 'Comprehensive orthodontic records including photos, X-rays, and impressions/scans',
    defaultDuration: 45,
    minDuration: 30,
    maxDuration: 60,
    color: '#F59E0B', // amber
    icon: 'camera',
    requiresChair: true,
    requiresRoom: false,
    prepTime: 5,
    cleanupTime: 10,
    isActive: true,
    allowOnline: false,
    sortOrder: 2,
  },
  {
    code: 'SCAN',
    name: 'Digital Scan',
    description: 'Intraoral digital scanning for aligners or retainers',
    defaultDuration: 20,
    minDuration: 15,
    maxDuration: 30,
    color: '#3B82F6', // blue
    icon: 'scan',
    requiresChair: true,
    requiresRoom: false,
    prepTime: 5,
    cleanupTime: 5,
    isActive: true,
    allowOnline: false,
    sortOrder: 3,
  },
  {
    code: 'XRAY',
    name: 'X-Ray Only',
    description: 'Panoramic, cephalometric, or CBCT imaging',
    defaultDuration: 15,
    minDuration: 10,
    maxDuration: 20,
    color: '#64748B', // slate
    icon: 'radiation',
    requiresChair: false,
    requiresRoom: true, // X-ray room
    prepTime: 5,
    cleanupTime: 5,
    isActive: true,
    allowOnline: false,
    sortOrder: 4,
  },

  // Treatment Appointments
  {
    code: 'BOND',
    name: 'Bonding',
    description: 'Initial placement of braces or brackets',
    defaultDuration: 90,
    minDuration: 60,
    maxDuration: 120,
    color: '#10B981', // green
    icon: 'plus-circle',
    requiresChair: true,
    requiresRoom: false,
    prepTime: 15,
    cleanupTime: 15,
    isActive: true,
    allowOnline: false,
    sortOrder: 10,
  },
  {
    code: 'ADJ',
    name: 'Adjustment',
    description: 'Regular adjustment appointment for braces',
    defaultDuration: 20,
    minDuration: 15,
    maxDuration: 30,
    color: '#3B82F6', // blue
    icon: 'settings',
    requiresChair: true,
    requiresRoom: false,
    prepTime: 5,
    cleanupTime: 5,
    isActive: true,
    allowOnline: true,
    sortOrder: 11,
  },
  {
    code: 'ALIGNER_CHECK',
    name: 'Aligner Check',
    description: 'Progress check for clear aligner patients',
    defaultDuration: 15,
    minDuration: 10,
    maxDuration: 20,
    color: '#06B6D4', // cyan
    icon: 'check-circle',
    requiresChair: true,
    requiresRoom: false,
    prepTime: 5,
    cleanupTime: 5,
    isActive: true,
    allowOnline: true,
    sortOrder: 12,
  },
  {
    code: 'ALIGNER_DELIVERY',
    name: 'Aligner Delivery',
    description: 'Delivery of new aligners with attachments or IPR if needed',
    defaultDuration: 30,
    minDuration: 20,
    maxDuration: 45,
    color: '#8B5CF6', // violet
    icon: 'package',
    requiresChair: true,
    requiresRoom: false,
    prepTime: 10,
    cleanupTime: 5,
    isActive: true,
    allowOnline: false,
    sortOrder: 13,
  },
  {
    code: 'WIRE_CHANGE',
    name: 'Wire Change',
    description: 'Archwire change appointment',
    defaultDuration: 25,
    minDuration: 20,
    maxDuration: 35,
    color: '#F97316', // orange
    icon: 'refresh-cw',
    requiresChair: true,
    requiresRoom: false,
    prepTime: 5,
    cleanupTime: 5,
    isActive: true,
    allowOnline: false,
    sortOrder: 14,
  },
  {
    code: 'REPAIR',
    name: 'Repair/Emergency',
    description: 'Emergency repair for broken brackets, wires, or appliances',
    defaultDuration: 20,
    minDuration: 10,
    maxDuration: 30,
    color: '#EF4444', // red
    icon: 'alert-triangle',
    requiresChair: true,
    requiresRoom: false,
    prepTime: 5,
    cleanupTime: 5,
    isActive: true,
    allowOnline: false,
    sortOrder: 15,
  },

  // Debonding & Retention
  {
    code: 'DEBOND',
    name: 'Debonding',
    description: 'Removal of braces and retainer impressions/delivery',
    defaultDuration: 60,
    minDuration: 45,
    maxDuration: 90,
    color: '#EC4899', // pink
    icon: 'gift',
    requiresChair: true,
    requiresRoom: false,
    prepTime: 10,
    cleanupTime: 15,
    isActive: true,
    allowOnline: false,
    sortOrder: 20,
  },
  {
    code: 'RETAINER_CHECK',
    name: 'Retainer Check',
    description: 'Retention appointment to check retainer fit and compliance',
    defaultDuration: 15,
    minDuration: 10,
    maxDuration: 20,
    color: '#84CC16', // lime
    icon: 'shield',
    requiresChair: true,
    requiresRoom: false,
    prepTime: 5,
    cleanupTime: 5,
    isActive: true,
    allowOnline: true,
    sortOrder: 21,
  },
  {
    code: 'RETAINER_DELIVERY',
    name: 'Retainer Delivery',
    description: 'Delivery and fitting of new retainers',
    defaultDuration: 20,
    minDuration: 15,
    maxDuration: 30,
    color: '#6366F1', // indigo
    icon: 'package',
    requiresChair: true,
    requiresRoom: false,
    prepTime: 5,
    cleanupTime: 5,
    isActive: true,
    allowOnline: false,
    sortOrder: 22,
  },

  // Other
  {
    code: 'FINAL_PHOTOS',
    name: 'Final Photos',
    description: 'Final orthodontic photos for documentation',
    defaultDuration: 15,
    minDuration: 10,
    maxDuration: 20,
    color: '#A855F7', // purple
    icon: 'camera',
    requiresChair: false,
    requiresRoom: false,
    prepTime: 5,
    cleanupTime: 5,
    isActive: true,
    allowOnline: false,
    sortOrder: 30,
  },
];

/**
 * Sample appointments for development/testing
 * These are relative to today's date
 */
export function generateSampleAppointments(
  patientIds: string[],
  providerIds: string[],
  appointmentTypeMap: Map<string, string>, // code -> id
  chairIds: string[]
) {
  const now = new Date();
  const appointments: Array<{
    patientId: string;
    providerId: string;
    appointmentTypeId: string;
    chairId: string | null;
    startTime: Date;
    duration: number;
    status: AppointmentStatus;
    source: AppointmentSource;
    notes?: string;
  }> = [];

  // Helper to get a random element
  const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  // Helper to create date at specific time today or offset days
  const createDateTime = (dayOffset: number, hour: number, minute: number): Date => {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(hour, minute, 0, 0);
    return date;
  };

  // Sample statuses distribution
  const statuses: AppointmentStatus[] = ['SCHEDULED', 'CONFIRMED', 'COMPLETED'];
  const sources: AppointmentSource[] = ['STAFF', 'PHONE', 'ONLINE'];

  // Generate appointments for the next 7 days
  for (let day = 0; day < 7; day++) {
    // Skip weekends
    const currentDay = new Date(now);
    currentDay.setDate(currentDay.getDate() + day);
    if (currentDay.getDay() === 0 || currentDay.getDay() === 6) continue;

    // Generate 5-10 appointments per day
    const appointmentsPerDay = 5 + Math.floor(Math.random() * 6);

    for (let i = 0; i < appointmentsPerDay; i++) {
      const hour = 8 + Math.floor(Math.random() * 9); // 8 AM to 5 PM
      const minute = Math.random() < 0.5 ? 0 : 30;

      // Select random appointment type code
      const typeCodes = ['ADJ', 'ALIGNER_CHECK', 'CONSULT', 'SCAN', 'REPAIR', 'RETAINER_CHECK'];
      const typeCode = random(typeCodes);
      const typeId = appointmentTypeMap.get(typeCode);

      if (!typeId) continue;

      // Find duration from fixture
      const typeFixture = DEFAULT_APPOINTMENT_TYPES.find((t) => t.code === typeCode);
      const duration = typeFixture?.defaultDuration || 30;

      const status: AppointmentStatus = day < 0 ? 'COMPLETED' : random(statuses);

      appointments.push({
        patientId: random(patientIds),
        providerId: random(providerIds),
        appointmentTypeId: typeId,
        chairId: chairIds.length > 0 ? random(chairIds) : null,
        startTime: createDateTime(day, hour, minute),
        duration,
        status,
        source: random(sources),
        notes: Math.random() < 0.3 ? 'Sample appointment note' : undefined,
      });
    }
  }

  return appointments;
}

/**
 * Patient Communications fixture data for seeding
 *
 * This provides sample data for:
 * - Message templates (appointment reminders, billing, etc.)
 * - Sample messages and conversations
 * - Notification preferences
 */

import type { MessageDirection, MessageStatus } from '@prisma/client';

// =============================================================================
// MESSAGE TEMPLATES
// =============================================================================

export interface MessageTemplateData {
  name: string;
  description: string;
  category: 'appointment' | 'billing' | 'treatment' | 'marketing' | 'general';
  smsBody: string | null;
  emailSubject: string | null;
  emailBody: string | null;
  pushTitle: string | null;
  pushBody: string | null;
  isSystem: boolean;
}

/**
 * Default message templates for an orthodontic practice
 */
export const MESSAGE_TEMPLATES: MessageTemplateData[] = [
  // Appointment Templates
  {
    name: 'Appointment Reminder - 24 Hours',
    description: 'Sent 24 hours before scheduled appointment',
    category: 'appointment',
    smsBody:
      'Hi {{firstName}}, this is a reminder that you have an appointment tomorrow at {{appointmentTime}} with {{providerName}} at {{clinicName}}. Reply C to confirm or call us to reschedule.',
    emailSubject: 'Appointment Reminder - Tomorrow at {{appointmentTime}}',
    emailBody: `Dear {{firstName}},

This is a friendly reminder that you have an upcoming appointment:

**Date:** {{appointmentDate}}
**Time:** {{appointmentTime}}
**Provider:** {{providerName}}
**Location:** {{clinicName}}

Please arrive 10 minutes early to complete any necessary paperwork.

If you need to reschedule, please call us at least 24 hours in advance.

Best regards,
{{clinicName}}`,
    pushTitle: 'Appointment Tomorrow',
    pushBody: 'Your appointment is tomorrow at {{appointmentTime}} with {{providerName}}',
    isSystem: true,
  },
  {
    name: 'Appointment Reminder - 1 Hour',
    description: 'Sent 1 hour before scheduled appointment',
    category: 'appointment',
    smsBody:
      'Hi {{firstName}}, your appointment with {{providerName}} starts in 1 hour. See you soon at {{clinicName}}!',
    emailSubject: null,
    emailBody: null,
    pushTitle: 'Appointment in 1 Hour',
    pushBody: 'Your appointment with {{providerName}} starts in 1 hour',
    isSystem: true,
  },
  {
    name: 'Appointment Confirmation',
    description: 'Sent when appointment is scheduled',
    category: 'appointment',
    smsBody:
      'Your appointment at {{clinicName}} is confirmed for {{appointmentDate}} at {{appointmentTime}} with {{providerName}}. Reply HELP for assistance.',
    emailSubject: 'Appointment Confirmed - {{appointmentDate}}',
    emailBody: `Dear {{firstName}},

Your appointment has been confirmed:

**Date:** {{appointmentDate}}
**Time:** {{appointmentTime}}
**Provider:** {{providerName}}
**Location:** {{clinicName}}

**What to bring:**
- Insurance card (if applicable)
- List of current medications
- Any referral forms

If you have any questions, please don't hesitate to contact us.

See you soon!
{{clinicName}}`,
    pushTitle: 'Appointment Confirmed',
    pushBody: 'Your appointment on {{appointmentDate}} at {{appointmentTime}} is confirmed',
    isSystem: true,
  },
  {
    name: 'Appointment Cancelled',
    description: 'Sent when appointment is cancelled',
    category: 'appointment',
    smsBody:
      'Your appointment at {{clinicName}} on {{appointmentDate}} has been cancelled. Please call us to reschedule.',
    emailSubject: 'Appointment Cancelled',
    emailBody: `Dear {{firstName}},

Your appointment scheduled for {{appointmentDate}} at {{appointmentTime}} has been cancelled.

Please call us at your earliest convenience to reschedule.

Best regards,
{{clinicName}}`,
    pushTitle: 'Appointment Cancelled',
    pushBody: 'Your appointment on {{appointmentDate}} has been cancelled',
    isSystem: true,
  },
  {
    name: 'Missed Appointment Follow-up',
    description: 'Sent after a missed appointment',
    category: 'appointment',
    smsBody:
      'Hi {{firstName}}, we missed you at your appointment today. Please call {{clinicName}} to reschedule your visit.',
    emailSubject: 'We Missed You Today',
    emailBody: `Dear {{firstName}},

We noticed you missed your appointment scheduled for today at {{appointmentTime}}.

Regular orthodontic visits are important for your treatment progress. Please call us to reschedule at your earliest convenience.

If you're experiencing any issues or have concerns, we're here to help.

Best regards,
{{clinicName}}`,
    pushTitle: 'Missed Appointment',
    pushBody: 'We missed you today! Please call us to reschedule.',
    isSystem: true,
  },

  // Billing Templates
  {
    name: 'Payment Receipt',
    description: 'Sent after payment is processed',
    category: 'billing',
    smsBody:
      'Thank you for your payment of {{paymentAmount}} to {{clinicName}}. Your receipt has been emailed to you.',
    emailSubject: 'Payment Receipt - {{clinicName}}',
    emailBody: `Dear {{firstName}},

Thank you for your payment.

**Amount:** {{paymentAmount}}
**Date:** {{paymentDate}}
**Payment Method:** {{paymentMethod}}

If you have any questions about this payment, please contact our billing department.

Thank you for choosing {{clinicName}}.

Best regards,
{{clinicName}} Billing Team`,
    pushTitle: 'Payment Received',
    pushBody: 'Thank you! Your payment of {{paymentAmount}} has been processed.',
    isSystem: true,
  },
  {
    name: 'Payment Reminder',
    description: 'Reminder for outstanding balance',
    category: 'billing',
    smsBody:
      'Hi {{firstName}}, you have an outstanding balance of {{balanceAmount}} at {{clinicName}}. Please call us or visit the patient portal to make a payment.',
    emailSubject: 'Payment Reminder - Balance Due',
    emailBody: `Dear {{firstName}},

This is a friendly reminder that you have an outstanding balance on your account.

**Current Balance:** {{balanceAmount}}
**Due Date:** {{dueDate}}

You can make a payment by:
- Visiting our patient portal
- Calling our billing department
- Paying at your next visit

If you have any questions or need to set up a payment plan, please contact us.

Best regards,
{{clinicName}} Billing Team`,
    pushTitle: 'Payment Reminder',
    pushBody: 'You have an outstanding balance of {{balanceAmount}}',
    isSystem: true,
  },

  // Treatment Templates
  {
    name: 'Treatment Started',
    description: 'Sent when treatment begins',
    category: 'treatment',
    smsBody: null,
    emailSubject: 'Welcome to Your Orthodontic Journey!',
    emailBody: `Dear {{firstName}},

Congratulations on starting your orthodontic treatment with {{clinicName}}!

Your treatment plan has been customized specifically for you. Here's what to expect:

**Treatment Overview:**
- Estimated duration: {{treatmentDuration}}
- Next appointment: {{nextAppointmentDate}}

**Care Instructions:**
- Brush thoroughly after every meal
- Avoid hard and sticky foods
- Wear your elastics as instructed
- Contact us immediately if you experience any issues

We're excited to be part of your smile journey!

Best regards,
{{providerName}}
{{clinicName}}`,
    pushTitle: null,
    pushBody: null,
    isSystem: true,
  },
  {
    name: 'Post-Visit Care Instructions',
    description: 'Care instructions after appointment',
    category: 'treatment',
    smsBody:
      'Thanks for visiting {{clinicName}} today! Remember to follow your care instructions. Call us if you have any questions.',
    emailSubject: 'Post-Visit Care Instructions',
    emailBody: `Dear {{firstName}},

Thank you for visiting us today. Here are your care instructions following your appointment:

**Important Reminders:**
- {{careInstructions}}

**Next Appointment:** {{nextAppointmentDate}} at {{nextAppointmentTime}}

If you experience unusual discomfort or have questions, please don't hesitate to contact us.

Best regards,
{{clinicName}}`,
    pushTitle: 'Post-Visit Reminder',
    pushBody: 'Remember to follow your care instructions from today\'s visit.',
    isSystem: true,
  },

  // Marketing Templates
  {
    name: 'Birthday Greeting',
    description: 'Sent on patient birthday',
    category: 'marketing',
    smsBody: 'Happy Birthday {{firstName}}! Wishing you a wonderful day from all of us at {{clinicName}}! ',
    emailSubject: 'Happy Birthday from {{clinicName}}!',
    emailBody: `Dear {{firstName}},

Happy Birthday!

Everyone at {{clinicName}} wishes you a fantastic birthday filled with joy and beautiful smiles!

Thank you for being a valued member of our practice family.

Warm wishes,
The {{clinicName}} Team`,
    pushTitle: 'Happy Birthday!',
    pushBody: 'Wishing you a wonderful birthday from {{clinicName}}!',
    isSystem: false,
  },
  {
    name: 'Referral Thank You',
    description: 'Thank patient for referring someone',
    category: 'marketing',
    smsBody:
      'Thank you for referring a friend to {{clinicName}}! We appreciate your trust in us.',
    emailSubject: 'Thank You for Your Referral!',
    emailBody: `Dear {{firstName}},

Thank you so much for referring {{referralName}} to our practice!

Word-of-mouth referrals from patients like you are the highest compliment we can receive. We truly appreciate your trust in us and are committed to providing the same excellent care to your friend.

As a token of our appreciation, {{referralReward}}.

Thank you again for being such a wonderful part of the {{clinicName}} family!

Warm regards,
{{clinicName}}`,
    pushTitle: 'Thank You!',
    pushBody: 'Thanks for your referral! We appreciate you.',
    isSystem: false,
  },

  // General Templates
  {
    name: 'Welcome Message',
    description: 'Sent to new patients',
    category: 'general',
    smsBody:
      'Welcome to {{clinicName}}! We\'re excited to have you as a patient. Reply HELP for assistance or visit our patient portal.',
    emailSubject: 'Welcome to {{clinicName}}!',
    emailBody: `Dear {{firstName}},

Welcome to {{clinicName}}! We're thrilled to have you join our practice family.

**Getting Started:**
- Set up your patient portal account for easy appointment management
- Save our number for quick communication
- Review our office policies

**Contact Information:**
- Phone: {{clinicPhone}}
- Email: {{clinicEmail}}
- Address: {{clinicAddress}}

If you have any questions before your first visit, please don't hesitate to reach out.

We look forward to seeing you soon!

Best regards,
The {{clinicName}} Team`,
    pushTitle: 'Welcome!',
    pushBody: 'Welcome to {{clinicName}}! We\'re excited to meet you.',
    isSystem: true,
  },
  {
    name: 'Office Closure Notice',
    description: 'Notify patients of office closure',
    category: 'general',
    smsBody:
      '{{clinicName}} will be closed on {{closureDate}} for {{closureReason}}. We will reopen on {{reopenDate}}. For emergencies, call {{emergencyPhone}}.',
    emailSubject: 'Office Closure Notice - {{closureDate}}',
    emailBody: `Dear {{firstName}},

Please be advised that {{clinicName}} will be closed:

**Closure Date:** {{closureDate}}
**Reason:** {{closureReason}}
**Reopening:** {{reopenDate}}

If you have an appointment scheduled during this time, our team will contact you to reschedule.

For dental emergencies during our closure, please call {{emergencyPhone}}.

We apologize for any inconvenience and appreciate your understanding.

Best regards,
{{clinicName}}`,
    pushTitle: 'Office Closure',
    pushBody: '{{clinicName}} will be closed on {{closureDate}}',
    isSystem: false,
  },
];

// =============================================================================
// SAMPLE MESSAGES GENERATORS
// =============================================================================

export interface SampleMessageData {
  channel: 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP';
  direction: MessageDirection;
  status: MessageStatus;
  subject: string | null;
  body: string;
  hoursAgo: number; // Hours before now when message was sent
  read: boolean;
}

/**
 * Generate sample conversation messages for a patient
 */
export function generateSampleConversation(): SampleMessageData[] {
  return [
    // Initial outbound appointment reminder
    {
      channel: 'SMS',
      direction: 'OUTBOUND',
      status: 'DELIVERED',
      subject: null,
      body: 'Hi, this is a reminder that you have an appointment tomorrow at 10:00 AM with Dr. Smith at Bright Smiles Orthodontics. Reply C to confirm.',
      hoursAgo: 48,
      read: true,
    },
    // Patient confirmation reply
    {
      channel: 'SMS',
      direction: 'INBOUND',
      status: 'DELIVERED',
      subject: null,
      body: 'C',
      hoursAgo: 47,
      read: true,
    },
    // Confirmation acknowledgment
    {
      channel: 'SMS',
      direction: 'OUTBOUND',
      status: 'DELIVERED',
      subject: null,
      body: 'Thank you for confirming! We look forward to seeing you tomorrow at 10:00 AM.',
      hoursAgo: 47,
      read: true,
    },
    // Post-visit follow up
    {
      channel: 'EMAIL',
      direction: 'OUTBOUND',
      status: 'DELIVERED',
      subject: 'Post-Visit Care Instructions',
      body: 'Thank you for visiting us today. Please remember to wear your rubber bands as instructed. Your next appointment is scheduled for March 15th.',
      hoursAgo: 24,
      read: true,
    },
    // Patient question
    {
      channel: 'SMS',
      direction: 'INBOUND',
      status: 'DELIVERED',
      subject: null,
      body: 'Hi, I have a question about my retainer. Is it normal for it to feel tight?',
      hoursAgo: 2,
      read: false,
    },
  ];
}

/**
 * Sample quick replies for staff
 */
export const QUICK_REPLIES = [
  {
    label: 'Confirm Receipt',
    message: 'Thank you for your message. We\'ve received it and will get back to you shortly.',
  },
  {
    label: 'Call Request',
    message: 'Thank you for reaching out. One of our team members will call you within the next business hour.',
  },
  {
    label: 'Normal Adjustment',
    message: 'What you\'re experiencing is normal after an adjustment. If discomfort persists beyond 3-4 days, please call us.',
  },
  {
    label: 'Emergency Contact',
    message: 'For dental emergencies outside office hours, please call our emergency line at (555) 123-4567.',
  },
];

// =============================================================================
// NOTIFICATION PREFERENCES
// =============================================================================

export interface NotificationPreferenceData {
  // Channel enablement
  smsEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  // Category preferences
  appointmentReminders: boolean;
  treatmentUpdates: boolean;
  billingNotifications: boolean;
  marketingMessages: boolean;
  // Channel priority
  channelPriority: string[];
  // Quiet hours
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string | null;
}

/**
 * Default notification preferences for new patients
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferenceData = {
  smsEnabled: true,
  emailEnabled: true,
  pushEnabled: true,
  appointmentReminders: true,
  treatmentUpdates: true,
  billingNotifications: true,
  marketingMessages: false,
  channelPriority: ['SMS', 'EMAIL', 'PUSH'],
  quietHoursStart: '21:00',
  quietHoursEnd: '08:00',
  timezone: 'America/New_York',
};

/**
 * Generate varied notification preferences for sample patients
 */
export function generateNotificationPreferences(patientIndex: number): NotificationPreferenceData {
  // Vary preferences based on patient index to create realistic distribution
  const variations: NotificationPreferenceData[] = [
    // SMS + Email patient (most common)
    {
      smsEnabled: true,
      emailEnabled: true,
      pushEnabled: false,
      appointmentReminders: true,
      treatmentUpdates: true,
      billingNotifications: true,
      marketingMessages: true,
      channelPriority: ['SMS', 'EMAIL'],
      quietHoursStart: '21:00',
      quietHoursEnd: '08:00',
      timezone: 'America/New_York',
    },
    // SMS only patient
    {
      smsEnabled: true,
      emailEnabled: false,
      pushEnabled: false,
      appointmentReminders: true,
      treatmentUpdates: true,
      billingNotifications: true,
      marketingMessages: false,
      channelPriority: ['SMS'],
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      timezone: 'America/Chicago',
    },
    // Email only patient
    {
      smsEnabled: false,
      emailEnabled: true,
      pushEnabled: false,
      appointmentReminders: true,
      treatmentUpdates: true,
      billingNotifications: true,
      marketingMessages: true,
      channelPriority: ['EMAIL'],
      quietHoursStart: null,
      quietHoursEnd: null,
      timezone: null,
    },
    // All channels patient
    {
      smsEnabled: true,
      emailEnabled: true,
      pushEnabled: true,
      appointmentReminders: true,
      treatmentUpdates: true,
      billingNotifications: true,
      marketingMessages: true,
      channelPriority: ['SMS', 'EMAIL', 'PUSH'],
      quietHoursStart: '20:00',
      quietHoursEnd: '09:00',
      timezone: 'America/Los_Angeles',
    },
    // Minimal notifications patient
    {
      smsEnabled: true,
      emailEnabled: false,
      pushEnabled: false,
      appointmentReminders: true,
      treatmentUpdates: false,
      billingNotifications: false,
      marketingMessages: false,
      channelPriority: ['SMS'],
      quietHoursStart: '18:00',
      quietHoursEnd: '10:00',
      timezone: 'America/Denver',
    },
  ];

  return variations[patientIndex % variations.length];
}

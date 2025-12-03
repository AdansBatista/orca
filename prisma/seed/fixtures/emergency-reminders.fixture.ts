/**
 * Emergency & Reminders fixture data for seeding
 * Includes emergency protocols, reminder templates, on-call schedules, and sample data
 */

import type {
  EmergencyType,
  EmergencySeverity,
  TriageStatus,
  RequestChannel,
  EmergencyResolution,
  OnCallType,
  OnCallStatus,
  ReminderChannel,
  ReminderType,
  ReminderStatus,
  ConfirmationResponse,
  AfterHoursUrgency,
  AfterHoursRouting,
  AfterHoursStatus,
  AfterHoursMessageType,
  FAQCategory,
} from '@prisma/client';

/**
 * Default emergency protocols for orthodontic practices
 */
export const DEFAULT_EMERGENCY_PROTOCOLS = [
  {
    emergencyType: 'SEVERE_PAIN' as EmergencyType,
    name: 'Pain Management Protocol',
    description: 'Standard protocol for handling patient pain complaints',
    typicalSeverity: 'HIGH' as EmergencySeverity,
    maxWaitDays: 1,
    triageQuestions: [
      { question: 'On a scale of 1-10, how severe is the pain?', options: [{ text: '1-3', severity: 'LOW' }, { text: '4-6', severity: 'MEDIUM' }, { text: '7-10', severity: 'HIGH' }] },
      { question: 'When did the pain start?', options: [] },
      { question: 'Is there any visible swelling or redness?', options: [{ text: 'Yes', severity: 'HIGH' }, { text: 'No', severity: 'LOW' }] },
    ],
    selfCareInstructions: 'Take over-the-counter pain relievers like ibuprofen or acetaminophen. Apply a cold compress to the affected area. Avoid hard or chewy foods.',
    whenToCall: 'If pain persists beyond 3-4 days or is severe and unresponsive to OTC medication.',
    whenToSeekER: 'Severe swelling, difficulty breathing or swallowing, fever above 101°F.',
    isActive: true,
  },
  {
    emergencyType: 'BROKEN_BRACKET' as EmergencyType,
    name: 'Broken Bracket Protocol',
    description: 'Protocol for handling broken or loose brackets',
    typicalSeverity: 'LOW' as EmergencySeverity,
    maxWaitDays: 3,
    triageQuestions: [
      { question: 'Which tooth has the broken bracket?', options: [] },
      { question: 'Is the bracket still attached to the wire?', options: [{ text: 'Yes', severity: 'LOW' }, { text: 'No', severity: 'MEDIUM' }] },
      { question: 'Is the bracket causing irritation?', options: [{ text: 'Yes', severity: 'MEDIUM' }, { text: 'No', severity: 'LOW' }] },
    ],
    selfCareInstructions: 'If bracket is still on wire, leave it. If causing irritation, cover with orthodontic wax. Save loose brackets.',
    whenToCall: 'If bracket is causing significant irritation or multiple brackets are affected.',
    whenToSeekER: null,
    isActive: true,
  },
  {
    emergencyType: 'POKING_WIRE' as EmergencyType,
    name: 'Loose/Poking Wire Protocol',
    description: 'Protocol for handling loose or poking archwires',
    typicalSeverity: 'MEDIUM' as EmergencySeverity,
    maxWaitDays: 2,
    triageQuestions: [
      { question: 'Where is the wire poking?', options: [] },
      { question: 'Is there bleeding or sores?', options: [{ text: 'Yes', severity: 'HIGH' }, { text: 'No', severity: 'LOW' }] },
      { question: 'Have you tried covering it with wax?', options: [{ text: 'Yes, didn\'t help', severity: 'MEDIUM' }, { text: 'No', severity: 'LOW' }] },
    ],
    selfCareInstructions: 'Apply orthodontic wax to cover the poking wire. If you have clean nail clippers, you can try to carefully clip the wire.',
    whenToCall: 'If wax is not effective or wire is causing significant discomfort.',
    whenToSeekER: 'If wire has caused a puncture wound or significant bleeding.',
    isActive: true,
  },
  {
    emergencyType: 'LOST_RETAINER' as EmergencyType,
    name: 'Lost/Broken Retainer Protocol',
    description: 'Protocol for handling lost or broken retainers',
    typicalSeverity: 'LOW' as EmergencySeverity,
    maxWaitDays: 5,
    triageQuestions: [
      { question: 'When did you lose/break the retainer?', options: [] },
      { question: 'Do you have a backup retainer?', options: [{ text: 'Yes', severity: 'LOW' }, { text: 'No', severity: 'MEDIUM' }] },
      { question: 'Do you notice any teeth shifting?', options: [{ text: 'Yes', severity: 'HIGH' }, { text: 'No', severity: 'LOW' }] },
    ],
    selfCareInstructions: 'Wear backup retainer if available. Note any changes in tooth position to report.',
    whenToCall: 'Schedule replacement within a few days to prevent relapse.',
    whenToSeekER: null,
    isActive: true,
  },
  {
    emergencyType: 'SWELLING_INFECTION' as EmergencyType,
    name: 'Swelling Protocol',
    description: 'Protocol for handling swelling complaints',
    typicalSeverity: 'HIGH' as EmergencySeverity,
    maxWaitDays: 1,
    triageQuestions: [
      { question: 'Where is the swelling located?', options: [] },
      { question: 'Do you have a fever?', options: [{ text: 'Yes', severity: 'CRITICAL' }, { text: 'No', severity: 'MEDIUM' }] },
      { question: 'Is there difficulty breathing or swallowing?', options: [{ text: 'Yes', severity: 'CRITICAL' }, { text: 'No', severity: 'MEDIUM' }] },
    ],
    selfCareInstructions: 'Apply ice pack to reduce swelling. Take OTC anti-inflammatory medication.',
    whenToCall: 'Facial swelling with fever requires same-day attention.',
    whenToSeekER: 'Difficulty breathing, difficulty swallowing, rapid spread of swelling, or high fever.',
    isActive: true,
  },
  {
    emergencyType: 'TRAUMA_INJURY' as EmergencyType,
    name: 'Dental Trauma Protocol',
    description: 'Protocol for handling dental trauma with braces',
    typicalSeverity: 'CRITICAL' as EmergencySeverity,
    maxWaitDays: 0,
    triageQuestions: [
      { question: 'What caused the trauma?', options: [] },
      { question: 'Are any teeth loose or knocked out?', options: [{ text: 'Knocked out', severity: 'CRITICAL' }, { text: 'Loose', severity: 'HIGH' }, { text: 'No', severity: 'MEDIUM' }] },
      { question: 'Did you hit your head or lose consciousness?', options: [{ text: 'Yes', severity: 'CRITICAL' }, { text: 'No', severity: 'MEDIUM' }] },
    ],
    selfCareInstructions: 'For knocked out tooth, keep moist in milk and seek immediate care. Control bleeding with gauze.',
    whenToCall: 'Immediately for any dental trauma.',
    whenToSeekER: 'Head injury, loss of consciousness, avulsed permanent teeth, or uncontrolled bleeding.',
    isActive: true,
  },
  {
    emergencyType: 'APPLIANCE_IRRITATION' as EmergencyType,
    name: 'Appliance Irritation Protocol',
    description: 'Protocol for handling appliance irritation and related issues',
    typicalSeverity: 'MEDIUM' as EmergencySeverity,
    maxWaitDays: 2,
    triageQuestions: [
      { question: 'Is there pus or drainage?', options: [{ text: 'Yes', severity: 'HIGH' }, { text: 'No', severity: 'MEDIUM' }] },
      { question: 'Do you have a fever?', options: [{ text: 'Yes', severity: 'CRITICAL' }, { text: 'No', severity: 'MEDIUM' }] },
      { question: 'How long have you had symptoms?', options: [] },
    ],
    selfCareInstructions: 'Rinse with warm salt water. Apply orthodontic wax to irritated areas.',
    whenToCall: 'Signs of irritation require same-day or next-day appointment.',
    whenToSeekER: 'High fever, spreading redness, difficulty swallowing, or signs of infection.',
    isActive: true,
  },
];

/**
 * Default reminder templates for appointment reminders
 */
export const DEFAULT_REMINDER_TEMPLATES = [
  // SMS Templates
  {
    name: '24-Hour SMS Reminder',
    channel: 'SMS' as ReminderChannel,
    type: 'STANDARD' as ReminderType,
    subject: null,
    body: 'Hi {patient_name}! This is a reminder of your orthodontic appointment tomorrow at {time} with {provider}. Reply YES to confirm or call {clinic_phone} to reschedule.',
    includeCalendarLink: false,
    includeDirections: false,
    includeConfirmLink: true,
    includeCancelLink: false,
    isActive: true,
    isDefault: true,
  },
  {
    name: '2-Hour SMS Reminder',
    channel: 'SMS' as ReminderChannel,
    type: 'STANDARD' as ReminderType,
    subject: null,
    body: 'Hi {patient_name}! Just a reminder that your appointment at {clinic_name} is in 2 hours at {time}. See you soon!',
    includeCalendarLink: false,
    includeDirections: false,
    includeConfirmLink: false,
    includeCancelLink: false,
    isActive: true,
    isDefault: false,
  },
  {
    name: 'SMS Confirmation Request',
    channel: 'SMS' as ReminderChannel,
    type: 'CONFIRMATION' as ReminderType,
    subject: null,
    body: 'Hi {patient_name}! Please confirm your appointment on {date} at {time}. Reply YES to confirm, NO to cancel, or call {clinic_phone} to reschedule.',
    includeCalendarLink: false,
    includeDirections: false,
    includeConfirmLink: true,
    includeCancelLink: true,
    isActive: true,
    isDefault: true,
  },

  // Email Templates
  {
    name: '48-Hour Email Reminder',
    channel: 'EMAIL' as ReminderChannel,
    type: 'STANDARD' as ReminderType,
    subject: 'Appointment Reminder - {clinic_name}',
    body: `Dear {patient_name},

This is a friendly reminder about your upcoming orthodontic appointment:

Date: {date}
Time: {time}
Provider: {provider}
Location: {clinic_name}

Please arrive 5-10 minutes early. If you need to reschedule, please call us at {clinic_phone} or reply to this email.

We look forward to seeing you!

Best regards,
{clinic_name}`,
    includeCalendarLink: true,
    includeDirections: true,
    includeConfirmLink: true,
    includeCancelLink: true,
    isActive: true,
    isDefault: true,
  },
  {
    name: 'Email Confirmation Request',
    channel: 'EMAIL' as ReminderChannel,
    type: 'CONFIRMATION' as ReminderType,
    subject: 'Please Confirm Your Appointment - {clinic_name}',
    body: `Dear {patient_name},

Please confirm your upcoming appointment:

Date: {date}
Time: {time}
Provider: {provider}
Location: {clinic_name}

Click the links below to confirm or reschedule.

Thank you,
{clinic_name}`,
    includeCalendarLink: true,
    includeDirections: false,
    includeConfirmLink: true,
    includeCancelLink: true,
    isActive: true,
    isDefault: true,
  },
];

/**
 * Default after-hours settings
 */
export const DEFAULT_AFTER_HOURS_SETTINGS = {
  weekdayOpen: '08:00',
  weekdayClose: '17:00',
  saturdayOpen: null,
  saturdayClose: null,
  sundayOpen: null,
  sundayClose: null,
  afterHoursPhone: '555-ORTHO-911',
  answeringServicePhone: '555-555-0199',
  emergencyLinePhone: '555-EMERGENCY',
  smsAutoReply: 'Thanks for your message! Our office is closed. For emergencies, call our emergency line. We will respond during business hours.',
  emailAutoReply: 'Thank you for contacting us. Our office is currently closed. We will respond to your message during our next business day. If this is an emergency, please call our emergency line.',
  voicemailGreeting: 'Thank you for calling. Our office is currently closed. If this is a dental emergency, please press 1 to be connected to our on-call provider.',
  emergencyKeywords: ['emergency', 'urgent', 'pain', 'bleeding', 'swelling', 'broken'],
  urgentResponseMinutes: 30,
  routineResponseHours: 24,
};

/**
 * Default emergency FAQs for patient self-service
 */
export const DEFAULT_EMERGENCY_FAQS = [
  {
    category: 'SELF_CARE' as FAQCategory,
    question: 'My braces are causing pain. What should I do?',
    answer: 'Some discomfort after adjustments is normal. Try taking over-the-counter pain relievers like ibuprofen or acetaminophen. Eating soft foods and applying orthodontic wax to any areas causing irritation can also help. If pain persists beyond 3-4 days or is severe, please contact our office.',
    emergencyType: 'SEVERE_PAIN' as EmergencyType,
    displayOrder: 0,
    isPublished: true,
  },
  {
    category: 'SELF_CARE' as FAQCategory,
    question: 'A bracket came off. Is this an emergency?',
    answer: 'A loose bracket is not usually an emergency, but it should be addressed soon. If the bracket is still on the wire, leave it in place. If it comes off completely, save it and bring it to your next appointment. Call our office to schedule a repair appointment within a few days.',
    emergencyType: 'BROKEN_BRACKET' as EmergencyType,
    displayOrder: 1,
    isPublished: true,
  },
  {
    category: 'SELF_CARE' as FAQCategory,
    question: 'The wire is poking my cheek. What can I do?',
    answer: 'Try using orthodontic wax to cover the poking wire. If you have clean nail clippers, you can try to carefully clip the wire. If the wire is causing significant discomfort or bleeding, contact our office to schedule a same-day appointment.',
    emergencyType: 'POKING_WIRE' as EmergencyType,
    displayOrder: 2,
    isPublished: true,
  },
  {
    category: 'GENERAL' as FAQCategory,
    question: 'I lost my retainer. What should I do?',
    answer: 'Contact our office as soon as possible to schedule an appointment for a replacement retainer. Teeth can begin shifting without a retainer, especially if you are recently out of braces. If you have a backup retainer, wear that until your appointment.',
    emergencyType: 'LOST_RETAINER' as EmergencyType,
    displayOrder: 3,
    isPublished: true,
  },
  {
    category: 'WHEN_TO_CALL' as FAQCategory,
    question: 'I have swelling in my mouth. Should I be concerned?',
    answer: 'Some minor swelling can occur after adjustments. However, if you have significant swelling, especially with fever, difficulty swallowing, or if swelling is spreading, this could indicate an infection and you should contact our office immediately or seek emergency care.',
    emergencyType: 'SWELLING_INFECTION' as EmergencyType,
    displayOrder: 4,
    isPublished: true,
  },
  {
    category: 'WHEN_TO_CALL' as FAQCategory,
    question: 'What should I do if I have a dental emergency after hours?',
    answer: 'For true emergencies (severe bleeding, trauma, difficulty breathing), go to the nearest emergency room. For orthodontic emergencies, call our main number to reach our after-hours answering service. Our on-call provider will return your call to advise you.',
    emergencyType: null,
    displayOrder: 5,
    isPublished: true,
  },
];

/**
 * Generate sample emergency appointments
 */
export function generateSampleEmergencies(
  patientIds: string[],
  providerIds: string[]
): Array<{
  patientId: string;
  patientName: string;
  patientPhone: string;
  emergencyType: EmergencyType;
  severity: EmergencySeverity;
  triageStatus: TriageStatus;
  description: string;
  symptoms: string[];
  requestChannel: RequestChannel;
  requestedAt: Date;
  resolution?: EmergencyResolution;
  resolvedAt?: Date;
  resolutionNotes?: string;
}> {
  const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const now = new Date();

  const emergencies: Array<{
    patientId: string;
    patientName: string;
    patientPhone: string;
    emergencyType: EmergencyType;
    severity: EmergencySeverity;
    triageStatus: TriageStatus;
    description: string;
    symptoms: string[];
    requestChannel: RequestChannel;
    requestedAt: Date;
    resolution?: EmergencyResolution;
    resolvedAt?: Date;
    resolutionNotes?: string;
  }> = [];

  const sampleEmergencies = [
    {
      emergencyType: 'SEVERE_PAIN' as EmergencyType,
      severity: 'HIGH' as EmergencySeverity,
      description: 'Severe pain around back molar area, started yesterday',
      symptoms: ['Constant throbbing pain', 'Sensitivity to cold'],
    },
    {
      emergencyType: 'BROKEN_BRACKET' as EmergencyType,
      severity: 'MEDIUM' as EmergencySeverity,
      description: 'Bracket fell off upper front tooth while eating',
      symptoms: ['Loose bracket on wire'],
    },
    {
      emergencyType: 'POKING_WIRE' as EmergencyType,
      severity: 'MEDIUM' as EmergencySeverity,
      description: 'Wire poking inside of cheek causing sore',
      symptoms: ['Irritation', 'Small sore on cheek'],
    },
    {
      emergencyType: 'LOST_RETAINER' as EmergencyType,
      severity: 'LOW' as EmergencySeverity,
      description: 'Lost retainer at school yesterday',
      symptoms: [],
    },
    {
      emergencyType: 'SWELLING_INFECTION' as EmergencyType,
      severity: 'HIGH' as EmergencySeverity,
      description: 'Swelling around lower jaw since this morning',
      symptoms: ['Visible swelling', 'Difficulty chewing', 'Mild fever'],
    },
    {
      emergencyType: 'APPLIANCE_IRRITATION' as EmergencyType,
      severity: 'LOW' as EmergencySeverity,
      description: 'General soreness after adjustment 2 days ago',
      symptoms: ['Tender teeth', 'Mild discomfort when eating'],
    },
  ];

  const channels: RequestChannel[] = ['PHONE', 'PATIENT_PORTAL', 'SMS'];
  const triageStatuses: TriageStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REFERRED'];
  const names = ['John Smith', 'Mary Johnson', 'James Williams', 'Emily Davis', 'Michael Brown', 'Sarah Wilson'];
  const phones = ['555-123-4567', '555-234-5678', '555-345-6789', '555-456-7890', '555-567-8901', '555-678-9012'];

  // Create some sample emergencies with varying statuses
  for (let i = 0; i < sampleEmergencies.length; i++) {
    const sample = sampleEmergencies[i];
    const triageStatus = random(triageStatuses);
    const daysAgo = Math.floor(Math.random() * 7);
    const requestedAt = new Date(now);
    requestedAt.setDate(requestedAt.getDate() - daysAgo);
    requestedAt.setHours(Math.floor(Math.random() * 10) + 8); // 8 AM to 6 PM

    const emergency: {
      patientId: string;
      patientName: string;
      patientPhone: string;
      emergencyType: EmergencyType;
      severity: EmergencySeverity;
      triageStatus: TriageStatus;
      description: string;
      symptoms: string[];
      requestChannel: RequestChannel;
      requestedAt: Date;
      resolution?: EmergencyResolution;
      resolvedAt?: Date;
      resolutionNotes?: string;
    } = {
      patientId: random(patientIds),
      patientName: names[i % names.length],
      patientPhone: phones[i % phones.length],
      emergencyType: sample.emergencyType,
      severity: sample.severity,
      triageStatus,
      description: sample.description,
      symptoms: sample.symptoms,
      requestChannel: random(channels),
      requestedAt,
    };

    // Some emergencies are resolved
    if (triageStatus === 'COMPLETED' && Math.random() > 0.5) {
      emergency.resolution = random(['APPOINTMENT_SCHEDULED', 'SELF_CARE_RESOLVED', 'NO_ACTION_NEEDED'] as EmergencyResolution[]);
      emergency.resolvedAt = new Date(requestedAt);
      emergency.resolvedAt.setHours(emergency.resolvedAt.getHours() + Math.floor(Math.random() * 24) + 1);
      emergency.resolutionNotes = 'Patient treated successfully';
    }

    emergencies.push(emergency);
  }

  return emergencies;
}

/**
 * Generate sample on-call schedules for the week
 */
export function generateOnCallSchedules(
  providerIds: string[],
  providerNames: string[]
): Array<{
  providerId: string;
  providerName: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  type: OnCallType;
  status: OnCallStatus;
  notes: string | null;
  createdBy: string;
}> {
  if (providerIds.length === 0) return [];

  const schedules: Array<{
    providerId: string;
    providerName: string;
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
    type: OnCallType;
    status: OnCallStatus;
    notes: string | null;
    createdBy: string;
  }> = [];

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  // Create evening on-call for each weekday
  for (let day = 1; day <= 5; day++) {
    const scheduleDate = new Date(startOfWeek);
    scheduleDate.setDate(startOfWeek.getDate() + day);

    const nextDate = new Date(scheduleDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const providerIndex = day % providerIds.length;
    const providerId = providerIds[providerIndex];
    const providerName = providerNames[providerIndex] || 'Unknown Provider';

    schedules.push({
      providerId,
      providerName,
      startDate: scheduleDate,
      endDate: nextDate,
      startTime: '17:00',
      endTime: '08:00',
      type: 'PRIMARY' as OnCallType,
      status: day < now.getDay() ? 'COMPLETED' as OnCallStatus : 'SCHEDULED' as OnCallStatus,
      notes: null,
      createdBy: providerId,
    });
  }

  // Create weekend on-call
  const saturdayStart = new Date(startOfWeek);
  saturdayStart.setDate(startOfWeek.getDate() + 6);

  const mondayStart = new Date(saturdayStart);
  mondayStart.setDate(mondayStart.getDate() + 2);

  schedules.push({
    providerId: providerIds[0],
    providerName: providerNames[0] || 'Unknown Provider',
    startDate: saturdayStart,
    endDate: mondayStart,
    startTime: '00:00',
    endTime: '00:00',
    type: 'PRIMARY' as OnCallType,
    status: 'SCHEDULED' as OnCallStatus,
    notes: 'Weekend coverage',
    createdBy: providerIds[0],
  });

  return schedules;
}

/**
 * Generate sample appointment reminders
 */
export function generateSampleReminders(
  appointments: Array<{ id: string; patientId: string }>,
  templateId: string
): Array<{
  appointmentId: string;
  patientId: string;
  templateId: string;
  channel: ReminderChannel;
  reminderType: ReminderType;
  status: ReminderStatus;
  scheduledFor: Date;
  sentAt: Date | null;
  deliveredAt: Date | null;
  responseType: ConfirmationResponse | null;
  respondedAt: Date | null;
}> {
  const reminders: Array<{
    appointmentId: string;
    patientId: string;
    templateId: string;
    channel: ReminderChannel;
    reminderType: ReminderType;
    status: ReminderStatus;
    scheduledFor: Date;
    sentAt: Date | null;
    deliveredAt: Date | null;
    responseType: ConfirmationResponse | null;
    respondedAt: Date | null;
  }> = [];

  const now = new Date();
  const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  for (const appointment of appointments.slice(0, 10)) {
    // Create a reminder for each appointment
    const scheduledFor = new Date(now);
    scheduledFor.setHours(scheduledFor.getHours() - Math.floor(Math.random() * 48)); // Within past 48 hours

    const isSent = Math.random() > 0.3;
    const isDelivered = isSent && Math.random() > 0.1;
    const hasResponse = isDelivered && Math.random() > 0.5;

    reminders.push({
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      templateId,
      channel: random(['SMS', 'EMAIL'] as ReminderChannel[]),
      reminderType: 'STANDARD' as ReminderType,
      status: isSent ? (isDelivered ? 'DELIVERED' as ReminderStatus : 'SENT' as ReminderStatus) : 'SCHEDULED' as ReminderStatus,
      scheduledFor,
      sentAt: isSent ? new Date(scheduledFor.getTime() + 60000) : null, // 1 min after scheduled
      deliveredAt: isDelivered ? new Date(scheduledFor.getTime() + 120000) : null, // 2 min after scheduled
      responseType: hasResponse ? random(['CONFIRMED', 'NO_RESPONSE'] as ConfirmationResponse[]) : null,
      respondedAt: hasResponse ? new Date(scheduledFor.getTime() + 3600000) : null, // 1 hour after
    });
  }

  return reminders;
}

/**
 * Generate sample after-hours messages
 */
export function generateSampleAfterHoursMessages(
  patientIds: string[]
): Array<{
  patientId: string | null;
  callerName: string;
  callerPhone: string;
  messageType: AfterHoursMessageType;
  urgency: AfterHoursUrgency;
  routing: AfterHoursRouting;
  status: AfterHoursStatus;
  message: string;
  receivedAt: Date;
}> {
  const messages: Array<{
    patientId: string | null;
    callerName: string;
    callerPhone: string;
    messageType: AfterHoursMessageType;
    urgency: AfterHoursUrgency;
    routing: AfterHoursRouting;
    status: AfterHoursStatus;
    message: string;
    receivedAt: Date;
  }> = [];

  const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const now = new Date();

  const sampleMessages = [
    {
      callerName: 'Sarah Johnson',
      message: 'Hi, my daughter\'s wire is poking her cheek and causing bleeding. Can someone call us back?',
      urgency: 'URGENT' as AfterHoursUrgency,
      messageType: 'EMERGENCY' as AfterHoursMessageType,
    },
    {
      callerName: 'Mike Thompson',
      message: 'I need to reschedule my appointment next Tuesday. Please call me back during office hours.',
      urgency: 'ROUTINE' as AfterHoursUrgency,
      messageType: 'APPOINTMENT_REQUEST' as AfterHoursMessageType,
    },
    {
      callerName: 'Emily Davis',
      message: 'I lost my retainer on vacation. How soon can I get a replacement?',
      urgency: 'ROUTINE' as AfterHoursUrgency,
      messageType: 'GENERAL_QUESTION' as AfterHoursMessageType,
    },
  ];

  for (const sample of sampleMessages) {
    const receivedAt = new Date(now);
    receivedAt.setDate(receivedAt.getDate() - Math.floor(Math.random() * 3));
    receivedAt.setHours(19 + Math.floor(Math.random() * 3)); // 7-10 PM

    messages.push({
      patientId: patientIds.length > 0 ? random(patientIds) : null,
      callerName: sample.callerName,
      callerPhone: `555-${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      messageType: sample.messageType,
      urgency: sample.urgency,
      routing: sample.urgency === 'URGENT' || sample.urgency === 'EMERGENCY' ? 'ON_CALL_PROVIDER' as AfterHoursRouting : 'VOICEMAIL' as AfterHoursRouting,
      status: random(['PENDING', 'ACKNOWLEDGED', 'RESOLVED'] as AfterHoursStatus[]),
      message: sample.message,
      receivedAt,
    });
  }

  return messages;
}

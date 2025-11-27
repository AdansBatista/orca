# Notification Preferences (Schema)

NotificationPreference {
  id: UUID
  patientId: UUID
  channel: enum [sms,email,in-app]
  optIn: boolean
  frequency: enum [immediate,daily,summary]
  allowedDays: [mon,tue,wed,thu,fri,sat,sun]
  allowedTimeRange: { start: "08:00", end: "20:00" }
  createdAt: datetime
  updatedAt: datetime
}

Notes:
- Default is opt-in for in-app, opt-out for SMS/email unless consent captured.
- System must honor `allowedTimeRange` when scheduling sends.

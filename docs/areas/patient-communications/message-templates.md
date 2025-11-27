# Message Templates

Examples for SMS, Email, and In-App templates with variables.

SMS — Appointment Reminder
```
Hi {{firstName}}, this is a reminder for your appointment on {{appointment.date}} at {{appointment.time}}. Reply YES to confirm or NO to cancel. -- {{clinic.name}}
```

Email — Results Notification
Subject: New test results available for {{patient.lastName}}

Body:
```
Hello {{firstName}},

Your lab results for {{test.name}} are available in your patient portal. View them here: {{portal.link}}

If you have questions, reply to this email or contact {{clinic.phone}}.

Regards,
{{clinic.name}}
```

In-App — Billing Reminder
```
Invoice {{invoice.number}} for {{invoice.total}} is due on {{invoice.dueDate}}. Pay now in the Billing section.
```

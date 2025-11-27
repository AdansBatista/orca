# Patient Communications — Requirements

This document lists functional, non-functional, and compliance requirements for the Patient Communications area (Phase 2, High Priority).

Functional Requirements
- FR-PC-001: Send appointment reminders via SMS, Email, and In-App channels.
- FR-PC-002: Provide a Messaging Hub API to enqueue and route messages.
- FR-PC-003: Patient portal for authentication, profile, appointment self-service, results access, and billing payments.
- FR-PC-004: Campaign engine to create, schedule, and trigger multi-step workflows.
- FR-PC-005: Template management with versioning and variable substitution.
- FR-PC-006: Notification preferences per patient and channel (opt-in/opt-out, frequency).
- FR-PC-007: Delivery receipts and persistent message history with audit logging.
- FR-PC-008: Educational content library with personalization and scheduled delivery.

Non-Functional Requirements
- NFR-PC-001: Delivery SLA: 95th percentile under 2s for API enqueue operations.
- NFR-PC-002: Message throughput: support up to 500 req/s in peak for large practices.
- NFR-PC-003: Retry/backoff with at-least-once semantics and idempotency keys for dedup.
- NFR-PC-004: Providers must be pluggable (Twilio, Nexmo, SendGrid, SES, SMTP).
- NFR-PC-005: Data encryption at rest (AES-256) and in transit (TLS 1.2+).
- NFR-PC-006: Audit and retention policies configurable per deployment.

Compliance Requirements
- COMP-PC-001: HIPAA compliance for PHI in messages and persistence.
- COMP-PC-002: Consent tracking and per-channel opt-out processing.
- COMP-PC-003: Logging and audit trail retention aligned to policy (configurable).
- COMP-PC-004: Support for manual and automatic data purge workflows.

Acceptance & Notes
- Each critical channel (SMS/Email/In-App) must have tests and sample payloads in CI fixtures.
- Provide clear integration hooks for Booking, Treatment, Billing, CRM, and Lab areas.
# Patient Communications - Requirements

## Overview
The Patient Communications module provides comprehensive two-way communication, automated campaign management, patient self-service portal, and educational content delivery to enhance patient engagement and reduce administrative workload.

## Goals
- Enable seamless two-way communication with patients
- Automate routine patient communications
- Provide patient self-service capabilities
- Improve patient engagement and satisfaction
- Reduce front desk communication workload by 40%
- Ensure HIPAA-compliant secure messaging

## Requirements

### Two-Way Messaging Platform

#### Messaging Channels
- [ ] **SMS/Text messaging** with two-way capabilities
- [ ] **Email communication** with threading
- [ ] **Secure in-app messaging** (HIPAA-compliant)
- [ ] **Unified inbox** - all channels in one place
- [ ] **Message threading** - conversation history per patient
- [ ] **Multi-channel sync** - consistent experience across channels

#### Message Management
- [ ] **Staff assignment** for message routing
- [ ] **Message status tracking** (sent, delivered, read, replied)
- [ ] **Priority flagging** for urgent messages
- [ ] **Message templates library** for common responses
- [ ] **Canned responses** for FAQ
- [ ] **Bulk messaging** to patient segments
- [ ] **Message scheduling** - send later functionality

#### Attachments & Media
- [ ] **File attachments** (documents, images)
- [ ] **Image sharing** from patient to practice
- [ ] **Video sharing** capabilities
- [ ] **Link sharing** with click tracking
- [ ] **Size limits and file type restrictions**

### Automated Communication Workflows

#### Post-Appointment Automation
- [ ] **Same-day check-in messages** ("How are you feeling?")
- [ ] **Next-day follow-up** for specific procedures
- [ ] **Care instructions** auto-send based on procedure performed
- [ ] **Medication reminders** for prescribed treatments
- [ ] **Post-op instructions** delivery
- [ ] **Satisfaction survey** after appointments

#### Treatment Milestone Automation
- [ ] **Phase completion celebrations** (e.g., "Halfway through!")
- [ ] **Progress update notifications** with photos
- [ ] **Treatment timeline reminders** (what's coming next)
- [ ] **Retention phase transition** notifications
- [ ] **Braces-versary** (anniversary of getting braces)

#### Lifecycle Automation
- [ ] **Welcome series** for new patients
- [ ] **Appointment reminder** campaigns
- [ ] **Pre-appointment preparation** instructions
- [ ] **Birthday messages** with special offers
- [ ] **Seasonal greetings** (holidays, back-to-school)
- [ ] **Re-engagement campaigns** for inactive patients
- [ ] **Incomplete treatment follow-up**
- [ ] **Retention check-up reminders**

#### Financial Communication Automation
- [ ] **Payment reminders** before due date
- [ ] **Payment confirmation** receipts
- [ ] **Statement delivery** automation
- [ ] **Payment plan milestone** notifications
- [ ] **Balance alerts** for overdue accounts

### Patient Portal

#### Account Management
- [ ] **Patient registration** and account creation
- [ ] **Secure login** with multi-factor authentication
- [ ] **Password reset** functionality
- [ ] **Profile management** (update contact info, preferences)
- [ ] **Family member linking** for parents managing children
- [ ] **Notification preferences** (email, SMS, push)

#### Self-Service Appointment Booking
- [ ] **View available appointment slots**
- [ ] **Book appointments online** (24/7 availability)
- [ ] **Appointment type selection**
- [ ] **Provider/location selection**
- [ ] **Reschedule appointments** within policy
- [ ] **Cancel appointments** with notice period
- [ ] **Appointment confirmation** via portal
- [ ] **Add to calendar** functionality

#### Treatment Progress Viewing
- [ ] **View treatment timeline** and milestones
- [ ] **Progress photos gallery** (before/during/after)
- [ ] **Treatment plan summary**
- [ ] **Upcoming procedures** information
- [ ] **Treatment completion percentage**
- [ ] **Historical appointment record**

#### Financial Self-Service
- [ ] **View account balance** and payment history
- [ ] **Make payments online** via secure payment gateway
- [ ] **Set up automatic payments** for payment plans
- [ ] **View/download statements** and invoices
- [ ] **Payment plan details** and upcoming payments
- [ ] **Billing inquiries** submission

#### Document Management
- [ ] **Upload insurance cards** and documents
- [ ] **Upload medical forms** and health history
- [ ] **View/download consent forms**
- [ ] **Digital signature** for forms
- [ ] **Document expiration reminders**
- [ ] **Access educational materials**

#### Secure Messaging
- [ ] **Message the practice** securely
- [ ] **View message history**
- [ ] **Receive staff responses**
- [ ] **Attach photos** (e.g., broken bracket)
- [ ] **Mark messages as urgent**

### Educational Content Delivery

#### Content Library
- [ ] **Treatment phase-specific education** (what to expect next)
- [ ] **Care instruction videos** and tutorials
- [ ] **FAQ library** searchable and categorized
- [ ] **Oral hygiene tips** and best practices
- [ ] **Emergency care instructions** (what to do for common issues)
- [ ] **Appliance care guides** (retainer, braces, etc.)
- [ ] **Dietary guidelines** during treatment

#### Content Delivery
- [ ] **Automated content delivery** based on treatment phase
- [ ] **Push notifications** for new educational content
- [ ] **In-portal content recommendations**
- [ ] **Email educational series**
- [ ] **Video library** with playback tracking
- [ ] **Downloadable PDFs** for offline access

#### Interactive Tools
- [ ] **Treatment cost estimator** (self-service)
- [ ] **Virtual tour** of practice
- [ ] **Meet the team** profiles
- [ ] **Before/after gallery** showcase
- [ ] **Patient testimonials** and reviews

### Campaign Management

#### Campaign Builder
- [ ] **Drag-and-drop campaign builder**
- [ ] **Email campaign creation**
- [ ] **SMS campaign creation**
- [ ] **Multi-step drip campaigns**
- [ ] **Trigger-based automation** (event-driven)
- [ ] **A/B testing** for campaign optimization

#### Patient Segmentation
- [ ] **Segment by treatment phase**
- [ ] **Segment by demographics** (age, location)
- [ ] **Segment by engagement level**
- [ ] **Segment by financial status**
- [ ] **Custom segment creation**
- [ ] **Dynamic segments** (auto-update)

#### Campaign Analytics
- [ ] **Open rates** tracking
- [ ] **Click-through rates**
- [ ] **Response rates**
- [ ] **Conversion tracking**
- [ ] **Unsubscribe rates**
- [ ] **Campaign ROI** measurement

### Communication Templates

#### Template Library
- [ ] **Pre-built templates** for common scenarios
- [ ] **Customizable templates** per practice
- [ ] **Multi-channel templates** (email, SMS, portal)
- [ ] **Personalization variables** (patient name, appointment time, etc.)
- [ ] **Rich text editor** for email templates
- [ ] **Template versioning** and history
- [ ] **Template categories** for organization

#### Common Template Types
- [ ] **Appointment confirmations**
- [ ] **Appointment reminders**
- [ ] **Appointment rescheduling requests**
- [ ] **Payment reminders**
- [ ] **Treatment phase transitions**
- [ ] **Emergency instructions**
- [ ] **Satisfaction surveys**
- [ ] **Re-engagement messages**

### Communication Analytics

#### Performance Metrics
- [ ] **Message volume** by channel
- [ ] **Response time** tracking
- [ ] **Staff productivity** metrics
- [ ] **Patient engagement scores**
- [ ] **Communication preferences** analysis
- [ ] **Peak communication times**

#### Patient Engagement Tracking
- [ ] **Portal login frequency**
- [ ] **Message interaction rates**
- [ ] **Content consumption** tracking
- [ ] **Self-service adoption** rates
- [ ] **Satisfaction scores** correlation

### Compliance & Security

#### HIPAA Compliance
- [ ] **Encrypted messaging** at rest and in transit
- [ ] **Access controls** and permissions
- [ ] **Audit logging** of all communications
- [ ] **Patient consent** for communication channels
- [ ] **Right to opt-out** functionality
- [ ] **Data retention policies**
- [ ] **Secure file sharing**

#### Communication Preferences
- [ ] **Patient communication channel preferences**
- [ ] **Opt-in/opt-out management**
- [ ] **Do not disturb hours** respect
- [ ] **Communication frequency limits**
- [ ] **Unsubscribe handling**

## Features
See [features.md](./features.md) for detailed feature specifications.

---

**Status**: Draft
**Last Updated**: 2025-11-26

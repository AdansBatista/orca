# Orca

> **O**rthodontic **R**ecords & **C**linical **A**dministration

**Modern Practice Management System for Orthodontics Clinics**

Orca is the state of the art and comprehensive, web-based practice management system designed to handle all facets of orthodontics practicesfrom patient care and treatment management to administrative operations and financial oversight. Built for small to medium-sized orthodontics clinics, Orca empowers orthodontist-owners with modern tools to efficiently manage both the clinical and business aspects of their practice.

---

## Overview

Orca solves the challenge of managing complex orthodontic practices by providing an integrated platform that handles:

- **Clinical Operations**: Patient lifecycle, treatment management, and imaging
- **Administrative Tasks**: Staff management, resource allocation, and vendor relationships
- **Financial Management**: Billing, insurance parties, and comprehensive financial oversight
- **AI-Powered Insights**: Intelligent assistance across all features to enhance decision-making and efficiency

---

## Target Audience

- Small to medium-sized orthodontics clinics
- Orthodontist-owners seeking comprehensive practice management
- Practices looking for secure, on-premises solutions with modern capabilities

---

## Core Features

### 1. **CRM & Patient Onboarding**

Streamlined new patient intake and relationship management to ensure smooth onboarding experiences.

### 2. **Booking & Scheduling**

Intelligent appointment scheduling system to optimize clinic resources and patient flow.

### 3. **Patient Treatment Cycle Management**

Complete lifecycle tracking from initial consultation through treatment completion and retention.

### 4. **Staff Management**

Team coordination, scheduling, roles, and performance tracking.

### 5. **Resources Management**

Equipment, rooms, and material inventory management.

### 6. **Vendors Management**

Supplier relationships, ordering, and vendor performance tracking.

### 7. **Patient Imaging Management**

Secure storage and management of x-rays, photos, scans, and other diagnostic imaging.

### 8. **Financial Management**

Comprehensive financial oversight including budgeting, reporting, and analytics.

### 9. **Billing & Insurance Parties Management**

Patient billing, insurance claims processing, and multi-party payment coordination.

### AI Support

Artificial intelligence capabilities integrated throughout all features to provide:

- Structured data analysis and extraction. E.g. Faxes and letters from Insurance and reconciliation with patient info.
- Automated data entry and validation
- Predictive analytics

---

## Tech Stack

- **Frontend Framework**: Next.js (React-based)
- **Database**: MongoDB with Prisma ORM
- **Platform**: Web-based (desktop browsers only, no mobile views initially)
- **Authentication**: Multi-clinic authentication system (reused from existing infrastructure)
- **AI Integration**: External AI services via outbound internet connections

---

## Architecture

### On-Premises Deployment Model

Orca is designed for secure, local deployment with the following architecture:

- **Local Server**: Practice-hosted on-premises server
- **Network Security**:
  - Firewall protection
  - MAC address whitelist
  - IP address whitelist
- **Data Privacy**: All patient and practice data stored locally
- **Limited Internet Access**: Outbound-only connections exclusively for AI service integration
- **Multi-Clinic Support**: Built on proven multi-tenant architecture from existing applications. Secure VPN sync data between clinic's geolocation.

### Deployment Pipeline

```
Development Machine � Internal Staging Site � Production (On-Premises)
```

Manual deployment process ensures complete control over what code runs in production environments.

---

## Project Status

=� **Currently Starting Development**

The project is in its initial development phase. Core infrastructure and foundational features are being built.

---

## Development Notes

- Reusing authentication and multi-clinic structure from existing Next.js/MongoDB/Prisma applications
- Desktop-first approach; mobile views may be added for specific use cases in the future
- Focus on security, data privacy, and, PIPEDA HIPAA compliance considerations

---

## Security & Compliance

Given the sensitive nature of patient health information, Orca is built with security as a foundational requirement:

- On-premises data storage
- Whitelist-based access control
- Minimal to non internet exposure
- Secure authentication and authorization
- Audit logging capabilities

---

## License

Private

---

## Contact

Adans Schmidt Batista - adans.bat@gmail.com

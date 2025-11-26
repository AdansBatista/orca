# System Architecture

## Overview
Orca is built on a modern web-based architecture designed for secure, on-premises deployment with minimal internet exposure.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Practice Network                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Client Browsers (Desktop)                  │ │
│  │              Chrome, Edge, Firefox, Safari              │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │ HTTPS                                │
│  ┌────────────────────▼───────────────────────────────────┐ │
│  │           On-Premises Application Server                │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │         Next.js Application                       │  │ │
│  │  │  - Server-Side Rendering (SSR)                    │  │ │
│  │  │  - API Routes                                     │  │ │
│  │  │  - Authentication & Authorization                 │  │ │
│  │  │  - Business Logic                                 │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │         Prisma ORM                                │  │ │
│  │  │  - Database Abstraction                           │  │ │
│  │  │  - Query Builder                                  │  │ │
│  │  │  - Migrations                                     │  │ │
│  │  └──────────────────┬───────────────────────────────┘  │ │
│  └────────────────────┼───────────────────────────────────┘ │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────────┐ │
│  │           MongoDB Database Server                       │ │
│  │  - Patient Records                                      │ │
│  │  - Treatment Data                                       │ │
│  │  - Financial Records                                    │ │
│  │  - Images & Documents                                   │ │
│  │  - Encrypted at Rest                                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │              Network Security Layer                       ││
│  │  - Firewall                                               ││
│  │  - MAC Address Whitelist                                  ││
│  │  - IP Address Whitelist                                   ││
│  │  - VPN (Multi-Location Sync)                              ││
│  └──────────────────┬───────────────────────────────────────┘│
└────────────────────┼────────────────────────────────────────┘
                     │ Outbound Only
                     │ (AI Services)
          ┌──────────▼──────────┐
          │   Internet Cloud    │
          │   - AI/ML APIs      │
          │   - OCR Services    │
          │   - NLP Services    │
          └─────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15+ (React 19+)
- **Language**: TypeScript
- **Styling**: TailwindCSS / CSS Modules
- **State Management**: React Context API / Zustand
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Custom component library (or shadcn/ui)
- **Charts**: Recharts / Chart.js
- **Image Viewing**: Custom image viewer for DICOM and medical images

### Backend
- **Framework**: Next.js API Routes
- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **ORM**: Prisma
- **Authentication**: NextAuth.js (adapted from existing apps)
- **File Storage**: Local file system (encrypted)
- **Session Management**: Server-side sessions

### Database
- **Primary Database**: MongoDB
- **Schema Management**: Prisma schema
- **Backup**: Automated daily backups
- **Replication**: Multi-location sync via VPN

### Security
- **Encryption at Rest**: Database encryption
- **Encryption in Transit**: TLS/SSL (HTTPS)
- **Authentication**: Multi-factor authentication (MFA)
- **Authorization**: Role-Based Access Control (RBAC)
- **Session Security**: HTTP-only cookies, CSRF protection
- **Audit Logging**: Comprehensive activity logging

### DevOps
- **Version Control**: Git
- **Deployment**: Manual deployment scripts
- **Environment Management**: .env files per environment
- **Monitoring**: Local logging and monitoring
- **Backup**: Automated backup scripts

## Application Modules

Orca is organized into functional modules that cover all aspects of orthodontic practice management:

### Core Clinical Modules
| Module | Description | Key Features |
|--------|-------------|--------------|
| **Treatment Management** | Patient treatment lifecycle | Treatment plans, procedures, progress tracking, clinical notes |
| **Imaging Management** | Diagnostic imaging | Image capture, storage, viewing, DICOM support, progress photos |
| **Lab Work Management** | External lab coordination | Lab orders, vendor management, order tracking, quality control |

### Operations Modules
| Module | Description | Key Features |
|--------|-------------|--------------|
| **Booking & Scheduling** | Appointment management | Calendar, scheduling, waitlist, appointment types |
| **Practice Orchestration** | Real-time operations | Daily dashboard, patient flow, status tracking, alerts |
| **Staff Management** | Team coordination | Schedules, roles, assignments, performance tracking |
| **Resources Management** | Physical resources | Chairs, rooms, equipment, availability tracking |

### Administrative Modules
| Module | Description | Key Features |
|--------|-------------|--------------|
| **CRM & Patient Onboarding** | Patient acquisition | Lead management, intake forms, referral tracking |
| **Patient Communications** | Patient engagement | Messaging hub, patient portal, campaigns, education |
| **Vendors Management** | Supplier relationships | Vendor directory, contracts, orders, payments |

### Financial Modules
| Module | Description | Key Features |
|--------|-------------|--------------|
| **Financial Management** | Practice finances | Revenue tracking, expenses, reporting, analytics |
| **Billing & Insurance** | Revenue cycle | Claims processing, invoicing, payment plans, EOBs |

### Compliance Module
| Module | Description | Key Features |
|--------|-------------|--------------|
| **Compliance & Documentation** | Regulatory compliance | HIPAA/PIPEDA, consent forms, protocols, training, audits |

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Orca Application Modules                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Practice Orchestration                        │    │
│  │              (Real-time Operations Dashboard)                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│  ┌──────────────┬──────────────┬───┴───┬──────────────┬────────────┐    │
│  │              │              │       │              │            │    │
│  ▼              ▼              ▼       ▼              ▼            ▼    │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│ │Booking │ │Treatment│ │Imaging │ │ Staff  │ │Resource│ │Lab Work│      │
│ │Schedule│ │  Mgmt   │ │  Mgmt  │ │  Mgmt  │ │  Mgmt  │ │  Mgmt  │      │
│ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘      │
│                                                                          │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐          │
│  │              │              │              │              │          │
│  ▼              ▼              ▼              ▼              ▼          │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐              │
│ │  CRM   │ │Patient │ │Financial│ │Billing │ │ Compliance │              │
│ │Onboard │ │ Comms  │ │  Mgmt   │ │Insuranc│ │   & Docs   │              │
│ └────────┘ └────────┘ └────────┘ └────────┘ └────────────┘              │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      Vendors Management                          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Architecture

### Data Models (High-Level)

#### Core Entities
```
Patient
├── Demographics
├── Insurance Information
├── Contacts & Relationships
├── Medical History
├── Treatment Plans
├── Appointments
├── Images
└── Financial Records

Clinic (Multi-Tenant)
├── Settings
├── Staff Members
├── Resources (Chairs, Equipment)
├── Vendors
├── Financial Data
└── Custom Configurations

User
├── Profile
├── Role & Permissions
├── Clinic Associations
└── Activity Logs

Appointment
├── Patient Reference
├── Provider Reference
├── Resource Allocation
├── Treatment Association
└── Status & History

Treatment
├── Patient Reference
├── Treatment Plan
├── Procedures
├── Progress Notes
├── Timeline
└── Associated Images

Financial
├── Invoices
├── Payments
├── Insurance Claims
├── Payment Plans
└── Transactions

Lab Work
├── Lab Orders
├── Vendor Reference
├── Patient/Treatment Reference
├── Order Status & Tracking
├── Quality Control Records
└── Delivery Schedule

Communications
├── Message Threads
├── Templates
├── Campaigns
├── Patient Portal Access
└── Communication Preferences

Compliance & Documentation
├── Consent Forms
├── Clinical Protocols
├── Staff Certifications
├── Incident Reports
├── Audit Records
└── Safety Data Sheets

CRM & Onboarding
├── Leads
├── Referral Sources
├── Intake Forms
├── Referral Network
└── Records Requests
```

### Database Design Principles
- **Multi-tenancy**: Clinic-based data isolation
- **Soft deletes**: Maintain data integrity and audit trails
- **Versioning**: Track changes to critical records
- **Denormalization**: Strategic denormalization for performance
- **Indexing**: Optimize for common query patterns

## Security Architecture

### Network Security
```
┌─────────────────────────────────────────────┐
│          Practice Internal Network          │
│  ┌───────────────────────────────────────┐ │
│  │        Firewall Rules                  │ │
│  │  - Deny all inbound by default         │ │
│  │  - Allow outbound to AI services only  │ │
│  │  - Allow VPN for multi-location sync   │ │
│  └───────────────────────────────────────┘ │
│  ┌───────────────────────────────────────┐ │
│  │     Access Control Lists               │ │
│  │  - MAC address whitelist               │ │
│  │  - IP address whitelist                │ │
│  │  - Device registration required        │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Application Security
- **Authentication**: NextAuth.js with multi-factor authentication
- **Authorization**: Role-based permissions at route and component level
- **Input Validation**: Zod schemas for all user inputs
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **XSS Prevention**: React auto-escaping + CSP headers
- **CSRF Protection**: Token-based CSRF protection
- **Rate Limiting**: API rate limiting to prevent abuse
- **Session Management**: Secure session handling with timeout

### Data Security
- **Encryption at Rest**: MongoDB encryption
- **Encryption in Transit**: TLS 1.3
- **File Encryption**: Patient images and documents encrypted
- **Backup Encryption**: Encrypted backups
- **Key Management**: Secure key storage and rotation

### Compliance
- **HIPAA**: Health Insurance Portability and Accountability Act
- **PIPEDA**: Personal Information Protection and Electronic Documents Act
- **Audit Logging**: Comprehensive activity and access logs
- **Data Retention**: Configurable retention policies
- **Right to Access**: Patient data export capabilities

## Deployment Architecture

### Environment Structure

#### Development Environment
- Developer local machines
- Local MongoDB instance
- Hot reload for development
- Debug logging enabled

#### Staging Environment
- On-premises staging server at practice
- Mirrors production configuration
- Used for testing before production deployment
- Accessible only from practice network

#### Production Environment
- On-premises production server at practice
- High availability configuration
- Daily automated backups
- Monitoring and alerting

### Deployment Pipeline

```
┌─────────────────┐
│  Development    │
│    Machine      │
│                 │
│  - Git commit   │
│  - Run tests    │
│  - Build app    │
└────────┬────────┘
         │ Manual Deploy
         │ (Secure copy)
┌────────▼────────┐
│     Staging     │
│   Environment   │
│                 │
│  - Integration  │
│  - User testing │
│  - Validation   │
└────────┬────────┘
         │ Manual Promotion
         │ (After approval)
┌────────▼────────┐
│   Production    │
│   Environment   │
│                 │
│  - Live system  │
│  - Monitoring   │
│  - Backups      │
└─────────────────┘
```

### Deployment Process
1. Code developed and tested locally
2. Build production bundle
3. Run automated tests
4. Copy build to staging server
5. Test in staging environment
6. Practice staff validation
7. Manual promotion to production
8. Verify production deployment
9. Monitor for issues

## Multi-Clinic Architecture

### Data Isolation
- Each clinic has isolated data partition
- Clinic ID included in all queries
- Row-level security ensures data separation

### VPN Synchronization
```
Clinic A (Location 1)         Clinic B (Location 2)
┌─────────────────┐          ┌─────────────────┐
│  Local Server   │          │  Local Server   │
│  + Database     │◄────────►│  + Database     │
└─────────────────┘   VPN    └─────────────────┘
                      Sync
```

### Sync Strategy
- **Real-time**: Critical data (appointments, patient updates)
- **Scheduled**: Less critical data (reports, analytics)
- **Conflict Resolution**: Last-write-wins with manual review option
- **Offline Capability**: Each location operates independently

## Scalability Considerations

### Vertical Scaling
- Increase server resources as practice grows
- MongoDB vertical scaling for larger datasets

### Horizontal Scaling (Future)
- Read replicas for reporting queries
- Separate application and database servers
- Load balancing for multiple app instances

### Performance Optimization
- Database indexing strategy
- Query optimization
- Caching strategy (Redis/in-memory)
- Image optimization and lazy loading
- Code splitting and lazy loading

## Monitoring & Maintenance

### Logging
- Application logs (errors, warnings, info)
- Access logs (authentication, authorization)
- Audit logs (data changes, user actions)
- Performance logs (slow queries, bottlenecks)

### Monitoring
- Server resource utilization
- Database performance
- Application error rates
- User activity metrics
- Backup success/failure

### Backup Strategy
- **Frequency**: Daily automated backups
- **Retention**: 30 days rolling
- **Storage**: Encrypted local storage + off-site
- **Testing**: Monthly restore testing
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 24 hours

## Integration Points

### External AI Services
- **Connection**: HTTPS outbound only
- **Data**: Anonymized when possible
- **Fallback**: Local operation if unavailable
- **APIs**: OpenAI, Google Cloud AI, AWS AI services

### Future Integrations
- Imaging equipment (intraoral cameras, x-ray)
- Payment processors (for online payments)
- Email services (for patient communication)
- SMS gateways (for appointment reminders)

---

**Status**: Draft
**Last Updated**: 2025-11-26

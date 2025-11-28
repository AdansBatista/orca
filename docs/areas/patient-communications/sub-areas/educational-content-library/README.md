# Educational Content Library

> **Sub-Area**: Educational Content Library
>
> **Area**: Patient Communications (2.4)
>
> **Purpose**: Repository of patient education materials for orthodontic care, supporting curated content delivery based on treatment phase and patient needs

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Medium |
| **Complexity** | Medium |
| **Functions** | 5 |

---

## Overview

The Educational Content Library provides a centralized repository of patient education materials covering orthodontic care, treatment phases, compliance instructions, and FAQs. Content can be automatically delivered based on treatment milestones or manually shared by staff.

### Key Capabilities

- Curated orthodontic content library
- Multi-format support (text, video, PDF)
- Treatment phase-specific content
- Automated delivery based on milestones
- Multi-language support
- Patient-facing knowledge base

---

## Functions

| # | Function | Description | Priority |
|---|----------|-------------|----------|
| 1 | [Content Management & Curation](./functions/content-management-curation.md) | Manage educational content library | High |
| 2 | [Patient Education Delivery](./functions/patient-education-delivery.md) | Deliver content to patients | High |
| 3 | [Content Personalization](./functions/content-personalization.md) | Personalize content by patient | Medium |
| 4 | [FAQ & Knowledge Base](./functions/faq-knowledge-base.md) | Patient-facing help center | Medium |
| 5 | [Tagging & Metadata](./functions/tagging-metadata.md) | Organize and categorize content | Medium |

---

## Function Details

### Content Management & Curation

Manage the educational content library.

**Key Features:**
- Content editor (rich text, markdown)
- Media upload (videos, PDFs, images)
- Content versioning
- Draft/publish workflow
- Content expiration/archival
- Import from external sources

---

### Patient Education Delivery

Deliver educational content to patients.

**Key Features:**
- Manual content sharing
- Automated delivery rules
- Email/portal delivery
- Delivery tracking
- Read receipts
- Content engagement analytics

---

### Content Personalization

Personalize content based on patient context.

**Key Features:**
- Treatment type filtering (braces, aligners)
- Age-appropriate content (kids, teens, adults)
- Phase-specific content
- Language preferences
- AI-powered recommendations
- Custom content assignments

---

### FAQ & Knowledge Base

Patient-facing FAQ and help center.

**Key Features:**
- Searchable FAQ database
- Category organization
- Popular/featured questions
- Contact escalation
- Analytics on searches
- Integration with portal

---

### Tagging & Metadata

Organize content with tags and metadata.

**Key Features:**
- Tag management
- Category hierarchy
- Treatment phase mapping
- Search indexing
- Content relationships
- Bulk tagging

---

## Data Model

### Prisma Schema

```prisma
model ContentArticle {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String?           @db.ObjectId  // Null for global content

  title           String
  slug            String
  summary         String?
  body            String            // Rich text/markdown

  // Media
  featuredImage   String?
  attachments     Json?             // Array of attachment URLs
  videoUrl        String?

  // Organization
  category        String
  tags            String[]
  treatmentTypes  String[]          // braces, aligners, etc.
  treatmentPhases String[]          // pre-treatment, active, retention
  ageGroups       String[]          // child, teen, adult
  languages       String[]          @default(["en"])

  // Status
  status          ContentStatus     // DRAFT, PUBLISHED, ARCHIVED
  publishedAt     DateTime?
  expiresAt       DateTime?

  // Metrics
  viewCount       Int               @default(0)
  shareCount      Int               @default(0)

  // SEO
  metaTitle       String?
  metaDescription String?

  // Audit
  createdBy       String            @db.ObjectId
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  clinic          Clinic?           @relation(fields: [clinicId], references: [id])
  deliveries      ContentDelivery[]

  @@unique([clinicId, slug])
  @@index([clinicId, category])
  @@index([clinicId, status])
  @@index([tags])
}

model ContentDelivery {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String            @db.ObjectId
  articleId       String            @db.ObjectId
  patientId       String            @db.ObjectId

  // Delivery method
  method          DeliveryMethod    // EMAIL, PORTAL, SMS_LINK

  // Status
  deliveredAt     DateTime          @default(now())
  viewedAt        DateTime?

  // Context
  triggeredBy     String?           // Event or manual
  sentBy          String?           @db.ObjectId

  // Relations
  clinic          Clinic            @relation(fields: [clinicId], references: [id])
  article         ContentArticle    @relation(fields: [articleId], references: [id])
  patient         Patient           @relation(fields: [patientId], references: [id])

  @@index([clinicId, patientId])
  @@index([articleId])
}

model ContentCategory {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String?           @db.ObjectId  // Null for global

  name            String
  slug            String
  description     String?
  parentId        String?           @db.ObjectId
  order           Int               @default(0)

  icon            String?
  color           String?

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  clinic          Clinic?           @relation(fields: [clinicId], references: [id])
  parent          ContentCategory?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  children        ContentCategory[] @relation("CategoryHierarchy")

  @@unique([clinicId, slug])
}

model FAQItem {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String?           @db.ObjectId  // Null for global

  question        String
  answer          String
  category        String
  tags            String[]

  // Display
  order           Int               @default(0)
  isFeatured      Boolean           @default(false)

  // Metrics
  viewCount       Int               @default(0)
  helpfulCount    Int               @default(0)
  notHelpfulCount Int               @default(0)

  // Status
  isActive        Boolean           @default(true)

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  clinic          Clinic?           @relation(fields: [clinicId], references: [id])

  @@index([clinicId, category])
  @@index([clinicId, isActive])
}

enum ContentStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum DeliveryMethod {
  EMAIL
  PORTAL
  SMS_LINK
  IN_APP
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/content/articles` | List articles |
| POST | `/api/v1/content/articles` | Create article |
| GET | `/api/v1/content/articles/:id` | Get article |
| PUT | `/api/v1/content/articles/:id` | Update article |
| DELETE | `/api/v1/content/articles/:id` | Delete article |
| POST | `/api/v1/content/articles/:id/publish` | Publish article |
| POST | `/api/v1/content/articles/:id/deliver` | Deliver to patient |
| GET | `/api/v1/content/categories` | List categories |
| GET | `/api/v1/content/faq` | List FAQ items |
| GET | `/api/portal/content` | Patient portal - list content |
| GET | `/api/portal/content/:slug` | Patient portal - get article |
| GET | `/api/portal/faq` | Patient portal - get FAQ |

---

## UI Components

### Staff-Facing

| Component | Description |
|-----------|-------------|
| `ContentLibrary` | Browse and search content |
| `ArticleEditor` | Create/edit articles |
| `ContentDeliveryDialog` | Send content to patient |
| `CategoryManager` | Manage categories |
| `FAQManager` | Manage FAQ items |
| `ContentAnalytics` | View engagement metrics |

### Patient-Facing (Portal)

| Component | Description |
|-----------|-------------|
| `EducationCenter` | Browse educational content |
| `ArticleViewer` | Read article with media |
| `FAQSearch` | Search and browse FAQ |
| `MyContent` | Content shared with patient |

---

## Pre-Loaded Content Categories

| Category | Description |
|----------|-------------|
| **Getting Started** | New patient orientation |
| **Braces Care** | Caring for traditional braces |
| **Aligner Care** | Invisalign/clear aligner guidance |
| **Oral Hygiene** | Brushing, flossing, cleaning |
| **Diet & Eating** | What to eat/avoid |
| **Emergencies** | Handling common issues |
| **Appointments** | What to expect at visits |
| **Compliance** | Elastics, wear time, etc. |
| **Retention** | Retainer care and wear |
| **General Orthodontics** | How treatment works |

---

## Orthodontic Content Examples

### By Treatment Phase

| Phase | Content Examples |
|-------|------------------|
| **Pre-Treatment** | What to expect, treatment options, financial info |
| **Bonding Day** | Day of braces guide, first 24 hours tips |
| **Active Treatment** | Monthly care guides, elastics instructions |
| **Debonding** | What to expect, retainer intro |
| **Retention** | Retainer wear schedule, long-term care |

### By Treatment Type

| Type | Content Examples |
|------|------------------|
| **Traditional Braces** | Wire and bracket care, wax use, food guide |
| **Clear Aligners** | Wear time, switching aligners, cleaning trays |
| **Expanders** | Turning instructions, care tips |
| **Retainers** | Cleaning, storage, wear schedule |

---

## Business Rules

1. **Global vs Clinic Content**: Global content available to all; clinic content is private
2. **Auto-Delivery**: Content can auto-deliver based on treatment events
3. **Language Matching**: Deliver in patient's preferred language when available
4. **Expiration**: Expired content auto-archived
5. **Version Control**: Major changes create new version
6. **Engagement Tracking**: Track views but respect privacy

---

## Dependencies

- **Messaging Hub**: For content delivery via email/SMS
- **Patient Portal**: For content display in portal
- **Treatment Management**: For phase-based delivery triggers
- **Automated Campaigns**: For scheduled content delivery

---

## Related Documentation

- [Patient Communications Overview](../../README.md)
- [Messaging Hub](../messaging-hub/)
- [Automated Campaigns](../automated-campaigns/)
- [Patient Portal](../patient-portal/)

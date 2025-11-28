# AI Manager

> **Sub-Area**: AI Manager
>
> **Area**: Practice Orchestration (2.3)
>
> **Purpose**: AI-powered operational assistant providing natural language queries, anomaly detection, schedule optimization, and intelligent task generation

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Medium |
| **Complexity** | High |
| **Functions** | 4 |

---

## Overview

The AI Manager is an intelligent assistant that helps practice managers and staff make data-driven operational decisions. It provides natural language interaction, proactive anomaly detection, schedule optimization suggestions, and automated task prioritization.

### Key Capabilities

- Natural language queries about operations
- Anomaly detection and alerts
- Schedule optimization recommendations
- Automated daily task generation
- Predictive analytics
- What-if scenario modeling

---

## Functions

| # | Function | Description | Priority |
|---|----------|-------------|----------|
| 1 | [Natural Language Queries](./functions/natural-language-queries.md) | Ask questions in natural language | High |
| 2 | [Anomaly Detection](./functions/anomaly-detection.md) | Detect operational anomalies | High |
| 3 | [Schedule Optimization](./functions/schedule-optimization.md) | Optimize schedules and reduce gaps | Medium |
| 4 | [Task Generation](./functions/task-generation.md) | Auto-generate priority tasks | Medium |

---

## Function Details

### Natural Language Queries

Ask questions about operations in natural language.

**Key Features:**
- Conversational interface
- Context-aware responses
- Data-driven answers
- Follow-up questions
- Query history
- Suggested queries

**Example Queries:**
- "Who's running behind today?"
- "Show me patients waiting over 15 minutes"
- "What's chair 3's utilization this week?"
- "Are there any schedule gaps I can fill?"
- "How does today compare to last Tuesday?"

---

### Anomaly Detection

Detect and alert on operational anomalies.

**Key Features:**
- Real-time monitoring
- Pattern-based detection
- Threshold alerts
- Trend deviations
- Proactive notifications
- Root cause suggestions

**Detected Anomalies:**
- Unusual appointment lengths
- Excessive wait times
- Higher than normal no-shows
- Equipment issues
- Schedule conflicts
- Resource bottlenecks

---

### Schedule Optimization

Provide recommendations to optimize schedules.

**Key Features:**
- Gap identification
- Fill recommendations
- Overbooking detection
- Provider balancing
- Peak/off-peak analysis
- What-if modeling

**Recommendations:**
- "There's a 30-min gap at 2pm. Patient Jones needs a quick adjustment."
- "Dr. Smith is overbooked; consider moving 3pm to Dr. Brown."
- "Tomorrow has 3 gaps. These patients need retainer checks."

---

### Task Generation

Auto-generate daily operational tasks.

**Key Features:**
- Morning briefing tasks
- Priority-ranked list
- Context-aware generation
- Assignment suggestions
- Completion tracking
- Recurring patterns

**Generated Tasks:**
- "Call 3 patients who no-showed yesterday"
- "Chair 2 maintenance due this week"
- "Review patients with outstanding balances"
- "Confirm tomorrow's new patient appointments"

---

## Data Model

### Prisma Schema

```prisma
model AIQuery {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String            @db.ObjectId
  userId          String            @db.ObjectId

  // Query
  query           String
  context         Json?             // Current dashboard context

  // Response
  response        String
  responseData    Json?             // Structured data in response
  confidence      Float?

  // Feedback
  wasHelpful      Boolean?
  feedback        String?

  createdAt       DateTime          @default(now())

  // Relations
  clinic          Clinic            @relation(fields: [clinicId], references: [id])
  user            User              @relation(fields: [userId], references: [id])

  @@index([clinicId, createdAt])
  @@index([userId])
}

model AIAnomaly {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String            @db.ObjectId

  type            AnomalyType
  severity        AnomalySeverity

  // Details
  title           String
  description     String
  affectedEntity  String?           // appointment, resource, staff
  affectedId      String?           @db.ObjectId

  // Detection
  detectedAt      DateTime          @default(now())
  detectionMetric String?
  expectedValue   Float?
  actualValue     Float?
  deviation       Float?

  // Resolution
  status          AnomalyStatus     // ACTIVE, ACKNOWLEDGED, RESOLVED, DISMISSED
  acknowledgedAt  DateTime?
  acknowledgedBy  String?           @db.ObjectId
  resolvedAt      DateTime?
  resolution      String?

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  clinic          Clinic            @relation(fields: [clinicId], references: [id])

  @@index([clinicId, status])
  @@index([clinicId, type])
  @@index([clinicId, detectedAt])
}

model AIRecommendation {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String            @db.ObjectId

  type            RecommendationType
  priority        RecommendationPriority

  // Content
  title           String
  description     String
  actionItems     Json?             // Array of suggested actions

  // Context
  relatedEntity   String?
  relatedId       String?           @db.ObjectId
  validUntil      DateTime?

  // Status
  status          RecommendationStatus // PENDING, ACCEPTED, DISMISSED, EXPIRED
  acceptedAt      DateTime?
  acceptedBy      String?           @db.ObjectId
  outcome         String?

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  clinic          Clinic            @relation(fields: [clinicId], references: [id])

  @@index([clinicId, status])
  @@index([clinicId, type])
}

model AIGeneratedTask {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String            @db.ObjectId

  // Task details
  title           String
  description     String?
  category        String

  // Generation context
  generationReason String
  confidenceScore Float?

  // Assignment
  suggestedAssignee String?         @db.ObjectId
  assignedTo      String?           @db.ObjectId

  // Timing
  suggestedDueAt  DateTime?
  dueAt           DateTime?

  // Status
  status          TaskStatus        // PENDING, ACCEPTED, COMPLETED, DISMISSED

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  clinic          Clinic            @relation(fields: [clinicId], references: [id])

  @@index([clinicId, status])
  @@index([clinicId, createdAt])
}

enum AnomalyType {
  LONG_APPOINTMENT
  EXCESSIVE_WAIT
  HIGH_NO_SHOW_RATE
  EQUIPMENT_ISSUE
  SCHEDULE_CONFLICT
  UNUSUAL_CANCELLATION
  RESOURCE_BOTTLENECK
  STAFF_OVERLOAD
}

enum AnomalySeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum AnomalyStatus {
  ACTIVE
  ACKNOWLEDGED
  RESOLVED
  DISMISSED
}

enum RecommendationType {
  SCHEDULE_OPTIMIZATION
  RESOURCE_ALLOCATION
  STAFFING_SUGGESTION
  PATIENT_OUTREACH
  MAINTENANCE_REMINDER
  CAPACITY_PLANNING
}

enum RecommendationPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum RecommendationStatus {
  PENDING
  ACCEPTED
  DISMISSED
  EXPIRED
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ops/ai/query` | Submit natural language query |
| GET | `/api/v1/ops/ai/queries` | Get query history |
| GET | `/api/v1/ops/ai/anomalies` | Get active anomalies |
| PUT | `/api/v1/ops/ai/anomalies/:id/acknowledge` | Acknowledge anomaly |
| PUT | `/api/v1/ops/ai/anomalies/:id/resolve` | Resolve anomaly |
| GET | `/api/v1/ops/ai/recommendations` | Get recommendations |
| PUT | `/api/v1/ops/ai/recommendations/:id/accept` | Accept recommendation |
| PUT | `/api/v1/ops/ai/recommendations/:id/dismiss` | Dismiss recommendation |
| GET | `/api/v1/ops/ai/tasks` | Get AI-generated tasks |
| POST | `/api/v1/ops/ai/tasks/generate` | Trigger task generation |
| PUT | `/api/v1/ops/ai/tasks/:id/accept` | Accept generated task |

---

## UI Components

| Component | Description |
|-----------|-------------|
| `AIManagerChat` | Natural language query interface |
| `QueryInput` | Query input with suggestions |
| `AIResponse` | Formatted AI response display |
| `AnomalyAlert` | Single anomaly notification |
| `AnomalyList` | List of active anomalies |
| `RecommendationCard` | Single recommendation display |
| `RecommendationPanel` | Recommendations sidebar |
| `AITaskList` | AI-generated tasks list |
| `DailyBriefing` | Morning AI briefing view |
| `InsightsWidget` | AI insights dashboard widget |

---

## Example Queries & Responses

### Operational Status
**Query:** "How are we doing today?"
**Response:** "Today is going well. 45 of 52 scheduled patients have been seen. Average wait time is 8 minutes (below your 10-minute target). Chair utilization is at 78%. Two patients are currently waiting."

### Wait Times
**Query:** "Who's been waiting the longest?"
**Response:** "Sarah Johnson has been waiting 18 minutes (scheduled for Dr. Smith at 2:30). This is above your 15-minute threshold. Chair 3 is about to free up."

### Schedule Gaps
**Query:** "Do we have any gaps tomorrow?"
**Response:** "Tomorrow has 3 gaps totaling 90 minutes: 10:00-10:30 (Chair 2), 2:00-2:30 (Chair 1), 3:30-4:00 (Chair 3). I found 5 patients due for quick adjustments who could fill these slots."

### Comparative Analysis
**Query:** "How does this week compare to last week?"
**Response:** "This week you've seen 12% more patients (187 vs 167). No-show rate improved from 8% to 5%. Average wait time is up slightly (9 min vs 7 min)."

---

## Business Rules

1. **Query Limits**: Max 100 queries per user per day
2. **Response Time**: Queries should respond within 3 seconds
3. **Data Access**: AI respects role-based data access
4. **Anomaly Thresholds**: Configurable per clinic
5. **Task Generation**: Daily tasks generated at 6 AM
6. **Recommendation Expiry**: Schedule recommendations expire when slot passes
7. **Feedback Loop**: User feedback improves recommendations

---

## Dependencies

- **Operations Dashboard**: Data source for metrics
- **Patient Flow Management**: Real-time flow data
- **Resource Coordination**: Resource utilization data
- **Booking & Scheduling**: Schedule data

---

## Related Documentation

- [Practice Orchestration Overview](../../README.md)
- [Operations Dashboard](../operations-dashboard/)
- [AI Integration Guide](../../../../guides/AI-INTEGRATION.md)

# Natural Language Queries

> **Sub-Area**: [AI Manager](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Natural Language Queries enables staff to ask questions about clinic operations using conversational language. The AI interprets queries, retrieves relevant data, and provides context-aware responses with data-driven answers, supporting follow-up questions and maintaining query history.

---

## Core Requirements

- [ ] Parse natural language queries about operations
- [ ] Map queries to appropriate data sources
- [ ] Generate context-aware responses with data
- [ ] Support follow-up questions maintaining context
- [ ] Maintain query history per user
- [ ] Provide suggested queries based on context
- [ ] Handle ambiguous queries with clarification
- [ ] Return structured data alongside narrative response
- [ ] Track query confidence scores

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/v1/ops/ai/query` | `ops:ai_manager` | Submit query |
| GET | `/api/v1/ops/ai/queries` | `ops:ai_manager` | Get query history |
| GET | `/api/v1/ops/ai/queries/:id` | `ops:ai_manager` | Get specific query |
| POST | `/api/v1/ops/ai/queries/:id/feedback` | `ops:ai_manager` | Provide feedback |
| GET | `/api/v1/ops/ai/suggestions` | `ops:ai_manager` | Get suggested queries |

---

## Data Model

```prisma
model AIQuery {
  id              String    @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String    @db.ObjectId
  userId          String    @db.ObjectId

  query           String
  context         Json?     // Dashboard state, filters, etc.
  parentQueryId   String?   @db.ObjectId  // For follow-ups

  response        String
  responseData    Json?     // Structured data in response
  dataSources     String[]  // Which data sources were queried
  confidence      Float?

  wasHelpful      Boolean?
  feedback        String?

  processingMs    Int?      // Response time
  createdAt       DateTime  @default(now())

  @@index([clinicId, createdAt])
  @@index([userId])
}
```

---

## Example Queries

| Query | Intent | Data Sources |
|-------|--------|--------------|
| "Who's running behind today?" | Delay detection | Patient flow, appointments |
| "Show me patients waiting over 15 min" | Wait time filter | Patient flow |
| "What's chair 3's utilization this week?" | Utilization report | Resource utilization |
| "Are there any gaps I can fill?" | Schedule optimization | Appointments, waitlist |
| "How does today compare to last Tuesday?" | Comparative analysis | Daily metrics |

---

## Business Rules

- Queries limited to 100 per user per day
- Response time target: under 3 seconds
- AI respects role-based data access (no PHI for unauthorized)
- Confidence below 0.6 prompts clarification
- Context maintained for 5 minutes between queries
- Feedback used to improve query understanding
- Queries logged for analysis and improvement

---

## Dependencies

**Depends On:**
- [Operations Dashboard](../../operations-dashboard/) - Metrics data
- [Patient Flow](../../patient-flow/) - Flow state data
- [Resource Coordination](../../resource-coordination/) - Resource data
- [AI Integration](../../../../guides/AI-INTEGRATION.md) - AI service

**Required By:**
- [Schedule Optimization](./schedule-optimization.md) - Query interface
- [Anomaly Detection](./anomaly-detection.md) - Manual investigation

---

## Notes

- Consider caching common queries
- Provide "did you mean" for common typos
- Log failed queries for model improvement
- Mobile-optimized voice input option

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested

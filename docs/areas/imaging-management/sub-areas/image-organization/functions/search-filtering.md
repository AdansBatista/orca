# Search & Filtering

> **Sub-Area**: [Image Organization](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Search & Filtering enables finding images quickly across all patients using powerful search capabilities. The system supports full-text search across tags and metadata, multi-criteria filtering, saved searches for common queries, and both patient-scoped and practice-wide search modes for comprehensive image discovery.

---

## Core Requirements

- [ ] Implement full-text search across tags and metadata
- [ ] Support filtering by category, date range, treatment phase
- [ ] Enable filtering by image quality score
- [ ] Provide advanced search with multiple criteria
- [ ] Support search within patient or across entire practice
- [ ] Allow saving frequently used searches
- [ ] Display recent search history
- [ ] Generate search usage analytics
- [ ] Support natural language search queries

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/imaging/search` | `imaging:view` | Search images |
| GET | `/api/imaging/search/suggestions` | `imaging:view` | Get autocomplete suggestions |
| GET | `/api/imaging/search/recent` | `imaging:view` | Get recent searches |
| GET | `/api/imaging/search/saved` | `imaging:view` | List saved searches |
| POST | `/api/imaging/search/saved` | `imaging:view` | Save a search |
| PUT | `/api/imaging/search/saved/:id` | `imaging:view` | Update saved search |
| DELETE | `/api/imaging/search/saved/:id` | `imaging:view` | Delete saved search |
| GET | `/api/imaging/search/stats` | `imaging:admin` | Search analytics |

---

## Data Model

```prisma
model SavedSearch {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  userId        String   @db.ObjectId
  name          String
  description   String?
  query         String           // Search query string
  filters       Json             // Structured filter criteria
  scope         SearchScope @default(PATIENT)
  lastUsedAt    DateTime?
  useCount      Int     @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  @@index([clinicId])
  @@index([userId])
}

enum SearchScope {
  PATIENT       // Search within specific patient
  PRACTICE      // Search across all patients in clinic
}

model SearchHistory {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  userId        String   @db.ObjectId
  query         String
  filters       Json?
  resultCount   Int
  searchedAt    DateTime @default(now())

  @@index([clinicId])
  @@index([userId])
  @@index([searchedAt])
}

// Search filter schema (JSON):
// {
//   "dateRange": { "from": "2024-01-01", "to": "2024-12-31" },
//   "categories": ["EXTRAORAL", "INTRAORAL"],
//   "tags": ["crowding", "before-treatment"],
//   "qualityRange": { "min": 80, "max": 100 },
//   "treatmentId": "...",
//   "capturedBy": "...",
//   "protocolId": "..."
// }
```

---

## Business Rules

- Practice-wide search respects user's clinic access permissions
- Search results limited to images user has view permission for
- Search history retained for 30 days per user
- Maximum 50 saved searches per user
- Quality filter requires images to have quality scores
- Empty search with filters returns all matching images
- Search query supports operators: tag:, category:, date:, quality:

---

## Dependencies

**Depends On:**
- Auth & Authorization (view permissions, clinic scoping)
- Image Categorization (category filtering)
- Tagging & Metadata (tag and metadata search)

**Required By:**
- Patient Image Gallery (search within gallery)
- Reports & Collages (image selection)
- All functions requiring image discovery

---

## Notes

- Consider Elasticsearch or MongoDB Atlas Search for full-text indexing
- Query syntax example: `category:xray date:last-30-days tag:crowding quality:>80`
- Natural language: "panoramic X-rays from January" parsed to structured query
- Search analytics help identify common needs and optimize tagging

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested

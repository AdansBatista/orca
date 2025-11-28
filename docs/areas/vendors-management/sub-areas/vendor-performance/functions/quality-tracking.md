# Quality Tracking

> **Sub-Area**: [Vendor Performance](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Quality Tracking monitors and documents product and service quality from vendors. This function captures quality issues during receiving, categorizes defects, tracks quality trends, and identifies recurring problems. Essential for ensuring patient safety, maintaining supply quality standards, and holding vendors accountable for product quality.

---

## Core Requirements

- [ ] Document quality issues during receiving inspection
- [ ] Categorize issues by type (defect, damage, contamination, etc.)
- [ ] Link quality issues to specific products and vendors
- [ ] Track quality inspection pass/fail results
- [ ] Calculate defect rates by vendor and product
- [ ] Identify recurring quality problems
- [ ] Document root cause for significant issues
- [ ] Track corrective actions and preventive measures
- [ ] Monitor quality trends over time
- [ ] Alert on quality threshold violations

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/vendors/:id/quality` | `performance:read` | Get vendor quality metrics |
| GET | `/api/vendors/:id/quality/issues` | `performance:read` | Get quality issues |
| POST | `/api/vendors/:id/quality/issues` | `performance:create` | Report quality issue |
| GET | `/api/vendors/quality/trends` | `performance:read` | Quality trend analysis |
| GET | `/api/vendors/quality/products/:productCode` | `performance:read` | Product quality history |
| GET | `/api/vendors/quality/alerts` | `performance:read` | Quality alerts |
| GET | `/api/vendors/quality/recalls` | `performance:read` | Product recalls |

---

## Data Model

```prisma
// Quality data captured in VendorMetric and VendorIssue models

// Quality-specific fields in VendorMetric
model VendorMetric {
  // Quality Metrics
  itemsReceived Int      @default(0)
  itemsAccepted Int      @default(0)
  itemsRejected Int      @default(0)
  qualityIssues Int      @default(0)
  defectRate    Decimal?
}

// Quality issues as subset of VendorIssue
model VendorIssue {
  issueType     VendorIssueType // QUALITY_DEFECT, DAMAGED_GOODS, etc.

  // Product Reference
  productCode   String?
  lotNumber     String?

  // Root Cause
  rootCause     String?
  preventiveAction String?
}

// Optional: Product quality tracking
model ProductQualityHistory {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId
  productCode   String

  // Quality Stats
  totalReceived Int      @default(0)
  totalAccepted Int      @default(0)
  totalRejected Int      @default(0)
  issueCount    Int      @default(0)

  // Period
  periodStart   DateTime
  periodEnd     DateTime

  @@index([clinicId])
  @@index([vendorId])
  @@index([productCode])
}
```

---

## Business Rules

- Quality issues created from receiving inspection failures
- Defect rate = Rejected items / Received items
- Quality threshold: Defect rate should be < 1%
- Recurring issues (3+ in 90 days) flagged for vendor review
- Critical quality issues require root cause analysis
- Product recalls tracked separately with affected lot numbers
- Quality issues feed into vendor rating calculations
- Sterile/medical supplies require stricter quality standards
- Documentation required for all rejected items
- Quality trends reviewed at contract renewal

---

## Dependencies

**Depends On:**
- Receiving (quality inspection data)
- Performance Metrics (quality rates)
- Issue Tracking (quality issues as subset)

**Required By:**
- Vendor Ratings (quality score component)
- Returns (return defective items)
- Contract Management (renewal decisions)

---

## Notes

- Photo documentation for quality defects
- Product-level quality reports for supplier feedback
- Integration with manufacturer recall databases
- Lot number tracking for traceability
- Quality certification requirements by product type
- SDS (Safety Data Sheets) for material safety

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested

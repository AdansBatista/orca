# Staff Management Backlog Implementation

> **Status**: In Progress
> **Started**: 2024-11-30
> **Goal**: Complete all backlog items to mark Staff Management area as fully implemented

---

## Progress Overview

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Foundation (Schema, Permissions, Validations) |
| Phase 2 | ⬜ Pending | Critical Business Logic |
| Phase 3 | ⬜ Pending | Scheduling Enhancements |
| Phase 4 | ⬜ Pending | Document Management |
| Phase 5 | ⬜ Pending | Employment Records Enhancements |
| Phase 6 | ⬜ Pending | Cleanup & Backlog Update |

---

## Scope

### In Scope (This Implementation)
- Critical business logic validations
- Scheduling enhancements (bulk shifts, month view, blackout dates, PTO tracking)
- Document management (expiration tracking, new types, version history)
- Employment records (PDF verification, compensation UI, supervisor tracking)

### Deferred (Future Work)
- File upload infrastructure → Imaging Management area
- Drag-and-drop shift scheduling → Future UX enhancement
- Full PTO balance tracking with limits → Future enhancement
- Notification system → Patient Communications integration

---

## Phase 1: Foundation

**Status**: ✅ Complete

> **Note**: Run `npx prisma generate && npx prisma db push` after stopping dev server if you encounter EPERM errors.

### Tasks

#### 1.1 Prisma Schema Updates

**File**: `prisma/schema.prisma`

- [x] Add compensation fields to EmploymentRecord:
  - `previousSalary`, `newSalary`, `previousHourlyRate`, `newHourlyRate`
  - `supervisorId`, `documentIds`

- [x] Add supervisor relationship to StaffProfile:
  - `supervisorId`, `supervisor`, `directReports`

- [x] Add document versioning/expiration to StaffDocument:
  - `expirationDate`, `expirationStatus`, `version`, `previousVersionId`, `isCurrentVersion`, `effectiveDate`

- [x] Add `DocumentExpirationStatus` enum

- [x] Add new `BlackoutDate` model

- [x] Add `BlackoutType` enum

- [x] Add new `PTOUsage` model

- [x] Add new document categories to `DocumentCategory` enum

#### 1.2 Permission Updates

**File**: `src/lib/auth/types.ts`

- [x] Add `staff:compensation` permission to `clinic_admin` role

#### 1.3 Validation Schema Updates

**File**: `src/lib/validations/staff.ts`
- [x] Add compensation fields to `createEmploymentRecordSchema`
- [x] Add `supervisorId` and `documentIds` fields
- [x] Update `DocumentCategoryEnum` with new types
- [x] Add `DocumentExpirationStatusEnum`
- [x] Add `replaceDocumentSchema` for versioning
- [x] Add `documentQuerySchema` with expiration filters

**File**: `src/lib/validations/scheduling.ts`
- [x] Add `BlackoutTypeEnum`
- [x] Add blackout date schemas
- [x] Add `ptoUsageQuerySchema`
- [x] Add 6-hour break refinement to `createShiftSchema`

#### 1.4 Generate & Push

- [x] Run `npx prisma generate`
- [x] Run `npx prisma db push`

---

## Phase 2: Critical Business Logic

**Status**: ⬜ Pending

### Tasks

#### 2.1 Automatic Account Deactivation on TERMINATION

**File**: `src/app/api/staff/[id]/employment-records/route.ts`

- [ ] After creating TERMINATION record:
  - Update staff status to TERMINATED
  - Deactivate linked user account
  - Revoke all sessions
  - Audit log the action

#### 2.2 Compensation Permission Enforcement

**New File**: `src/lib/auth/helpers.ts`

- [ ] Create `canViewCompensation(session)` helper
- [ ] Create `filterCompensationFields(data, session)` helper

**File**: `src/app/api/staff/[id]/employment-records/route.ts`

- [ ] GET: Filter compensation fields before returning
- [ ] POST: Check permission before accepting compensation data

#### 2.3 Manager Self-Approval Prevention

**File**: `src/app/api/staff/time-off/[requestId]/approve/route.ts`

- [ ] Get approver's staff profile
- [ ] Prevent approval if approver === requester
- [ ] Return 403 SELF_APPROVAL_NOT_ALLOWED

#### 2.4 6-Hour Break Requirement

**File**: `src/lib/validations/scheduling.ts`

- [ ] Add refinement to `createShiftSchema`
- [ ] Shifts > 6 hours require >= 30 min break

#### 2.5 Historical Shift Protection

**File**: `src/app/api/staff/shifts/[shiftId]/route.ts`

- [ ] PUT: Check if shift is COMPLETED
- [ ] DELETE: Check if shift is COMPLETED
- [ ] Require admin override for completed shifts
- [ ] Audit log override actions

#### 2.6 Advance Notice & Type-Specific Rules

**New File**: `src/lib/utils/time-off-policy.ts`

- [ ] Define DEFAULT_POLICY with advance notice days per type
- [ ] Create `validateAdvanceNotice()` function
- [ ] Create `requiresHRReview()` function

**File**: `src/app/api/staff/[id]/time-off/route.ts`

- [ ] Validate advance notice before creating request
- [ ] Flag FMLA for HR review

#### 2.7 Cross-Location Conflict Warning

**File**: `src/app/api/staff/[id]/shifts/route.ts`

- [ ] Check for cross-location conflicts after overlap check
- [ ] Return warning in response (don't block)

---

## Phase 3: Scheduling Enhancements

**Status**: ⬜ Pending

### Tasks

#### 3.1 Bulk Shift Creation

**New File**: `src/app/api/staff/shifts/bulk/route.ts`

- [ ] POST handler with transaction
- [ ] Validate all shifts
- [ ] Check conflicts for all
- [ ] Create atomically
- [ ] Audit log

#### 3.2 Month View Calendar

**File**: `src/components/staff/scheduling/ScheduleCalendar.tsx`

- [ ] Add `view` state ('week' | 'month')
- [ ] Add view toggle buttons
- [ ] Conditional rendering

**New File**: `src/components/staff/scheduling/MonthView.tsx`

- [ ] 6-week calendar grid
- [ ] Shift counts per day
- [ ] Click to expand day details

#### 3.3 Blackout Date Management

**New Files**:
- [ ] `src/app/api/staff/blackout-dates/route.ts` (GET, POST)
- [ ] `src/app/api/staff/blackout-dates/[id]/route.ts` (GET, PUT, DELETE)
- [ ] `src/components/staff/scheduling/BlackoutDateForm.tsx`
- [ ] `src/components/staff/scheduling/BlackoutDateList.tsx`
- [ ] `src/app/(app)/staff/schedules/blackout-dates/page.tsx`

**File**: `src/app/api/staff/[id]/time-off/route.ts`

- [ ] Check blackout dates before creating request
- [ ] Block BLOCKED type, warn RESTRICTED/WARNING

#### 3.4 PTO Usage Tracking

**New Files**:
- [ ] `src/lib/services/pto-tracking.ts`
- [ ] `src/app/api/staff/pto-usage/route.ts`
- [ ] `src/app/api/staff/[id]/pto-usage/route.ts`

- [ ] Calculate usage from approved requests
- [ ] Auto-update on time-off approval

---

## Phase 4: Document Management

**Status**: ⬜ Pending

### Tasks

#### 4.1 Expiration Tracking

**File**: `src/components/staff/DocumentUploadForm.tsx`

- [ ] Add `expirationDate` field
- [ ] Add `effectiveDate` field

**File**: `src/components/staff/DocumentsList.tsx`

- [ ] Add expiration badge with status colors
- [ ] Filter by expiration status

**File**: `src/app/api/staff/[id]/documents/route.ts`

- [ ] Support `expirationStatus` filter
- [ ] Support `expiringWithinDays` filter

**New File**: `src/app/api/staff/documents/expiring/route.ts`

- [ ] GET documents expiring within N days

#### 4.2 Additional Document Types

**File**: `src/lib/validations/staff.ts`

- [ ] Update `DocumentCategoryEnum` (done in Phase 1)

**File**: `src/components/staff/DocumentUploadForm.tsx`

- [ ] Update category dropdown options

#### 4.3 Version History

**New Files**:
- [ ] `src/app/api/staff/[id]/documents/[documentId]/replace/route.ts`
- [ ] `src/app/api/staff/[id]/documents/[documentId]/versions/route.ts`
- [ ] `src/components/staff/DocumentVersionHistory.tsx`

---

## Phase 5: Employment Records Enhancements

**Status**: ⬜ Pending

### Tasks

#### 5.1 Employment Verification Letter

- [ ] `npm install @react-pdf/renderer`

**New Files**:
- [ ] `src/lib/pdf/employment-verification-template.tsx`
- [ ] `src/app/api/staff/[id]/employment-verification/route.ts`

**Update**: Staff detail page
- [ ] Add "Generate Verification Letter" button

#### 5.2 Compensation Tracking UI

**File**: `src/components/staff/EmploymentRecordForm.tsx`

- [ ] Add compensation fields with PermissionGate

**File**: `src/components/staff/EmploymentRecordsList.tsx`

- [ ] Display compensation changes (permission-gated)

#### 5.3 Supervisor Tracking

**File**: `src/components/staff/EmploymentRecordForm.tsx`

- [ ] Add supervisor dropdown

**File**: `src/components/staff/EmploymentRecordsList.tsx`

- [ ] Display supervisor name

#### 5.4 Document Attachments

**New File**: `src/components/staff/DocumentSelector.tsx`

- [ ] Checkbox list of staff documents

**File**: `src/components/staff/EmploymentRecordForm.tsx`

- [ ] Add DocumentSelector for attachments

---

## Phase 6: Cleanup & Backlog Update

**Status**: ⬜ Pending

### Tasks

- [ ] Update `docs/BACKLOG.md` with remaining deferred items
- [ ] Update seed data for new models
- [ ] Run `npx tsc` and fix any type errors
- [ ] Update Staff Management area README with implementation status
- [ ] Commit all changes

---

## Files Summary

### Files to Modify

| File | Phase |
|------|-------|
| `prisma/schema.prisma` | 1 |
| `src/lib/auth/types.ts` | 1 |
| `src/lib/validations/staff.ts` | 1 |
| `src/lib/validations/scheduling.ts` | 1 |
| `src/app/api/staff/[id]/employment-records/route.ts` | 2 |
| `src/app/api/staff/time-off/[requestId]/approve/route.ts` | 2 |
| `src/app/api/staff/shifts/[shiftId]/route.ts` | 2 |
| `src/app/api/staff/[id]/time-off/route.ts` | 2, 3 |
| `src/app/api/staff/[id]/shifts/route.ts` | 2 |
| `src/components/staff/scheduling/ScheduleCalendar.tsx` | 3 |
| `src/app/api/staff/[id]/documents/route.ts` | 4 |
| `src/components/staff/DocumentUploadForm.tsx` | 4 |
| `src/components/staff/DocumentsList.tsx` | 4 |
| `src/components/staff/EmploymentRecordForm.tsx` | 5 |
| `src/components/staff/EmploymentRecordsList.tsx` | 5 |

### Files to Create

| File | Phase |
|------|-------|
| `src/lib/auth/helpers.ts` | 2 |
| `src/lib/utils/time-off-policy.ts` | 2 |
| `src/app/api/staff/shifts/bulk/route.ts` | 3 |
| `src/components/staff/scheduling/MonthView.tsx` | 3 |
| `src/app/api/staff/blackout-dates/route.ts` | 3 |
| `src/app/api/staff/blackout-dates/[id]/route.ts` | 3 |
| `src/components/staff/scheduling/BlackoutDateForm.tsx` | 3 |
| `src/components/staff/scheduling/BlackoutDateList.tsx` | 3 |
| `src/app/(app)/staff/schedules/blackout-dates/page.tsx` | 3 |
| `src/lib/services/pto-tracking.ts` | 3 |
| `src/app/api/staff/pto-usage/route.ts` | 3 |
| `src/app/api/staff/[id]/pto-usage/route.ts` | 3 |
| `src/app/api/staff/documents/expiring/route.ts` | 4 |
| `src/app/api/staff/[id]/documents/[documentId]/replace/route.ts` | 4 |
| `src/app/api/staff/[id]/documents/[documentId]/versions/route.ts` | 4 |
| `src/components/staff/DocumentVersionHistory.tsx` | 4 |
| `src/lib/pdf/employment-verification-template.tsx` | 5 |
| `src/app/api/staff/[id]/employment-verification/route.ts` | 5 |
| `src/components/staff/DocumentSelector.tsx` | 5 |

---

## Commit History

| Date | Phase | Commit | Description |
|------|-------|--------|-------------|
| 2024-11-30 | 1 | (pending) | Foundation: Schema, permissions, validations |

---

**Last Updated**: 2024-11-30

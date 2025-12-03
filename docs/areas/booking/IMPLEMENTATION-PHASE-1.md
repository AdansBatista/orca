# Booking & Scheduling - Phase 1 Implementation

> **Phase**: 1 - Basic Booking (MVP)
> **Status**: ✅ COMPLETED
> **Started**: 2024-12-02
> **Completed**: 2024-12-03
> **Last Updated**: 2024-12-03

## Overview

This phase implements basic appointment booking with FullCalendar, enabling staff to:
- Manage appointment types
- Create and view appointments on a calendar
- Update appointment status (check-in, complete, cancel)

## Progress Summary

- [x] Step 1: Database Models (4/4) ✅
- [x] Step 2: Permissions & Auth (3/3) ✅
- [x] Step 3: Validation Schemas (2/2) ✅
- [x] Step 4: Appointment Types API (4/4) ✅
- [x] Step 5: Appointments API (6/6) ✅
- [x] Step 6: Calendar API (2/2) ✅
- [x] Step 7: FullCalendar Setup (3/3) ✅
- [x] Step 8: Appointment Types UI (3/3) ✅
- [x] Step 9: Calendar UI (4/4) ✅
- [x] Step 10: Appointment Forms (3/3) ✅
- [x] Step 11: Seed Data (2/2) ✅
- [x] Step 12: Testing & Polish (3/3) ✅
- [x] Step 13: Bug Fixes (2024-12-03) ✅

---

## Step 1: Database Models ✅ COMPLETED

### 1.1 Add AppointmentType model
- [x] Add `AppointmentType` model to `prisma/schema.prisma`
- [x] Add required enums

### 1.2 Add Appointment model
- [x] Add `Appointment` model to `prisma/schema.prisma`
- [x] Add `AppointmentStatus`, `ConfirmationStatus`, `AppointmentSource` enums

### 1.3 Update Patient model
- [x] Verify Patient has phone/email for future reminders
- [x] Add relation to Appointment

### 1.4 Generate and migrate
- [x] Run `npx prisma generate`
- [x] Run `npx prisma db push`

---

## Step 2: Permissions & Auth ✅ COMPLETED

### 2.1 Add booking resource
- [x] Add 'booking' to `PERMISSION_RESOURCES` in `prisma/seed/fixtures/permissions.fixture.ts`

### 2.2 Update role mappings
- [x] Map permissions to roles in `prisma/seed/fixtures/permissions.fixture.ts`

**Role mappings applied:**
- `super_admin`: `*` (all permissions)
- `clinic_admin`: `booking:*` (full booking access)
- `doctor`: `booking:read`, `booking:create`, `booking:update`
- `clinical_staff`: `booking:read`, `booking:create`, `booking:update`
- `front_desk`: `booking:*` (full booking access for scheduling)
- `billing`: `booking:read` (view only)
- `read_only`: `booking:read` (view only)

### 2.3 Reseed permissions
- [x] Permissions auto-generated via `generateAllPermissions()` function

---

## Step 3: Validation Schemas ✅ COMPLETED

### 3.1 Create booking validations file
- [x] Create `src/lib/validations/booking.ts`
- [x] Add enums matching Prisma

### 3.2 Add schemas
- [x] `createAppointmentTypeSchema` - with duration validations
- [x] `updateAppointmentTypeSchema`
- [x] `appointmentTypeQuerySchema` - with sorting and filtering
- [x] `createAppointmentSchema` - with time validations
- [x] `updateAppointmentSchema`
- [x] `appointmentQuerySchema` - with date range and status filters
- [x] `calendarQuerySchema` - with 3-month range limit
- [x] `availabilityCheckSchema` - for conflict detection
- [x] Status transition schemas (confirm, check-in, start, complete, cancel, no-show)

---

## Step 4: Appointment Types API ✅ COMPLETED

### 4.1 List/Create endpoint
- [x] Create `src/app/api/booking/appointment-types/route.ts`
- [x] Implement GET (list with pagination, search, filters)
- [x] Implement POST (create with duplicate code check)

### 4.2 Single type endpoint
- [x] Create `src/app/api/booking/appointment-types/[id]/route.ts`
- [x] Implement GET (single with appointment count)
- [x] Implement PUT (update with duplicate code check)
- [x] Implement DELETE (soft delete, blocks if upcoming appointments exist)

---

## Step 5: Appointments API ✅ COMPLETED

### 5.1 List/Create endpoint
- [x] Create `src/app/api/booking/appointments/route.ts`
- [x] Implement GET (list with filters, patient search, pagination)
- [x] Implement POST (create with provider/chair/room conflict checks)

### 5.2 Single appointment endpoint
- [x] Create `src/app/api/booking/appointments/[id]/route.ts`
- [x] Implement GET, PUT (with conflict checks), DELETE (soft delete)

### 5.3 Status transition endpoints
- [x] Create `src/app/api/booking/appointments/[id]/confirm/route.ts`
- [x] Create `src/app/api/booking/appointments/[id]/check-in/route.ts`
- [x] Create `src/app/api/booking/appointments/[id]/start/route.ts`
- [x] Create `src/app/api/booking/appointments/[id]/complete/route.ts`
- [x] Create `src/app/api/booking/appointments/[id]/no-show/route.ts`
- [x] Create `src/app/api/booking/appointments/[id]/cancel/route.ts`

---

## Step 6: Calendar API ✅ COMPLETED

### 6.1 Calendar data endpoint
- [x] Create `src/app/api/booking/calendar/route.ts`
- [x] Return appointments formatted for FullCalendar (CalendarEvent interface)
- [x] Support provider filtering (single or multiple)
- [x] Support date range queries with 3-month limit
- [x] Status-based color coding

### 6.2 Availability endpoint
- [x] Create `src/app/api/booking/availability/route.ts`
- [x] Check provider/chair/room availability for time slot
- [x] Return detailed conflict information

---

## Step 7: FullCalendar Setup ✅ COMPLETED

### 7.1 Install packages
- [x] `npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction @fullcalendar/core`

### 7.2 Create calendar component
- [x] Create `src/components/booking/BookingCalendar.tsx`
- [x] Configure views (day, week, month)
- [x] Add event click handler
- [x] Add date select handler (create appointment)
- [x] Add drag/drop support for rescheduling
- [x] Add resize support for duration changes

### 7.3 Style calendar
- [x] Create `src/styles/fullcalendar.css`
- [x] Match Orca design system colors and tokens
- [x] Responsive styling for mobile

---

## Step 8: Appointment Types UI ✅ COMPLETED

### 8.1 Types list page
- [x] Create `src/app/(app)/booking/settings/appointment-types/page.tsx`
- [x] Create `src/components/booking/AppointmentTypeList.tsx` with search/filter

### 8.2 Type card component
- [x] Create `src/components/booking/AppointmentTypeCard.tsx`
- [x] Display color, duration, badges, edit/delete actions

### 8.3 Type form
- [x] Create `src/components/booking/AppointmentTypeForm.tsx`
- [x] Add color picker with presets
- [x] Duration settings (default, min, max, prep, cleanup)
- [x] Resource requirements and availability toggles

---

## Step 9: Calendar UI ✅ COMPLETED

### 9.1 Main booking page
- [x] Create `src/app/(app)/booking/page.tsx`
- [x] Add FullCalendar component with BookingCalendar
- [x] Add provider filter placeholder (ready for API)
- [x] Add status legend

### 9.2 Appointment quick view
- [x] Create `src/components/booking/AppointmentQuickView.tsx`
- [x] Show on event click in Sheet component
- [x] Display patient, time, provider, location info
- [x] Status transition buttons (confirm, check-in, start, complete, cancel, no-show)

### 9.3 Provider selector
- [x] Basic provider filter in main booking page

### 9.4 Navigation
- [x] Updated sidebar navigation to include Booking (changed from Schedule to Booking)

---

## Step 10: Appointment Forms ✅ COMPLETED

### 10.1 Create appointment form
- [x] Create `src/components/booking/AppointmentForm.tsx`
- [x] Patient search/select with debounce
- [x] Type, provider, chair selection
- [x] Date/time picker
- [x] Source selection
- [x] Availability conflict warnings

### 10.2 New appointment page
- [x] Create `src/app/(app)/booking/appointments/new/page.tsx`
- [x] Support preselected date and provider via URL params

### 10.3 Edit appointment page
- [x] Create `src/app/(app)/booking/appointments/[id]/page.tsx`
- [x] Load and edit existing appointment
- [x] Prevent editing terminal statuses

---

## Step 11: Seed Data ✅ COMPLETED

### 11.1 Create fixtures
- [x] Create `prisma/seed/fixtures/booking.fixture.ts`
- [x] Add 15 default orthodontic appointment types

### 11.2 Create seeder
- [x] Create `prisma/seed/areas/booking.seed.ts`
- [x] Register in area registry (`prisma/seed/areas/index.ts`)
- [x] Generate sample appointments (standard/full mode)

---

## Step 12: Testing & Polish ✅ COMPLETED

### 12.1 TypeScript compilation
- [x] All TypeScript errors fixed
- [x] Clean `npx tsc --noEmit` output

### 12.2 Navigation
- [x] Updated sidebar: "Schedule" → "Booking" at `/booking`

### 12.3 Documentation
- [x] Updated implementation tracking document

---

## Step 13: Bug Fixes (2024-12-03) ✅ COMPLETED

### 13.1 Permission System Fix
- [x] Fixed `ROLE_PERMISSIONS` in `src/lib/auth/types.ts` to include CRUD actions (e.g., `booking:*`)
- [x] Updated `hasPermission()` in `src/lib/auth/permissions.ts` to handle resource wildcards

### 13.2 MongoDB Null Query Fix
**CRITICAL PATTERN**: MongoDB with Prisma requires special handling for null/undefined field checks.

The pattern `{ deletedAt: null }` does NOT work reliably with MongoDB. Use this pattern instead:

```typescript
// ✅ CORRECT - Use this for soft delete checks
OR: [{ deletedAt: { isSet: false } }, { deletedAt: null }]

// When combining with other OR conditions, wrap in AND:
AND: [
  { OR: [{ deletedAt: { isSet: false } }, { deletedAt: null }] },
  { OR: [/* other conditions */] },
]
```

**Files fixed:**
- `src/app/api/booking/appointments/route.ts` (GET list, POST create with conflict checks)
- `src/app/api/booking/appointments/[id]/route.ts` (GET, PUT, DELETE)
- `src/app/api/booking/appointment-types/[id]/route.ts` (GET, PUT, DELETE)
- `src/app/api/booking/calendar/route.ts` (GET)

### 13.3 Patient Selection Fix
- [x] Fixed patient dropdown in `AppointmentForm.tsx`
- [x] Changed from `onClick` to `onMouseDown` with `e.preventDefault()` to prevent blur firing before selection
- [x] Increased z-index to 50 for dropdown

### 13.4 Edit Form Patient Display Fix
- [x] Added `initialPatient` prop to `AppointmentForm` component
- [x] Updated edit page to pass `appointment.patient` to form
- [x] Form now correctly shows selected patient when editing

### 13.5 Dialog Height & Sticky Footer Fix
- [x] Updated `src/components/ui/dialog.tsx`:
  - `DialogContent`: Added `flex flex-col max-h-[90vh]`
  - `DialogHeader`: Added `flex-shrink-0 px-6 pt-6 pb-4 border-b`
  - `DialogBody`: New component with `flex-1 overflow-y-auto px-6 py-4`
  - `DialogFooter`: Added `flex-shrink-0 px-6 pb-6 pt-4 border-t`
- [x] Updated `AppointmentTypeForm.tsx` to support `forwardRef` with `hideFooter` prop
- [x] Updated `AppointmentTypeList.tsx` to use `DialogBody` and `DialogFooter`
- [x] Updated `STYLING-GUIDE.md` with new dialog patterns

### 13.6 Build Error Fix
- [x] Fixed `useSearchParams()` Suspense boundary error in `src/app/(app)/booking/appointments/new/page.tsx`
- [x] Wrapped content using `useSearchParams()` in Suspense with skeleton fallback

---

## Files Created/Modified

| File | Status |
|------|--------|
| `prisma/schema.prisma` (modified - AppointmentType, Appointment) | ✅ |
| `prisma/seed/fixtures/permissions.fixture.ts` (modified) | ✅ |
| `src/lib/validations/booking.ts` | ✅ |
| `src/lib/auth/types.ts` (modified - CRUD permissions) | ✅ |
| `src/lib/auth/permissions.ts` (modified - wildcard handling) | ✅ |
| `src/app/api/booking/appointment-types/route.ts` | ✅ |
| `src/app/api/booking/appointment-types/[id]/route.ts` | ✅ |
| `src/app/api/booking/appointments/route.ts` | ✅ |
| `src/app/api/booking/appointments/[id]/route.ts` | ✅ |
| `src/app/api/booking/appointments/[id]/confirm/route.ts` | ✅ |
| `src/app/api/booking/appointments/[id]/check-in/route.ts` | ✅ |
| `src/app/api/booking/appointments/[id]/start/route.ts` | ✅ |
| `src/app/api/booking/appointments/[id]/complete/route.ts` | ✅ |
| `src/app/api/booking/appointments/[id]/no-show/route.ts` | ✅ |
| `src/app/api/booking/appointments/[id]/cancel/route.ts` | ✅ |
| `src/app/api/booking/calendar/route.ts` | ✅ |
| `src/app/api/booking/availability/route.ts` | ✅ |
| `src/app/(app)/booking/page.tsx` | ✅ |
| `src/app/(app)/booking/settings/appointment-types/page.tsx` | ✅ |
| `src/app/(app)/booking/appointments/new/page.tsx` | ✅ |
| `src/app/(app)/booking/appointments/[id]/page.tsx` | ✅ |
| `src/components/booking/BookingCalendar.tsx` | ✅ |
| `src/components/booking/AppointmentTypeCard.tsx` | ✅ |
| `src/components/booking/AppointmentTypeList.tsx` | ✅ |
| `src/components/booking/AppointmentTypeForm.tsx` | ✅ |
| `src/components/booking/AppointmentQuickView.tsx` | ✅ |
| `src/components/booking/AppointmentForm.tsx` | ✅ |
| `src/components/booking/index.ts` | ✅ |
| `src/components/ui/dialog.tsx` (modified - sticky header/footer) | ✅ |
| `src/styles/fullcalendar.css` | ✅ |
| `prisma/seed/fixtures/booking.fixture.ts` | ✅ |
| `prisma/seed/areas/booking.seed.ts` | ✅ |
| `docs/guides/STYLING-GUIDE.md` (modified - dialog patterns) | ✅ |

---

## Critical Technical Patterns

### MongoDB Null Check Pattern
Always use this pattern for soft delete checks with MongoDB + Prisma:
```typescript
OR: [{ deletedAt: { isSet: false } }, { deletedAt: null }]
```

### Dialog with Scrollable Content Pattern
For tall dialogs, use the new structure:
```tsx
<Dialog>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <DialogBody>
      {/* Scrollable content */}
    </DialogBody>
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>Cancel</Button>
      <Button onClick={onSubmit}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Form with External Footer Pattern
Use `forwardRef` + `useImperativeHandle` to expose form submission:
```tsx
export const MyForm = forwardRef<FormRef, Props>((props, ref) => {
  useImperativeHandle(ref, () => ({
    submit: () => handleSubmit(onSubmit)(),
    isSubmitting,
  }));
  // ...
});
```

### Next.js useSearchParams Pattern
Always wrap `useSearchParams()` in a Suspense boundary:
```tsx
function ContentWithSearchParams() {
  const searchParams = useSearchParams();
  // ...
}

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <ContentWithSearchParams />
    </Suspense>
  );
}
```

---

## What's Next: Phase 2

Phase 2 will add:
- Provider schedules and availability templates
- Recurring appointments
- Waitlist management
- Reminders/confirmations (SMS/Email integration)
- Calendar printing
- Block time for breaks/meetings

See [docs/areas/booking/README.md](README.md) for full phase planning.

---

## Session Continuation Notes

When starting a new session to continue Booking development:

1. **Current Status**: Phase 1 complete, build passing
2. **Test the app**: Login as `admin@smileorthomain.smileortho.com` (clinic_admin)
3. **Key routes**:
   - `/booking` - Main calendar view
   - `/booking/appointments/new` - Create appointment
   - `/booking/appointments/[id]` - Edit appointment
   - `/booking/settings/appointment-types` - Manage types
4. **Remember**: Always use the MongoDB null pattern for `deletedAt` checks
5. **Next task**: Begin Phase 2 implementation (see README.md for priorities)

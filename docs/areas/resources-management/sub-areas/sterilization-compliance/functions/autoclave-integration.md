# Autoclave Integration

> **Area**: [Resources Management](../../../)
>
> **Sub-Area**: [Sterilization & Compliance](../)
>
> **Function**: 3.4.6 Autoclave Integration
>
> **Purpose**: Integrate with network-connected autoclaves (STATCLAVE G4 and similar) to automatically import sterilization cycles

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | ✅ Implemented |
| **Priority** | High |
| **Complexity** | Medium |
| **Parent Sub-Area** | [Sterilization & Compliance](../) |
| **Dependencies** | Equipment Management, Sterilization Cycles |
| **Last Updated** | 2024-12-13 |

---

## Overview

The Autoclave Integration feature enables automatic import of sterilization cycle data from network-connected autoclaves. This eliminates manual data entry, ensures accurate parameter recording, and provides full traceability from the autoclave's digital records directly into Orca's sterilization tracking system.

### Key Capabilities

- **Device Discovery & Configuration**: Register autoclaves by IP address
- **Automatic Cycle Import**: Fetch completed cycles directly from autoclave
- **One-Click Sync**: Quick sync button imports today's new cycles
- **Duplicate Prevention**: Automatically skips previously imported cycles
- **Label Printing**: Generate QR-coded labels for sterilized pouches
- **Digital Signature Capture**: Store autoclave's digital signatures for compliance

### Supported Devices

| Manufacturer | Model | Protocol | Status |
|--------------|-------|----------|--------|
| Scican | STATCLAVE G4 | HTTP REST | ✅ Supported |
| Scican | STATIM Series | HTTP REST | 🔄 Planned |
| Other | Various | - | Contact support |

---

## Technical Implementation

### Autoclave API Communication

The integration communicates with autoclaves over the local network using HTTP:

```
GET /data/cycles.cgi - List available cycles (years/months/days)
POST /data/cycleData.cgi - Fetch detailed cycle data
```

**Sample Cycle Data Response (STATCLAVE G4):**
```json
{
  "date": "2025-10-08",
  "number": 1755,
  "runmode": 1,
  "display_units": "metric",
  "log": "STATCLAVE G4 SBS1R118\r\n...",
  "status": "Solid/Wrapped / 132°C/4min",
  "temp": "63.6 63.8 131.9 132.0 ...",
  "pressure": "98.6 98.3 196.8 ...",
  "succeeded": true
}
```

### Cycle Type Mapping

| Autoclave runmode | Orca Cycle Type | Description |
|-------------------|-----------------|-------------|
| 1 | STEAM_GRAVITY | Solid/Wrapped 132°C |
| 2 | STEAM_PREVACUUM | Pre-Vacuum cycle |
| 3 | STEAM_FLASH | Flash/Immediate use |
| (others) | STEAM_GRAVITY | Default mapping |

### Data Extraction from Logs

The integration parses the autoclave's log text to extract:
- Maximum temperature reached
- Maximum pressure achieved
- Exposure time at sterilization temperature
- Digital signature for compliance
- Success/failure status

---

## Database Schema

### AutoclaveIntegration Model

```prisma
model AutoclaveIntegration {
  id            String                    @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String                    @db.ObjectId
  equipmentId   String                    @db.ObjectId

  name          String                    // Display name: "Autoclave 1"
  ipAddress     String                    // Network address: "192.168.0.82"
  port          Int                       @default(80)

  enabled       Boolean                   @default(true)
  status        IntegrationStatus         @default(NOT_CONFIGURED)
  errorMessage  String?

  lastSyncAt    DateTime?
  lastCycleNum  Int?                      // Track last imported cycle

  createdAt     DateTime                  @default(now())
  updatedAt     DateTime                  @updatedAt
  createdBy     String?                   @db.ObjectId

  clinic        Clinic                    @relation(fields: [clinicId], references: [id])
  equipment     Equipment                 @relation(fields: [equipmentId], references: [id])
  cycles        SterilizationCycle[]

  @@unique([clinicId, ipAddress])
  @@index([clinicId])
  @@map("autoclave_integrations")
}

enum IntegrationStatus {
  NOT_CONFIGURED
  CONNECTED
  DISCONNECTED
  ERROR
}
```

### SterilizationCycle Extensions

Additional fields for imported cycles:

```prisma
// Added to SterilizationCycle model
externalCycleNumber  Int?            // Autoclave's cycle number (e.g., 1755)
digitalSignature     String?         // Autoclave's digital signature
rawLog               String?         // Full log text from autoclave
importedAt           DateTime?       // When imported from autoclave
autoclaveId          String?         @db.ObjectId  // Reference to AutoclaveIntegration
tempProfile          String?         // Temperature readings (comma-separated)
pressureProfile      String?         // Pressure readings (comma-separated)
isNew                Boolean         @default(true)  // "New" badge until viewed
viewedAt             DateTime?       // When first viewed (clears isNew)
```

---

## API Endpoints

### Autoclave Management

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/resources/sterilization/autoclaves` | List configured autoclaves | `sterilization:read` |
| POST | `/api/resources/sterilization/autoclaves` | Add new autoclave | `sterilization:create` |
| GET | `/api/resources/sterilization/autoclaves/:id` | Get autoclave details | `sterilization:read` |
| PUT | `/api/resources/sterilization/autoclaves/:id` | Update autoclave config | `sterilization:update` |
| DELETE | `/api/resources/sterilization/autoclaves/:id` | Remove autoclave | `sterilization:delete` |
| POST | `/api/resources/sterilization/autoclaves/:id/test` | Test connection | `sterilization:read` |

### Cycle Import

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/resources/sterilization/autoclaves/:id/cycles` | List available cycles from device | `sterilization:read` |
| POST | `/api/resources/sterilization/autoclaves/:id/import` | Import selected cycles | `sterilization:create` |
| POST | `/api/resources/sterilization/autoclaves/:id/sync` | Quick sync (today's new cycles) | `sterilization:create` |

### Label Printing

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/resources/sterilization/cycles/:id/print` | Get print-ready label data | `sterilization:read` |

---

## User Interface

### Settings Page

**Location**: `/resources/sterilization/settings`

Configure autoclave integrations:
- Add new autoclave (name, IP address)
- Test connection with status indicator
- View last sync time
- Enable/disable individual autoclaves
- Remove autoclave configuration

### Import Page

**Location**: `/resources/sterilization/import`

Manual cycle import workflow:
1. Select autoclave from dropdown
2. Choose date range
3. View available cycles from device
4. Select cycles to import (with preview)
5. Import button creates SterilizationCycle records

### Import Dropdown (Quick Sync)

**Location**: Sterilization cycles list page header

One-click sync for daily use:
- Dropdown shows all configured autoclaves
- Status indicator (green/red) shows connection status
- Click to sync today's cycles
- Shows count of imported cycles
- Auto-skips duplicates

### Cycle List Enhancements

Imported cycles display:
- **"New" badge**: Shown on cycles until first viewed
- **Source column**: Shows autoclave name and machine cycle number
- **External cycle number**: e.g., "Autoclave 1 #391"

### Label Printing

**Location**: `/resources/sterilization/:id/print`

Print sterilization labels for pouches:
- **2x2" Labels**: 9 labels per letter page (grid layout)
- **Full Page**: Single large label for testing
- QR code links to cycle detail page
- Includes: cycle number, date, expiration, equipment name, parameters

---

## Workflow

### Daily Sterilization Workflow

```
┌─────────────────┐
│ Staff runs      │
│ autoclave cycle │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cycle completes │
│ on autoclave    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Staff clicks    │────▶│ System imports  │
│ "Sync" in Orca  │     │ new cycles      │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ Cycle appears   │
                        │ with "New" badge│
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ Staff prints    │
                        │ QR labels       │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ Labels applied  │
                        │ to pouches      │
                        └─────────────────┘
```

### Setup Workflow (One-Time)

1. Go to Sterilization Settings
2. Add autoclave: Name="Autoclave 1", IP="192.168.0.82"
3. Click "Test Connection" → shows "Connected"
4. Autoclave is ready for use

### Import Deduplication

The system prevents duplicate imports by:
1. Checking `externalCycleNumber` + `autoclaveId` + `clinicId`
2. Comparing cycle date from autoclave
3. Skipping cycles that already exist in database
4. Returning count of skipped vs imported cycles

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `ImportDropdown` | Quick sync dropdown in header | `components/sterilization/` |
| `AutoclaveConfigDialog` | Add/edit autoclave config | `components/sterilization/` |
| `AutoclaveList` | List configured autoclaves | `components/sterilization/` |
| `CycleLabelPrint` | Printable label component | `components/sterilization/` |
| `CycleLabelGrid` | 9-up label grid for printing | `components/sterilization/` |
| `SterilizationLabel` | QR code label with cycle info | `components/sterilization/` |

---

## Print Styles

The print functionality uses CSS media queries to ensure clean label output:

```css
@media print {
  /* Hide navigation and chrome */
  nav, aside, header:not(.print-header) { display: none !important; }

  /* Reset page margins */
  @page { margin: 0.25in; size: letter; }

  /* Ensure colors print */
  * { -webkit-print-color-adjust: exact !important; }
}
```

The `AppShell` component uses `print:hidden` classes to hide the sidebar during printing.

---

## Security Considerations

- **Network Isolation**: Autoclaves are on local LAN only, no internet exposure
- **Clinic Isolation**: All endpoints filter by `clinicId`
- **Authentication**: All endpoints require valid session via `withAuth`
- **Audit Logging**: Imports logged with user, timestamp, and cycle count
- **Permission Checks**: Requires `sterilization:create` for imports

---

## Error Handling

| Error | Handling |
|-------|----------|
| Autoclave offline | Show "Disconnected" status, allow retry |
| Network timeout | Return error message, suggest checking IP |
| Invalid response | Log error, show user-friendly message |
| Duplicate cycle | Skip silently, include in "skipped" count |
| Parse error | Log raw response, show generic error |

---

## Configuration

### Environment Variables

None required - autoclaves are configured per-clinic in database.

### Default Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Port | 80 | HTTP port for autoclave API |
| Timeout | 10 seconds | Connection timeout |
| Expiration Days | 30 | Default label expiration period |

---

## Future Enhancements

- [ ] Automatic scheduled sync (cron-based)
- [ ] Push notifications for new cycles
- [ ] Thermal label printer support
- [ ] Multi-autoclave batch import
- [ ] Temperature/pressure graph visualization
- [ ] Integration with additional autoclave brands

---

## Files

### Created

| File | Purpose |
|------|---------|
| `src/lib/sterilization/autoclave-service.ts` | HTTP client for autoclave API |
| `src/lib/validations/autoclave.ts` | Zod validation schemas |
| `src/app/api/resources/sterilization/autoclaves/route.ts` | List & create autoclaves |
| `src/app/api/resources/sterilization/autoclaves/[id]/route.ts` | Update & delete |
| `src/app/api/resources/sterilization/autoclaves/[id]/test/route.ts` | Test connection |
| `src/app/api/resources/sterilization/autoclaves/[id]/cycles/route.ts` | List cycles from device |
| `src/app/api/resources/sterilization/autoclaves/[id]/import/route.ts` | Import cycles |
| `src/app/api/resources/sterilization/autoclaves/[id]/sync/route.ts` | Quick sync endpoint |
| `src/app/(app)/resources/sterilization/settings/page.tsx` | Autoclave config UI |
| `src/app/(app)/resources/sterilization/import/page.tsx` | Import cycles UI |
| `src/app/(app)/resources/sterilization/[id]/print/page.tsx` | Print labels page |
| `src/components/sterilization/CycleLabelPrint.tsx` | Label component |
| `src/components/sterilization/ImportDropdown.tsx` | Quick sync dropdown |
| `src/components/sterilization/AutoclaveConfigDialog.tsx` | Config dialog |
| `src/components/sterilization/SterilizationLabel.tsx` | QR code label |

### Modified

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Added `AutoclaveIntegration` model, extended `SterilizationCycle` |
| `src/app/(app)/resources/sterilization/page.tsx` | Added ImportDropdown to header |
| `src/app/(app)/resources/sterilization/[id]/page.tsx` | Added "Print Labels" button |
| `src/components/sterilization/CycleCard.tsx` | Show autoclave name, "New" badge |
| `src/components/sterilization/CycleTableView.tsx` | Added Source column, "New" badge |
| `src/components/layout/AppShell.tsx` | Added `print:hidden` for sidebar |
| `src/app/globals.css` | Added print media queries |

---

## Related Documentation

- [Parent: Sterilization & Compliance](../)
- [Cycle Logging](./cycle-logging.md) - Manual cycle entry
- [Equipment Management](../../equipment-management/) - Autoclave equipment records
- [Label Generation](./label-generation.md) - QR code labels

---

**Status**: ✅ Implemented
**Last Updated**: 2024-12-13
**Owner**: Development Team

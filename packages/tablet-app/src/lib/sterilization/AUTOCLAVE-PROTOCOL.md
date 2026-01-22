# Autoclave Communication Protocol

## Overview

The tablet app communicates directly with two types of SciCan StatClave autoclaves over HTTP on the local network. Each firmware version has a completely different API.

---

## Firmware Types

| | MQX (Older) | nginx (Newer) |
|---|---|---|
| **Example IP** | 192.168.0.12 | 192.168.0.23 |
| **Server Header** | MQX / Freescale (or none) | nginx/1.17.8 |
| **Archive Page** | `/archives.html` | `/us/archives.php` |
| **Cycle Index** | POST `/data/cycles.cgi` | Embedded in archives.php |
| **Cycle Data** | POST `/data/cycleData.cgi` | GET `/data/cycleData.php` |
| **HTTP Parsing** | Requires lenient (malformed headers) | Standard fetch |
| **Detection** | Server header or archives.php fails | Server header contains "nginx" |

---

## API Endpoints

### MQX Firmware

#### GET Cycle Index: `POST /data/cycles.cgi?{timestamp}`

Returns all cycles for the month containing the requested day.

**Request:**
```
POST /data/cycles.cgi?1737580000
Accept: application/json, text/javascript, */*; q=0.01
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
X-Requested-With: XMLHttpRequest
Content-Length: {length}

{"year":"2026","month":"01","day":"22"}
```

**Response (JSON):**
```json
[{
  "year": "2026",
  "months": [{
    "month": "01",
    "days": [
      { "day": "05", "cycles": ["01875", "01876", "01877"] },
      { "day": "22", "cycles": ["01912", "01913", "01914"] }
    ]
  }]
}]
```

**Key behaviors:**
- `Content-Length` header is REQUIRED (server ignores body without it)
- The `day` param tells the server which month to return data for
- Response includes ALL days in that month that have cycles
- Cycle numbers are zero-padded to 5 digits (e.g., "01912")
- Empty body returns only year/month index WITHOUT days/cycles
- Requires `insecureHTTPParser: true` due to malformed response headers

#### GET Cycle Data: `POST /data/cycleData.cgi?{timestamp}`

Returns detailed cycle data (temperatures, pressures, log).

**Request:**
```
POST /data/cycleData.cgi?1737580000
Accept: application/json, text/javascript, */*; q=0.01
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
X-Requested-With: XMLHttpRequest
Content-Length: {length}

{"year":"2026","month":"01","day":"22","cycle":"01912"}
```

**Response (JSON):**
```json
{
  "succeeded": true,
  "date": "2026-01-22",
  "number": 1912,
  "runmode": 1,
  "display_units": "metric",
  "status": "Solid/Wrapped / 132°C/4min",
  "x_axis_points": 500,
  "temp": "57.65 57.67 57.65 ...",
  "pressure": "0.12 0.13 0.12 ...",
  "log": "Full cycle log text..."
}
```

**Key behaviors:**
- Temperature/pressure values are SPACE-separated
- `succeeded: true` means the cycle completed successfully
- `cycle` param must be zero-padded to 5 digits

---

### nginx Firmware

#### GET Cycle Index: `GET /us/archives.php`

Returns an HTML page with all cycle metadata embedded as JavaScript.

**Request:**
```
GET /us/archives.php
Accept: text/html,application/xhtml+xml,*/*
```

**Response (HTML with embedded JS):**
```html
<script>
var cyclesInfo = [
  {
    "records_id": 1,
    "cycle_start_time": 1768516306,
    "file_name": "S20260115_00152_710125H00004",
    "cycle_number": 152,
    "cycle_id": "STATCLAVE_120V_solid_wrapped_132_4min"
  },
  ...
];
</script>
```

**Key behaviors:**
- ALL cycles are returned in a single page (no pagination)
- `cycle_start_time` is a Unix timestamp (seconds)
- `file_name` format: `S{YYYYMMDD}_{cycleNum5digit}_{serialNumber}`
- Parse with regex: `/cyclesInfo\s*=\s*(\[[\s\S]*?\]);/`

#### GET Cycle Data: `GET /data/cycleData.php`

Returns detailed cycle data by file path.

**Request:**
```
GET /data/cycleData.php?filename=/opt/data/scilog/2026/01/15/S20260115_00152_710125H00004.cpt&t=1737580000
Accept: application/json, text/javascript, */*
X-Requested-With: XMLHttpRequest
```

**Response (JSON):**
```json
{
  "succeeded": true,
  "date": "2026-01-15",
  "number": 152,
  "runmode": 1,
  "display_units": "metric",
  "status": "Solid/Wrapped / 132°C/4min",
  "x_axis_points": 500,
  "temp": "57.65,57.67,57.65,...",
  "pressure": "0.12,0.13,0.12,...",
  "log": "Full cycle log text..."
}
```

**Key behaviors:**
- Temperature/pressure values are COMMA-separated (unlike MQX)
- File path format: `/opt/data/scilog/{YYYY}/{MM}/{DD}/{filename}.cpt`
- `t` param is a cache-buster timestamp

---

## Code Architecture

### Entry Point

```
fetchCyclesForRange(ipAddress, port, range)
  ├── detectFirmwareType(ipAddress, port)
  │     └── HEAD / → checks server header
  ├── fetchCyclesForRangeNginx(...)
  │     └── fetchAllCyclesFromArchives(...)
  │           └── GET /us/archives.php → parse cyclesInfo
  └── fetchCyclesForRangeMQX(...)
        └── POST /data/cycles.cgi → for each month in range
```

### Files

| File | Purpose |
|------|---------|
| `autoclave-service.ts` | All autoclave communication logic |
| `lenient-http.ts` | Node.js HTTP client with `insecureHTTPParser` for MQX |
| `../api/get-cycles/route.ts` | API route that calls `fetchCyclesForRange` |
| `../api/test-connection/route.ts` | Connection test endpoint |

### Key Functions

| Function | Purpose |
|----------|---------|
| `fetchCyclesForRange(ip, port, range)` | Main entry - returns cycles for date range |
| `fetchCyclesForRangeNginx(...)` | nginx: fetches archives.php, filters by date |
| `fetchCyclesForRangeMQX(...)` | MQX: POSTs to cycles.cgi for each month |
| `detectFirmwareType(ip, port)` | Detects firmware via HEAD request server header |
| `autoclaveRequest(url, options)` | Smart fetch: tries standard, falls back to lenient |
| `lenientFetch(url, options)` | Raw HTTP with `insecureHTTPParser: true` |
| `fetchAllCyclesFromArchives(ip, port)` | Parses cyclesInfo from archives.php HTML |
| `fetchCycleData(ip, port, y, m, d, cycle)` | Gets detailed cycle data (temp, pressure, log) |

### Types

```typescript
interface FlattenedCycle {
  year: string;         // "2026"
  month: string;        // "01"
  day: string;          // "22"
  cycleNumber: string;  // "01912"
  date: Date;           // Parsed date object
}

interface AutoclaveCycleIndex {
  year: string;
  months: {
    month: string;
    days?: { day: string; cycles: string[] }[];
  }[];
}

interface AutoclaveCycleData {
  succeeded: boolean;
  date: string;
  number: number;
  temp: string;       // Space-separated (MQX) or comma-separated (nginx)
  pressure: string;
  log: string;
  status: string;
}

type CycleRange = 'today' | 'yesterday' | 'week' | 'month';
```

---

## Date Range Behavior

| Range | Start Date | End Date |
|-------|-----------|----------|
| `today` | Today 00:00 | Today 00:00 |
| `yesterday` | Yesterday 00:00 | Yesterday 00:00 |
| `week` | 7 days ago | Yesterday |
| `month` | 30 days ago | Yesterday |

Past ranges (yesterday, week, month) do NOT include today's cycles.

---

## Known Issues & Gotchas

### MQX Firmware
1. **Content-Length is mandatory** - Without it, server ignores POST body and returns empty/index-only response
2. **Malformed HTTP headers** - Server sends invalid header characters; requires `insecureHTTPParser: true`
3. **HEAD requests may fail** - The root URL (`/`) sometimes causes socket hang up; firmware detection falls back to "mqx" default
4. **Date in POST body controls which month is returned** - Always send the target date, not empty

### nginx Firmware
5. **All cycles in one page** - archives.php can be large (60KB+) with hundreds of cycles
6. **Timestamps are Unix seconds** - Not milliseconds; multiply by 1000 for JavaScript Date
7. **Cycle numbers in file_name are zero-padded** - But `cycle_number` field is a plain integer

### General
8. **Temperature format differs** - MQX uses spaces, nginx uses commas as separator
9. **Firmware detection uses HEAD** - If HEAD fails, defaults to MQX (more restrictive)
10. **Lenient parsing is cached per host:port** - Once detected, all subsequent requests use lenient fetch
11. **No authentication** - Autoclaves have no auth; rely on network isolation

---

## Debugging

### Verify MQX connectivity:
```bash
curl -s -X POST "http://192.168.0.12/data/cycles.cgi" \
  -H "Content-Type: application/x-www-form-urlencoded; charset=UTF-8" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d '{"year":"2026","month":"01","day":"22"}'
```

### Verify nginx connectivity:
```bash
curl -s "http://192.168.0.23/us/archives.php" | grep "cyclesInfo"
```

### Verify cycle data (nginx):
```bash
curl -s "http://192.168.0.23/data/cycleData.php?filename=/opt/data/scilog/2026/01/15/S20260115_00152_710125H00004.cpt&t=$(date +%s)"
```

### Server logs to watch:
- `[AUTOCLAVE-SERVICE]` prefix for all autoclave operations
- `fetchCyclesForRange` - Entry point with range
- `Detected firmware:` - Which path was taken
- `MQX cycles.cgi raw response length:` - Check if body came back
- `nginx: Found N cycles` / `MQX: Found N cycles` - Final count

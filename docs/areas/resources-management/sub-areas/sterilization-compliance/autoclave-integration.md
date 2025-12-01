# Autoclave Integration - SciCan STATCLAVE G4

> **Sub-Area**: [Sterilization Tracking](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Integration options for extracting sterilization cycle data from SciCan STATCLAVE G4 autoclaves. This document outlines all available methods for programmatic data access, ranked by feasibility and automation level.

---

## Equipment Specifications

**Model**: SciCan STATCLAVE G4  
**Type**: Class B vacuum sterilizer  
**Capacity**: 11" chamber (4 full-size cassettes + 4 exam cassettes OR 20 pouches)  
**Cycle Time**: 38 minutes (minimum)  
**Connectivity**: WiFi, Ethernet, RS232, USB

---

## Data Integration Options

### Option 1: Web Portal HTTP Access ⭐ RECOMMENDED

**Description**: Direct network access to autoclave's built-in web portal

**Capabilities**:

- Real-time cycle information
- Complete archive of all sterilization records since manufacture
- Search and filter cycle history
- Print reports directly from portal
- Protected by local firewall (not accessible externally without Remote Access Code)

**Access Method**:

1. Get IP address from autoclave touchscreen (connectivity icon)
2. Access via browser: `http://[IP-ADDRESS]`
3. Optional: Scan QR code for mobile access

**Data Format**: Unknown until discovery (could be JSON API or HTML)

**Implementation Approaches**:

**Scenario A: JSON API** (Best Case)

```typescript
// Direct API calls
async function fetchCycles() {
  const response = await fetch("http://192.168.1.100/api/cycles");
  const data = await response.json();
  return data.cycles;
}
```

**Scenario B: HTML Scraping** (Good Case)

```typescript
// Web scraping with Puppeteer
import puppeteer from "puppeteer";

async function scrapeCycles() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("http://192.168.1.100/cycles");

  const cycles = await page.evaluate(() => {
    // Parse HTML table/data
    return extractedData;
  });

  await browser.close();
  return cycles;
}
```

**Pros**:

- Real-time data access
- No manual intervention required
- Complete cycle history available
- Can search and filter programmatically

**Cons**:

- Requires network connectivity
- Format unknown until discovery
- May require authentication
- Could break if SciCan updates portal

**Discovery Required**:

- Access web portal and inspect structure
- Check for JSON API endpoints
- Document authentication requirements
- Test data extraction methods

**Estimated Implementation**: 1-2 weeks (depending on API availability)

---

### Option 2: Email Notifications ⭐ EASIEST

**Description**: Configure autoclave to send email notifications after each cycle

**Capabilities**:

- Automatic email after cycle completion
- Structured cycle reports
- Real-time notifications
- Event-driven (no polling required)

**Setup**:

1. On touchscreen: SETTINGS → USER → ONLINE
2. Select ONLINE ACCESS
3. Agree to Privacy Policy
4. Enter email address (e.g., `sterilization@yourorca.app`)
5. Confirm via email

**Implementation**:

```typescript
// Email webhook/parser
import { simpleParser } from "mailparser";

async function parseAutoclaveEmail(emailBuffer: Buffer) {
  const parsed = await simpleParser(emailBuffer);

  // Extract cycle data from email body
  const cycleData = {
    cycleNumber: extractFromEmail(parsed.text, "Cycle:"),
    date: extractFromEmail(parsed.text, "Date:"),
    temperature: extractFromEmail(parsed.text, "Temperature:"),
    pressure: extractFromEmail(parsed.text, "Pressure:"),
    duration: extractFromEmail(parsed.text, "Duration:"),
    status: extractFromEmail(parsed.text, "Status:"),
  };

  // Auto-import to database
  await db.sterilizationCycle.create({ data: cycleData });
}
```

**Pros**:

- Fully automated
- Event-driven (instant when cycle completes)
- No polling or scheduled jobs needed
- Works independently of network issues
- Simple implementation

**Cons**:

- Requires email server setup
- Email format unknown until tested
- May need email parsing logic
- Dependent on autoclave's email service

**Discovery Required**:

- Configure test email
- Run test cycle (or wait for next cycle)
- Document email format (plain text, HTML, PDF attachment)
- Test parsing logic

**Estimated Implementation**: 1 week

---

### Option 3: USB Data Export

**Description**: Weekly manual export of cycle data to USB drive

**Capabilities**:

- Complete cycle history export
- Smart duplicate prevention (only copies new data)
- Manufacturer-supported method
- Works offline

**Process**:

1. Insert USB storage device into autoclave USB port
2. Press USB icon on touchscreen
3. Press COPY icon
4. Wait for USB icon to turn from flashing green to solid grey
5. Remove USB and transfer to computer

**Data Format**: PDF files with cycle reports

**Implementation**:

```typescript
// Parse PDF files from USB export
import pdf from "pdf-parse";

async function parseAutoclavePDF(file: Buffer) {
  const data = await pdf(file);

  // Extract cycle information from PDF text
  const cycleData = {
    cycleNumber: extractField(data.text, "Cycle:"),
    date: extractField(data.text, "Date:"),
    temperature: extractField(data.text, "Temperature:"),
    pressure: extractField(data.text, "Pressure:"),
    duration: extractField(data.text, "Duration:"),
    status: extractField(data.text, "Status:"),
  };

  return cycleData;
}
```

**Pros**:

- Reliable (manufacturer-supported)
- Smart duplicate prevention built-in
- Works offline
- No network dependency
- Complete data export

**Cons**:

- Manual weekly process required
- PDF parsing can be unreliable
- Delayed data (not real-time)
- Requires staff training
- PDF structure may vary

**Discovery Required**:

- Obtain sample USB export file
- Analyze PDF structure
- Test PDF parsing reliability
- Document extraction patterns

**Estimated Implementation**: 2 weeks

---

### Option 4: Serial Printer Interception

**Description**: Intercept data sent to serial printer

**Capabilities**:

- Auto-print after each cycle
- Real-time data capture
- Structured text output

**Setup**:

- RS232 port connection
- Recommended printer: Epson TM-U220D
- Serial settings: 9600 baud, CR/LF

**Implementation**:

```typescript
// Intercept serial data before printer
import SerialPort from "serialport";

const port = new SerialPort("/dev/ttyUSB0", { baudRate: 9600 });

port.on("data", (data) => {
  const cycleData = parseSerialData(data.toString());
  // Save to database
});
```

**Pros**:

- Real-time data capture
- Structured text format
- Event-driven

**Cons**:

- Requires hardware setup (serial splitter)
- Complex installation
- Thermal paper has 5-year lifespan
- Additional equipment needed

**Not Recommended**: More complex than web portal or email options

**Estimated Implementation**: 3-4 weeks

---

### Option 5: Manual Entry (Fallback)

**Description**: Staff manually enters cycle data from touchscreen

**Capabilities**:

- View last 5 successful cycles on touchscreen
- View last 5 incomplete cycles
- Manual data entry form

**Implementation**:

- Simple web form
- Validation rules
- Operator selection
- Notes field

**Pros**:

- No technical integration required
- Works immediately
- Full control over data quality
- No equipment dependency

**Cons**:

- Manual labor required
- Potential for human error
- Not real-time
- Time-consuming for staff

**Use Case**: MVP or backup when automated methods fail

**Estimated Implementation**: 1 week

---

## Recommended Implementation Strategy

### Phase 1: Discovery (This Week)

1. Access web portal and document structure
2. Configure test email notification
3. Obtain sample USB export file
4. Determine best integration method

### Phase 2: MVP (Week 1-2)

- Implement chosen integration method
- Build basic cycle import functionality
- Create validation and error handling
- Test with real autoclave data

### Phase 3: Enhancement (Week 3-4)

- Add automated scheduling (if needed)
- Implement duplicate detection
- Build monitoring and alerts
- Create admin dashboard

---

## Cycle Data Available

All integration methods should capture:

- Cycle ID/number
- Date and time
- Cycle type (wrapped instruments, pouches, cassettes, handpieces)
- Temperature (°C)
- Pressure (PSI or kPa)
- Duration (minutes)
- Cycle status (success, failed, incomplete, aborted)
- Biological indicator result (if available)
- Chemical indicator result (if available)
- Operator information

---

## Next Steps

1. **Schedule clinic visit** to access autoclave
2. **Run discovery process**:
   - Access web portal (get IP, inspect structure)
   - Configure email notifications (test format)
   - Export USB data (analyze PDF structure)
3. **Document findings** and share with development team
4. **Select integration method** based on discovery results
5. **Begin implementation** of chosen approach

---

## Technical Requirements

### Network Integration

- Autoclave must be on local network
- Firewall configuration may be needed
- Static IP recommended for reliability

### Email Integration

- Email server with webhook support
- Email parsing library (mailparser)
- Spam filter configuration

### USB Integration

- PDF parsing library (pdf-parse)
- File upload functionality
- Duplicate detection logic

---

## References

- SciCan STATCLAVE G4 Operator's Manual (Section 8.5, 9.1-9.4)
- Web Portal Discovery Guide (see separate document)
- Implementation Plan (see separate document)

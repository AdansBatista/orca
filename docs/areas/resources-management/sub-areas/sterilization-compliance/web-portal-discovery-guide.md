# STATCLAVE Web Portal Integration - Technical Discovery Guide

## Objective

Determine the best way to programmatically extract cycle data from the STATCLAVE G4 web portal.

---

## Step 1: Access the Web Portal (5 minutes)

### On the Autoclave Touchscreen:

1. Press the **connectivity icon** (WiFi/network symbol)
2. Note the **IP address** displayed (e.g., `192.168.1.100`)
3. Optional: Scan the QR code with your phone to test mobile access

### On Your Computer:

1. Open Chrome browser
2. Navigate to: `http://[IP-ADDRESS]` (replace with actual IP)
3. Take screenshots of:
   - Login page (if any)
   - Main dashboard
   - Cycle list/history page
   - Individual cycle detail page

---

## Step 2: Inspect Network Requests (15 minutes)

### Open Chrome DevTools:

1. Press `F12` or right-click → "Inspect"
2. Click the **Network** tab
3. Check "Preserve log" checkbox

### Navigate the Portal:

1. **View Cycle List**:

   - Click on "Cycles" or "History" menu
   - Watch Network tab for requests
   - Look for requests like:
     - `/api/cycles`
     - `/cycles.json`
     - `/data/cycles`
     - Or HTML pages like `/cycles.html`

2. **View Single Cycle**:

   - Click on a specific cycle
   - Watch for requests like:
     - `/api/cycles/123`
     - `/cycle-detail?id=123`

3. **Search/Filter**:
   - Try searching or filtering cycles
   - Note the request parameters

### Document Your Findings:

For each request, note:

- **URL**: Full path (e.g., `/api/cycles?limit=10`)
- **Method**: GET, POST, etc.
- **Response Type**: JSON, HTML, XML
- **Response Preview**: Click on request → "Preview" tab

---

## Step 3: Analyze the Response Format

### Scenario A: JSON API (Best Case) ✅

If you see responses like this in the Preview tab:

```json
{
  "cycles": [
    {
      "id": "12345",
      "cycleNumber": "CYC-001",
      "date": "2025-11-30T10:00:00Z",
      "temperature": 134,
      "pressure": 30,
      "duration": 38,
      "status": "SUCCESS"
    }
  ]
}
```

**This means**: Direct API integration is possible! ⭐

**Implementation**:

```typescript
// Direct API calls
async function fetchCycles() {
  const response = await fetch("http://192.168.1.100/api/cycles");
  const data = await response.json();
  return data.cycles;
}
```

### Scenario B: HTML Only (Still Good) ⚠️

If responses are HTML pages with tables:

```html
<table class="cycle-table">
  <tr>
    <td>CYC-001</td>
    <td>2025-11-30</td>
    <td>134°C</td>
    <td>SUCCESS</td>
  </tr>
</table>
```

**This means**: Web scraping needed

**Implementation**:

```typescript
// Web scraping with Puppeteer
import puppeteer from "puppeteer";

async function scrapeCycles() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto("http://192.168.1.100/cycles");

  const cycles = await page.evaluate(() => {
    const rows = document.querySelectorAll(".cycle-table tr");
    return Array.from(rows).map((row) => ({
      cycleNumber: row.cells[0].textContent,
      date: row.cells[1].textContent,
      temperature: row.cells[2].textContent,
      status: row.cells[3].textContent,
    }));
  });

  await browser.close();
  return cycles;
}
```

### Scenario C: Requires Authentication 🔐

If you see a login page:

- Note the login form fields
- Check if it uses:
  - Basic Auth (browser popup)
  - Form-based login (username/password fields)
  - Token-based (API key)

**Implementation** (form-based):

```typescript
async function loginAndFetch() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Login
  await page.goto("http://192.168.1.100/login");
  await page.type("#username", "admin");
  await page.type("#password", "password");
  await page.click("#login-button");
  await page.waitForNavigation();

  // Fetch data
  await page.goto("http://192.168.1.100/cycles");
  // ... extract data
}
```

---

## Step 4: Test Email Notifications (10 minutes)

### Configure Email on Autoclave:

1. On touchscreen: **SETTINGS** → **USER** → **ONLINE**
2. Select **ONLINE ACCESS**
3. Enter test email: `test@yourorca.app`
4. Run a test cycle (if possible) or wait for next cycle

### Check Email Format:

1. Open the email received
2. Check if it contains:
   - **Plain text** with cycle data
   - **HTML** with formatted data
   - **PDF attachment** with cycle report
   - **Structured data** (JSON/XML)

### Document Email Structure:

```
Subject: STATCLAVE Cycle Complete - CYC-001

Body:
Cycle Number: CYC-001
Date: 2025-11-30 10:00:00
Temperature: 134°C
Pressure: 30 PSI
Duration: 38 minutes
Status: SUCCESS
```

---

## Step 5: Document Your Findings

### Create a summary with:

1. **Web Portal Access**:

   - IP Address: `_______________`
   - Requires Login: Yes / No
   - Login Credentials: `_______________`

2. **API Endpoints Found**:

   ```
   GET /api/cycles → Returns: JSON / HTML / XML
   GET /api/cycles/:id → Returns: JSON / HTML / XML
   POST /api/cycles/search → Returns: JSON / HTML / XML
   ```

3. **Data Format**:

   - [ ] JSON API available
   - [ ] HTML scraping needed
   - [ ] Authentication required
   - [ ] Email notifications configured

4. **Sample Response** (copy-paste from Network tab):
   ```json
   // Paste actual response here
   ```

---

## Recommended Integration Approach

### Based on your findings:

**If JSON API exists** → **Option 1: Direct API Integration**

- Fastest implementation (1 week)
- Most reliable
- Real-time data
- Minimal maintenance

**If HTML only** → **Option 2: Web Scraping**

- Moderate implementation (2 weeks)
- Scheduled sync (hourly/daily)
- More fragile (breaks on UI changes)
- Requires headless browser

**If email works well** → **Option 3: Email Parsing**

- Event-driven (real-time)
- No portal dependency
- Simple implementation (1 week)
- Requires email server setup

---

## Next Steps

Once you've completed the discovery:

1. **Share findings** with me:

   - Screenshots of web portal
   - Network request examples
   - Sample email (if configured)

2. **I'll create** the integration code based on what you find

3. **We'll implement** the best option together

---

## Quick Reference Commands

### Check if autoclave is reachable:

```bash
ping 192.168.1.100
```

### Test HTTP access:

```bash
curl http://192.168.1.100
```

### View response headers:

```bash
curl -I http://192.168.1.100/api/cycles
```

---

## Questions to Answer

- [ ] What is the autoclave's IP address?
- [ ] Does the web portal require authentication?
- [ ] Is there a JSON API or just HTML pages?
- [ ] What does a sample cycle response look like?
- [ ] Can you configure email notifications?
- [ ] What format do email notifications use?

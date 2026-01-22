// Dynamic import for browser compatibility
let QRCode: typeof import('qrcode') | null = null;

async function getQRCode() {
  if (!QRCode) {
    QRCode = await import('qrcode');
  }
  return QRCode;
}

/**
 * Sterilization QR Code Format:
 * JSON object with all sterilization details
 *
 * Example:
 * {
 *   "v": 1,
 *   "id": "abc123",
 *   "cn": "CYC-2024-001",
 *   "ct": "STEAM_GRAVITY",
 *   "sd": "2024-11-30",
 *   "ed": "2024-12-30",
 *   "t": 134,
 *   "p": 30,
 *   "et": 4,
 *   "s": "COMPLETED",
 *   "eq": "Autoclave 1"
 * }
 */

export interface SterilizationQRData {
  cycleId: string;
  cycleNumber: string;
  cycleDate: Date;
  expirationDate?: Date;
  // Additional data
  cycleType?: string;
  temperature?: number;
  pressure?: number;
  exposureTime?: number;
  status?: string;
  equipmentName?: string;
  packageType?: string;
}

/**
 * Compact JSON format for QR code (short keys to minimize size)
 */
interface CompactQRData {
  v: number;      // version
  id: string;     // cycle ID (last 8 chars)
  cn: string;     // cycle number
  ct?: string;    // cycle type
  sd: string;     // sterilization date (YYYY-MM-DD)
  ed: string;     // expiration date (YYYY-MM-DD)
  t?: number;     // temperature
  p?: number;     // pressure
  et?: number;    // exposure time
  s?: string;     // status
  eq?: string;    // equipment name
}

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  color?: {
    dark?: string;
    light?: string;
  };
}

const DEFAULT_QR_OPTIONS: QRCodeOptions = {
  width: 200,
  margin: 2,
  errorCorrectionLevel: 'H', // Highest error correction (30%)
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
};

/**
 * Formats a date as DD-MMM-YYYY (e.g., "20-Dec-2025")
 */
function formatDateForScanner(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Formats time as HH_MM (e.g., "13_15")
 */
function formatTimeForScanner(date: Date): string {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}_${minutes}`;
}

/**
 * Generates the QR code content string for a sterilization cycle
 * Returns a scanner-readable text format: "Date STE DD-MMM-YYYY EquipmentName CycleNum HH_MM PackageType"
 * Example: "Date STE 20-Dec-2025 Stclave-2 2312 13_15 Pouch"
 */
export function generateQRContent(data: SterilizationQRData, expirationDays: number = 30): string {
  const sterilizationDate = formatDateForScanner(data.cycleDate);
  const time = formatTimeForScanner(data.cycleDate);
  const equipmentName = data.equipmentName || 'Unknown';
  const cycleNumber = data.cycleNumber;
  const packageType = data.packageType || 'Cassette';

  // Format: "Date STE DD-MMM-YYYY EquipmentName CycleNum HH_MM PackageType"
  return `Date STE ${sterilizationDate} ${equipmentName} ${cycleNumber} ${time} ${packageType}`;
}

/**
 * Legacy function to generate compact JSON format (for backwards compatibility)
 */
export function generateQRContentJSON(data: SterilizationQRData, expirationDays: number = 30): string {
  const sterilizationDate = formatDateISO(data.cycleDate);
  const expDate = data.expirationDate || calculateExpirationDate(data.cycleDate, expirationDays);
  const expirationDateStr = formatDateISO(expDate);

  const compactData: CompactQRData = {
    v: 1, // version for future compatibility
    id: data.cycleId.slice(-8), // short ID
    cn: data.cycleNumber,
    sd: sterilizationDate,
    ed: expirationDateStr,
  };

  // Only add optional fields if they have values
  if (data.cycleType) compactData.ct = data.cycleType;
  if (data.temperature) compactData.t = Math.round(data.temperature);
  if (data.pressure) compactData.p = Math.round(data.pressure);
  if (data.exposureTime) compactData.et = data.exposureTime;
  if (data.status) compactData.s = data.status;
  if (data.equipmentName) compactData.eq = data.equipmentName;

  return JSON.stringify(compactData);
}

/**
 * Parses scanner date format (DD-MMM-YYYY) to ISO format (YYYY-MM-DD)
 */
function parseScannerDate(dateStr: string): string | null {
  const months: Record<string, string> = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
  const match = dateStr.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
  if (match) {
    const [, day, monthName, year] = match;
    const month = months[monthName];
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }
  return null;
}

/**
 * Parses a QR code content string back to its components
 * Supports:
 * - Scanner format: "Date STE DD-MMM-YYYY EquipmentName CycleNum HH_MM PackageType"
 * - JSON format: {"v":1,"cn":"...","sd":"...","ed":"..."}
 * - Legacy format: ORCA-STERIL-{cycleNumber}-{shortId}-{date}
 */
export function parseQRContent(content: string): {
  version: number;
  cycleIdSuffix: string;
  cycleNumber: string;
  cycleType?: string;
  sterilizationDate: string;
  expirationDate: string;
  temperature?: number;
  pressure?: number;
  exposureTime?: number;
  status?: string;
  equipmentName?: string;
  packageType?: string;
  time?: string;
} | null {
  // Try scanner format first: "Date STE DD-MMM-YYYY EquipmentName CycleNum HH_MM PackageType"
  const scannerMatch = content.match(/^Date STE (\d{2}-[A-Za-z]{3}-\d{4}) ([^\s]+) ([^\s]+) (\d{2}_\d{2}) (.+)$/);
  if (scannerMatch) {
    const [, dateStr, equipmentName, cycleNumber, time, packageType] = scannerMatch;
    const sterilizationDate = parseScannerDate(dateStr);
    if (sterilizationDate) {
      // Calculate expiration (30 days default)
      const sterDate = new Date(sterilizationDate);
      const expDate = calculateExpirationDate(sterDate, 30);

      return {
        version: 2, // scanner format
        cycleIdSuffix: '',
        cycleNumber,
        sterilizationDate,
        expirationDate: formatDateISO(expDate),
        equipmentName,
        packageType,
        time,
      };
    }
  }

  // Try parsing as JSON (compact format)
  try {
    const data = JSON.parse(content) as CompactQRData;
    if (data.v && data.cn && data.sd && data.ed) {
      return {
        version: data.v,
        cycleIdSuffix: data.id,
        cycleNumber: data.cn,
        cycleType: data.ct,
        sterilizationDate: data.sd,
        expirationDate: data.ed,
        temperature: data.t,
        pressure: data.p,
        exposureTime: data.et,
        status: data.s,
        equipmentName: data.eq,
      };
    }
  } catch {
    // Not JSON, try legacy format
  }

  // Try legacy format: ORCA-STERIL-{cycleNumber}-{shortId}-{date}
  const legacyMatch = content.match(/^ORCA-STERIL-(.+)-([a-f0-9]{8})-(\d{8})$/);
  if (legacyMatch) {
    const dateStr = legacyMatch[3];
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    const sterilizationDate = `${year}-${month}-${day}`;

    // Calculate expiration (30 days default)
    const sterDate = new Date(sterilizationDate);
    const expDate = calculateExpirationDate(sterDate, 30);

    return {
      version: 0, // legacy format
      cycleNumber: legacyMatch[1],
      cycleIdSuffix: legacyMatch[2],
      sterilizationDate,
      expirationDate: formatDateISO(expDate),
    };
  }

  return null;
}

/**
 * Formats a date as ISO date string (YYYY-MM-DD)
 */
function formatDateISO(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates a QR code as a data URL (base64 PNG)
 */
export async function generateQRCodeDataURL(
  data: SterilizationQRData,
  options?: QRCodeOptions
): Promise<string> {
  const qrcode = await getQRCode();
  const content = generateQRContent(data);
  const mergedOptions = { ...DEFAULT_QR_OPTIONS, ...options };

  return qrcode.toDataURL(content, {
    width: mergedOptions.width,
    margin: mergedOptions.margin,
    errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
    color: mergedOptions.color,
  });
}

/**
 * Generates a QR code as an SVG string
 */
export async function generateQRCodeSVG(
  data: SterilizationQRData,
  options?: QRCodeOptions
): Promise<string> {
  const qrcode = await getQRCode();
  const content = generateQRContent(data);
  const mergedOptions = { ...DEFAULT_QR_OPTIONS, ...options };

  return qrcode.toString(content, {
    type: 'svg',
    width: mergedOptions.width,
    margin: mergedOptions.margin,
    errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
    color: mergedOptions.color,
  });
}

/**
 * Label sizes for thermal and standard printers
 * Includes Staples shipping labels for office printers
 */
export const LABEL_SIZES = {
  '4x2': { width: 4, height: 2, widthPx: 384, heightPx: 192, name: 'Staples Shipping (4" x 2")' }, // Staples 3037851 / ST18060-CC - 10 labels/sheet
  '2.625x1': { width: 2.625, height: 1, widthPx: 252, heightPx: 96, name: 'Staples Address (2⅝" x 1")' }, // Staples ST18054-CC - 30 labels/sheet
  '2x1': { width: 2, height: 1, widthPx: 192, heightPx: 96, name: 'Thermal 2" x 1"' },
  '2x2': { width: 2, height: 2, widthPx: 192, heightPx: 192, name: 'Thermal 2" x 2"' },
  '2x4': { width: 2, height: 4, widthPx: 192, heightPx: 384, name: 'Thermal 2" x 4"' },
  '4x6': { width: 4, height: 6, widthPx: 384, heightPx: 576, name: 'Thermal 4" x 6"' },
} as const;

export type LabelSize = keyof typeof LABEL_SIZES;

/**
 * Calculate expiration date based on sterilization date
 * Default is 30 days for wrapped instruments
 */
export function calculateExpirationDate(
  sterilizationDate: Date,
  expirationDays: number = 30
): Date {
  const expDate = new Date(sterilizationDate);
  expDate.setDate(expDate.getDate() + expirationDays);
  return expDate;
}

/**
 * Check if a sterilization is still valid (not expired)
 */
export function isStillSterile(
  sterilizationDate: Date,
  expirationDays: number = 30
): boolean {
  const expDate = calculateExpirationDate(sterilizationDate, expirationDays);
  return new Date() < expDate;
}

/**
 * Get days remaining until expiration
 */
export function getDaysUntilExpiration(
  sterilizationDate: Date,
  expirationDays: number = 30
): number {
  const expDate = calculateExpirationDate(sterilizationDate, expirationDays);
  const now = new Date();
  const diffTime = expDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

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
 * Generates the QR code content string for a sterilization cycle
 * Returns a compact JSON string with all details
 */
export function generateQRContent(data: SterilizationQRData, expirationDays: number = 30): string {
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
 * Parses a QR code content string back to its components
 * Supports both old format (ORCA-STERIL-...) and new JSON format
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
} | null {
  // Try parsing as JSON first (new format)
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
    // Not JSON, try old format
  }

  // Try old format: ORCA-STERIL-{cycleNumber}-{shortId}-{date}
  const match = content.match(/^ORCA-STERIL-(.+)-([a-f0-9]{8})-(\d{8})$/);
  if (match) {
    const dateStr = match[3];
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    const sterilizationDate = `${year}-${month}-${day}`;

    // Calculate expiration (30 days default)
    const sterDate = new Date(sterilizationDate);
    const expDate = calculateExpirationDate(sterDate, 30);

    return {
      version: 0, // legacy format
      cycleNumber: match[1],
      cycleIdSuffix: match[2],
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
 * Label sizes for thermal printers
 */
export const LABEL_SIZES = {
  '2x1': { width: 2, height: 1, widthPx: 192, heightPx: 96 }, // 2" x 1" at 96 DPI
  '2x2': { width: 2, height: 2, widthPx: 192, heightPx: 192 },
  '2x4': { width: 2, height: 4, widthPx: 192, heightPx: 384 },
  '4x6': { width: 4, height: 6, widthPx: 384, heightPx: 576 },
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

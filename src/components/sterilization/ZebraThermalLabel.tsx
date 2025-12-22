'use client';

import { useEffect, useState } from 'react';
import {
  generateQRCodeDataURL,
  SterilizationQRData,
  calculateExpirationDate,
} from '@/lib/sterilization/qr-code';
import type { CycleLabelData } from './CycleLabelPrint';

/**
 * Zebra ZD411 Thermal Label Formats
 *
 * 2x1 Labels:
 * - Width: 2" (50.8mm)
 * - Height: 1" (25.4mm)
 * - Direct thermal printing
 * - Continuous roll, prints one label at a time
 */

export type ZebraLabelFormat = '2x1' | '2x1.25' | '2.25x1.25';

interface ZebraThermalLabelProps {
  cycle: CycleLabelData;
  format?: ZebraLabelFormat;
  /** For preview scaling */
  scale?: number;
}

// Zebra label format configurations
export const ZEBRA_LABEL_FORMATS = {
  '2x1': {
    name: 'Zebra 2" x 1"',
    width: 2, // inches
    height: 1, // inches
    widthMm: 50.8,
    heightMm: 25.4,
  },
  '2x1.25': {
    name: 'Zebra 2" x 1.25"',
    width: 2,
    height: 1.25,
    widthMm: 50.8,
    heightMm: 31.75,
  },
  '2.25x1.25': {
    name: 'Zebra 2.25" x 1.25"',
    width: 2.25,
    height: 1.25,
    widthMm: 57.15,
    heightMm: 31.75,
  },
} as const;

/**
 * Single Zebra thermal label component - compact 2x1" format
 */
export function ZebraThermalLabel({
  cycle,
  format = '2x1',
  scale = 1,
}: ZebraThermalLabelProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const config = ZEBRA_LABEL_FORMATS[format];
  const expirationDays = cycle.expirationDays || 30;
  const expirationDate = calculateExpirationDate(cycle.cycleDate, expirationDays);

  useEffect(() => {
    async function generateQR() {
      const qrData: SterilizationQRData = {
        cycleId: cycle.cycleId,
        cycleNumber: cycle.cycleNumber,
        cycleDate: cycle.cycleDate,
        expirationDate,
        cycleType: cycle.cycleType,
        temperature: cycle.temperature || undefined,
        pressure: cycle.pressure || undefined,
        exposureTime: cycle.exposureTime || undefined,
        status: cycle.status,
        equipmentName: cycle.equipmentName,
      };

      // Smaller QR for thermal labels
      const url = await generateQRCodeDataURL(qrData, {
        width: 80,
        errorCorrectionLevel: 'M', // Medium error correction for small labels
        margin: 0,
      });
      setQrCodeUrl(url);
    }

    generateQR();
  }, [cycle, expirationDate]);

  // Format date compactly
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
    });
  };

  return (
    <div
      className="flex items-center bg-white overflow-hidden box-border"
      style={{
        width: `${config.width * scale}in`,
        height: `${config.height * scale}in`,
        padding: `${0.05 * scale}in`,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* QR Code - left side */}
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{ width: `${0.85 * scale}in`, height: `${0.85 * scale}in` }}
      >
        {qrCodeUrl ? (
          <img
            src={qrCodeUrl}
            alt="QR"
            style={{
              width: `${0.8 * scale}in`,
              height: `${0.8 * scale}in`,
              imageRendering: 'pixelated',
            }}
          />
        ) : (
          <div
            style={{
              width: `${0.8 * scale}in`,
              height: `${0.8 * scale}in`,
              backgroundColor: '#f0f0f0',
            }}
          />
        )}
      </div>

      {/* Info - right side */}
      <div
        className="flex-1 flex flex-col justify-center overflow-hidden"
        style={{ paddingLeft: `${0.05 * scale}in` }}
      >
        {/* Cycle number - bold, prominent */}
        <div
          className="font-mono font-bold truncate"
          style={{ fontSize: `${10 * scale}pt`, lineHeight: 1.1 }}
        >
          {cycle.externalCycleNumber
            ? `#${String(cycle.externalCycleNumber).padStart(4, '0')}`
            : cycle.cycleNumber}
        </div>

        {/* Equipment name - truncated */}
        <div
          className="truncate text-gray-600"
          style={{ fontSize: `${6 * scale}pt`, lineHeight: 1.2 }}
        >
          {cycle.equipmentName}
        </div>

        {/* Dates row */}
        <div
          className="flex gap-1"
          style={{ fontSize: `${7 * scale}pt`, lineHeight: 1.2, marginTop: `${0.02 * scale}in` }}
        >
          <span className="text-gray-500">S:</span>
          <span className="font-medium">{formatDate(cycle.cycleDate)}</span>
        </div>
        <div
          className="flex gap-1"
          style={{ fontSize: `${7 * scale}pt`, lineHeight: 1.2 }}
        >
          <span className="text-gray-500">E:</span>
          <span className="font-bold text-red-600">{formatDate(expirationDate)}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Multiple labels for thermal printing - renders N copies with page breaks
 */
export function ZebraThermalLabelBatch({
  cycle,
  format = '2x1',
  count = 1,
}: {
  cycle: CycleLabelData;
  format?: ZebraLabelFormat;
  count?: number;
}) {
  const labels = Array(count).fill(null);

  return (
    <>
      {labels.map((_, i) => (
        <div key={i} className="zebra-label">
          <ZebraThermalLabel cycle={cycle} format={format} />
        </div>
      ))}
    </>
  );
}

export { ZEBRA_LABEL_FORMATS as ZebraFormats };

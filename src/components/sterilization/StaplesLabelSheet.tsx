'use client';

import { useEffect, useState } from 'react';
import {
  generateQRCodeDataURL,
  SterilizationQRData,
  calculateExpirationDate,
} from '@/lib/sterilization/qr-code';
import type { CycleLabelData } from './CycleLabelPrint';

/**
 * Staples Label Sheet Formats (measured from actual sheets)
 *
 * 4x2 Shipping Labels (ST18060-CC / 3037851):
 * - 10 labels per sheet (2 columns x 5 rows)
 * - Each label: 4" wide x 2" tall
 * - Sheet: 8.5" x 11" letter
 * - Top/Bottom margin: 13mm (0.512")
 * - Left/Right margin: 4mm (0.157")
 * - Labels touch vertically (no gap between rows)
 * - Center gap between columns: ~4.7mm (0.186")
 *
 * 2.625x1 Address Labels (ST18054-CC):
 * - 30 labels per sheet (3 columns x 10 rows)
 * - Each label: 2.625" x 1"
 * - Sheet: 8.5" x 11" letter
 * - Margins: 0.5" top/bottom, 0.1875" left/right
 */

export type StaplesLabelFormat = '4x2' | '2.625x1';

interface StaplesLabelSheetProps {
  cycle: CycleLabelData;
  format: StaplesLabelFormat;
  /** How many labels to print (fills sheet, max based on format) */
  labelCount?: number;
  /** Show sheet border for preview (hidden in print) */
  showSheetBorder?: boolean;
}

// Label format configurations (measurements from actual Staples sheets)
const LABEL_FORMATS = {
  '4x2': {
    name: 'Staples Shipping 4" x 2"',
    sku: 'ST18060-CC',
    labelsPerSheet: 10,
    columns: 2,
    rows: 5,
    labelWidth: 4, // inches
    labelHeight: 2, // inches
    marginTop: 0.512, // 13mm from top/bottom edge to first/last label
    marginLeft: 0.157, // 4mm from left/right edge
    gapHorizontal: 0.186, // ~4.7mm gap between the two columns (center)
    gapVertical: 0, // labels touch each other vertically
  },
  '2.625x1': {
    name: 'Staples Address 2⅝" x 1"',
    sku: 'ST18054-CC',
    labelsPerSheet: 30,
    columns: 3,
    rows: 10,
    labelWidth: 2.625, // inches
    labelHeight: 1, // inches
    marginTop: 0.5, // inches
    marginLeft: 0.1875, // inches
    gapHorizontal: 0.125, // inches
    gapVertical: 0, // inches
  },
} as const;

// Single label component for 4x2 format
function Label4x2({ cycle, qrCodeUrl }: { cycle: CycleLabelData; qrCodeUrl: string }) {
  const expirationDays = cycle.expirationDays || 30;
  const expirationDate = calculateExpirationDate(cycle.cycleDate, expirationDays);

  const formatCycleType = (type: string) => {
    switch (type) {
      case 'STEAM_GRAVITY': return 'Steam Gravity';
      case 'STEAM_PREVACUUM': return 'Steam Pre-Vac';
      case 'STEAM_FLASH': return 'Flash';
      case 'CHEMICAL': return 'Chemical';
      case 'DRY_HEAT': return 'Dry Heat';
      default: return type;
    }
  };

  const tempDisplay = cycle.temperature ? `${Math.round(Number(cycle.temperature))}°C` : '';
  const timeDisplay = cycle.exposureTime ? `${cycle.exposureTime}min` : '';
  const params = [tempDisplay, timeDisplay].filter(Boolean).join(' / ');

  return (
    <div
      className="flex items-center gap-3 box-border overflow-hidden bg-white"
      style={{
        width: '4in',
        height: '2in',
        padding: '0.125in',
      }}
    >
      {/* QR Code */}
      <div className="flex-shrink-0">
        {qrCodeUrl ? (
          <img
            src={qrCodeUrl}
            alt="QR"
            style={{ width: '1.6in', height: '1.6in', imageRendering: 'pixelated' }}
          />
        ) : (
          <div style={{ width: '1.6in', height: '1.6in', backgroundColor: '#f0f0f0' }} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-between h-full py-1">
        {/* Equipment name */}
        <div
          className="font-bold text-gray-800 truncate"
          style={{ fontSize: '11pt' }}
        >
          {cycle.equipmentName}
        </div>

        {/* Cycle number */}
        <div
          className="font-mono font-bold"
          style={{ fontSize: '14pt' }}
        >
          {cycle.externalCycleNumber
            ? `#${String(cycle.externalCycleNumber).padStart(5, '0')}`
            : cycle.cycleNumber}
        </div>

        {/* Type + Params */}
        <div
          className="text-gray-600"
          style={{ fontSize: '9pt' }}
        >
          {formatCycleType(cycle.cycleType)}
          {params && ` • ${params}`}
        </div>

        {/* Dates row */}
        <div
          className="flex justify-between items-center border-t border-gray-300 pt-1"
          style={{ fontSize: '10pt' }}
        >
          <div>
            <span className="text-gray-500">STE: </span>
            <span className="font-semibold">
              {cycle.cycleDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: '2-digit',
              })}
            </span>
          </div>
          <div className="text-red-600">
            <span className="text-gray-500">EXP: </span>
            <span className="font-bold">
              {expirationDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1" style={{ fontSize: '8pt' }}>
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              cycle.status === 'COMPLETED' ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className={cycle.status === 'COMPLETED' ? 'text-green-700' : 'text-red-700'}>
            {cycle.status === 'COMPLETED' ? 'STERILE' : 'FAILED'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Single label component for 2.625x1 format (compact)
function Label2625x1({ cycle, qrCodeUrl }: { cycle: CycleLabelData; qrCodeUrl: string }) {
  const expirationDays = cycle.expirationDays || 30;
  const expirationDate = calculateExpirationDate(cycle.cycleDate, expirationDays);

  return (
    <div
      className="flex items-center gap-1 box-border overflow-hidden bg-white"
      style={{
        width: '2.625in',
        height: '1in',
        padding: '0.0625in',
      }}
    >
      {/* QR Code */}
      <div className="flex-shrink-0">
        {qrCodeUrl ? (
          <img
            src={qrCodeUrl}
            alt="QR"
            style={{ width: '0.8in', height: '0.8in', imageRendering: 'pixelated' }}
          />
        ) : (
          <div style={{ width: '0.8in', height: '0.8in', backgroundColor: '#f0f0f0' }} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-center h-full overflow-hidden">
        {/* Cycle number */}
        <div
          className="font-mono font-bold truncate"
          style={{ fontSize: '9pt' }}
        >
          {cycle.externalCycleNumber
            ? `#${String(cycle.externalCycleNumber).padStart(5, '0')}`
            : cycle.cycleNumber}
        </div>

        {/* Equipment */}
        <div
          className="text-gray-600 truncate"
          style={{ fontSize: '7pt' }}
        >
          {cycle.equipmentName}
        </div>

        {/* Dates */}
        <div
          className="flex gap-2"
          style={{ fontSize: '7pt' }}
        >
          <span>
            S:{' '}
            {cycle.cycleDate.toLocaleDateString('en-US', {
              month: 'numeric',
              day: 'numeric',
            })}
          </span>
          <span className="text-red-600 font-semibold">
            E:{' '}
            {expirationDate.toLocaleDateString('en-US', {
              month: 'numeric',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

export function StaplesLabelSheet({
  cycle,
  format,
  labelCount,
  showSheetBorder = true,
}: StaplesLabelSheetProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const config = LABEL_FORMATS[format];
  const count = labelCount ?? config.labelsPerSheet;

  useEffect(() => {
    async function generateQR() {
      const expirationDate = calculateExpirationDate(
        cycle.cycleDate,
        cycle.expirationDays || 30
      );

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

      // Smaller QR for address labels
      const qrSize = format === '2.625x1' ? 100 : 200;
      const url = await generateQRCodeDataURL(qrData, {
        width: qrSize,
        errorCorrectionLevel: 'H',
      });
      setQrCodeUrl(url);
    }

    generateQR();
  }, [cycle, format]);

  // Generate grid of labels
  const labels = [];
  for (let i = 0; i < Math.min(count, config.labelsPerSheet); i++) {
    labels.push(
      format === '4x2' ? (
        <Label4x2 key={i} cycle={cycle} qrCodeUrl={qrCodeUrl} />
      ) : (
        <Label2625x1 key={i} cycle={cycle} qrCodeUrl={qrCodeUrl} />
      )
    );
  }

  // Calculate grid template
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${config.columns}, ${config.labelWidth}in)`,
    gridTemplateRows: `repeat(${config.rows}, ${config.labelHeight}in)`,
    columnGap: `${config.gapHorizontal}in`,
    rowGap: `${config.gapVertical}in`,
    paddingTop: `${config.marginTop}in`,
    paddingLeft: `${config.marginLeft}in`,
    width: '8.5in',
    height: '11in',
    backgroundColor: 'white',
  };

  return (
    <div
      className={showSheetBorder ? 'border border-gray-300 shadow-sm print:border-0 print:shadow-none' : ''}
      style={gridStyle}
    >
      {labels}
    </div>
  );
}

// Export label format info for use in UI
export function getLabelFormatInfo(format: StaplesLabelFormat) {
  return LABEL_FORMATS[format];
}

export { LABEL_FORMATS };

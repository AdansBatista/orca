'use client';

import { useEffect, useState } from 'react';
import {
  generateQRCodeDataURL,
  SterilizationQRData,
  calculateExpirationDate,
} from '@/lib/sterilization/qr-code';

export interface CycleLabelData {
  cycleId: string;
  cycleNumber: string;
  externalCycleNumber?: number | null;
  cycleDate: Date;
  cycleType: string;
  equipmentName: string;
  temperature?: number | null;
  pressure?: number | null;
  exposureTime?: number | null;
  status: string;
  expirationDays?: number;
}

interface CycleLabelPrintProps {
  cycle: CycleLabelData;
  format: 'label' | 'full';
}

export function CycleLabelPrint({ cycle, format }: CycleLabelPrintProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

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

      const url = await generateQRCodeDataURL(qrData, {
        width: format === 'full' ? 300 : 150,
        errorCorrectionLevel: 'H',
      });
      setQrCodeUrl(url);
    }

    generateQR();
  }, [cycle, format, expirationDate]);

  // Format cycle type for display
  const formatCycleType = (type: string) => {
    switch (type) {
      case 'STEAM_GRAVITY':
        return 'Steam (Gravity)';
      case 'STEAM_PREVACUUM':
        return 'Steam (Pre-vacuum)';
      case 'STEAM_FLASH':
        return 'Flash';
      default:
        return type;
    }
  };

  // Format temperature display
  const tempDisplay = cycle.temperature
    ? `${cycle.temperature}°C`
    : '';
  const timeDisplay = cycle.exposureTime
    ? `${cycle.exposureTime}min`
    : '';
  const cycleParams = [tempDisplay, timeDisplay].filter(Boolean).join('/');

  if (format === 'full') {
    // Full page format - large QR code with details
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 print:p-0">
        <div className="border-2 border-black p-8 max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">STERILIZED</h1>
            <p className="text-lg">{cycle.equipmentName}</p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="Sterilization QR Code"
                className="w-64 h-64"
              />
            ) : (
              <div className="w-64 h-64 bg-gray-100 flex items-center justify-center">
                Loading...
              </div>
            )}
          </div>

          {/* Cycle Info */}
          <div className="space-y-2 text-center">
            <p className="text-xl font-mono font-bold">
              {cycle.externalCycleNumber
                ? `#${String(cycle.externalCycleNumber).padStart(5, '0')}`
                : cycle.cycleNumber}
            </p>
            <p className="text-lg">
              {formatCycleType(cycle.cycleType)}
              {cycleParams && ` • ${cycleParams}`}
            </p>
          </div>

          {/* Dates */}
          <div className="mt-6 grid grid-cols-2 gap-4 text-center border-t pt-4">
            <div>
              <p className="text-sm text-gray-600">Sterilized</p>
              <p className="font-bold">
                {cycle.cycleDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Expires</p>
              <p className="font-bold text-red-600">
                {expirationDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="mt-4 text-center">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                cycle.status === 'COMPLETED'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {cycle.status === 'COMPLETED' ? '✓ PASSED' : '✗ FAILED'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2x2" label format - compact
  return (
    <div
      className="label-2x2 border border-black p-2 flex flex-col"
      style={{ width: '2in', height: '2in' }}
    >
      {/* Top: Equipment name */}
      <div className="text-center text-xs font-bold truncate">
        {cycle.equipmentName}
      </div>

      {/* Middle: QR Code + Cycle info */}
      <div className="flex-1 flex items-center justify-between gap-1 py-1">
        {/* QR Code */}
        <div className="flex-shrink-0">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="QR"
              className="w-16 h-16"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            <div className="w-16 h-16 bg-gray-100" />
          )}
        </div>

        {/* Cycle details */}
        <div className="flex-1 text-right">
          <p className="font-mono font-bold text-sm">
            {cycle.externalCycleNumber
              ? `#${String(cycle.externalCycleNumber).padStart(5, '0')}`
              : cycle.cycleNumber}
          </p>
          <p className="text-xs">
            {cycleParams || formatCycleType(cycle.cycleType)}
          </p>
          <p
            className={`text-xs font-medium ${
              cycle.status === 'COMPLETED' ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {cycle.status === 'COMPLETED' ? '✓' : '✗'}
          </p>
        </div>
      </div>

      {/* Bottom: Dates */}
      <div className="flex justify-between text-xs border-t pt-1">
        <div>
          <span className="text-gray-500">S: </span>
          <span className="font-medium">
            {cycle.cycleDate.toLocaleDateString('en-US', {
              month: 'numeric',
              day: 'numeric',
              year: '2-digit',
            })}
          </span>
        </div>
        <div className="text-red-600">
          <span className="text-gray-500">E: </span>
          <span className="font-medium">
            {expirationDate.toLocaleDateString('en-US', {
              month: 'numeric',
              day: 'numeric',
              year: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

// Grid of labels for printing multiple on one page
export function CycleLabelGrid({
  cycle,
  copies = 9,
}: {
  cycle: CycleLabelData;
  copies?: number;
}) {
  const labels = Array(copies).fill(null);

  return (
    <div
      className="grid gap-2 p-4 print:p-0"
      style={{
        gridTemplateColumns: 'repeat(3, 2in)',
        gridAutoRows: '2in',
      }}
    >
      {labels.map((_, i) => (
        <CycleLabelPrint key={i} cycle={cycle} format="label" />
      ))}
    </div>
  );
}

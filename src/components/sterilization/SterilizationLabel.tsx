'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Printer, Download, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  generateQRCodeDataURL,
  calculateExpirationDate,
  type SterilizationQRData,
} from '@/lib/sterilization/qr-code';

interface SterilizationLabelProps {
  cycle: {
    id: string;
    cycleNumber: string;
    cycleType: string;
    startTime: Date | string;
    temperature?: number | null;
    pressure?: number | null;
    exposureTime?: number | null;
    status: string;
  };
  equipmentName?: string;
  packageType?: string;
  expirationDays?: number;
  /** Show download/print buttons */
  showControls?: boolean;
}

const cycleTypeLabels: Record<string, string> = {
  STEAM_GRAVITY: 'Steam Gravity',
  STEAM_PREVACUUM: 'Steam Pre-Vacuum',
  STEAM_FLASH: 'Flash',
  CHEMICAL: 'Chemical',
  DRY_HEAT: 'Dry Heat',
  VALIDATION: 'Validation',
};

/**
 * SterilizationLabel - Displays a preview of the sterilization label with QR code.
 * For actual printing, redirects to the dedicated print page which has proper
 * Staples label sheet layouts.
 */
export function SterilizationLabel({
  cycle,
  equipmentName,
  packageType = 'Cassette',
  expirationDays = 30,
  showControls = true,
}: SterilizationLabelProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoize cycleDate to prevent infinite loop
  const cycleDateStr = typeof cycle.startTime === 'string'
    ? cycle.startTime
    : cycle.startTime.toISOString();
  const cycleDate = new Date(cycleDateStr);
  const expirationDate = calculateExpirationDate(cycleDate, expirationDays);

  useEffect(() => {
    const generateQR = async () => {
      setLoading(true);
      try {
        const qrData: SterilizationQRData = {
          cycleId: cycle.id,
          cycleNumber: cycle.cycleNumber,
          cycleDate: new Date(cycleDateStr),
          cycleType: cycle.cycleType,
          temperature: cycle.temperature ?? undefined,
          pressure: cycle.pressure ?? undefined,
          exposureTime: cycle.exposureTime ?? undefined,
          status: cycle.status,
          equipmentName,
          packageType,
        };

        const dataUrl = await generateQRCodeDataURL(qrData, {
          width: 300,
          margin: 1,
          errorCorrectionLevel: 'H',
        });
        setQrCodeDataUrl(dataUrl);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      } finally {
        setLoading(false);
      }
    };

    generateQR();
  }, [cycle.id, cycle.cycleNumber, cycle.cycleType, cycle.temperature, cycle.pressure, cycle.exposureTime, cycle.status, equipmentName, packageType, cycleDateStr]);

  const handleDownload = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `sterilization-qr-${cycle.cycleNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle size="sm">Sterilization Label</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Label Preview */}
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex gap-4">
            {/* QR Code Section */}
            <div className="flex-shrink-0">
              {loading ? (
                <div className="w-[120px] h-[120px] bg-muted animate-pulse rounded flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt={`QR Code for ${cycle.cycleNumber}`}
                  className="w-[120px] h-[120px]"
                />
              ) : (
                <div className="w-[120px] h-[120px] bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                  QR Error
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="flex-1 text-sm space-y-1">
              <div className="font-bold text-base">
                {cycle.cycleNumber}
              </div>
              <div className="flex gap-1">
                <span className="text-muted-foreground">Type:</span>
                <span>{cycleTypeLabels[cycle.cycleType] || cycle.cycleType}</span>
              </div>
              <div className="flex gap-1">
                <span className="text-muted-foreground">Sterilized:</span>
                <span>{format(cycleDate, 'MMM d, yyyy')}</span>
              </div>
              <div className="flex gap-1">
                <span className="text-muted-foreground">Expires:</span>
                <span className="font-semibold text-error-600">
                  {format(expirationDate, 'MMM d, yyyy')}
                </span>
              </div>
              {cycle.temperature && (
                <div className="flex gap-1">
                  <span className="text-muted-foreground">Temp:</span>
                  <span>{Number(cycle.temperature).toFixed(0)}°C</span>
                </div>
              )}
              {equipmentName && (
                <div className="text-xs text-muted-foreground">
                  {equipmentName}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        {showControls && (
          <div className="flex gap-2">
            <Link href={`/resources/sterilization/${cycle.id}/print`}>
              <Button disabled={loading}>
                <Printer className="h-4 w-4" />
                Print Labels
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={loading || !qrCodeDataUrl}
            >
              <Download className="h-4 w-4" />
              Download QR
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

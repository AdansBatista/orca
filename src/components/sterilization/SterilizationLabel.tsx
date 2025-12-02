'use client';

import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { Printer, Download, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import {
  generateQRCodeDataURL,
  calculateExpirationDate,
  LABEL_SIZES,
  type SterilizationQRData,
  type LabelSize,
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
  expirationDays?: number;
  showPrintControls?: boolean;
  labelSize?: LabelSize;
  onPrint?: () => void;
}

const cycleTypeLabels: Record<string, string> = {
  STEAM_GRAVITY: 'Steam Gravity',
  STEAM_PREVACUUM: 'Steam Pre-Vacuum',
  STEAM_FLASH: 'Flash',
  CHEMICAL: 'Chemical',
  DRY_HEAT: 'Dry Heat',
  VALIDATION: 'Validation',
};

export function SterilizationLabel({
  cycle,
  equipmentName,
  expirationDays = 30,
  showPrintControls = true,
  labelSize: initialLabelSize = '2x2',
  onPrint,
}: SterilizationLabelProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [labelSize, setLabelSize] = useState<LabelSize>(initialLabelSize);
  const [copies, setCopies] = useState(1);
  const labelRef = useRef<HTMLDivElement>(null);

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
  }, [cycle.id, cycle.cycleNumber, cycle.cycleType, cycle.temperature, cycle.pressure, cycle.exposureTime, cycle.status, equipmentName, cycleDateStr]);

  const handlePrint = () => {
    if (!labelRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const labelContent = labelRef.current.innerHTML;
    const labelConfig = LABEL_SIZES[labelSize];

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sterilization Label - ${cycle.cycleNumber}</title>
          <style>
            @page {
              size: ${labelConfig.width}in ${labelConfig.height}in;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            .label-container {
              width: ${labelConfig.width}in;
              height: ${labelConfig.height}in;
              padding: 0.1in;
              box-sizing: border-box;
              page-break-after: always;
            }
            .label-container:last-child {
              page-break-after: auto;
            }
            .label-content {
              display: flex;
              gap: 8px;
              height: 100%;
            }
            .qr-section {
              flex-shrink: 0;
            }
            .qr-section img {
              width: ${Math.min(labelConfig.height * 0.8, 1.5)}in;
              height: ${Math.min(labelConfig.height * 0.8, 1.5)}in;
            }
            .info-section {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              font-size: ${labelSize === '2x1' ? '7pt' : '9pt'};
              line-height: 1.3;
            }
            .cycle-number {
              font-weight: bold;
              font-size: ${labelSize === '2x1' ? '9pt' : '11pt'};
              margin-bottom: 2px;
            }
            .info-row {
              display: flex;
              gap: 4px;
            }
            .label-key {
              color: #666;
            }
            .expiry {
              font-weight: bold;
              color: #c00;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${Array(copies).fill(`<div class="label-container">${labelContent}</div>`).join('')}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    onPrint?.();
  };

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
          <div ref={labelRef} className="label-content flex gap-4">
            {/* QR Code Section */}
            <div className="qr-section flex-shrink-0">
              {loading ? (
                <div className="w-[160px] h-[160px] bg-muted animate-pulse rounded flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt={`QR Code for ${cycle.cycleNumber}`}
                  className="w-[160px] h-[160px]"
                />
              ) : (
                <div className="w-[160px] h-[160px] bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                  QR Error
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="info-section flex-1 text-sm space-y-1">
              <div className="cycle-number font-bold text-base">
                {cycle.cycleNumber}
              </div>
              <div className="info-row">
                <span className="label-key text-muted-foreground">Type:</span>
                <span>{cycleTypeLabels[cycle.cycleType] || cycle.cycleType}</span>
              </div>
              <div className="info-row">
                <span className="label-key text-muted-foreground">Sterilized:</span>
                <span>{format(cycleDate, 'MMM d, yyyy')}</span>
              </div>
              <div className="info-row">
                <span className="label-key text-muted-foreground">Expires:</span>
                <span className="expiry font-semibold text-error-600">
                  {format(expirationDate, 'MMM d, yyyy')}
                </span>
              </div>
              {cycle.temperature && (
                <div className="info-row">
                  <span className="label-key text-muted-foreground">Temp:</span>
                  <span>{Number(cycle.temperature).toFixed(0)}°C</span>
                </div>
              )}
              {equipmentName && (
                <div className="info-row text-xs text-muted-foreground">
                  {equipmentName}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Print Controls */}
        {showPrintControls && (
          <div className="flex flex-wrap items-end gap-4">
            <FormField label="Label Size" className="w-32">
              <Select
                value={labelSize}
                onValueChange={(v) => setLabelSize(v as LabelSize)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2x1">2&quot; x 1&quot;</SelectItem>
                  <SelectItem value="2x2">2&quot; x 2&quot;</SelectItem>
                  <SelectItem value="2x4">2&quot; x 4&quot;</SelectItem>
                  <SelectItem value="4x6">4&quot; x 6&quot;</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Copies" className="w-20">
              <Select
                value={String(copies)}
                onValueChange={(v) => setCopies(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="flex gap-2">
              <Button onClick={handlePrint} disabled={loading || !qrCodeDataUrl}>
                <Printer className="h-4 w-4 mr-2" />
                Print Labels
              </Button>
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={loading || !qrCodeDataUrl}
              >
                <Download className="h-4 w-4 mr-2" />
                Download QR
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

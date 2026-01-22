'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Printer, Plus, Minus } from 'lucide-react';
import { generateQRCodeDataURL, type SterilizationQRData } from '@/lib/sterilization/qr-code';

export default function PrintPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PrintPageContent />
    </Suspense>
  );
}

function PrintPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const cycleIds = searchParams.get('cycles')?.split(',') || [];
  const [quantity, setQuantity] = useState(1);
  const [printing, setPrinting] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Generate QR code for the first cycle on mount
  useEffect(() => {
    async function generateQR() {
      if (cycleIds.length === 0) return;

      console.log('🔢 Generating QR code for cycle:', cycleIds[0]);

      // Parse the cycle ID format: year-month-day-cycleNumber
      const [year, month, day, cycleNumber] = cycleIds[0].split('-');
      const cycleDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

      const qrData: SterilizationQRData = {
        cycleId: cycleIds[0],
        cycleNumber: cycleNumber,
        cycleDate: cycleDate,
        equipmentName: 'STATCLAVE G4', // Default equipment name
        packageType: 'Wrapped', // Default package type
      };

      try {
        const dataUrl = await generateQRCodeDataURL(qrData, {
          width: 400, // Much higher resolution for crisp thermal printing
          margin: 1, // Minimal margin to maximize QR size
          errorCorrectionLevel: 'M', // Medium error correction (15% recovery) - better for dense codes
        });
        setQrCodeUrl(dataUrl);
        console.log('✅ QR code generated successfully');
      } catch (error) {
        console.error('❌ Failed to generate QR code:', error);
      }
    }

    generateQR();
  }, [cycleIds]);

  function adjustQuantity(delta: number) {
    setQuantity(Math.max(1, Math.min(100, quantity + delta)));
  }

  function setPresetQuantity(amount: number) {
    console.log('🔢 Setting quantity to:', amount);
    setQuantity(amount);
  }

  async function handlePrint() {
    console.log('🖨️ Printing', quantity, 'labels for', cycleIds.length, 'cycles');
    setPrinting(true);

    try {
      // For now, trigger browser print dialog
      window.print();

      // TODO: In the future, send ZPL directly to Zebra printer
      // const response = await fetch('/api/print-labels', {
      //   method: 'POST',
      //   body: JSON.stringify({ cycleIds, quantity }),
      // });

      console.log('✅ Print dialog opened');
    } catch (error) {
      console.error('❌ Print failed:', error);
      alert('Print failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setPrinting(false);
    }
  }

  return (
    <main className="min-h-screen p-8 pb-24 bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Print Labels</h1>
          </div>
        </div>

        {/* Print Settings - Balanced Control Bar */}
        <Card className="mb-8">
          <CardContent className="py-5">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              {/* Left: Quick Presets */}
              <div className="flex items-center gap-3">
                <span className="text-base font-semibold whitespace-nowrap">Qty:</span>
                <div className="flex gap-2">
                  {[5, 10, 15, 20, 25].map((preset) => (
                    <Button
                      key={preset}
                      variant={quantity === preset ? "default" : "outline"}
                      size="default"
                      onClick={() => setPresetQuantity(preset)}
                      className={`min-w-[48px] text-base ${quantity === preset ? "bg-primary text-white" : ""}`}
                    >
                      {preset}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Center: Fine Tune Controls */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11"
                  onClick={() => adjustQuantity(-1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  className="w-20 text-center text-xl font-bold h-11"
                  min={1}
                  max={100}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11"
                  onClick={() => adjustQuantity(1)}
                  disabled={quantity >= 100}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="bg-primary text-white hover:bg-primary/90 min-w-[140px]"
                  onClick={handlePrint}
                  disabled={printing || cycleIds.length === 0}
                >
                  <Printer className="w-5 h-5 mr-2" />
                  {printing ? 'Printing...' : `Print ${cycleIds.length * quantity}`}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Label Preview */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Label Preview</CardTitle>
              <span className="text-sm text-muted-foreground font-normal">2" × 1" Thermal</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8">
              <div className="max-w-md mx-auto">
                <div className="border-2 border-black p-3 bg-white" style={{ aspectRatio: '2/1' }}>
                  {/* Label Content Preview - Optimized Layout */}
                  <div className="flex h-full gap-3">
                    {/* Left Side: Logo + Text */}
                    <div className="flex-1 flex flex-col">
                      {/* Clinic Logo - Top Left */}
                      <div className="mb-0">
                        <img
                          src="/WillowPrimaryTransparent trimmed.png"
                          alt="Clinic Logo"
                          className="h-16 -ml-5 mt-4 w-auto object-contain"
                        />
                      </div>
                      {/* Text Content */}
                      <div className="flex-1 flex flex-col justify-center space-y-0.5">
                        <div className="text-[11px] font-bold">STATCLAVE G4</div>
                        <div className="text-base font-bold leading-none">
                          Cycle #{cycleIds.length > 0 ? cycleIds[0].split('-')[3] : '00000'}
                        </div>
                        <div className="text-[10px] leading-tight mt-0.5">
                          {cycleIds.length > 0 ? (() => {
                            const [year, month, day] = cycleIds[0].split('-');
                            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                            return date.toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            });
                          })() : '01-Jan-2026'} at {cycleIds.length > 0 ? '14:31' : '14:31'}
                        </div>
                        <div className="text-[10px] leading-tight">
                          Solid/Wrapped 132°C/4min
                        </div>
                      </div>
                    </div>

                    {/* QR Code - Right Side */}
                    <div className="flex items-start justify-center" style={{ width: '40%' }}>
                      {qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt="QR Code"
                          className="w-full h-full object-contain"
                          style={{ imageRendering: 'crisp-edges' }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 border border-gray-400 flex items-center justify-center text-xs">
                          Loading...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Preview showing first label
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Print Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Printer Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Ensure Zebra thermal printer is connected and powered on</p>
              <p>• Load 2" × 1" thermal labels</p>
              <p>• Select the Zebra printer in the print dialog</p>
              <p>• Labels will print with QR codes for easy scanning</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print-only Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </main>
  );
}

'use client';

import { useState, useEffect, use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Printer, ArrowLeft, FileText, Grid3X3, LayoutGrid } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { PageHeader, PageContent } from '@/components/layout';
import {
  CycleLabelPrint,
  CycleLabelData,
} from '@/components/sterilization/CycleLabelPrint';
import { StaplesLabelSheet, type StaplesLabelFormat } from '@/components/sterilization/StaplesLabelSheet';

interface SterilizationCycle {
  id: string;
  cycleNumber: string;
  externalCycleNumber: number | null;
  cycleType: string;
  startTime: string;
  temperature: number | null;
  pressure: number | null;
  exposureTime: number | null;
  status: string;
  equipmentId: string;
  autoclave?: {
    name: string;
    equipment: {
      name: string;
    };
  } | null;
}

type PrintFormat = 'staples-4x2' | 'staples-2.625x1' | 'full';

function PrintLabelsPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [cycle, setCycle] = useState<SterilizationCycle | null>(null);
  const [equipmentName, setEquipmentName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [format, setFormat] = useState<PrintFormat>(
    (searchParams.get('format') as PrintFormat) || 'staples-4x2'
  );

  useEffect(() => {
    fetchCycle();
  }, [id]);

  async function fetchCycle() {
    try {
      const res = await fetch(`/api/resources/sterilization/cycles/${id}`);
      const data = await res.json();

      if (data.success) {
        setCycle(data.data);

        // Get equipment name
        if (data.data.autoclave?.equipment?.name) {
          setEquipmentName(data.data.autoclave.equipment.name);
        } else if (data.data.autoclave?.name) {
          setEquipmentName(data.data.autoclave.name);
        } else {
          // Fetch equipment separately
          const eqRes = await fetch(
            `/api/resources/equipment/${data.data.equipmentId}`
          );
          const eqData = await eqRes.json();
          if (eqData.success) {
            setEquipmentName(eqData.data.name);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch cycle:', error);
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <>
        <PageHeader
          title="Print Labels"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Sterilization', href: '/resources/sterilization' },
            { label: 'Print Labels' },
          ]}
        />
        <PageContent>
          <Skeleton className="h-96 w-full max-w-2xl mx-auto" />
        </PageContent>
      </>
    );
  }

  if (!cycle) {
    return (
      <>
        <PageHeader
          title="Print Labels"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Sterilization', href: '/resources/sterilization' },
            { label: 'Print Labels' },
          ]}
        />
        <PageContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cycle not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
        </PageContent>
      </>
    );
  }

  const labelData: CycleLabelData = {
    cycleId: cycle.id,
    cycleNumber: cycle.cycleNumber,
    externalCycleNumber: cycle.externalCycleNumber,
    cycleDate: new Date(cycle.startTime),
    cycleType: cycle.cycleType,
    equipmentName: equipmentName || 'Autoclave',
    temperature: cycle.temperature,
    pressure: cycle.pressure,
    exposureTime: cycle.exposureTime,
    status: cycle.status,
    expirationDays: 30,
  };

  return (
    <>
      {/* Screen-only header */}
      <div className="print:hidden">
        <PageHeader
          title="Print Labels"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Sterilization', href: '/resources/sterilization' },
            { label: cycle.cycleNumber, href: `/resources/sterilization/${id}` },
            { label: 'Print Labels' },
          ]}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          }
        />
      </div>

      {/* Screen-only format selector */}
      <div className="print:hidden">
        <PageContent density="comfortable">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Format Selection */}
            <Card variant="bento">
              <CardHeader>
                <CardTitle>Label Format</CardTitle>
                <CardDescription>
                  Choose the Staples label sheet format you&apos;re printing on
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={format}
                  onValueChange={(v) => setFormat(v as PrintFormat)}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {/* Staples 4x2 Shipping Labels */}
                  <div>
                    <RadioGroupItem
                      value="staples-4x2"
                      id="format-staples-4x2"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="format-staples-4x2"
                      className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
                    >
                      <LayoutGrid className="h-8 w-8 mb-2" />
                      <span className="font-medium text-center">Staples Shipping</span>
                      <span className="text-xs text-muted-foreground text-center">
                        4&quot; x 2&quot; • 10 per sheet
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        SKU: ST18060-CC
                      </span>
                    </Label>
                  </div>

                  {/* Staples 2.625x1 Address Labels */}
                  <div>
                    <RadioGroupItem
                      value="staples-2.625x1"
                      id="format-staples-address"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="format-staples-address"
                      className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
                    >
                      <Grid3X3 className="h-8 w-8 mb-2" />
                      <span className="font-medium text-center">Staples Address</span>
                      <span className="text-xs text-muted-foreground text-center">
                        2⅝&quot; x 1&quot; • 30 per sheet
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        SKU: ST18054-CC
                      </span>
                    </Label>
                  </div>

                  {/* Full Page */}
                  <div>
                    <RadioGroupItem
                      value="full"
                      id="format-full"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="format-full"
                      className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
                    >
                      <FileText className="h-8 w-8 mb-2" />
                      <span className="font-medium text-center">Full Page</span>
                      <span className="text-xs text-muted-foreground text-center">
                        Large label with big QR
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        Regular paper
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card variant="bento">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  This is how your labels will look when printed (scaled to fit)
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-auto bg-gray-100 rounded-lg p-4">
                <div className="flex justify-center">
                  {format === 'full' ? (
                    <CycleLabelPrint cycle={labelData} format="full" />
                  ) : format === 'staples-4x2' ? (
                    <div className="transform scale-[0.45] origin-top">
                      <StaplesLabelSheet
                        cycle={labelData}
                        format="4x2"
                        showSheetBorder
                      />
                    </div>
                  ) : (
                    <div className="transform scale-[0.45] origin-top">
                      <StaplesLabelSheet
                        cycle={labelData}
                        format="2.625x1"
                        showSheetBorder
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Print Instructions */}
            <Card variant="ghost">
              <CardContent className="pt-6">
                <h4 className="font-medium mb-2">Printing Instructions</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {format === 'staples-4x2' && (
                    <>
                      <li>• Load <strong>Staples Shipping Labels (ST18060-CC)</strong> into your printer</li>
                      <li>• This sheet has 10 labels (2 columns x 5 rows), each 4&quot; x 2&quot;</li>
                    </>
                  )}
                  {format === 'staples-2.625x1' && (
                    <>
                      <li>• Load <strong>Staples Address Labels (ST18054-CC)</strong> into your printer</li>
                      <li>• This sheet has 30 labels (3 columns x 10 rows), each 2⅝&quot; x 1&quot;</li>
                    </>
                  )}
                  {format === 'full' && (
                    <li>• Use regular letter-size paper for full-page labels</li>
                  )}
                  <li>• Set printer to <strong>&quot;Actual size&quot;</strong> (not &quot;Fit to page&quot;)</li>
                  <li>• Turn off headers/footers in print settings</li>
                  <li>• Set margins to <strong>None</strong> or <strong>Minimum</strong></li>
                  <li>• After printing, apply one label to each sterilized pouch from this cycle</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </PageContent>
      </div>

      {/* Print-only content */}
      <div className="hidden print:block">
        <style jsx global>{`
          @media print {
            @page {
              margin: 0;
              size: letter;
            }
            body {
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print\\:block {
              display: block !important;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `}</style>
        {format === 'full' ? (
          <CycleLabelPrint cycle={labelData} format="full" />
        ) : format === 'staples-4x2' ? (
          <StaplesLabelSheet cycle={labelData} format="4x2" showSheetBorder={false} />
        ) : (
          <StaplesLabelSheet cycle={labelData} format="2.625x1" showSheetBorder={false} />
        )}
      </div>
    </>
  );
}

export default function PrintLabelsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="flex h-48 items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>}>
      <PrintLabelsPageContent params={params} />
    </Suspense>
  );
}

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Printer, ArrowLeft, FileText, Grid3X3 } from 'lucide-react';

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
  CycleLabelGrid,
  CycleLabelData,
} from '@/components/sterilization/CycleLabelPrint';

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

export default function PrintLabelsPage({
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
  const [format, setFormat] = useState<'label' | 'full'>(
    (searchParams.get('format') as 'label' | 'full') || 'label'
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
                  Choose how you want to print the sterilization labels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={format}
                  onValueChange={(v) => setFormat(v as 'label' | 'full')}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem
                      value="label"
                      id="format-label"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="format-label"
                      className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Grid3X3 className="h-8 w-8 mb-2" />
                      <span className="font-medium">2x2" Labels</span>
                      <span className="text-xs text-muted-foreground">
                        9 labels per page
                      </span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="full"
                      id="format-full"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="format-full"
                      className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <FileText className="h-8 w-8 mb-2" />
                      <span className="font-medium">Full Page</span>
                      <span className="text-xs text-muted-foreground">
                        Large label with big QR
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
                  This is how your labels will look when printed
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-auto bg-gray-50 rounded-lg p-4">
                <div className="flex justify-center">
                  {format === 'full' ? (
                    <CycleLabelPrint cycle={labelData} format="full" />
                  ) : (
                    <div className="transform scale-75 origin-top">
                      <CycleLabelGrid cycle={labelData} copies={9} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Print Instructions */}
            <Card variant="ghost">
              <CardContent className="pt-6">
                <h4 className="font-medium mb-2">Printing Tips</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • For 2x2" labels, use a 3x3 grid of labels on letter paper
                  </li>
                  <li>
                    • Set printer to "Actual size" (not "Fit to page")
                  </li>
                  <li>• Turn off headers/footers in print settings</li>
                  <li>
                    • After printing, stick one label on each pouch from this cycle
                  </li>
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
              margin: 0.25in;
              size: letter;
            }
            body {
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
        ) : (
          <CycleLabelGrid cycle={labelData} copies={9} />
        )}
      </div>
    </>
  );
}

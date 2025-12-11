'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Download, Trash2 } from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

import {
  CephAnalysis,
  ANALYSIS_PRESETS,
  type CephAnalysisState,
  type PlacedLandmark,
  type CalculatedMeasurement,
} from '@/components/imaging/cephalometric';

interface CephAnalysisData {
  id: string;
  clinicId: string;
  patientId: string;
  imageId: string;
  presetId: string;
  landmarks: PlacedLandmark[];
  measurements: CalculatedMeasurement[];
  calibration: number | null;
  notes: string | null;
  summary: string | null;
  isComplete: boolean;
  analysisDate: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  image: {
    id: string;
    fileName: string;
    fileUrl: string;
    thumbnailUrl: string | null;
    category: string;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function CephAnalysisPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const analysisId = params.id as string;

  const [analysis, setAnalysis] = useState<CephAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch analysis data
  useEffect(() => {
    fetchAnalysis();
  }, [analysisId]);

  const fetchAnalysis = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/imaging/ceph-analyses/${analysisId}`);
      const data = await response.json();

      if (data.success) {
        setAnalysis(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to load analysis',
          variant: 'destructive',
        });
        router.push('/imaging/cephalometric');
      }
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analysis',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = useCallback(
    async (analysisState: CephAnalysisState) => {
      setIsSaving(true);
      try {
        const response = await fetch(`/api/imaging/ceph-analyses/${analysisId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            landmarks: analysisState.landmarks,
            measurements: analysisState.measurements,
            calibration: analysisState.calibration,
            notes: analysisState.notes,
            isComplete: analysisState.landmarks.length > 0,
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast({
            title: 'Saved',
            description: 'Analysis saved successfully',
          });
          setHasUnsavedChanges(false);
          setAnalysis(data.data);
        } else {
          toast({
            title: 'Error',
            description: data.error?.message || 'Failed to save analysis',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Failed to save analysis:', error);
        toast({
          title: 'Error',
          description: 'Failed to save analysis',
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [analysisId, toast]
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/imaging/ceph-analyses/${analysisId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Deleted',
          description: 'Analysis deleted successfully',
        });
        router.push('/imaging/cephalometric');
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to delete analysis',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to delete analysis:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete analysis',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = useCallback(
    (analysisState: CephAnalysisState) => {
      // Generate a simple text report for now
      const preset = ANALYSIS_PRESETS.find((p) => p.id === analysisState.presetId);

      let report = `CEPHALOMETRIC ANALYSIS REPORT\n`;
      report += `================================\n\n`;
      report += `Patient: ${analysis?.patient.firstName} ${analysis?.patient.lastName}\n`;
      report += `Date: ${new Date().toLocaleDateString()}\n`;
      report += `Analysis Type: ${preset?.name || analysisState.presetId}\n\n`;

      report += `MEASUREMENTS\n`;
      report += `------------\n`;

      for (const m of analysisState.measurements) {
        report += `${m.measurementId}: ${m.value.toFixed(1)} (${m.interpretation})\n`;
      }

      report += `\nLANDMARKS PLACED: ${analysisState.landmarks.length}\n`;

      if (analysisState.calibration) {
        report += `Calibration: ${analysisState.calibration.toFixed(2)} px/mm\n`;
      }

      // Download as text file
      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ceph-analysis-${analysisId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Exported',
        description: 'Analysis report downloaded',
      });
    },
    [analysis, analysisId, toast]
  );

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Cephalometric Analysis"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Imaging', href: '/imaging' },
            { label: 'Cephalometric', href: '/imaging/cephalometric' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent density="comfortable">
          <Card className="h-[calc(100vh-200px)]">
            <CardContent className="p-4">
              <div className="flex h-full">
                <Skeleton className="flex-1" />
                <Skeleton className="w-80 ml-4" />
              </div>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  if (!analysis) {
    return (
      <>
        <PageHeader
          title="Analysis Not Found"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Imaging', href: '/imaging' },
            { label: 'Cephalometric', href: '/imaging/cephalometric' },
            { label: 'Not Found' },
          ]}
        />
        <PageContent density="comfortable">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                The requested cephalometric analysis could not be found.
              </p>
              <Link href="/imaging/cephalometric">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to List
                </Button>
              </Link>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  const patientName = `${analysis.patient.firstName} ${analysis.patient.lastName}`;
  const presetName =
    ANALYSIS_PRESETS.find((p) => p.id === analysis.presetId)?.name ||
    analysis.presetId;

  return (
    <>
      <PageHeader
        title={`Cephalometric - ${presetName}`}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Imaging', href: '/imaging' },
          { label: 'Cephalometric', href: '/imaging/cephalometric' },
          { label: patientName },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/imaging/cephalometric">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Analysis?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this cephalometric analysis.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      <div className="p-0">
        <div className="h-[calc(100vh-140px)]">
          <CephAnalysis
            imageUrl={analysis.image.fileUrl}
            imageId={analysis.imageId}
            patientId={analysis.patientId}
            clinicId={analysis.clinicId}
            initialAnalysis={{
              id: analysis.id,
              imageId: analysis.imageId,
              patientId: analysis.patientId,
              clinicId: analysis.clinicId,
              presetId: analysis.presetId,
              landmarks: analysis.landmarks || [],
              measurements: analysis.measurements || [],
              calibration: analysis.calibration || undefined,
              notes: analysis.notes || undefined,
            }}
            onSave={handleSave}
            onExport={handleExport}
          />
        </div>
      </div>
    </>
  );
}

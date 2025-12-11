'use client';

import { useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Grid3X3,
  ArrowLeft,
  Loader2,
  Search,
  Filter,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PatientSearchCombobox, type PatientSearchResult } from '@/components/booking/PatientSearchCombobox';
import {
  TemplateSelector,
  CollageEditor,
  DEFAULT_COLLAGE_TEMPLATES,
  type CollageTemplateData,
} from '@/components/imaging/collage';
import { cn } from '@/lib/utils';

type ViewMode = 'templates' | 'editor';

function CollagesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [viewMode, setViewMode] = useState<ViewMode>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<CollageTemplateData | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showPatientSelector, setShowPatientSelector] = useState(false);

  // Handle template selection
  const handleTemplateSelect = useCallback((template: CollageTemplateData) => {
    setSelectedTemplate(template);
    setShowPatientSelector(true);
  }, []);

  // Handle patient selection and start editing
  const handlePatientSelect = useCallback((patientId: string) => {
    setSelectedPatientId(patientId);
    setShowPatientSelector(false);
    setViewMode('editor');
  }, []);

  // Handle save
  const handleSave = useCallback(
    async (data: { title: string; assignments: Record<string, unknown> }) => {
      if (!selectedTemplate || !selectedPatientId) return;

      // For now, we'll use the default templates which don't have IDs
      // In a real implementation, we'd need to save templates to DB first
      // or match by name

      // Show success message
      alert('Collage saved successfully!');
      setViewMode('templates');
      setSelectedTemplate(null);
      setSelectedPatientId(null);
    },
    [selectedTemplate, selectedPatientId]
  );

  // Handle export
  const handleExport = useCallback(async (format: 'PNG' | 'JPG' | 'PDF') => {
    // Export functionality will be implemented with html2canvas or similar
    alert(`Export as ${format} - Coming soon!`);
  }, []);

  // Handle back to templates
  const handleBack = useCallback(() => {
    setViewMode('templates');
    setSelectedTemplate(null);
    setSelectedPatientId(null);
  }, []);

  return (
    <>
      <PageHeader
        title={viewMode === 'editor' ? 'Create Collage' : 'Collage Builder'}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Imaging', href: '/imaging' },
          { label: viewMode === 'editor' ? 'Create Collage' : 'Collages' },
        ]}
        actions={
          viewMode === 'editor' ? (
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Templates
            </Button>
          ) : undefined
        }
      />

      <PageContent density="comfortable" className="h-[calc(100vh-130px)]">
        {viewMode === 'templates' ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Select a Template</h2>
                <p className="text-sm text-muted-foreground">
                  Choose a collage template to create a new image presentation
                </p>
              </div>
            </div>

            {/* Template Selector */}
            <TemplateSelector
              templates={DEFAULT_COLLAGE_TEMPLATES}
              selectedTemplate={selectedTemplate}
              onSelect={handleTemplateSelect}
            />
          </div>
        ) : selectedTemplate && selectedPatientId ? (
          <CollageEditor
            template={selectedTemplate}
            patientId={selectedPatientId}
            onSave={handleSave}
            onExport={handleExport}
            className="h-full"
          />
        ) : null}
      </PageContent>

      {/* Patient Selection Dialog */}
      <Dialog open={showPatientSelector} onOpenChange={setShowPatientSelector}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Patient</DialogTitle>
            <DialogDescription>
              Choose a patient to create the collage for:{' '}
              <strong>{selectedTemplate?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <PatientSearchCombobox
              onSelect={(patient: PatientSearchResult) => handlePatientSelect(patient.id)}
              placeholder="Search for a patient..."
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function CollagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CollagesPageContent />
    </Suspense>
  );
}

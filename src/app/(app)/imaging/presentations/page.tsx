'use client';

import { useState, useCallback, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Presentation,
  ArrowLeft,
  Loader2,
  Search,
  Eye,
  Edit,
  Trash2,
  Share2,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PatientSearchCombobox, type PatientSearchResult } from '@/components/booking/PatientSearchCombobox';
import {
  PresentationBuilder,
  type PresentationData,
} from '@/components/imaging/presentations';
import { cn } from '@/lib/utils';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

type ViewMode = 'list' | 'builder';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

interface PatientImage {
  id: string;
  fileName: string;
  thumbnailUrl: string | null;
  fileUrl: string;
  category: string;
  capturedAt: Date | null;
  createdAt: Date;
}

// Helper function for formatting dates
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function PresentationsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientImages, setPatientImages] = useState<PatientImage[]>([]);
  const [showPatientSelector, setShowPatientSelector] = useState(false);

  // List state
  const [presentations, setPresentations] = useState<
    Array<{
      id: string;
      title: string;
      patient: Patient;
      slidesCount: number;
      createdAt: string;
      isPublic: boolean;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter presentations by search
  const filteredPresentations = presentations.filter((pres) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      pres.title.toLowerCase().includes(searchLower) ||
      `${pres.patient.firstName} ${pres.patient.lastName}`
        .toLowerCase()
        .includes(searchLower)
    );
  });

  // Fetch patient images when patient is selected
  const fetchPatientImages = useCallback(async (patientId: string) => {
    try {
      const response = await fetch(`/api/images?patientId=${patientId}&pageSize=100`);
      const data = await response.json();

      if (data.success) {
        setPatientImages(
          data.data.items.map((img: Record<string, unknown>) => ({
            id: img.id as string,
            fileName: img.fileName as string,
            thumbnailUrl: img.thumbnailUrl as string | null,
            fileUrl: img.fileUrl as string,
            category: img.category as string,
            capturedAt: img.capturedAt ? new Date(img.capturedAt as string) : null,
            createdAt: new Date(img.createdAt as string),
          }))
        );
      }
    } catch (error) {
      console.error('Failed to fetch patient images:', error);
    }
  }, []);

  // Handle patient selection
  const handlePatientSelect = useCallback(
    async (patient: Patient) => {
      setSelectedPatient(patient);
      setShowPatientSelector(false);
      await fetchPatientImages(patient.id);
      setViewMode('builder');
    },
    [fetchPatientImages]
  );

  // Handle save
  const handleSave = useCallback(async (data: PresentationData) => {
    // For now, just show success
    // In real implementation, save to API
    alert('Presentation saved successfully!');
    setViewMode('list');
    setSelectedPatient(null);
    setPatientImages([]);
  }, []);

  // Handle export
  const handleExport = useCallback(async (format: 'PDF' | 'PNG') => {
    alert(`Export as ${format} - Coming soon!`);
  }, []);

  // Handle back to list
  const handleBack = useCallback(() => {
    setViewMode('list');
    setSelectedPatient(null);
    setPatientImages([]);
  }, []);

  return (
    <>
      <PageHeader
        title={viewMode === 'builder' ? 'Create Presentation' : 'Before/After Presentations'}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Imaging', href: '/imaging' },
          { label: viewMode === 'builder' ? 'Create Presentation' : 'Presentations' },
        ]}
        actions={
          viewMode === 'list' ? (
            <Button onClick={() => setShowPatientSelector(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Presentation
            </Button>
          ) : undefined
        }
      />

      <PageContent
        density="comfortable"
        className={viewMode === 'builder' ? 'h-[calc(100vh-130px)] p-0' : ''}
      >
        {viewMode === 'list' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search presentations..."
                  className="pl-9"
                />
              </div>
            </div>

            {/* Empty State */}
            {filteredPresentations.length === 0 && !isLoading && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Presentation className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold mb-2">No presentations yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create before/after presentations to share treatment progress
                  </p>
                  <Button onClick={() => setShowPatientSelector(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Presentation
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Presentations List */}
            {filteredPresentations.length > 0 && (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Slides</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPresentations.map((pres) => (
                      <TableRow key={pres.id}>
                        <TableCell className="font-medium">{pres.title}</TableCell>
                        <TableCell>
                          <PhiProtected fakeData={getFakeName()}>
                            {pres.patient.firstName} {pres.patient.lastName}
                          </PhiProtected>
                        </TableCell>
                        <TableCell>{pres.slidesCount}</TableCell>
                        <TableCell>{formatDate(new Date(pres.createdAt))}</TableCell>
                        <TableCell>
                          <Badge variant={pres.isPublic ? 'success' : 'secondary'}>
                            {pres.isPublic ? 'Shared' : 'Private'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Share">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {/* Getting Started Info */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Presentation className="h-5 w-5" />
                  About Presentations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Create interactive before/after presentations to share with patients:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                  <li>Interactive slider comparisons</li>
                  <li>Side-by-side and grid layouts</li>
                  <li>Multiple comparison stages</li>
                  <li>Export to PDF for printing</li>
                  <li>Shareable links for patients</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {viewMode === 'builder' && selectedPatient && (
          <PresentationBuilder
            patientId={selectedPatient.id}
            patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
            patientImages={patientImages}
            onSave={handleSave}
            onExport={handleExport}
            onBack={handleBack}
            className="h-full"
          />
        )}
      </PageContent>

      {/* Patient Selection Dialog */}
      <Dialog open={showPatientSelector} onOpenChange={setShowPatientSelector}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Patient</DialogTitle>
            <DialogDescription>
              Choose a patient to create a presentation for
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <PatientSearchCombobox
              onSelect={(patient: PatientSearchResult) =>
                handlePatientSelect({
                  id: patient.id,
                  firstName: patient.firstName,
                  lastName: patient.lastName,
                })
              }
              placeholder="Search for a patient..."
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function PresentationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <PresentationsPageContent />
    </Suspense>
  );
}

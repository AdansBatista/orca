'use client';

import { useState, useCallback, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  FileText,
  ArrowLeft,
  Loader2,
  Search,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Download,
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
  ReportBuilder,
  ReportTemplateSelector,
  DEFAULT_REPORT_TEMPLATES,
  REPORT_TYPE_LABELS,
  type ReportTemplate,
  type ProgressReportData,
  type PatientImageData,
} from '@/components/imaging/progress-report';
import { cn } from '@/lib/utils';
// Helper function for formatting dates
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

type ViewMode = 'list' | 'templates' | 'builder';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

interface ProgressReport {
  id: string;
  title: string;
  reportType: string;
  reportDate: string;
  visibleToPatient: boolean;
  patient: Patient;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

function ReportsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientImages, setPatientImages] = useState<PatientImageData[]>([]);
  const [showPatientSelector, setShowPatientSelector] = useState(false);

  // List state
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Fetch reports
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== 'ALL') {
        params.set('reportType', filterType);
      }

      const response = await fetch(`/api/progress-reports?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setReports(data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    if (viewMode === 'list') {
      fetchReports();
    }
  }, [viewMode, fetchReports]);

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

  // Handle template selection
  const handleTemplateSelect = useCallback((template: ReportTemplate) => {
    setSelectedTemplate(template);
    setShowPatientSelector(true);
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
  const handleSave = useCallback(
    async (data: ProgressReportData) => {
      try {
        const response = await fetch('/api/progress-reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          alert('Report saved successfully!');
          setViewMode('list');
          setSelectedTemplate(null);
          setSelectedPatient(null);
          setPatientImages([]);
        } else {
          alert('Failed to save report: ' + result.error.message);
        }
      } catch (error) {
        console.error('Failed to save report:', error);
        alert('Failed to save report');
      }
    },
    []
  );

  // Handle export
  const handleExport = useCallback(async (format: 'PDF' | 'PNG') => {
    alert(`Export as ${format} - Coming soon!`);
  }, []);

  // Handle back to list
  const handleBack = useCallback(() => {
    setViewMode('list');
    setSelectedTemplate(null);
    setSelectedPatient(null);
    setPatientImages([]);
  }, []);

  // Filter reports by search
  const filteredReports = reports.filter((report) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      report.title.toLowerCase().includes(searchLower) ||
      `${report.patient.firstName} ${report.patient.lastName}`
        .toLowerCase()
        .includes(searchLower)
    );
  });

  const getReportTypeBadgeVariant = (type: string): 'info' | 'success' | 'accent' | 'warning' | 'secondary' => {
    switch (type) {
      case 'INITIAL':
        return 'info';
      case 'PROGRESS':
        return 'success';
      case 'FINAL':
        return 'accent';
      case 'COMPARISON':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <>
      <PageHeader
        title={
          viewMode === 'builder'
            ? 'Create Report'
            : viewMode === 'templates'
            ? 'Select Template'
            : 'Progress Reports'
        }
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Imaging', href: '/imaging' },
          {
            label:
              viewMode === 'builder'
                ? 'Create Report'
                : viewMode === 'templates'
                ? 'Select Template'
                : 'Reports',
          },
        ]}
        actions={
          viewMode === 'list' ? (
            <Button onClick={() => setViewMode('templates')}>
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          ) : viewMode === 'templates' ? (
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
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
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search reports..."
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reports Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredReports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold mb-2">No reports found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first progress report to document treatment progress
                  </p>
                  <Button onClick={() => setViewMode('templates')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Report
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.title}</TableCell>
                        <TableCell>
                          <PhiProtected fakeData={getFakeName()}>
                            {report.patient.firstName} {report.patient.lastName}
                          </PhiProtected>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getReportTypeBadgeVariant(report.reportType)}
                          >
                            {REPORT_TYPE_LABELS[report.reportType as keyof typeof REPORT_TYPE_LABELS] ||
                              report.reportType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(new Date(report.reportDate))}
                        </TableCell>
                        <TableCell>
                          {report.createdBy.firstName} {report.createdBy.lastName}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Export">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        )}

        {viewMode === 'templates' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Select a Report Template</h2>
              <p className="text-sm text-muted-foreground">
                Choose a template to start creating a new progress report
              </p>
            </div>
            <ReportTemplateSelector
              templates={DEFAULT_REPORT_TEMPLATES}
              selectedTemplate={selectedTemplate}
              onSelect={handleTemplateSelect}
            />
          </div>
        )}

        {viewMode === 'builder' && selectedPatient && (
          <ReportBuilder
            patientId={selectedPatient.id}
            patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
            patientImages={patientImages}
            initialData={
              selectedTemplate
                ? {
                    reportType: selectedTemplate.reportType,
                    sections: selectedTemplate.sections.map((s, i) => ({
                      id: `section-${i}`,
                      type: s.type,
                      title: s.title,
                      content: s.defaultContent,
                      order: i,
                    })),
                  }
                : undefined
            }
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
              Choose a patient to create the report for
              {selectedTemplate && (
                <>
                  :{' '}
                  <strong>{selectedTemplate.name}</strong>
                </>
              )}
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

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ReportsPageContent />
    </Suspense>
  );
}

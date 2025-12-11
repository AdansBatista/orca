'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileImage,
  Upload,
  Calendar,
  User,
  Search,
  Filter,
  Eye,
  Trash2,
  Activity,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

import {
  DicomViewer,
  MODALITY_LABELS,
  type DicomModality,
  type LoadedDicomImage,
} from '@/components/imaging/dicom-viewer';

interface DicomRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  subcategory?: string;
  captureDate: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

// Map image categories to modality
const CATEGORY_TO_MODALITY: Record<string, DicomModality> = {
  PANORAMIC_XRAY: 'PX',
  CEPHALOMETRIC_XRAY: 'DX',
  PERIAPICAL_XRAY: 'IO',
  CBCT: 'CBCT',
};

const DICOM_CATEGORIES = [
  { value: 'PANORAMIC_XRAY', label: 'Panoramic X-Ray' },
  { value: 'CEPHALOMETRIC_XRAY', label: 'Cephalometric X-Ray' },
  { value: 'PERIAPICAL_XRAY', label: 'Periapical X-Ray' },
  { value: 'CBCT', label: 'CBCT' },
];

export default function DicomViewerPage() {
  const [dicomFiles, setDicomFiles] = useState<DicomRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedDicom, setSelectedDicom] = useState<DicomRecord | null>(null);
  const [viewerDialogOpen, setViewerDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Fetch DICOM files (X-ray categories)
  useEffect(() => {
    fetchDicomFiles();
  }, [filterCategory]);

  const fetchDicomFiles = async () => {
    setIsLoading(true);
    try {
      // Fetch images from X-ray categories
      const categories =
        filterCategory === 'all'
          ? ['PANORAMIC_XRAY', 'CEPHALOMETRIC_XRAY', 'PERIAPICAL_XRAY', 'CBCT']
          : [filterCategory];

      const allFiles: DicomRecord[] = [];

      for (const category of categories) {
        const params = new URLSearchParams({
          category,
          pageSize: '50',
        });

        const response = await fetch(`/api/images?${params}`);
        const data = await response.json();

        if (data.success) {
          const files: DicomRecord[] = data.data.items.map(
            (item: {
              id: string;
              fileName: string;
              fileUrl: string;
              subcategory?: string;
              captureDate?: string;
              createdAt: string;
              patient: {
                id: string;
                firstName: string;
                lastName: string;
              };
              createdBy?: {
                firstName: string;
                lastName: string;
              };
            }) => ({
              id: item.id,
              fileName: item.fileName,
              fileUrl: item.fileUrl,
              subcategory: item.subcategory || category,
              captureDate: item.captureDate || item.createdAt,
              patient: item.patient,
              createdBy: item.createdBy || { firstName: 'System', lastName: '' },
            })
          );
          allFiles.push(...files);
        }
      }

      // Sort by date descending
      allFiles.sort(
        (a, b) => new Date(b.captureDate).getTime() - new Date(a.captureDate).getTime()
      );

      setDicomFiles(allFiles);
    } catch (error) {
      console.error('Failed to fetch DICOM files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFiles = dicomFiles.filter((file) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const patientName = `${file.patient.firstName} ${file.patient.lastName}`.toLowerCase();
    return patientName.includes(search) || file.fileName.toLowerCase().includes(search);
  });

  const handleImageLoad = (loadedImage: LoadedDicomImage) => {
    console.log('DICOM loaded:', loadedImage.metadata);
  };

  const openViewer = (dicom: DicomRecord) => {
    setSelectedDicom(dicom);
    setViewerDialogOpen(true);
  };

  const getModalityBadge = (subcategory?: string) => {
    if (!subcategory) return null;
    const modality = CATEGORY_TO_MODALITY[subcategory];
    if (!modality) return null;
    return (
      <Badge variant="outline">
        {MODALITY_LABELS[modality] || subcategory}
      </Badge>
    );
  };

  return (
    <>
      <PageHeader
        title="DICOM Viewer"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Imaging', href: '/imaging' },
          { label: 'DICOM Viewer' },
        ]}
        actions={
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload DICOM
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Upload DICOM File</DialogTitle>
                <DialogDescription>
                  Upload DICOM files (.dcm) from your X-ray equipment.
                </DialogDescription>
              </DialogHeader>

              <div className="h-[600px]">
                <DicomViewer
                  allowUpload={true}
                  onImageLoad={handleImageLoad}
                  height="100%"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <PageContent density="comfortable">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by patient name or file..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All X-Ray Types</SelectItem>
                  {DICOM_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* File List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No DICOM Files Yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload DICOM files from your X-ray equipment to get started.
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload First DICOM
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file) => (
              <Card
                key={file.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openViewer(file)}
              >
                <CardContent className="p-4">
                  {/* Preview placeholder */}
                  <div className="aspect-video bg-gray-900 rounded-lg mb-3 flex items-center justify-center">
                    <Activity className="h-12 w-12 text-gray-600" />
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold truncate flex-1">
                        <PhiProtected fakeData={getFakeName()}>
                          {file.patient.firstName} {file.patient.lastName}
                        </PhiProtected>
                      </h3>
                      {getModalityBadge(file.subcategory)}
                    </div>

                    <p className="text-sm text-muted-foreground truncate">
                      {file.fileName}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(file.captureDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {file.createdBy.firstName}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Viewer Dialog */}
        <Dialog open={viewerDialogOpen} onOpenChange={setViewerDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] p-0">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle className="flex items-center gap-2">
                {selectedDicom && (
                  <>
                    <PhiProtected fakeData={getFakeName()}>
                      {selectedDicom.patient.firstName} {selectedDicom.patient.lastName}
                    </PhiProtected>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-muted-foreground font-normal">
                      {selectedDicom.fileName}
                    </span>
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="h-[70vh]">
              {selectedDicom && (
                <DicomViewer
                  dicomUrl={selectedDicom.fileUrl}
                  allowUpload={false}
                  height="100%"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Supported Equipment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Import DICOM files from popular dental imaging equipment:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline">Panoramic</Badge>
                  <span className="text-muted-foreground">
                    Planmeca, Carestream, Vatech
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">Cephalometric</Badge>
                  <span className="text-muted-foreground">
                    Orthoceph, Lateral Ceph
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">Intra-oral</Badge>
                  <span className="text-muted-foreground">
                    Sensors, PSP plates
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">CBCT</Badge>
                  <span className="text-muted-foreground">
                    i-CAT, Planmeca, Carestream
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Viewer Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Window/Level adjustment (drag or presets)</li>
                <li>• Zoom, pan, and rotate controls</li>
                <li>• Flip horizontal/vertical</li>
                <li>• Invert colors (negative view)</li>
                <li>• DICOM metadata display</li>
                <li>• Measurement tools</li>
                <li>• Dental-specific W/L presets</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </>
  );
}

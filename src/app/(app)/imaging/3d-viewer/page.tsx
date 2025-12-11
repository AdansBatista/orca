'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Box,
  Upload,
  Calendar,
  User,
  ChevronRight,
  Search,
  Filter,
  Eye,
  Trash2,
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
  Model3DViewer,
  SCAN_TYPE_LABELS,
  type ScanType,
  type LoadedModel,
} from '@/components/imaging/model-viewer';

interface Model3DRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  scanType: ScanType;
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

export default function Model3DViewerPage() {
  const [models, setModels] = useState<Model3DRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<Model3DRecord | null>(null);
  const [viewerDialogOpen, setViewerDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Fetch 3D models (filtered by SCAN_3D category)
  useEffect(() => {
    fetchModels();
  }, [filterType]);

  const fetchModels = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        category: 'SCAN_3D',
        pageSize: '50',
      });

      const response = await fetch(`/api/images?${params}`);
      const data = await response.json();

      if (data.success) {
        // Transform image records to 3D model format
        const transformedModels: Model3DRecord[] = data.data.items.map(
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
            scanType: (item.subcategory as ScanType) || 'OTHER',
            captureDate: item.captureDate || item.createdAt,
            patient: item.patient,
            createdBy: item.createdBy || { firstName: 'System', lastName: '' },
          })
        );
        setModels(transformedModels);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredModels = models.filter((model) => {
    if (filterType !== 'all' && model.scanType !== filterType) {
      return false;
    }
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const patientName = `${model.patient.firstName} ${model.patient.lastName}`.toLowerCase();
    return (
      patientName.includes(search) || model.fileName.toLowerCase().includes(search)
    );
  });

  const handleModelLoad = (loadedModel: LoadedModel) => {
    console.log('Model loaded:', loadedModel);
  };

  const openViewer = (model: Model3DRecord) => {
    setSelectedModel(model);
    setViewerDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="3D Model Viewer"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Imaging', href: '/imaging' },
          { label: '3D Models' },
        ]}
        actions={
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Model
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Upload 3D Model</DialogTitle>
                <DialogDescription>
                  Upload STL, PLY, or OBJ files from your intraoral scanner.
                </DialogDescription>
              </DialogHeader>

              <div className="h-[500px]">
                <Model3DViewer
                  allowUpload={true}
                  onModelLoad={handleModelLoad}
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
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Scan Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scan Types</SelectItem>
                  {Object.entries(SCAN_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Model List */}
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
        ) : filteredModels.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Box className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No 3D Models Yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload STL, PLY, or OBJ files from your intraoral scanner to get
                started.
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload First Model
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModels.map((model) => (
              <Card
                key={model.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openViewer(model)}
              >
                <CardContent className="p-4">
                  {/* Preview placeholder */}
                  <div className="aspect-video bg-gray-900 rounded-lg mb-3 flex items-center justify-center">
                    <Box className="h-12 w-12 text-gray-600" />
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold truncate flex-1">
                        <PhiProtected fakeData={getFakeName()}>
                          {model.patient.firstName} {model.patient.lastName}
                        </PhiProtected>
                      </h3>
                      <Badge variant="outline">
                        {SCAN_TYPE_LABELS[model.scanType] || model.scanType}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground truncate">
                      {model.fileName}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(model.captureDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {model.createdBy.firstName}
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
                {selectedModel && (
                  <>
                    <PhiProtected fakeData={getFakeName()}>
                      {selectedModel.patient.firstName}{' '}
                      {selectedModel.patient.lastName}
                    </PhiProtected>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-muted-foreground font-normal">
                      {selectedModel.fileName}
                    </span>
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="h-[70vh]">
              {selectedModel && (
                <Model3DViewer
                  modelUrl={selectedModel.fileUrl}
                  format={
                    selectedModel.fileName.toLowerCase().endsWith('.stl')
                      ? 'STL'
                      : selectedModel.fileName.toLowerCase().endsWith('.ply')
                        ? 'PLY'
                        : 'OBJ'
                  }
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
              <CardTitle size="sm">Supported Scanners</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Import 3D scans from popular intraoral scanners:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline">iTero</Badge>
                  <span className="text-muted-foreground">STL, PLY export</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">3Shape TRIOS</Badge>
                  <span className="text-muted-foreground">STL, PLY export</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">Medit</Badge>
                  <span className="text-muted-foreground">STL, PLY export</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">Primescan</Badge>
                  <span className="text-muted-foreground">STL export</span>
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
                <li>• Rotate, pan, and zoom with mouse controls</li>
                <li>• Multiple render modes (solid, wireframe, points)</li>
                <li>• Material presets for teeth, gums, and more</li>
                <li>• Cross-section clipping plane</li>
                <li>• View presets (front, back, top, etc.)</li>
                <li>• Auto-rotation for presentations</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </>
  );
}

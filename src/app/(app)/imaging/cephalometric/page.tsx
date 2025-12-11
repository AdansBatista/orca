'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Ruler,
  Calendar,
  User,
  Image as ImageIcon,
  FileText,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  Clock,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

import { ANALYSIS_PRESETS, type CephAnalysisPreset } from '@/components/imaging/cephalometric';

interface CephAnalysisItem {
  id: string;
  presetId: string;
  analysisDate: string;
  isComplete: boolean;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  image: {
    id: string;
    fileName: string;
    thumbnailUrl: string | null;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface PatientImage {
  id: string;
  fileName: string;
  thumbnailUrl: string | null;
  category: string;
  patientId: string;
  patient?: {
    firstName: string;
    lastName: string;
  };
}

export default function CephalometricPage() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<CephAnalysisItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPreset, setFilterPreset] = useState<string>('all');
  const [filterComplete, setFilterComplete] = useState<string>('all');

  // New analysis dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [availableImages, setAvailableImages] = useState<PatientImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [imageSearchTerm, setImageSearchTerm] = useState('');

  // Fetch analyses
  useEffect(() => {
    fetchAnalyses();
  }, [filterPreset, filterComplete]);

  const fetchAnalyses = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterPreset && filterPreset !== 'all') {
        params.set('presetId', filterPreset);
      }
      if (filterComplete && filterComplete !== 'all') {
        params.set('isComplete', filterComplete);
      }

      const response = await fetch(`/api/imaging/ceph-analyses?${params}`);
      const data = await response.json();

      if (data.success) {
        setAnalyses(data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch analyses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch ceph images when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      fetchCephImages();
    }
  }, [dialogOpen]);

  const fetchCephImages = async () => {
    try {
      const response = await fetch(
        '/api/imaging/images?category=CEPHALOMETRIC_XRAY&pageSize=100'
      );
      const data = await response.json();

      if (data.success) {
        setAvailableImages(data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    }
  };

  const handleCreateAnalysis = async () => {
    if (!selectedImageId || !selectedPreset) return;

    setIsCreating(true);
    try {
      // Find the selected image to get patient ID
      const selectedImage = availableImages.find((img) => img.id === selectedImageId);
      if (!selectedImage) return;

      const response = await fetch('/api/imaging/ceph-analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: selectedImageId,
          patientId: selectedImage.patientId,
          presetId: selectedPreset,
          landmarks: [],
          measurements: [],
          isComplete: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Navigate to the analysis page
        router.push(`/imaging/cephalometric/${data.data.id}`);
      }
    } catch (error) {
      console.error('Failed to create analysis:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const getPresetName = (presetId: string) => {
    return ANALYSIS_PRESETS.find((p) => p.id === presetId)?.name || presetId;
  };

  const filteredAnalyses = analyses.filter((analysis) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const patientName = `${analysis.patient.firstName} ${analysis.patient.lastName}`.toLowerCase();
    return (
      patientName.includes(search) ||
      analysis.image.fileName.toLowerCase().includes(search)
    );
  });

  const filteredImages = availableImages.filter((img) => {
    if (!imageSearchTerm) return true;
    const search = imageSearchTerm.toLowerCase();
    const patientName = img.patient
      ? `${img.patient.firstName} ${img.patient.lastName}`.toLowerCase()
      : '';
    return (
      patientName.includes(search) ||
      img.fileName.toLowerCase().includes(search)
    );
  });

  return (
    <>
      <PageHeader
        title="Cephalometric Analysis"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Imaging', href: '/imaging' },
          { label: 'Cephalometric Analysis' },
        ]}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Analysis
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>New Cephalometric Analysis</DialogTitle>
                <DialogDescription>
                  Select a cephalometric X-ray and analysis preset to begin.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Image Selection */}
                <div className="space-y-2">
                  <Label>Select Cephalometric X-ray</Label>
                  <Input
                    placeholder="Search images..."
                    value={imageSearchTerm}
                    onChange={(e) => setImageSearchTerm(e.target.value)}
                    className="mb-2"
                  />
                  <ScrollArea className="h-48 border rounded-lg p-2">
                    {filteredImages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <ImageIcon className="h-8 w-8 mb-2" />
                        <p className="text-sm">No cephalometric X-rays found</p>
                        <p className="text-xs">Upload images with category &quot;Cephalometric X-ray&quot;</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {filteredImages.map((img) => (
                          <button
                            key={img.id}
                            onClick={() => setSelectedImageId(img.id)}
                            className={`p-2 rounded-lg border-2 transition-colors text-left ${
                              selectedImageId === img.id
                                ? 'border-primary bg-primary/5'
                                : 'border-transparent hover:border-muted'
                            }`}
                          >
                            <div className="aspect-square bg-muted rounded-md mb-1 overflow-hidden">
                              {img.thumbnailUrl ? (
                                <img
                                  src={img.thumbnailUrl}
                                  alt={img.fileName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <p className="text-xs truncate">{img.fileName}</p>
                            {img.patient && (
                              <p className="text-xs text-muted-foreground truncate">
                                <PhiProtected fakeData={getFakeName()}>
                                  {img.patient.firstName} {img.patient.lastName}
                                </PhiProtected>
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {/* Preset Selection */}
                <div className="space-y-2">
                  <Label>Analysis Preset</Label>
                  <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select analysis type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ANALYSIS_PRESETS.map((preset) => (
                        <SelectItem key={preset.id} value={preset.id}>
                          <div className="flex flex-col">
                            <span>{preset.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {preset.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAnalysis}
                  disabled={!selectedImageId || !selectedPreset || isCreating}
                  loading={isCreating}
                >
                  Start Analysis
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
                    placeholder="Search by patient name or image..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={filterPreset} onValueChange={setFilterPreset}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Presets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Presets</SelectItem>
                    {ANALYSIS_PRESETS.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterComplete} onValueChange={setFilterComplete}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="true">Complete</SelectItem>
                    <SelectItem value="false">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis List */}
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
        ) : filteredAnalyses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Ruler className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Cephalometric Analyses Yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Start by creating a new cephalometric analysis from a lateral X-ray.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Analysis
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAnalyses.map((analysis) => (
              <Link
                key={analysis.id}
                href={`/imaging/cephalometric/${analysis.id}`}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      {/* Thumbnail */}
                      <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        {analysis.image.thumbnailUrl ? (
                          <img
                            src={analysis.image.thumbnailUrl}
                            alt={analysis.image.fileName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">
                            <PhiProtected fakeData={getFakeName()}>
                              {analysis.patient.firstName} {analysis.patient.lastName}
                            </PhiProtected>
                          </h3>
                          <Badge
                            variant={analysis.isComplete ? 'success' : 'warning'}
                          >
                            {analysis.isComplete ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Complete
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 mr-1" />
                                In Progress
                              </>
                            )}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {getPresetName(analysis.presetId)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(analysis.analysisDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {analysis.createdBy.firstName} {analysis.createdBy.lastName}
                          </span>
                        </div>
                      </div>

                      {/* Action */}
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">About Cephalometric Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Cephalometric analysis is a crucial diagnostic tool in orthodontics
                that involves measuring and analyzing the relationships between
                skeletal, dental, and soft tissue structures using lateral skull X-rays.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>SNA/SNB/ANB:</strong> Assess jaw position relative to skull base</li>
                <li>• <strong>FMA:</strong> Evaluate vertical growth pattern</li>
                <li>• <strong>Incisor angles:</strong> Determine tooth inclination</li>
                <li>• <strong>Soft tissue:</strong> Analyze facial profile</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Available Analysis Presets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ANALYSIS_PRESETS.map((preset) => (
                  <div key={preset.id} className="flex items-start gap-3">
                    <Badge variant="outline">{preset.name}</Badge>
                    <p className="text-sm text-muted-foreground flex-1">
                      {preset.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </>
  );
}

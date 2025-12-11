'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Image as ImageIcon,
  Camera,
  FileImage,
  Grid,
  Settings,
  Tag,
  TrendingUp,
  Users,
  LayoutGrid,
  FileText,
  Presentation,
  Ruler,
  Box,
  Activity,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { StatsRow } from '@/components/layout';

interface DashboardStats {
  totalImages: number;
  imagesThisMonth: number;
  protocolsActive: number;
  tagsCount: number;
}

interface RecentImage {
  id: string;
  fileName: string;
  thumbnailUrl: string | null;
  category: string;
  patientName: string;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  EXTRAORAL_PHOTO: 'Extraoral',
  INTRAORAL_PHOTO: 'Intraoral',
  PANORAMIC_XRAY: 'Panoramic',
  CEPHALOMETRIC_XRAY: 'Ceph',
  PERIAPICAL_XRAY: 'Periapical',
  CBCT: 'CBCT',
  SCAN_3D: '3D Scan',
  OTHER: 'Other',
};

export default function ImagingDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalImages: 0,
    imagesThisMonth: 0,
    protocolsActive: 0,
    tagsCount: 0,
  });

  // In a real implementation, we would fetch stats from the API
  // For now, we'll show the dashboard structure

  return (
    <>
      <PageHeader
        title="Imaging"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Imaging' },
        ]}
      />
      <PageContent density="comfortable">
        {/* Stats */}
        <StatsRow>
          <StatCard accentColor="primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Images</p>
                <p className="text-lg font-bold">{stats.totalImages.toLocaleString()}</p>
              </div>
              <ImageIcon className="h-5 w-5 text-primary-500" />
            </div>
          </StatCard>
          <StatCard accentColor="accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">This Month</p>
                <p className="text-lg font-bold">{stats.imagesThisMonth.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-accent-500" />
            </div>
          </StatCard>
          <StatCard accentColor="success">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Protocols</p>
                <p className="text-lg font-bold">{stats.protocolsActive}</p>
              </div>
              <Camera className="h-5 w-5 text-success-500" />
            </div>
          </StatCard>
          <StatCard accentColor="warning">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Tags</p>
                <p className="text-lg font-bold">{stats.tagsCount}</p>
              </div>
              <Tag className="h-5 w-5 text-warning-500" />
            </div>
          </StatCard>
        </StatsRow>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/patients">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Patient Images</h3>
                <p className="text-sm text-muted-foreground">
                  Browse images by patient
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/imaging/protocols">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Camera className="h-6 w-6 text-accent-600" />
                </div>
                <h3 className="font-semibold mb-1">Photo Protocols</h3>
                <p className="text-sm text-muted-foreground">
                  Manage capture protocols
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/imaging/compare">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-success-500/10 flex items-center justify-center mb-4">
                  <Grid className="h-6 w-6 text-success-600" />
                </div>
                <h3 className="font-semibold mb-1">Compare Images</h3>
                <p className="text-sm text-muted-foreground">
                  Side-by-side comparison
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/imaging/collages">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                  <LayoutGrid className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-1">Collage Builder</h3>
                <p className="text-sm text-muted-foreground">
                  Create image presentations
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/imaging/reports">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold mb-1">Progress Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Generate treatment reports
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/imaging/presentations">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
                  <Presentation className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold mb-1">Presentations</h3>
                <p className="text-sm text-muted-foreground">
                  Before/after slideshows
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/imaging/cephalometric">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
                  <Ruler className="h-6 w-6 text-cyan-600" />
                </div>
                <h3 className="font-semibold mb-1">Cephalometric Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Landmark tracing & measurements
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/imaging/3d-viewer">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-teal-500/10 flex items-center justify-center mb-4">
                  <Box className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="font-semibold mb-1">3D Model Viewer</h3>
                <p className="text-sm text-muted-foreground">
                  View intraoral scans (STL/PLY)
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/imaging/dicom">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
                  <Activity className="h-6 w-6 text-rose-600" />
                </div>
                <h3 className="font-semibold mb-1">DICOM Viewer</h3>
                <p className="text-sm text-muted-foreground">
                  View X-rays & medical images
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader compact>
              <CardTitle size="sm" className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Standard Photo Protocols
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Standard orthodontic photo series ensure consistent documentation:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline">Extraoral</Badge>
                  <span className="text-muted-foreground">Frontal, Profile, Smile (4-5 photos)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">Intraoral</Badge>
                  <span className="text-muted-foreground">Upper, Lower, Buccal, Overjet (5 photos)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">X-Rays</Badge>
                  <span className="text-muted-foreground">Panoramic, Cephalometric (2-3 images)</span>
                </li>
              </ul>
              <div className="mt-4">
                <Link href="/imaging/protocols">
                  <Button variant="outline" size="sm">
                    Manage Protocols
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader compact>
              <CardTitle size="sm" className="flex items-center gap-2">
                <FileImage className="h-5 w-5" />
                Supported Formats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Upload images in any of these supported formats:
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge>JPEG</Badge>
                <Badge>PNG</Badge>
                <Badge>WebP</Badge>
                <Badge>TIFF</Badge>
                <Badge>BMP</Badge>
                <Badge>GIF</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                3D model formats:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="success">STL</Badge>
                <Badge variant="success">PLY</Badge>
                <Badge variant="success">OBJ</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Medical imaging formats:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="success">DICOM</Badge>
                <Badge variant="success">DCM</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </>
  );
}

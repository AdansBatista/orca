'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Upload } from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { ImageGallery, ImageViewer } from '@/components/imaging';

interface PatientImage {
  id: string;
  fileName: string;
  fileUrl: string;
  thumbnailUrl?: string | null;
  fileSize: number;
  mimeType: string;
  category: string;
  subcategory?: string | null;
  captureDate?: string | null;
  qualityScore?: number | null;
  visibleToPatient: boolean;
  description?: string | null;
  notes?: string | null;
  capturedBy?: {
    firstName: string;
    lastName: string;
  } | null;
  createdBy?: {
    firstName: string;
    lastName: string;
  } | null;
  protocol?: {
    name: string;
  } | null;
  protocolSlot?: {
    name: string;
  } | null;
  tags: Array<{
    id: string;
    name: string;
    color?: string | null;
    category: string;
  }>;
  createdAt: string;
}

export default function PatientImagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: patientId } = use(params);
  const router = useRouter();

  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<PatientImage | null>(null);
  const [images, setImages] = useState<PatientImage[]>([]);

  const handleImageView = (image: PatientImage) => {
    setSelectedImage(image);
    setViewerOpen(true);
  };

  const handleImageEdit = (image: PatientImage) => {
    // TODO: Open edit dialog
    console.log('Edit image:', image.id);
  };

  const handleImageDelete = async (image: PatientImage) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`/api/images/${image.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the gallery
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  const handlePrevious = () => {
    if (!selectedImage || images.length === 0) return;
    const currentIndex = images.findIndex((img) => img.id === selectedImage.id);
    if (currentIndex > 0) {
      setSelectedImage(images[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (!selectedImage || images.length === 0) return;
    const currentIndex = images.findIndex((img) => img.id === selectedImage.id);
    if (currentIndex < images.length - 1) {
      setSelectedImage(images[currentIndex + 1]);
    }
  };

  return (
    <>
      <PageHeader
        title="Patient Images"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Patients', href: '/patients' },
          { label: 'Patient Details', href: `/patients/${patientId}` },
          { label: 'Images' },
        ]}
        actions={
          <Link href={`/patients/${patientId}/images/upload`}>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Images
            </Button>
          </Link>
        }
      />
      <PageContent density="comfortable">
        <ImageGallery
          patientId={patientId}
          onImageView={handleImageView}
          onImageEdit={handleImageEdit}
          onImageDelete={handleImageDelete}
        />

        <ImageViewer
          image={selectedImage}
          images={images}
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </PageContent>
    </>
  );
}

'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUploader } from '@/components/imaging';

export default function PatientImagesUploadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: patientId } = use(params);
  const router = useRouter();

  const handleUploadComplete = (uploadedImages: unknown[]) => {
    // Navigate back to gallery after successful upload
    if (uploadedImages.length > 0) {
      router.push(`/patients/${patientId}/images`);
    }
  };

  return (
    <>
      <PageHeader
        title="Upload Images"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Patients', href: '/patients' },
          { label: 'Patient Details', href: `/patients/${patientId}` },
          { label: 'Images', href: `/patients/${patientId}/images` },
          { label: 'Upload' },
        ]}
        actions={
          <Link href={`/patients/${patientId}/images`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Gallery
            </Button>
          </Link>
        }
      />
      <PageContent density="comfortable">
        <Card>
          <CardHeader compact>
            <CardTitle size="sm">Upload Patient Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader
              patientId={patientId}
              onUploadComplete={handleUploadComplete}
              maxFiles={20}
            />
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}

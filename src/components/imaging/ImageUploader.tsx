'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, CheckCircle, AlertCircle, Loader2, Box } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface ImageUploaderProps {
  patientId: string;
  onUploadComplete?: (images: unknown[]) => void;
  defaultCategory?: string;
  protocolId?: string;
  protocolSlotId?: string;
  appointmentId?: string;
  treatmentPlanId?: string;
  maxFiles?: number;
  className?: string;
}

const IMAGE_CATEGORIES = [
  { value: 'EXTRAORAL_PHOTO', label: 'Extraoral Photo' },
  { value: 'INTRAORAL_PHOTO', label: 'Intraoral Photo' },
  { value: 'PANORAMIC_XRAY', label: 'Panoramic X-Ray' },
  { value: 'CEPHALOMETRIC_XRAY', label: 'Cephalometric X-Ray' },
  { value: 'PERIAPICAL_XRAY', label: 'Periapical X-Ray' },
  { value: 'CBCT', label: 'CBCT' },
  { value: 'SCAN_3D', label: '3D Scan' },
  { value: 'OTHER', label: 'Other' },
];

export function ImageUploader({
  patientId,
  onUploadComplete,
  defaultCategory = 'EXTRAORAL_PHOTO',
  protocolId,
  protocolSlotId,
  appointmentId,
  treatmentPlanId,
  maxFiles = 20,
  className,
}: ImageUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [category, setCategory] = useState(defaultCategory);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.slice(0, maxFiles - files.length).map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        status: 'pending' as const,
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files.length, maxFiles]
  );

  // Determine accepted file types based on category
  const acceptedFileTypes = category === 'SCAN_3D'
    ? {
        'model/stl': ['.stl'],
        'model/obj': ['.obj'],
        'model/ply': ['.ply'],
        'application/octet-stream': ['.stl', '.obj', '.ply'],
      }
    : {
        'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.bmp', '.tiff'],
      };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles || isUploading,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const uploadFiles = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append('patientId', patientId);
    formData.append('category', category);
    if (protocolId) formData.append('protocolId', protocolId);
    if (protocolSlotId) formData.append('protocolSlotId', protocolSlotId);
    if (appointmentId) formData.append('appointmentId', appointmentId);
    if (treatmentPlanId) formData.append('treatmentPlanId', treatmentPlanId);

    // Mark files as uploading
    setFiles((prev) =>
      prev.map((f) =>
        f.status === 'pending' ? { ...f, status: 'uploading' as const, progress: 10 } : f
      )
    );

    pendingFiles.forEach((f) => {
      formData.append('files', f.file);
    });

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.status === 'uploading'
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        );
      }, 200);

      const response = await fetch('/api/images', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      const result = await response.json();

      if (result.success) {
        // Mark all as success
        setFiles((prev) =>
          prev.map((f) =>
            f.status === 'uploading'
              ? { ...f, status: 'success' as const, progress: 100 }
              : f
          )
        );

        onUploadComplete?.(result.data);

        // Clear successful files after a delay
        setTimeout(() => {
          setFiles((prev) => prev.filter((f) => f.status !== 'success'));
        }, 2000);
      } else {
        // Mark all as error
        setFiles((prev) =>
          prev.map((f) =>
            f.status === 'uploading'
              ? { ...f, status: 'error' as const, error: result.error?.message }
              : f
          )
        );
      }
    } catch {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading'
            ? { ...f, status: 'error' as const, error: 'Upload failed' }
            : f
        )
      );
    } finally {
      setIsUploading(false);
    }
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const uploadingCount = files.filter((f) => f.status === 'uploading').length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Category selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Category:</label>
        <Select value={category} onValueChange={setCategory} disabled={isUploading}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {IMAGE_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          (files.length >= maxFiles || isUploading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        {category === 'SCAN_3D' ? (
          <Box className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        ) : (
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        )}
        {isDragActive ? (
          <p className="text-primary font-medium">
            Drop {category === 'SCAN_3D' ? '3D models' : 'images'} here...
          </p>
        ) : (
          <>
            <p className="font-medium">
              Drag & drop {category === 'SCAN_3D' ? '3D models' : 'images'} here
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {category === 'SCAN_3D'
                ? 'STL, OBJ, PLY files supported'
                : `or click to browse (max ${maxFiles} files)`}
            </p>
          </>
        )}
      </div>

      {/* File previews */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </span>
            {pendingCount > 0 && (
              <Button onClick={uploadFiles} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {pendingCount} file{pendingCount !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((file) => (
              <Card key={file.id} className="relative overflow-hidden">
                <CardContent className="p-2">
                  <div className="aspect-square relative rounded overflow-hidden bg-muted">
                    {/* Show icon for 3D files, image preview for images */}
                    {file.file.name.match(/\.(stl|obj|ply)$/i) ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        <Box className="h-12 w-12 text-gray-500" />
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Status overlay */}
                    {file.status === 'uploading' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      </div>
                    )}
                    {file.status === 'success' && (
                      <div className="absolute inset-0 bg-success-500/50 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-white" />
                      </div>
                    )}
                    {file.status === 'error' && (
                      <div className="absolute inset-0 bg-destructive/50 flex items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-white" />
                      </div>
                    )}

                    {/* Remove button */}
                    {file.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    )}
                  </div>

                  {/* Progress bar */}
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="h-1 mt-2" />
                  )}

                  {/* File name */}
                  <p className="text-xs text-muted-foreground mt-2 truncate" title={file.file.name}>
                    {file.file.name}
                  </p>

                  {/* Status badge */}
                  <Badge
                    variant={
                      file.status === 'success'
                        ? 'success'
                        : file.status === 'error'
                          ? 'destructive'
                          : 'secondary'
                    }
                    className="mt-1"
                  >
                    {file.status === 'pending' && 'Ready'}
                    {file.status === 'uploading' && 'Uploading...'}
                    {file.status === 'success' && 'Uploaded'}
                    {file.status === 'error' && 'Failed'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

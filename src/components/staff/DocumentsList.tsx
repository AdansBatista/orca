'use client';

import { useState } from 'react';
import { Plus, FileText, Download, Trash2, File, FileImage, FilePlus, Clock, AlertTriangle, History, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import type { StaffDocument } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DocumentUploadForm } from './DocumentUploadForm';

interface DocumentsListProps {
  staffProfileId: string;
  documents: DocumentWithExpiration[];
  canEdit: boolean;
  onUpdate: () => void;
}

const categoryLabels: Record<string, string> = {
  CONTRACT: 'Contract',
  ID: 'ID Document',
  TAX: 'Tax Document',
  MEDICAL: 'Medical',
  BACKGROUND: 'Background Check',
  CERTIFICATION: 'Certification',
  PERFORMANCE: 'Performance Review',
  DISCIPLINARY: 'Disciplinary',
  OTHER: 'Other',
  // HR-specific document types
  NDA: 'NDA',
  I9: 'I-9',
  W4: 'W-4',
  DIRECT_DEPOSIT: 'Direct Deposit',
  HANDBOOK_ACKNOWLEDGMENT: 'Handbook',
  EMERGENCY_CONTACT_FORM: 'Emergency Contact',
  BENEFITS_ENROLLMENT: 'Benefits',
  PIP: 'PIP',
  WRITTEN_WARNING: 'Warning',
  COMMENDATION: 'Commendation',
};

// Extended document type with expiration fields
interface DocumentWithExpiration extends StaffDocument {
  calculatedExpirationStatus?: string;
  daysUntilExpiration?: number | null;
}

const accessLevelLabels: Record<string, string> = {
  PUBLIC: 'Public',
  STAFF_ONLY: 'Staff Only',
  HR_ONLY: 'HR Only',
  MANAGEMENT: 'Management',
  CONFIDENTIAL: 'Confidential',
};

const accessLevelVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'ghost'> = {
  PUBLIC: 'success',
  STAFF_ONLY: 'info',
  HR_ONLY: 'warning',
  MANAGEMENT: 'warning',
  CONFIDENTIAL: 'error',
};

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.includes('pdf')) return FileText;
  return File;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsList({ staffProfileId, documents, canEdit, onUpdate }: DocumentsListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSuccess = () => {
    setDialogOpen(false);
    onUpdate();
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/staff/${staffProfileId}/documents?documentId=${deleteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onUpdate();
      }
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle size="sm">Documents</CardTitle>
          {canEdit && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                </DialogHeader>
                <DocumentUploadForm
                  staffProfileId={staffProfileId}
                  onSuccess={handleSuccess}
                  onCancel={() => setDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FilePlus className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mt-2">
                No documents uploaded
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => {
                const FileIcon = getFileIcon(doc.mimeType);
                const expirationStatus = doc.calculatedExpirationStatus || doc.expirationStatus;
                const isExpired = expirationStatus === 'EXPIRED';
                const isExpiringSoon = expirationStatus === 'EXPIRING_SOON';

                return (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isExpired
                        ? 'bg-destructive/10 hover:bg-destructive/15 border border-destructive/20'
                        : isExpiringSoon
                        ? 'bg-warning/10 hover:bg-warning/15 border border-warning/20'
                        : 'bg-muted/50 hover:bg-muted/70'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <FileIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {doc.name}
                        </span>
                        {doc.version > 1 && (
                          <Badge variant="outline" size="sm" className="gap-1">
                            <History className="h-3 w-3" />
                            v{doc.version}
                          </Badge>
                        )}
                        <Badge variant="ghost" size="sm">
                          {categoryLabels[doc.category] || doc.category}
                        </Badge>
                        <Badge
                          variant={accessLevelVariants[doc.accessLevel] || 'ghost'}
                          size="sm"
                        >
                          {accessLevelLabels[doc.accessLevel] || doc.accessLevel}
                        </Badge>
                        {/* Expiration badge */}
                        {isExpired && (
                          <Badge variant="destructive" size="sm" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Expired
                          </Badge>
                        )}
                        {isExpiringSoon && doc.daysUntilExpiration !== null && (
                          <Badge variant="warning" size="sm" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Expires in {doc.daysUntilExpiration}d
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span>{doc.fileName}</span>
                        {doc.fileSize && (
                          <>
                            <span>•</span>
                            <span>{formatFileSize(doc.fileSize)}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        {doc.expirationDate && (
                          <>
                            <span>•</span>
                            <span>Expires: {format(new Date(doc.expirationDate), 'MMM d, yyyy')}</span>
                          </>
                        )}
                      </div>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {doc.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(doc.fileUrl, '_blank')}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              // TODO: Open replace document dialog
                              console.log('Replace document:', doc.id);
                            }}
                            title="Replace with new version"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteId(doc.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-error-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-error-600 hover:bg-error-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

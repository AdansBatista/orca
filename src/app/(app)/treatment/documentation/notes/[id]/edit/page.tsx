'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProgressNoteEditor } from '@/components/treatment/documentation';
import type { CreateProgressNoteInput } from '@/lib/validations/treatment';

interface ProgressNote {
  id: string;
  noteDate: string;
  noteType: string;
  status: string;
  chiefComplaint: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  proceduresSummary: string | null;
  patientId: string;
  providerId: string;
  treatmentPlanId: string | null;
  appointmentId: string | null;
  supervisingProviderId: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function EditProgressNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [note, setNote] = useState<ProgressNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const response = await fetch(`/api/progress-notes/${id}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch note');
        }

        // Only allow editing draft notes
        if (result.data.status !== 'DRAFT') {
          router.replace(`/treatment/documentation/notes/${id}`);
          return;
        }

        setNote(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id, router]);

  if (loading) {
    return (
      <>
        <PageHeader
          title="Edit Progress Note"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Treatment', href: '/treatment' },
            { label: 'Documentation', href: '/treatment/documentation' },
            { label: 'Progress Notes', href: '/treatment/documentation/notes' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </PageContent>
      </>
    );
  }

  if (error || !note) {
    return (
      <>
        <PageHeader
          title="Edit Progress Note"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Treatment', href: '/treatment' },
            { label: 'Documentation', href: '/treatment/documentation' },
            { label: 'Progress Notes', href: '/treatment/documentation/notes' },
            { label: 'Error' },
          ]}
        />
        <PageContent density="comfortable">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Note not found'}</AlertDescription>
          </Alert>
        </PageContent>
      </>
    );
  }

  // Transform data for the editor
  const initialData: Partial<CreateProgressNoteInput> & { id: string } = {
    id: note.id,
    patientId: note.patientId,
    noteType: note.noteType as CreateProgressNoteInput['noteType'],
    providerId: note.providerId,
    noteDate: new Date(note.noteDate),
    status: note.status as CreateProgressNoteInput['status'],
    chiefComplaint: note.chiefComplaint,
    subjective: note.subjective,
    objective: note.objective,
    assessment: note.assessment,
    plan: note.plan,
    proceduresSummary: note.proceduresSummary,
    treatmentPlanId: note.treatmentPlanId,
    appointmentId: note.appointmentId,
    supervisingProviderId: note.supervisingProviderId,
  };

  return (
    <>
      <PageHeader
        title="Edit Progress Note"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Treatment', href: '/treatment' },
          { label: 'Documentation', href: '/treatment/documentation' },
          { label: 'Progress Notes', href: '/treatment/documentation/notes' },
          { label: 'Edit' },
        ]}
      />
      <PageContent density="comfortable">
        <ProgressNoteEditor
          mode="edit"
          noteId={id}
          initialData={initialData}
          patientId={note.patientId}
        />
      </PageContent>
    </>
  );
}

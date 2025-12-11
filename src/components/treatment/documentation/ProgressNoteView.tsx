'use client';

import { format } from 'date-fns';
import {
  User,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  Edit,
  AlertCircle,
  Stethoscope,
  ClipboardList,
  Target,
  ArrowRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface Procedure {
  id: string;
  procedureCode: string;
  procedureName: string;
  description: string | null;
  toothNumbers: number[];
  performedAt: string;
  status: string;
  notes: string | null;
}

interface ClinicalFinding {
  id: string;
  findingType: string;
  description: string;
  severity: string | null;
  toothNumbers: number[];
  actionRequired: boolean;
  actionTaken: string | null;
}

interface ClinicalMeasurement {
  id: string;
  measurementType: string;
  value: number;
  unit: string;
  notes: string | null;
}

export interface ProgressNoteData {
  id: string;
  noteDate: string;
  noteType: string;
  chiefComplaint: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  proceduresSummary: string | null;
  status: string;
  signedAt: string | null;
  coSignedAt: string | null;
  isAmended: boolean;
  amendmentReason: string | null;
  amendedAt: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    patientNumber: string;
  };
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
  signedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  } | null;
  coSignedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  } | null;
  treatmentPlan?: {
    id: string;
    planNumber: string;
    planName: string;
  } | null;
  procedures: Procedure[];
  findings: ClinicalFinding[];
  measurements: ClinicalMeasurement[];
}

interface ProgressNoteViewProps {
  note: ProgressNoteData;
  onEdit?: () => void;
  onSign?: () => void;
  onCoSign?: () => void;
  onAmend?: () => void;
}

const noteTypeLabels: Record<string, string> = {
  INITIAL_EXAM: 'Initial Exam',
  CONSULTATION: 'Consultation',
  RECORDS_APPOINTMENT: 'Records Appointment',
  BONDING: 'Bonding',
  ADJUSTMENT: 'Adjustment',
  EMERGENCY: 'Emergency',
  DEBOND: 'Debond',
  RETENTION_CHECK: 'Retention Check',
  OBSERVATION: 'Observation',
  GENERAL: 'General',
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'info' }> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  PENDING_SIGNATURE: { label: 'Pending Signature', variant: 'warning' },
  SIGNED: { label: 'Signed', variant: 'success' },
  PENDING_COSIGN: { label: 'Pending Co-Sign', variant: 'info' },
  COSIGNED: { label: 'Co-Signed', variant: 'success' },
  AMENDED: { label: 'Amended', variant: 'warning' },
};

const findingTypeLabels: Record<string, string> = {
  DECALCIFICATION: 'Decalcification',
  CARIES: 'Caries',
  GINGIVITIS: 'Gingivitis',
  BRACKET_ISSUE: 'Bracket Issue',
  WIRE_ISSUE: 'Wire Issue',
  ELASTIC_COMPLIANCE: 'Elastic Compliance',
  ORAL_HYGIENE: 'Oral Hygiene',
  ROOT_RESORPTION: 'Root Resorption',
  IMPACTION: 'Impaction',
  ECTOPIC_ERUPTION: 'Ectopic Eruption',
  ANKYLOSIS: 'Ankylosis',
  OTHER: 'Other',
};

const measurementTypeLabels: Record<string, string> = {
  OVERJET: 'Overjet',
  OVERBITE: 'Overbite',
  OVERBITE_PERCENT: 'Overbite %',
  CROWDING_UPPER: 'Crowding (Upper)',
  CROWDING_LOWER: 'Crowding (Lower)',
  SPACING_UPPER: 'Spacing (Upper)',
  SPACING_LOWER: 'Spacing (Lower)',
  MIDLINE_UPPER: 'Midline (Upper)',
  MIDLINE_LOWER: 'Midline (Lower)',
};

export function ProgressNoteView({
  note,
  onEdit,
  onSign,
  onCoSign,
  onAmend,
}: ProgressNoteViewProps) {
  const config = statusConfig[note.status] || statusConfig.DRAFT;
  const canEdit = note.status === 'DRAFT';
  const canSign = note.status === 'DRAFT' || note.status === 'PENDING_SIGNATURE';
  const canCoSign = note.status === 'PENDING_COSIGN';
  const canAmend = note.status === 'SIGNED' || note.status === 'COSIGNED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">
              {noteTypeLabels[note.noteType] || note.noteType}
            </h1>
            <Badge variant={config.variant}>{config.label}</Badge>
            {note.isAmended && (
              <Badge variant="warning">Amended</Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {format(new Date(note.noteDate), 'MMMM d, yyyy')} at{' '}
            {format(new Date(note.noteDate), 'h:mm a')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canSign && onSign && (
            <Button onClick={onSign}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Sign Note
            </Button>
          )}
          {canCoSign && onCoSign && (
            <Button onClick={onCoSign}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Co-Sign
            </Button>
          )}
          {canAmend && onAmend && (
            <Button variant="outline" onClick={onAmend}>
              <Edit className="h-4 w-4 mr-2" />
              Amend
            </Button>
          )}
        </div>
      </div>

      {/* Amendment Notice */}
      {note.isAmended && note.amendmentReason && (
        <Card className="border-warning-200 bg-warning-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning-600 mt-0.5" />
              <div>
                <p className="font-medium text-warning-800">Note Amended</p>
                <p className="text-sm text-warning-700">{note.amendmentReason}</p>
                {note.amendedAt && (
                  <p className="text-xs text-warning-600 mt-1">
                    Amended on {format(new Date(note.amendedAt), 'MMM d, yyyy h:mm a')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient & Provider Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card variant="ghost">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Patient</p>
                <PhiProtected fakeData={getFakeName()}>
                  <p className="font-medium">
                    {note.patient.firstName} {note.patient.lastName}
                  </p>
                </PhiProtected>
                <p className="text-xs text-muted-foreground">{note.patient.patientNumber}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="ghost">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Provider</p>
                <p className="font-medium">
                  {note.provider.title || 'Dr.'} {note.provider.firstName} {note.provider.lastName}
                </p>
                {note.treatmentPlan && (
                  <p className="text-xs text-muted-foreground">
                    Plan: {note.treatmentPlan.planNumber}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chief Complaint */}
      {note.chiefComplaint && (
        <Card>
          <CardHeader compact>
            <CardTitle size="sm">Chief Complaint</CardTitle>
          </CardHeader>
          <CardContent compact>
            <p>{note.chiefComplaint}</p>
          </CardContent>
        </Card>
      )}

      {/* SOAP Notes */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Clinical Notes (SOAP)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {note.subjective && (
            <div>
              <h4 className="text-sm font-semibold text-primary-600 mb-1">S - Subjective</h4>
              <p className="text-sm whitespace-pre-wrap">{note.subjective}</p>
            </div>
          )}

          {note.objective && (
            <div>
              <h4 className="text-sm font-semibold text-primary-600 mb-1">O - Objective</h4>
              <p className="text-sm whitespace-pre-wrap">{note.objective}</p>
            </div>
          )}

          {note.assessment && (
            <div>
              <h4 className="text-sm font-semibold text-primary-600 mb-1">A - Assessment</h4>
              <p className="text-sm whitespace-pre-wrap">{note.assessment}</p>
            </div>
          )}

          {note.plan && (
            <div>
              <h4 className="text-sm font-semibold text-primary-600 mb-1">P - Plan</h4>
              <p className="text-sm whitespace-pre-wrap">{note.plan}</p>
            </div>
          )}

          {!note.subjective && !note.objective && !note.assessment && !note.plan && (
            <p className="text-muted-foreground text-sm">No clinical notes recorded.</p>
          )}
        </CardContent>
      </Card>

      {/* Procedures */}
      {note.procedures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle size="sm" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Procedures Performed ({note.procedures.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {note.procedures.map((procedure) => (
                <div
                  key={procedure.id}
                  className="flex items-start justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" size="sm">
                        {procedure.procedureCode}
                      </Badge>
                      <span className="font-medium">{procedure.procedureName}</span>
                    </div>
                    {procedure.description && (
                      <p className="text-sm text-muted-foreground">{procedure.description}</p>
                    )}
                    {procedure.toothNumbers.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Teeth: {procedure.toothNumbers.join(', ')}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={procedure.status === 'COMPLETED' ? 'success' : 'secondary'}
                    size="sm"
                  >
                    {procedure.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clinical Findings */}
      {note.findings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle size="sm" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Clinical Findings ({note.findings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {note.findings.map((finding) => (
                <div key={finding.id} className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {findingTypeLabels[finding.findingType] || finding.findingType}
                    </span>
                    {finding.severity && (
                      <Badge
                        variant={
                          finding.severity === 'SEVERE'
                            ? 'destructive'
                            : finding.severity === 'MODERATE'
                              ? 'warning'
                              : 'secondary'
                        }
                        size="sm"
                      >
                        {finding.severity}
                      </Badge>
                    )}
                    {finding.actionRequired && (
                      <Badge variant="info" size="sm">
                        Action Required
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm">{finding.description}</p>
                  {finding.toothNumbers.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Teeth: {finding.toothNumbers.join(', ')}
                    </p>
                  )}
                  {finding.actionTaken && (
                    <p className="text-xs text-success-600 mt-1">
                      <ArrowRight className="h-3 w-3 inline mr-1" />
                      {finding.actionTaken}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Measurements */}
      {note.measurements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle size="sm">Clinical Measurements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
              {note.measurements.map((measurement) => (
                <div key={measurement.id} className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-xs text-muted-foreground">
                    {measurementTypeLabels[measurement.measurementType] || measurement.measurementType}
                  </p>
                  <p className="text-lg font-bold">
                    {measurement.value}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      {measurement.unit}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signature Info */}
      <Card variant="ghost">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-6">
            {note.signedBy && note.signedAt && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Signed by</p>
                  <p className="text-sm font-medium">
                    {note.signedBy.title || 'Dr.'} {note.signedBy.firstName} {note.signedBy.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(note.signedAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            )}

            {note.coSignedBy && note.coSignedAt && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Co-signed by</p>
                  <p className="text-sm font-medium">
                    {note.coSignedBy.title || 'Dr.'} {note.coSignedBy.firstName}{' '}
                    {note.coSignedBy.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(note.coSignedAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            )}

            {!note.signedBy && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Awaiting signature</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Plus, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { Credential } from '@prisma/client';

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
import { CredentialForm } from './CredentialForm';

interface CredentialsListProps {
  staffProfileId: string;
  credentials: Credential[];
  canEdit: boolean;
  onUpdate: () => void;
}

const credentialTypeLabels: Record<string, string> = {
  STATE_LICENSE: 'State License',
  DEA_REGISTRATION: 'DEA Registration',
  NPI: 'NPI',
  BOARD_CERTIFICATION: 'Board Certification',
  SPECIALTY_CERTIFICATION: 'Specialty Certification',
  RADIOLOGY_LICENSE: 'Radiology License',
  SEDATION_PERMIT: 'Sedation Permit',
  CONTROLLED_SUBSTANCE: 'Controlled Substance',
  OTHER: 'Other',
};

const statusConfig: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'ghost'; icon: typeof CheckCircle }> = {
  ACTIVE: { variant: 'success', icon: CheckCircle },
  EXPIRED: { variant: 'error', icon: XCircle },
  PENDING: { variant: 'info', icon: Clock },
  SUSPENDED: { variant: 'error', icon: XCircle },
  REVOKED: { variant: 'error', icon: XCircle },
  RENEWAL_PENDING: { variant: 'warning', icon: AlertTriangle },
};

function getDaysUntilExpiry(date: Date | null): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getExpiryBadge(expirationDate: Date | null) {
  const days = getDaysUntilExpiry(expirationDate);

  if (days === null) return null;

  if (days < 0) {
    return <Badge variant="error" size="sm">Expired</Badge>;
  }
  if (days <= 30) {
    return <Badge variant="error" size="sm">Expires in {days} days</Badge>;
  }
  if (days <= 60) {
    return <Badge variant="warning" size="sm">Expires in {days} days</Badge>;
  }
  if (days <= 90) {
    return <Badge variant="info" size="sm">Expires in {days} days</Badge>;
  }
  return null;
}

export function CredentialsList({ staffProfileId, credentials, canEdit, onUpdate }: CredentialsListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSuccess = () => {
    setDialogOpen(false);
    onUpdate();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle size="sm">Credentials & Licenses</CardTitle>
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
                <DialogTitle>Add Credential</DialogTitle>
              </DialogHeader>
              <CredentialForm
                staffProfileId={staffProfileId}
                onSuccess={handleSuccess}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {credentials.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No credentials on file
          </p>
        ) : (
          <div className="space-y-3">
            {credentials.map((credential) => {
              const config = statusConfig[credential.status] || { variant: 'ghost' as const, icon: Clock };
              const StatusIcon = config.icon;

              return (
                <div
                  key={credential.id}
                  className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {credentialTypeLabels[credential.type] || credential.type}
                      </span>
                      <Badge variant={config.variant} size="sm" dot>
                        {credential.status.replace('_', ' ')}
                      </Badge>
                      {getExpiryBadge(credential.expirationDate)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {credential.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      #{credential.number} • {credential.issuingAuthority}
                      {credential.issuingState && ` (${credential.issuingState})`}
                    </p>
                    {credential.expirationDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires: {new Date(credential.expirationDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

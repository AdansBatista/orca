'use client';

import { useState } from 'react';
import { Plus, Award, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { Certification } from '@prisma/client';

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
import { CertificationForm } from './CertificationForm';

interface CertificationsListProps {
  staffProfileId: string;
  certifications: Certification[];
  canEdit: boolean;
  onUpdate: () => void;
}

const certificationTypeLabels: Record<string, string> = {
  CPR_BLS: 'CPR/BLS',
  ACLS: 'ACLS',
  PALS: 'PALS',
  RADIOLOGY: 'Radiology',
  NITROUS_OXIDE: 'Nitrous Oxide',
  LASER_CERTIFICATION: 'Laser Certification',
  INVISALIGN: 'Invisalign',
  SURESMILE: 'SureSmile',
  INCOGNITO: 'Incognito',
  DAMON: 'Damon System',
  INFECTION_CONTROL: 'Infection Control',
  HIPAA: 'HIPAA',
  OSHA: 'OSHA',
  OTHER: 'Other',
};

const statusConfig: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'ghost'; icon: typeof CheckCircle }> = {
  ACTIVE: { variant: 'success', icon: CheckCircle },
  EXPIRED: { variant: 'error', icon: XCircle },
  PENDING: { variant: 'info', icon: Clock },
  REVOKED: { variant: 'error', icon: XCircle },
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

export function CertificationsList({ staffProfileId, certifications, canEdit, onUpdate }: CertificationsListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSuccess = () => {
    setDialogOpen(false);
    onUpdate();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle size="sm">Certifications</CardTitle>
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
                <DialogTitle>Add Certification</DialogTitle>
              </DialogHeader>
              <CertificationForm
                staffProfileId={staffProfileId}
                onSuccess={handleSuccess}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {certifications.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No certifications on file
          </p>
        ) : (
          <div className="space-y-3">
            {certifications.map((cert) => {
              const config = statusConfig[cert.status] || { variant: 'ghost' as const, icon: Clock };

              return (
                <div
                  key={cert.id}
                  className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Award className="h-4 w-4 text-primary-500" />
                      <span className="font-medium text-sm">
                        {certificationTypeLabels[cert.type] || cert.type}
                      </span>
                      <Badge variant={config.variant} size="sm" dot>
                        {cert.status}
                      </Badge>
                      {getExpiryBadge(cert.expirationDate)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {cert.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {cert.issuingOrganization}
                      {cert.level && ` • ${cert.level}`}
                    </p>
                    {cert.expirationDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires: {new Date(cert.expirationDate).toLocaleDateString()}
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

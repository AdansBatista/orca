'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Edit, Trash2, AlertTriangle, Ban, AlertCircle } from 'lucide-react';
import type { BlackoutDate } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface BlackoutDateListProps {
  blackoutDates: BlackoutDate[];
  onEdit: (blackoutDate: BlackoutDate) => void;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const typeConfig = {
  BLOCKED: {
    label: 'Blocked',
    variant: 'destructive' as const,
    icon: Ban,
    description: 'No time-off allowed',
  },
  RESTRICTED: {
    label: 'Restricted',
    variant: 'warning' as const,
    icon: AlertTriangle,
    description: 'Approval required',
  },
  WARNING: {
    label: 'Warning',
    variant: 'info' as const,
    icon: AlertCircle,
    description: 'Advisory only',
  },
};

export function BlackoutDateList({
  blackoutDates,
  onEdit,
  onDelete,
  isLoading,
}: BlackoutDateListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteId);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-6 bg-muted rounded w-1/3 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (blackoutDates.length === 0) {
    return (
      <Card variant="ghost">
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No blackout dates configured</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create blackout dates to restrict time-off requests during busy periods
          </p>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const sortedDates = [...blackoutDates].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  return (
    <>
      <div className="space-y-3">
        {sortedDates.map((bd) => {
          const config = typeConfig[bd.restrictionType];
          const Icon = config.icon;
          const startDate = new Date(bd.startDate);
          const endDate = new Date(bd.endDate);
          const isPast = endDate < now;
          const isActive = startDate <= now && endDate >= now;

          return (
            <Card
              key={bd.id}
              className={`transition-opacity ${isPast || !bd.isActive ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      bd.restrictionType === 'BLOCKED' ? 'bg-destructive/10 text-destructive' :
                      bd.restrictionType === 'RESTRICTED' ? 'bg-warning/10 text-warning' :
                      'bg-info/10 text-info'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{bd.name}</h3>
                        <Badge variant={config.variant}>{config.label}</Badge>
                        {isActive && (
                          <Badge variant="success" dot>Active Now</Badge>
                        )}
                        {isPast && (
                          <Badge variant="soft-secondary">Past</Badge>
                        )}
                        {!bd.isActive && (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(startDate, 'MMM d, yyyy')} — {format(endDate, 'MMM d, yyyy')}
                      </p>
                      {bd.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {bd.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(bd)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(bd.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blackout Date</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this blackout date? This action will deactivate
              the blackout period and allow time-off requests during this time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

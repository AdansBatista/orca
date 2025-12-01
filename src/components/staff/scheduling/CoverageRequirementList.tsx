'use client';

import { useState } from 'react';
import { Users, Edit, Trash2, AlertTriangle, Clock, MapPin } from 'lucide-react';
import type { CoverageRequirement } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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

interface CoverageRequirementListProps {
  requirements: CoverageRequirement[];
  onEdit: (requirement: CoverageRequirement) => void;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function CoverageRequirementList({
  requirements,
  onEdit,
  onDelete,
  isLoading,
}: CoverageRequirementListProps) {
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

  if (requirements.length === 0) {
    return (
      <Card variant="ghost">
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No coverage requirements configured</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create coverage requirements to define minimum staffing levels
          </p>
        </CardContent>
      </Card>
    );
  }

  const sortedRequirements = [...requirements].sort((a, b) => {
    // Sort by priority (higher first), then by name
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      <div className="space-y-3">
        {sortedRequirements.map((req) => (
          <Card
            key={req.id}
            className={`transition-opacity ${!req.isActive ? 'opacity-60' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    req.isCritical ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                  }`}>
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium">{req.name}</h3>
                      {req.isCritical && (
                        <Badge variant="destructive" dot>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Critical
                        </Badge>
                      )}
                      {!req.isActive && (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                      <Badge variant="soft-secondary">
                        Priority {req.priority}
                      </Badge>
                    </div>

                    {req.description && (
                      <p className="text-sm text-muted-foreground">
                        {req.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Min: {req.minimumStaff}
                        {req.optimalStaff && ` / Optimal: ${req.optimalStaff}`}
                        {req.maximumStaff && ` / Max: ${req.maximumStaff}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {req.dayOfWeek !== null && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {dayNames[req.dayOfWeek]}
                        </span>
                      )}
                      {req.startTime && req.endTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {req.startTime} - {req.endTime}
                        </span>
                      )}
                      {req.department && (
                        <Badge variant="outline">{req.department}</Badge>
                      )}
                      {req.providerType && (
                        <Badge variant="outline">{req.providerType}</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(req)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(req.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coverage Requirement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this coverage requirement? This action cannot be undone
              and will remove the staffing level requirement.
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

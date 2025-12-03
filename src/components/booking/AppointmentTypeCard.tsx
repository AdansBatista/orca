'use client';

import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, Clock, Users, Calendar } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface AppointmentType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  defaultDuration: number;
  color: string;
  icon: string | null;
  requiresChair: boolean;
  requiresRoom: boolean;
  prepTime: number;
  cleanupTime: number;
  isActive: boolean;
  allowOnline: boolean;
  _count?: {
    appointments: number;
  };
}

interface AppointmentTypeCardProps {
  appointmentType: AppointmentType;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => Promise<void>;
}

export function AppointmentTypeCard({ appointmentType, onEdit, onDelete }: AppointmentTypeCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(appointmentType.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const totalDuration = appointmentType.prepTime + appointmentType.defaultDuration + appointmentType.cleanupTime;

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            {/* Color indicator and name */}
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: appointmentType.color }}
              />
              <div>
                <h3 className="font-semibold text-foreground">{appointmentType.name}</h3>
                <p className="text-xs text-muted-foreground font-mono">{appointmentType.code}</p>
              </div>
            </div>

            {/* Actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(appointmentType.id)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          {appointmentType.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {appointmentType.description}
            </p>
          )}

          {/* Duration info */}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{appointmentType.defaultDuration} min</span>
              {(appointmentType.prepTime > 0 || appointmentType.cleanupTime > 0) && (
                <span className="text-xs">({totalDuration} total)</span>
              )}
            </div>
            {appointmentType._count && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{appointmentType._count.appointments} appts</span>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <Badge variant={appointmentType.isActive ? 'success' : 'ghost'}>
              {appointmentType.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {appointmentType.allowOnline && (
              <Badge variant="info">
                <Users className="h-3 w-3 mr-1" />
                Online
              </Badge>
            )}
            {appointmentType.requiresChair && (
              <Badge variant="outline">Chair Required</Badge>
            )}
            {appointmentType.requiresRoom && (
              <Badge variant="outline">Room Required</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{appointmentType.name}&quot;?
              {appointmentType._count && appointmentType._count.appointments > 0 && (
                <span className="block mt-2 text-warning-600">
                  This type has {appointmentType._count.appointments} scheduled appointments.
                  Deleting it will prevent creating new appointments of this type.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
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

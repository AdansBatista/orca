'use client';

import { useState } from 'react';
import { Armchair, Plus, Trash2, Wrench } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ChairForm } from './ChairForm';

interface TreatmentChair {
  id: string;
  name: string;
  chairNumber: string;
  status: string;
  condition: string;
  manufacturer: string | null;
  modelNumber: string | null;
  hasDeliveryUnit: boolean;
  hasSuction: boolean;
  hasLight: boolean;
  nextMaintenanceDate: string | null;
}

interface ChairSectionProps {
  roomId: string;
  chairs: TreatmentChair[];
  onRefresh: () => void;
}

function getChairStatusVariant(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'IN_REPAIR':
      return 'warning';
    case 'OUT_OF_SERVICE':
      return 'destructive';
    case 'RETIRED':
      return 'secondary';
    default:
      return 'secondary';
  }
}

function getConditionVariant(condition: string) {
  switch (condition) {
    case 'EXCELLENT':
      return 'success';
    case 'GOOD':
      return 'info';
    case 'FAIR':
      return 'warning';
    case 'POOR':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export function ChairSection({ roomId, chairs, onRefresh }: ChairSectionProps) {
  const [chairFormOpen, setChairFormOpen] = useState(false);
  const [deletingChairId, setDeletingChairId] = useState<string | null>(null);

  const handleDeleteChair = async (chairId: string) => {
    setDeletingChairId(chairId);
    try {
      const response = await fetch(`/api/resources/rooms/${roomId}/chairs/${chairId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete chair');
      }

      onRefresh();
    } catch (err) {
      console.error('Failed to delete chair:', err);
    } finally {
      setDeletingChairId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle size="sm" className="flex items-center gap-2">
            <Armchair className="h-4 w-4" />
            Treatment Chairs
          </CardTitle>
          <Button size="sm" onClick={() => setChairFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Chair
          </Button>
        </CardHeader>
        <CardContent>
          {chairs && chairs.length > 0 ? (
            <div className="space-y-3">
              {chairs.map((chair) => (
                <div
                  key={chair.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{chair.name}</span>
                      <span className="text-sm text-muted-foreground font-mono">
                        ({chair.chairNumber})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getChairStatusVariant(chair.status)} size="sm">
                        {chair.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant={getConditionVariant(chair.condition)} size="sm">
                        {chair.condition}
                      </Badge>
                      {chair.manufacturer && (
                        <span className="text-xs text-muted-foreground">
                          {chair.manufacturer}
                          {chair.modelNumber && ` - ${chair.modelNumber}`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {chair.hasDeliveryUnit && <span>Delivery Unit</span>}
                      {chair.hasSuction && <span>Suction</span>}
                      {chair.hasLight && <span>Light</span>}
                    </div>
                    {chair.nextMaintenanceDate && (
                      <div className="flex items-center gap-1 mt-2 text-xs">
                        <Wrench className="h-3 w-3" />
                        <span>
                          Next maintenance:{' '}
                          {new Date(chair.nextMaintenanceDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-error-600"
                        disabled={deletingChairId === chair.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Chair</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &ldquo;{chair.name}&rdquo;? This action
                          cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteChair(chair.id)}
                          className="bg-error-600 hover:bg-error-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Armchair className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No treatment chairs in this room</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setChairFormOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add First Chair
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chair Form Modal */}
      <ChairForm
        open={chairFormOpen}
        onOpenChange={setChairFormOpen}
        roomId={roomId}
        mode="create"
        onSuccess={onRefresh}
      />
    </>
  );
}

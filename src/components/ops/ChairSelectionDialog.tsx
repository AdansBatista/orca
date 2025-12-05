'use client';

import { useState, useEffect } from 'react';
import { Armchair, CheckCircle2, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ChairSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (chairId: string) => void;
  patientName: string;
  loading?: boolean;
}

interface ChairStatus {
  id: string;
  name: string;
  chairNumber: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'BLOCKED' | 'CLEANING' | 'MAINTENANCE';
  room: {
    id: string;
    name: string;
    roomNumber: string;
  };
}

interface RoomWithChairs {
  room: {
    id: string;
    name: string;
    roomNumber: string;
  };
  chairs: ChairStatus[];
}

const STATUS_STYLES = {
  AVAILABLE: {
    bg: 'bg-success-100 border-success-300 hover:bg-success-200 cursor-pointer',
    text: 'text-success-700',
  },
  OCCUPIED: {
    bg: 'bg-muted border-muted-foreground/30 opacity-50 cursor-not-allowed',
    text: 'text-muted-foreground',
  },
  BLOCKED: {
    bg: 'bg-error-100 border-error-300 opacity-50 cursor-not-allowed',
    text: 'text-error-700',
  },
  CLEANING: {
    bg: 'bg-warning-100 border-warning-300 opacity-50 cursor-not-allowed',
    text: 'text-warning-700',
  },
  MAINTENANCE: {
    bg: 'bg-muted border-muted-foreground/30 opacity-50 cursor-not-allowed',
    text: 'text-muted-foreground',
  },
};

export function ChairSelectionDialog({
  open,
  onOpenChange,
  onSelect,
  patientName,
  loading: externalLoading,
}: ChairSelectionDialogProps) {
  const [rooms, setRooms] = useState<RoomWithChairs[]>([]);
  const [loadingChairs, setLoadingChairs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChairId, setSelectedChairId] = useState<string | null>(null);

  // Fetch available chairs when dialog opens
  useEffect(() => {
    if (open) {
      const fetchChairs = async () => {
        setLoadingChairs(true);
        setError(null);
        setSelectedChairId(null);
        try {
          const response = await fetch('/api/ops/resources/status');
          const result = await response.json();
          if (result.success) {
            setRooms(result.data.byRoom || []);
          } else {
            setError('Failed to load chairs');
          }
        } catch {
          setError('Failed to load chairs');
        } finally {
          setLoadingChairs(false);
        }
      };
      fetchChairs();
    }
  }, [open]);

  const handleChairClick = (chair: ChairStatus) => {
    if (chair.status === 'AVAILABLE') {
      setSelectedChairId(chair.id);
    }
  };

  const handleConfirm = () => {
    if (selectedChairId) {
      onSelect(selectedChairId);
    }
  };

  const availableCount = rooms.reduce(
    (sum, r) => sum + r.chairs.filter((c) => c.status === 'AVAILABLE').length,
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Armchair className="h-5 w-5 text-primary-500" />
            Select Chair
          </DialogTitle>
          <DialogDescription>
            Select an available chair for {patientName}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loadingChairs ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Armchair className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No chairs configured</p>
          </div>
        ) : availableCount === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-warning-500" />
            <p className="font-medium">No chairs available</p>
            <p className="text-sm">All chairs are currently occupied or unavailable</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {rooms.map((roomData) => {
              const availableInRoom = roomData.chairs.filter(
                (c) => c.status === 'AVAILABLE'
              ).length;

              return (
                <div key={roomData.room.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-sm">{roomData.room.name}</h4>
                    <Badge variant="outline" size="sm">
                      {availableInRoom} available
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {roomData.chairs.map((chair) => {
                      const styles = STATUS_STYLES[chair.status];
                      const isSelected = selectedChairId === chair.id;
                      const isAvailable = chair.status === 'AVAILABLE';

                      return (
                        <Card
                          key={chair.id}
                          className={`border-2 transition-all ${styles.bg} ${
                            isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                          }`}
                          onClick={() => handleChairClick(chair)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Armchair className={`h-4 w-4 ${styles.text}`} />
                                <span className="font-medium text-sm">
                                  {chair.name}
                                </span>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="h-4 w-4 text-primary-600" />
                              )}
                            </div>
                            <Badge
                              variant={isAvailable ? 'success' : 'ghost'}
                              size="sm"
                              className="mt-2"
                            >
                              {chair.status === 'AVAILABLE'
                                ? 'Available'
                                : chair.status.charAt(0) +
                                  chair.status.slice(1).toLowerCase()}
                            </Badge>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedChairId || externalLoading}
          >
            {externalLoading ? 'Seating...' : 'Seat Patient'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

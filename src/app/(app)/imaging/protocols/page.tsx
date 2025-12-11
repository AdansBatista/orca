'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Camera,
  Edit,
  Trash2,
  MoreVertical,
  Check,
  Image as ImageIcon,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { cn } from '@/lib/utils';

interface ProtocolSlot {
  id: string;
  name: string;
  category: string;
  subcategory?: string | null;
  sortOrder: number;
  isRequired: boolean;
  instructions?: string | null;
}

interface PhotoProtocol {
  id: string;
  clinicId: string | null;
  name: string;
  description?: string | null;
  isActive: boolean;
  isDefault: boolean;
  slots: ProtocolSlot[];
  _count: {
    images: number;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  EXTRAORAL_PHOTO: 'Extraoral',
  INTRAORAL_PHOTO: 'Intraoral',
  PANORAMIC_XRAY: 'Panoramic',
  CEPHALOMETRIC_XRAY: 'Ceph',
  PERIAPICAL_XRAY: 'Periapical',
  CBCT: 'CBCT',
  SCAN_3D: '3D Scan',
  OTHER: 'Other',
};

export default function ProtocolsPage() {
  const [protocols, setProtocols] = useState<PhotoProtocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProtocol, setNewProtocol] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProtocols();
  }, []);

  const fetchProtocols = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/photo-protocols');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch protocols');
      }

      setProtocols(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newProtocol.name.trim()) return;

    setCreating(true);

    try {
      const response = await fetch('/api/photo-protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProtocol),
      });

      const result = await response.json();

      if (result.success) {
        setCreateDialogOpen(false);
        setNewProtocol({ name: '', description: '' });
        fetchProtocols();
      }
    } catch (err) {
      console.error('Failed to create protocol:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/photo-protocols/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });

      if (response.ok) {
        fetchProtocols();
      }
    } catch (err) {
      console.error('Failed to set default:', err);
    }
  };

  const handleToggleActive = async (protocol: PhotoProtocol) => {
    try {
      const response = await fetch(`/api/photo-protocols/${protocol.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !protocol.isActive }),
      });

      if (response.ok) {
        fetchProtocols();
      }
    } catch (err) {
      console.error('Failed to toggle active:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this protocol?')) return;

    try {
      const response = await fetch(`/api/photo-protocols/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProtocols();
      }
    } catch (err) {
      console.error('Failed to delete protocol:', err);
    }
  };

  return (
    <>
      <PageHeader
        title="Photo Protocols"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Imaging', href: '/imaging' },
          { label: 'Protocols' },
        ]}
        actions={
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Protocol
          </Button>
        }
      />
      <PageContent density="comfortable">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>{error}</p>
            </CardContent>
          </Card>
        ) : protocols.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No protocols yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first photo protocol to standardize image capture
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Protocol
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {protocols.map((protocol) => (
              <Card
                key={protocol.id}
                className={cn(
                  'relative',
                  !protocol.isActive && 'opacity-60'
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {protocol.name}
                        {protocol.isDefault && (
                          <Badge variant="soft-primary">Default</Badge>
                        )}
                        {!protocol.clinicId && (
                          <Badge variant="outline">System</Badge>
                        )}
                      </CardTitle>
                      {protocol.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {protocol.description}
                        </p>
                      )}
                    </div>

                    {protocol.clinicId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {!protocol.isDefault && (
                            <DropdownMenuItem onClick={() => handleSetDefault(protocol.id)}>
                              <Check className="h-4 w-4 mr-2" />
                              Set as Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleToggleActive(protocol)}>
                            {protocol.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(protocol.id)}
                            disabled={protocol._count.images > 0}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Slots */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {protocol.slots.length} photos in series:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {protocol.slots.slice(0, 6).map((slot) => (
                        <Badge key={slot.id} variant="outline" className="text-xs">
                          {slot.name}
                          {!slot.isRequired && ' (opt)'}
                        </Badge>
                      ))}
                      {protocol.slots.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{protocol.slots.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="h-4 w-4" />
                      {protocol._count.images} images
                    </span>
                    <Badge variant={protocol.isActive ? 'success' : 'secondary'}>
                      {protocol.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Photo Protocol</DialogTitle>
              <DialogDescription>
                Create a new photo protocol to standardize image capture for patients.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <FormField label="Protocol Name" required>
                <Input
                  placeholder="e.g., Initial Records"
                  value={newProtocol.name}
                  onChange={(e) => setNewProtocol({ ...newProtocol, name: e.target.value })}
                />
              </FormField>

              <FormField label="Description">
                <Textarea
                  placeholder="Describe when this protocol should be used..."
                  value={newProtocol.description}
                  onChange={(e) => setNewProtocol({ ...newProtocol, description: e.target.value })}
                  rows={3}
                />
              </FormField>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating || !newProtocol.name.trim()}>
                {creating ? 'Creating...' : 'Create Protocol'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContent>
    </>
  );
}

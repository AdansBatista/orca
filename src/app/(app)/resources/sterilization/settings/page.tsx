'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Plug,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
  Wifi,
  WifiOff,
  Server,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Label } from '@/components/ui/label';
import {
  ListItem,
  ListItemTitle,
  ListItemDescription,
} from '@/components/ui/list-item';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
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
import { PageHeader, PageContent } from '@/components/layout';
import { toast } from 'sonner';

interface Equipment {
  id: string;
  name: string;
  equipmentNumber: string;
}

interface AutoclaveIntegration {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  enabled: boolean;
  status: string;
  errorMessage: string | null;
  lastSyncAt: string | null;
  lastCycleNum: number | null;
  equipment: Equipment;
  _count: {
    cycles: number;
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'CONNECTED':
      return (
        <Badge variant="success" size="sm" dot>
          Connected
        </Badge>
      );
    case 'ERROR':
      return (
        <Badge variant="destructive" size="sm" dot>
          Error
        </Badge>
      );
    case 'PENDING_SETUP':
    case 'PENDING_CONNECTION':
      return (
        <Badge variant="warning" size="sm" dot>
          Pending
        </Badge>
      );
    case 'INACTIVE':
      return (
        <Badge variant="soft-primary" size="sm">
          Inactive
        </Badge>
      );
    default:
      return (
        <Badge variant="soft-primary" size="sm">
          Not Configured
        </Badge>
      );
  }
}

function formatLastSync(dateStr: string | null) {
  if (!dateStr) return 'Never synced';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}

export default function SterilizationSettingsPage() {
  const [autoclaves, setAutoclaves] = useState<AutoclaveIntegration[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAutoclave, setEditingAutoclave] = useState<AutoclaveIntegration | null>(null);
  const [deleteAutoclave, setDeleteAutoclave] = useState<AutoclaveIntegration | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formIpAddress, setFormIpAddress] = useState('');
  const [formPort, setFormPort] = useState('80');
  const [formEquipmentId, setFormEquipmentId] = useState('');
  const [formEnabled, setFormEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch autoclaves
  useEffect(() => {
    fetchAutoclaves();
    fetchEquipment();
  }, []);

  async function fetchAutoclaves() {
    try {
      const res = await fetch('/api/resources/sterilization/autoclaves');
      const data = await res.json();
      if (data.success) {
        setAutoclaves(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch autoclaves:', error);
      toast.error('Failed to load autoclaves');
    } finally {
      setLoading(false);
    }
  }

  async function fetchEquipment() {
    try {
      const res = await fetch('/api/resources/equipment?category=STERILIZATION');
      const data = await res.json();
      if (data.success) {
        setEquipment(data.data.items || data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    }
  }

  function resetForm() {
    setFormName('');
    setFormIpAddress('');
    setFormPort('80');
    setFormEquipmentId('');
    setFormEnabled(true);
  }

  function openAddDialog() {
    resetForm();
    setEditingAutoclave(null);
    setShowAddDialog(true);
  }

  function openEditDialog(autoclave: AutoclaveIntegration) {
    setFormName(autoclave.name);
    setFormIpAddress(autoclave.ipAddress);
    setFormPort(autoclave.port.toString());
    setFormEquipmentId(autoclave.equipment.id);
    setFormEnabled(autoclave.enabled);
    setEditingAutoclave(autoclave);
    setShowAddDialog(true);
  }

  async function handleSave() {
    if (!formName || !formIpAddress || !formEquipmentId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formName,
        ipAddress: formIpAddress,
        port: parseInt(formPort, 10),
        equipmentId: formEquipmentId,
        enabled: formEnabled,
      };

      const url = editingAutoclave
        ? `/api/resources/sterilization/autoclaves/${editingAutoclave.id}`
        : '/api/resources/sterilization/autoclaves';

      const res = await fetch(url, {
        method: editingAutoclave ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          editingAutoclave ? 'Autoclave updated' : 'Autoclave added',
          {
            description: data.connectionTest?.success
              ? 'Connection successful!'
              : data.connectionTest?.error || 'Connection test failed',
          }
        );
        setShowAddDialog(false);
        fetchAutoclaves();
      } else {
        toast.error(data.error?.message || 'Failed to save autoclave');
      }
    } catch (error) {
      console.error('Failed to save autoclave:', error);
      toast.error('Failed to save autoclave');
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection(autoclave: AutoclaveIntegration) {
    setTestingId(autoclave.id);
    try {
      const res = await fetch(
        `/api/resources/sterilization/autoclaves/${autoclave.id}/test`,
        { method: 'POST' }
      );
      const data = await res.json();

      if (data.success) {
        if (data.data.connectionTest.success) {
          toast.success('Connection successful', {
            description: data.data.connectionTest.model || 'Autoclave is online',
          });
        } else {
          toast.error('Connection failed', {
            description: data.data.connectionTest.error,
          });
        }
        fetchAutoclaves();
      } else {
        toast.error(data.error?.message || 'Test failed');
      }
    } catch (error) {
      console.error('Failed to test connection:', error);
      toast.error('Failed to test connection');
    } finally {
      setTestingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteAutoclave) return;

    try {
      const res = await fetch(
        `/api/resources/sterilization/autoclaves/${deleteAutoclave.id}`,
        { method: 'DELETE' }
      );
      const data = await res.json();

      if (data.success) {
        toast.success('Autoclave removed');
        setDeleteAutoclave(null);
        fetchAutoclaves();
      } else {
        toast.error(data.error?.message || 'Failed to delete autoclave');
      }
    } catch (error) {
      console.error('Failed to delete autoclave:', error);
      toast.error('Failed to delete autoclave');
    }
  }

  async function handleToggleEnabled(autoclave: AutoclaveIntegration) {
    try {
      const res = await fetch(
        `/api/resources/sterilization/autoclaves/${autoclave.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !autoclave.enabled }),
        }
      );
      const data = await res.json();

      if (data.success) {
        toast.success(autoclave.enabled ? 'Autoclave disabled' : 'Autoclave enabled');
        fetchAutoclaves();
      } else {
        toast.error(data.error?.message || 'Failed to update autoclave');
      }
    } catch (error) {
      console.error('Failed to toggle autoclave:', error);
      toast.error('Failed to update autoclave');
    }
  }

  return (
    <>
      <PageHeader
        title="Sterilization Settings"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Sterilization', href: '/resources/sterilization' },
          { label: 'Settings' },
        ]}
        actions={
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4" />
            Add Autoclave
          </Button>
        }
      />

      <PageContent density="comfortable">
        <Card variant="bento">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary-500" />
              <div>
                <CardTitle>Connected Autoclaves</CardTitle>
                <CardDescription>
                  Configure connections to your autoclave equipment for automatic cycle import
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : autoclaves.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <WifiOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No autoclaves configured</p>
                <p className="text-sm">
                  Add an autoclave to start importing sterilization cycles automatically
                </p>
                <Button className="mt-4" onClick={openAddDialog}>
                  <Plus className="h-4 w-4" />
                  Add Autoclave
                </Button>
              </div>
            ) : (
              autoclaves.map((autoclave) => (
                <ListItem
                  key={autoclave.id}
                  variant="bordered"
                  leading={
                    <div
                      className={`p-2 rounded-lg ${
                        autoclave.enabled && autoclave.status === 'CONNECTED'
                          ? 'bg-success-100'
                          : autoclave.status === 'ERROR'
                            ? 'bg-destructive/10'
                            : 'bg-muted'
                      }`}
                    >
                      {autoclave.enabled && autoclave.status === 'CONNECTED' ? (
                        <Wifi className="h-5 w-5 text-success-600" />
                      ) : autoclave.status === 'ERROR' ? (
                        <WifiOff className="h-5 w-5 text-destructive" />
                      ) : (
                        <Server className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  }
                  trailing={
                    <div className="flex items-center gap-2">
                      {getStatusBadge(autoclave.status)}
                      <Switch
                        checked={autoclave.enabled}
                        onCheckedChange={() => handleToggleEnabled(autoclave)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConnection(autoclave)}
                        disabled={testingId === autoclave.id}
                      >
                        {testingId === autoclave.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(autoclave)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteAutoclave(autoclave)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  }
                >
                  <ListItemTitle>{autoclave.name}</ListItemTitle>
                  <ListItemDescription>
                    {autoclave.ipAddress}:{autoclave.port} • {autoclave.equipment.name}
                  </ListItemDescription>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    <span>Last sync: {formatLastSync(autoclave.lastSyncAt)}</span>
                    <span>{autoclave._count.cycles} cycles imported</span>
                    {autoclave.errorMessage && (
                      <span className="text-destructive">{autoclave.errorMessage}</span>
                    )}
                  </div>
                </ListItem>
              ))
            )}
          </CardContent>
        </Card>
      </PageContent>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAutoclave ? 'Edit Autoclave' : 'Add Autoclave'}
            </DialogTitle>
            <DialogDescription>
              Configure the connection to your autoclave equipment
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <FormField label="Name" required>
              <Input
                placeholder="e.g., Autoclave 1"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </FormField>
            <FormField label="IP Address" required>
              <Input
                placeholder="e.g., 192.168.0.82"
                value={formIpAddress}
                onChange={(e) => setFormIpAddress(e.target.value)}
              />
            </FormField>
            <FormField label="Port">
              <Input
                type="number"
                placeholder="80"
                value={formPort}
                onChange={(e) => setFormPort(e.target.value)}
              />
            </FormField>
            <FormField label="Equipment" required>
              <Select value={formEquipmentId} onValueChange={setFormEquipmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.name} ({eq.equipmentNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <div className="flex items-center gap-2">
              <Switch
                id="enabled"
                checked={formEnabled}
                onCheckedChange={setFormEnabled}
              />
              <Label htmlFor="enabled">Enable integration</Label>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & Test Connection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteAutoclave}
        onOpenChange={() => setDeleteAutoclave(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Autoclave</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{deleteAutoclave?.name}"? This will not
              delete any imported cycles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

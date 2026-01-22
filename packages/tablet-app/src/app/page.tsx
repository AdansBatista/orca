'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Settings, RefreshCw, Wifi, WifiOff, Activity, Edit2, Save, X, Printer, Plus, Trash2, Info, AlertCircle } from 'lucide-react';
import { getAutoclaves, updateAutoclave, deleteAutoclave, saveAutoclaves, type Autoclave, type CycleRange } from '@/lib/storage';

export default function HomePage() {
  const router = useRouter();
  const [autoclaves, setAutoclaves] = useState<Autoclave[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIp, setEditIp] = useState('');
  const [editPort, setEditPort] = useState('80');
  const [editRange, setEditRange] = useState<CycleRange>('today');
  const [importingLast, setImportingLast] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<{ open: boolean; type: 'info' | 'error'; title: string; message: string }>({ open: false, type: 'info', title: '', message: '' });

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      loadAutoclaves();
    }
  }, []);

  function loadAutoclaves() {
    console.log('📡 Loading autoclaves from localStorage...');
    try {
      const loadedAutoclaves = getAutoclaves();
      console.log('📊 Loaded:', loadedAutoclaves);
      console.log('✅ Found', loadedAutoclaves.length, 'autoclaves');
      setAutoclaves(loadedAutoclaves);
    } catch (error) {
      console.error('❌ Failed to load autoclaves:', error);
    } finally {
      setLoading(false);
    }
  }

  function startEditing(autoclave: Autoclave) {
    console.log('✏️ Starting edit for:', autoclave.name);
    setEditing(autoclave.id);
    setEditName(autoclave.name);
    setEditIp(autoclave.ipAddress);
    setEditPort(autoclave.port.toString());
    setEditRange(autoclave.cycleRange || 'today');
  }

  function cancelEditing() {
    console.log('❌ Cancelled editing');
    setEditing(null);
    setEditName('');
    setEditIp('');
    setEditPort('80');
    setEditRange('today');
  }

  function addNewAutoclave() {
    console.log('➕ Adding new autoclave');
    const newAutoclave: Autoclave = {
      id: `autoclave-${Date.now()}`,
      name: 'New Autoclave',
      ipAddress: '192.168.0.1',
      port: 80,
      cycleRange: 'today',
      status: 'NOT_CONFIGURED',
    };

    const currentAutoclaves = getAutoclaves();
    saveAutoclaves([...currentAutoclaves, newAutoclave]);
    loadAutoclaves();

    // Immediately start editing the new autoclave
    setEditing(newAutoclave.id);
    setEditName(newAutoclave.name);
    setEditIp(newAutoclave.ipAddress);
    setEditPort(newAutoclave.port.toString());
  }

  function removeAutoclave(autoclaveId: string) {
    const autoclave = autoclaves.find(a => a.id === autoclaveId);
    if (!autoclave) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove "${autoclave.name}"?\n\nThis action cannot be undone.`
    );

    if (confirmed) {
      console.log('🗑️ Removing autoclave:', autoclave.name);
      deleteAutoclave(autoclaveId);
      loadAutoclaves();
      setEditing(null);
      setEditName('');
      setEditIp('');
      setEditPort('80');
    }
  }

  function saveIpAddress(autoclaveId: string) {
    console.log('💾 Saving autoclave settings:', autoclaveId);
    console.log('New Name:', editName, 'IP:', editIp, 'Port:', editPort);

    // Validate name
    if (!editName || editName.trim() === '') {
      alert('Name cannot be empty');
      return;
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(editIp)) {
      alert('Invalid IP address format. Please use format: 192.168.0.23');
      return;
    }

    // Validate port
    const portNum = parseInt(editPort);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      alert('Invalid port number. Must be between 1 and 65535');
      return;
    }

    // Update in localStorage
    updateAutoclave(autoclaveId, {
      name: editName.trim(),
      ipAddress: editIp,
      port: portNum,
      cycleRange: editRange,
      status: 'NOT_CONFIGURED', // Reset status when IP changes
    });

    // Reload and close edit mode
    loadAutoclaves();
    setEditing(null);
    setEditName('');
    setEditIp('');
    setEditPort('80');
    setEditRange('today');

    console.log('✅ Autoclave settings updated successfully');
  }

  async function importLastCycle(autoclaveId: string) {
    console.log('⚡ Import Last Cycle clicked for:', autoclaveId);
    setImportingLast({ ...importingLast, [autoclaveId]: true });

    try {
      const autoclave = autoclaves.find(a => a.id === autoclaveId);
      if (!autoclave) {
        console.error('❌ Autoclave not found:', autoclaveId);
        return;
      }

      console.log(`📥 Fetching last cycle from ${autoclave.name} at ${autoclave.ipAddress}:${autoclave.port}...`);

      // Call the API route to get cycles (limit to 1)
      const response = await fetch('/api/get-cycles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ipAddress: autoclave.ipAddress,
          port: autoclave.port,
          limit: 1, // Only get the last cycle
        }),
      });

      const result = await response.json();

      console.log('📦 API result:', result);

      if (!result.success) {
        console.log('❌ API error:', result.error);
        setNotification({ open: true, type: 'error', title: 'Failed to Fetch Cycles', message: result.error || 'Unknown error occurred while connecting to the autoclave.' });
        return;
      }

      if (result.cycles.length === 0) {
        console.log('ℹ️ No cycles found for today');
        setNotification({ open: true, type: 'info', title: 'No Cycles Found', message: 'No sterilization cycles found today on this autoclave. The machine may not have run any cycles yet today.' });
        return;
      }

      const lastCycle = result.cycles[0];
      const cycleId = `${lastCycle.year}-${lastCycle.month}-${lastCycle.day}-${lastCycle.cycleNumber}`;
      console.log('✅ Last cycle found:', cycleId);
      router.push(`/print?cycles=${encodeURIComponent(cycleId)}`);
    } catch (error) {
      console.error('❌ Failed to import last cycle:', error);
      setNotification({ open: true, type: 'error', title: 'Import Failed', message: error instanceof Error ? error.message : 'An unexpected error occurred while importing the last cycle.' });
    } finally {
      setImportingLast({ ...importingLast, [autoclaveId]: false });
    }
  }

  async function testConnection(autoclaveId: string) {
    console.log('🔌 Testing connection for autoclave:', autoclaveId);
    setTesting({ ...testing, [autoclaveId]: true });

    try {
      const autoclave = autoclaves.find(a => a.id === autoclaveId);
      if (!autoclave) {
        console.error('❌ Autoclave not found:', autoclaveId);
        return;
      }

      console.log(`🔗 Testing ${autoclave.name} at ${autoclave.ipAddress}:${autoclave.port}...`);

      // Call the API route instead of directly calling the service
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ipAddress: autoclave.ipAddress,
          port: autoclave.port,
        }),
      });

      const result = await response.json();

      console.log('🧪 Test result:', result);

      if (result.success) {
        console.log('✅ Connection test successful!');
        updateAutoclave(autoclaveId, {
          status: 'CONNECTED',
          errorMessage: undefined,
        });
      } else {
        console.log('❌ Connection test failed:', result.error);
        console.log('📝 Updating autoclave with ERROR status and message:', result.error);
        updateAutoclave(autoclaveId, {
          status: 'ERROR',
          errorMessage: result.error,
        });
      }

      // Reload from localStorage to show updated status
      console.log('🔄 Reloading autoclaves from localStorage...');
      loadAutoclaves();
    } catch (error) {
      console.error('❌ Failed to test connection:', error);
      updateAutoclave(autoclaveId, {
        status: 'ERROR',
        errorMessage: error instanceof Error ? error.message : 'Failed to fetch',
      });
      loadAutoclaves();
    } finally {
      setTesting({ ...testing, [autoclaveId]: false });
    }
  }

  function getStatusBadge(status: Autoclave['status'], errorMessage?: string) {
    switch (status) {
      case 'CONNECTED':
        return (
          <Badge variant="default" className="bg-green-500">
            <Wifi className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case 'ERROR':
        return (
          <Badge variant="destructive" className="bg-red-600 text-white">
            <WifiOff className="w-3 h-3 mr-1" />
            {errorMessage || 'Connection Error'}
          </Badge>
        );
      case 'NOT_CONFIGURED':
        return <Badge variant="secondary">Not Configured</Badge>;
      case 'PENDING_CONNECTION':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading autoclaves...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 pb-24 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex-1 flex items-center gap-4">
            <img
              src="/icon.ico"
              alt="Orca"
              className="h-12 w-12"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">Autoclave Monitor</h1>
              <p className="text-sm text-muted-foreground">
                Monitor and import sterilization cycles
              </p>
            </div>
          </div>
          {autoclaves.length > 0 && (
            <Button
              variant="outline"
              className="h-12"
              onClick={addNewAutoclave}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Equipment
            </Button>
          )}
        </div>

        {/* Autoclave Grid */}
        {autoclaves.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Autoclaves Configured</h2>
              <p className="text-muted-foreground mb-6">
                Add your first autoclave to get started
              </p>
              <Button
                size="lg"
                className="bg-primary text-white hover:bg-primary/90"
                onClick={() => {
                  console.log('➕ Add Autoclave button clicked!');
                  alert('Add Autoclave clicked - Settings page not yet implemented');
                }}
              >
                <Settings className="w-5 h-5 mr-2" />
                Add Autoclave
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {autoclaves.map((autoclave) => (
              <Card key={autoclave.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {editing === autoclave.id ? (
                        <div className="space-y-2">
                          <Input
                            type="text"
                            placeholder="Autoclave Name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="text-xl font-semibold h-12"
                          />
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder="IP Address"
                              value={editIp}
                              onChange={(e) => setEditIp(e.target.value)}
                              className="flex-1 h-12"
                            />
                            <Input
                              type="number"
                              placeholder="Port"
                              value={editPort}
                              onChange={(e) => setEditPort(e.target.value)}
                              className="w-24 h-12"
                            />
                            <div className="flex h-12 rounded-full border border-input bg-muted/50 p-1">
                              {([
                                { value: 'today', label: 'Today' },
                                { value: 'yesterday', label: 'Yesterday' },
                                { value: 'week', label: 'Week' },
                                { value: 'month', label: 'Month' },
                              ] as const).map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => setEditRange(option.value as CycleRange)}
                                  className={`px-3 text-sm font-medium rounded-full transition-all ${
                                    editRange === option.value
                                      ? 'bg-background text-foreground shadow-sm'
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              variant="default"
                              className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => saveIpAddress(autoclave.id)}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 h-12"
                              onClick={cancelEditing}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => removeAutoclave(autoclave.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-xl">{autoclave.name}</CardTitle>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2"
                              onClick={() => startEditing(autoclave)}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {autoclave.ipAddress}:{autoclave.port}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 self-start">
                      {getStatusBadge(autoclave.status, autoclave.errorMessage)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editing !== autoclave.id && (
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 h-12"
                        onClick={() => testConnection(autoclave.id)}
                        disabled={testing[autoclave.id]}
                      >
                        {testing[autoclave.id] ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Activity className="w-4 h-4 mr-2" />
                            Connect Equipment
                          </>
                        )}
                      </Button>

                      <Button
                        variant="default"
                        className="flex-1 h-12 bg-primary text-white hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
                        disabled={autoclave.status !== 'CONNECTED'}
                        onClick={() => {
                          console.log('📥 Import Cycles clicked for:', autoclave.name);
                          router.push(`/import/${autoclave.id}`);
                        }}
                      >
                        Import Cycles
                      </Button>

                      <Button
                        variant="outline"
                        className="flex-1 h-12 bg-accent text-white hover:bg-accent/90 disabled:bg-muted disabled:text-muted-foreground"
                        disabled={autoclave.status !== 'CONNECTED' || importingLast[autoclave.id]}
                        onClick={() => importLastCycle(autoclave.id)}
                      >
                        {importingLast[autoclave.id] ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Printer className="w-4 h-4 mr-2" />
                            Import and Print Last Cycle
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Notification Modal */}
      <Dialog open={notification.open} onOpenChange={(open) => setNotification(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {notification.type === 'error' ? (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
              ) : (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Info className="w-5 h-5 text-primary" />
                </div>
              )}
              <DialogTitle>{notification.title}</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              {notification.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotification(prev => ({ ...prev, open: false }))}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

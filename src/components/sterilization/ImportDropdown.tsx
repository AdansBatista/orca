'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Download, RefreshCw, Server, ChevronDown, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface AutoclaveOption {
  id: string;
  name: string;
  status: string;
  enabled: boolean;
}

export function ImportDropdown() {
  const router = useRouter();
  const [autoclaves, setAutoclaves] = useState<AutoclaveOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAutoclaves();
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
    }
  }

  async function handleSync(autoclave: AutoclaveOption) {
    if (!autoclave.enabled) {
      toast.error('Autoclave is disabled', {
        description: 'Enable the autoclave in settings to sync cycles',
      });
      return;
    }

    if (autoclave.status !== 'CONNECTED') {
      toast.error('Autoclave not connected', {
        description: 'Test the connection in settings first',
      });
      return;
    }

    setSyncingId(autoclave.id);
    try {
      const res = await fetch(
        `/api/resources/sterilization/autoclaves/${autoclave.id}/sync`,
        { method: 'POST' }
      );
      const data = await res.json();

      if (data.success) {
        const { imported, skipped, date } = data.data;
        if (imported > 0) {
          toast.success(`Imported ${imported} new cycle${imported > 1 ? 's' : ''}`, {
            description: `From ${autoclave.name} for ${date}${skipped > 0 ? `. ${skipped} already imported.` : ''}`,
          });
          // Refresh the page to show new cycles
          router.refresh();
        } else if (skipped > 0) {
          toast.info('No new cycles', {
            description: `All ${skipped} cycle${skipped > 1 ? 's' : ''} for today were already imported`,
          });
        } else {
          toast.info('No cycles found', {
            description: `No cycles found for ${date} on ${autoclave.name}`,
          });
        }
      } else {
        toast.error(data.error?.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync cycles');
    } finally {
      setSyncingId(null);
    }
  }

  const enabledAutoclaves = autoclaves.filter((a) => a.enabled);
  const hasConnectedAutoclaves = enabledAutoclaves.some((a) => a.status === 'CONNECTED');

  if (autoclaves.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading}>
          <Download className="h-4 w-4" />
          Import
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Sync Today&apos;s Cycles</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {autoclaves.length === 0 ? (
          <DropdownMenuItem disabled>
            <WifiOff className="h-4 w-4 mr-2 opacity-50" />
            No autoclaves configured
          </DropdownMenuItem>
        ) : (
          autoclaves.map((autoclave) => (
            <DropdownMenuItem
              key={autoclave.id}
              onClick={() => handleSync(autoclave)}
              disabled={syncingId === autoclave.id || !autoclave.enabled || autoclave.status !== 'CONNECTED'}
            >
              {syncingId === autoclave.id ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Server className="h-4 w-4 mr-2" />
              )}
              <span className="flex-1">{autoclave.name}</span>
              {!autoclave.enabled && (
                <span className="text-xs text-muted-foreground">Disabled</span>
              )}
              {autoclave.enabled && autoclave.status !== 'CONNECTED' && (
                <span className="text-xs text-warning-600">Offline</span>
              )}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/resources/sterilization/import')}
        >
          <Download className="h-4 w-4 mr-2" />
          Advanced Import...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

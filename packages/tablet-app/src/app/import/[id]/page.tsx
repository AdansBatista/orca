'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Printer, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { getAutoclaveById } from '@/lib/storage';
import type { Autoclave } from '@/lib/storage';

interface Cycle {
  year: string;
  month: string;
  day: string;
  cycleNumber: string;
  date: Date;
  succeeded?: boolean;
  status?: string;
}

export default function ImportPage() {
  const router = useRouter();
  const params = useParams();
  const autoclaveId = params.id as string;

  const [autoclave, setAutoclave] = useState<Autoclave | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCycles, setSelectedCycles] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAutoclave();
    loadCycles();
  }, [autoclaveId]);

  function loadAutoclave() {
    const ac = getAutoclaveById(autoclaveId);
    if (ac) {
      setAutoclave(ac);
    } else {
      setError('Autoclave not found');
    }
  }

  async function loadCycles() {
    if (!autoclaveId) return;

    console.log('📥 Loading cycles for autoclave:', autoclaveId);
    setLoading(true);
    setError(null);

    try {
      const ac = getAutoclaveById(autoclaveId);
      if (!ac) {
        throw new Error('Autoclave not found');
      }

      // Call API to get cycles for the configured date range
      const response = await fetch('/api/get-cycles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ipAddress: ac.ipAddress,
          port: ac.port,
          range: ac.cycleRange || 'today',
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch cycles');
      }

      console.log('✅ Loaded cycles:', result.cycles.length);

      // Cycles are already sorted most recent first by the API
      setCycles(result.cycles);
    } catch (err) {
      console.error('❌ Failed to load cycles:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function toggleCycleSelection(cycleId: string) {
    const newSelected = new Set(selectedCycles);
    if (newSelected.has(cycleId)) {
      newSelected.delete(cycleId);
    } else {
      newSelected.add(cycleId);
    }
    setSelectedCycles(newSelected);
  }

  function selectAll() {
    const allIds = cycles.map(c => `${c.year}-${c.month}-${c.day}-${c.cycleNumber}`);
    setSelectedCycles(new Set(allIds));
  }

  function clearSelection() {
    setSelectedCycles(new Set());
  }

  function printLabels() {
    console.log('🖨️ Printing labels for:', selectedCycles.size, 'cycles');

    if (selectedCycles.size === 0) {
      alert('Please select at least one cycle to print');
      return;
    }

    // Navigate to print page with selected cycle IDs
    const cycleIds = Array.from(selectedCycles).join(',');
    router.push(`/print?cycles=${encodeURIComponent(cycleIds)}`);
  }

  if (!autoclave) {
    return (
      <main className="min-h-screen p-8 pb-24 bg-background">
        <div className="max-w-6xl mx-auto">
          <p>Autoclave not found</p>
          <Button onClick={() => router.push('/')}>Go Back</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 pb-24 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Import Cycles</h1>
            <p className="text-muted-foreground">
              {autoclave.name} - {autoclave.ipAddress}:{autoclave.port}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <Card className="p-12">
            <div className="text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p className="text-muted-foreground">Loading cycles from autoclave...</p>
            </div>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="p-12">
            <div className="text-center">
              <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold mb-2">Failed to Load Cycles</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={loadCycles}>Try Again</Button>
            </div>
          </Card>
        )}

        {/* Cycles List */}
        {!loading && !error && cycles.length > 0 && (
          <>
            {/* Selection Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All ({cycles.length})
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  {selectedCycles.size} selected
                </p>
                <Button
                  className="bg-primary text-white hover:bg-primary/90"
                  disabled={selectedCycles.size === 0}
                  onClick={printLabels}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Labels ({selectedCycles.size})
                </Button>
              </div>
            </div>

            {/* Cycles Table */}
            <Card>
              <CardHeader>
                <CardTitle>Available Cycles ({cycles.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {cycles.map((cycle) => {
                    const cycleId = `${cycle.year}-${cycle.month}-${cycle.day}-${cycle.cycleNumber}`;
                    const isSelected = selectedCycles.has(cycleId);
                    const cycleDate = new Date(cycle.date);

                    return (
                      <div
                        key={cycleId}
                        className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary/10 border-primary'
                            : 'bg-muted/30 border-border hover:bg-muted/50'
                        }`}
                        onClick={() => toggleCycleSelection(cycleId)}
                      >
                        <div className="flex-shrink-0">
                          <div
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                              isSelected
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground'
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <p className="font-medium">
                              Cycle #{cycle.cycleNumber}
                            </p>
                            <Badge variant="outline">
                              {cycleDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </Badge>
                            {cycle.status && (
                              <Badge
                                variant={
                                  cycle.succeeded === false
                                    ? 'destructive'
                                    : 'default'
                                }
                              >
                                {cycle.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {cycleDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at {cycleDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {!loading && !error && cycles.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Cycles Found</h2>
              <p className="text-muted-foreground">
                No sterilization cycles found on this autoclave
              </p>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}

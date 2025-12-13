'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Printer,
  ChevronRight,
  Server,
  AlertCircle,
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ListItem,
  ListItemTitle,
  ListItemDescription,
} from '@/components/ui/list-item';
import { PageHeader, PageContent } from '@/components/layout';
import { toast } from 'sonner';

interface AutoclaveIntegration {
  id: string;
  name: string;
  ipAddress: string;
  status: string;
  lastCycleNum: number | null;
}

interface CycleToImport {
  year: string;
  month: string;
  day: string;
  cycleNumber: string;
  date: string;
  alreadyImported: boolean;
}

interface ImportedCycle {
  id: string;
  cycleNumber: string;
  externalCycleNumber: number;
  startTime: string;
  status: string;
}

export default function ImportCyclesPage() {
  const router = useRouter();
  const [autoclaves, setAutoclaves] = useState<AutoclaveIntegration[]>([]);
  const [selectedAutoclave, setSelectedAutoclave] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [importing, setImporting] = useState(false);

  // Cycle data
  const [cycles, setCycles] = useState<CycleToImport[]>([]);
  const [selectedCycles, setSelectedCycles] = useState<Set<string>>(new Set());
  const [importResult, setImportResult] = useState<{
    imported: number;
    cycles: ImportedCycle[];
  } | null>(null);

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  // Fetch autoclaves
  useEffect(() => {
    fetchAutoclaves();
  }, []);

  // Fetch year/month index when autoclave changes
  useEffect(() => {
    if (selectedAutoclave) {
      fetchCycleIndex();
    }
  }, [selectedAutoclave]);

  // Fetch cycles when year/month changes
  useEffect(() => {
    if (selectedAutoclave && selectedYear && selectedMonth) {
      fetchCycles();
    }
  }, [selectedAutoclave, selectedYear, selectedMonth]);

  async function fetchAutoclaves() {
    try {
      const res = await fetch('/api/resources/sterilization/autoclaves?enabled=true');
      const data = await res.json();
      if (data.success) {
        setAutoclaves(data.data);
        // Auto-select if only one autoclave
        if (data.data.length === 1) {
          setSelectedAutoclave(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch autoclaves:', error);
      toast.error('Failed to load autoclaves');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCycleIndex() {
    setLoadingCycles(true);
    setCycles([]);
    setSelectedYear('');
    setSelectedMonth('');
    setAvailableYears([]);
    setAvailableMonths([]);

    try {
      const res = await fetch(
        `/api/resources/sterilization/autoclaves/${selectedAutoclave}/cycles`
      );
      const data = await res.json();

      if (data.success && data.data.index) {
        const years = data.data.index.map((y: { year: string }) => y.year);
        setAvailableYears(years);

        // Default to most recent year
        if (years.length > 0) {
          const latestYear = years[years.length - 1];
          setSelectedYear(latestYear);

          // Get months for that year
          const yearData = data.data.index.find(
            (y: { year: string }) => y.year === latestYear
          );
          if (yearData?.months) {
            const months = yearData.months.map((m: { month: string }) => m.month);
            setAvailableMonths(months);

            // Default to most recent month
            if (months.length > 0) {
              setSelectedMonth(months[months.length - 1]);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch cycle index:', error);
      toast.error('Failed to connect to autoclave');
    } finally {
      setLoadingCycles(false);
    }
  }

  async function fetchCycles() {
    setLoadingCycles(true);
    setCycles([]);
    setSelectedCycles(new Set());

    try {
      const res = await fetch(
        `/api/resources/sterilization/autoclaves/${selectedAutoclave}/cycles?year=${selectedYear}&month=${selectedMonth}`
      );
      const data = await res.json();

      if (data.success && data.data.cycles) {
        setCycles(data.data.cycles);

        // Auto-select new cycles
        const newCycles = data.data.cycles.filter(
          (c: CycleToImport) => !c.alreadyImported
        );
        setSelectedCycles(
          new Set(newCycles.map((c: CycleToImport) => c.cycleNumber))
        );
      }
    } catch (error) {
      console.error('Failed to fetch cycles:', error);
      toast.error('Failed to fetch cycles from autoclave');
    } finally {
      setLoadingCycles(false);
    }
  }

  function handleYearChange(year: string) {
    setSelectedYear(year);
    setSelectedMonth('');
    setCycles([]);

    // Update available months for this year
    const autoclave = autoclaves.find((a) => a.id === selectedAutoclave);
    if (autoclave) {
      // Re-fetch to get months
      fetch(`/api/resources/sterilization/autoclaves/${selectedAutoclave}/cycles`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data.index) {
            const yearData = data.data.index.find(
              (y: { year: string }) => y.year === year
            );
            if (yearData?.months) {
              const months = yearData.months.map((m: { month: string }) => m.month);
              setAvailableMonths(months);
              if (months.length > 0) {
                setSelectedMonth(months[months.length - 1]);
              }
            }
          }
        });
    }
  }

  function toggleCycleSelection(cycleNumber: string) {
    const newSelected = new Set(selectedCycles);
    if (newSelected.has(cycleNumber)) {
      newSelected.delete(cycleNumber);
    } else {
      newSelected.add(cycleNumber);
    }
    setSelectedCycles(newSelected);
  }

  function selectAllNew() {
    const newCycles = cycles.filter((c) => !c.alreadyImported);
    setSelectedCycles(new Set(newCycles.map((c) => c.cycleNumber)));
  }

  function selectNone() {
    setSelectedCycles(new Set());
  }

  async function handleImport() {
    if (selectedCycles.size === 0) {
      toast.error('Please select at least one cycle to import');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const cyclesToImport = cycles
        .filter((c) => selectedCycles.has(c.cycleNumber))
        .map((c) => ({
          year: c.year,
          month: c.month,
          day: c.day,
          cycleNumber: c.cycleNumber,
        }));

      const res = await fetch(
        `/api/resources/sterilization/autoclaves/${selectedAutoclave}/import`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cycles: cyclesToImport }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setImportResult({
          imported: data.data.imported,
          cycles: data.data.cycles,
        });

        if (data.data.imported > 0) {
          toast.success(`Imported ${data.data.imported} cycle(s)`);
        } else {
          toast.info(data.data.message || 'No new cycles to import');
        }

        // Refresh the cycle list
        fetchCycles();
      } else {
        toast.error(data.error?.message || 'Import failed');
      }
    } catch (error) {
      console.error('Failed to import cycles:', error);
      toast.error('Failed to import cycles');
    } finally {
      setImporting(false);
    }
  }

  const newCyclesCount = cycles.filter((c) => !c.alreadyImported).length;
  const selectedNewCount = [...selectedCycles].filter((cn) => {
    const cycle = cycles.find((c) => c.cycleNumber === cn);
    return cycle && !cycle.alreadyImported;
  }).length;

  return (
    <>
      <PageHeader
        title="Import Cycles"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Sterilization', href: '/resources/sterilization' },
          { label: 'Import' },
        ]}
      />

      <PageContent density="comfortable">
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Autoclave Selection */}
          <Card variant="bento">
            <CardHeader>
              <CardTitle>Select Autoclave</CardTitle>
              <CardDescription>
                Choose the autoclave to import cycles from
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-full" />
              ) : autoclaves.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No autoclaves configured</AlertTitle>
                  <AlertDescription>
                    Go to{' '}
                    <a
                      href="/resources/sterilization/settings"
                      className="underline"
                    >
                      Sterilization Settings
                    </a>{' '}
                    to add an autoclave first.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select
                  value={selectedAutoclave}
                  onValueChange={setSelectedAutoclave}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an autoclave" />
                  </SelectTrigger>
                  <SelectContent>
                    {autoclaves.map((autoclave) => (
                      <SelectItem key={autoclave.id} value={autoclave.id}>
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          {autoclave.name} ({autoclave.ipAddress})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Date Filters */}
          {selectedAutoclave && (
            <Card variant="bento">
              <CardHeader>
                <CardTitle>Select Date Range</CardTitle>
                <CardDescription>
                  Choose the year and month to view available cycles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Select
                      value={selectedYear}
                      onValueChange={handleYearChange}
                      disabled={loadingCycles || availableYears.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Select
                      value={selectedMonth}
                      onValueChange={setSelectedMonth}
                      disabled={loadingCycles || availableMonths.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMonths.map((month) => (
                          <SelectItem key={month} value={month}>
                            {new Date(2000, parseInt(month) - 1).toLocaleString(
                              'default',
                              { month: 'long' }
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    onClick={fetchCycles}
                    disabled={loadingCycles || !selectedYear || !selectedMonth}
                  >
                    {loadingCycles ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cycles List */}
          {selectedAutoclave && selectedYear && selectedMonth && (
            <Card variant="bento">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Available Cycles</CardTitle>
                    <CardDescription>
                      {cycles.length} cycles found • {newCyclesCount} new
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllNew}>
                      Select All New
                    </Button>
                    <Button variant="outline" size="sm" onClick={selectNone}>
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCycles ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : cycles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No cycles found for this month</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cycles.map((cycle) => (
                      <ListItem
                        key={cycle.cycleNumber}
                        variant="bordered"
                        className={
                          cycle.alreadyImported ? 'opacity-60' : undefined
                        }
                        leading={
                          <Checkbox
                            checked={selectedCycles.has(cycle.cycleNumber)}
                            onCheckedChange={() =>
                              toggleCycleSelection(cycle.cycleNumber)
                            }
                            disabled={cycle.alreadyImported}
                          />
                        }
                        trailing={
                          cycle.alreadyImported ? (
                            <Badge variant="soft-primary" size="sm">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Imported
                            </Badge>
                          ) : (
                            <Badge variant="success" size="sm">
                              New
                            </Badge>
                          )
                        }
                      >
                        <ListItemTitle>Cycle #{cycle.cycleNumber}</ListItemTitle>
                        <ListItemDescription>
                          {new Date(cycle.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </ListItemDescription>
                      </ListItem>
                    ))}
                  </div>
                )}

                {/* Import Button */}
                {cycles.length > 0 && newCyclesCount > 0 && (
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={handleImport}
                      disabled={importing || selectedNewCount === 0}
                    >
                      {importing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Import {selectedNewCount} Cycle
                          {selectedNewCount !== 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Import Results */}
          {importResult && importResult.imported > 0 && (
            <Card variant="bento" className="border-success-200 bg-success-50">
              <CardHeader>
                <CardTitle className="text-success-700">
                  <CheckCircle2 className="h-5 w-5 inline mr-2" />
                  Import Complete
                </CardTitle>
                <CardDescription>
                  Successfully imported {importResult.imported} cycle(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {importResult.cycles.map((cycle) => (
                    <ListItem
                      key={cycle.id}
                      variant="bordered"
                      className="bg-white"
                      trailing={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/resources/sterilization/${cycle.id}/print`
                            )
                          }
                        >
                          <Printer className="h-4 w-4" />
                          Print Labels
                        </Button>
                      }
                    >
                      <ListItemTitle>{cycle.cycleNumber}</ListItemTitle>
                      <ListItemDescription>
                        Autoclave Cycle #{cycle.externalCycleNumber} •{' '}
                        {new Date(cycle.startTime).toLocaleString()}
                      </ListItemDescription>
                    </ListItem>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </PageContent>
    </>
  );
}

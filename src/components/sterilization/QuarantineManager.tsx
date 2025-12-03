'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  Search,
  Unlock,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';

interface QuarantinedPackage {
  id: string;
  packageNumber: string;
  packageType: string;
  instrumentNames: string[];
  itemCount: number;
  sterilizedDate: string;
  expirationDate: string;
  quarantinedAt: string;
  cycle: {
    id: string;
    cycleNumber: string;
    cycleType: string;
    biologicalIndicator?: {
      id: string;
      lotNumber: string;
      testDate: string;
      status: string;
      result: string | null;
    };
  };
}

interface BiologicalTest {
  id: string;
  lotNumber: string;
  testDate: string;
  status: string;
  result: string | null;
  cycleId: string;
  quarantinedPackagesCount: number;
}

function QuarantineSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24" />
      <Skeleton className="h-64" />
    </div>
  );
}

export function QuarantineManager() {
  const [packages, setPackages] = useState<QuarantinedPackage[]>([]);
  const [pendingTests, setPendingTests] = useState<BiologicalTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Release dialog
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [releasing, setReleasing] = useState(false);

  // Record result dialog
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<BiologicalTest | null>(null);
  const [testResult, setTestResult] = useState<'NEGATIVE' | 'POSITIVE'>('NEGATIVE');
  const [resultNotes, setResultNotes] = useState('');
  const [recordingResult, setRecordingResult] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [packagesRes, testsRes] = await Promise.all([
        fetch('/api/resources/sterilization/packages?status=QUARANTINED'),
        fetch('/api/resources/sterilization/biological-indicators?status=PENDING,INCUBATING'),
      ]);

      const [packagesData, testsData] = await Promise.all([
        packagesRes.json(),
        testsRes.json(),
      ]);

      if (packagesData.success) {
        setPackages(packagesData.data.items || []);
      }
      if (testsData.success) {
        setPendingTests(testsData.data.items || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPackages = packages.filter(
    (pkg) =>
      pkg.packageNumber.toLowerCase().includes(search.toLowerCase()) ||
      pkg.instrumentNames.some((name) =>
        name.toLowerCase().includes(search.toLowerCase())
      )
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPackages(filteredPackages.map((p) => p.id));
    } else {
      setSelectedPackages([]);
    }
  };

  const handleSelectPackage = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedPackages([...selectedPackages, id]);
    } else {
      setSelectedPackages(selectedPackages.filter((p) => p !== id));
    }
  };

  const handleReleasePackages = async () => {
    if (selectedPackages.length === 0) return;

    setReleasing(true);
    try {
      const response = await fetch('/api/resources/sterilization/quarantine/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageIds: selectedPackages,
          notes: releaseNotes,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to release packages');
      }

      setReleaseDialogOpen(false);
      setSelectedPackages([]);
      setReleaseNotes('');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to release packages');
    } finally {
      setReleasing(false);
    }
  };

  const handleRecordResult = async () => {
    if (!selectedTest) return;

    setRecordingResult(true);
    try {
      const response = await fetch(
        `/api/resources/sterilization/biological-indicators/${selectedTest.id}/result`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            result: testResult,
            notes: resultNotes,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to record result');
      }

      setResultDialogOpen(false);
      setSelectedTest(null);
      setTestResult('NEGATIVE');
      setResultNotes('');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record result');
    } finally {
      setRecordingResult(false);
    }
  };

  if (loading) return <QuarantineSkeleton />;

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Pending Biological Tests */}
      {pendingTests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle size="sm" className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning-500" />
              Pending Biological Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingTests.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning-100 dark:bg-warning-900/50">
                      <Clock className="h-5 w-5 text-warning-600" />
                    </div>
                    <div>
                      <p className="font-medium">Lot #{test.lotNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Test Date: {format(new Date(test.testDate), 'MMM d, yyyy')} •{' '}
                        {test.quarantinedPackagesCount} packages in quarantine
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">{test.status}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTest(test);
                        setResultDialogOpen(true);
                      }}
                    >
                      Record Result
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quarantined Packages */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle size="sm" className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Quarantined Packages
              <Badge variant="warning">{packages.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {selectedPackages.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => setReleaseDialogOpen(true)}
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Release Selected ({selectedPackages.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <div className="text-center py-12">
              <ShieldCheck className="h-12 w-12 mx-auto text-success-500 mb-3" />
              <p className="font-medium">No Packages in Quarantine</p>
              <p className="text-sm text-muted-foreground mt-1">
                All sterilization packages are cleared for use
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search packages..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedPackages.length === filteredPackages.length &&
                          filteredPackages.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Instruments</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Quarantined</TableHead>
                    <TableHead>BI Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPackages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPackages.includes(pkg.id)}
                          onCheckedChange={(checked) =>
                            handleSelectPackage(pkg.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{pkg.packageNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {pkg.packageType.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {pkg.instrumentNames.slice(0, 2).join(', ')}
                          {pkg.instrumentNames.length > 2 && (
                            <span className="text-muted-foreground">
                              {' '}
                              +{pkg.instrumentNames.length - 2} more
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pkg.itemCount} items
                        </p>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/resources/sterilization/${pkg.cycle.id}`}
                          className="text-primary-600 hover:underline text-sm"
                        >
                          {pkg.cycle.cycleNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {format(new Date(pkg.quarantinedAt), 'MMM d, h:mm a')}
                        </p>
                      </TableCell>
                      <TableCell>
                        {pkg.cycle.biologicalIndicator ? (
                          <Badge
                            variant={
                              pkg.cycle.biologicalIndicator.status === 'COMPLETED'
                                ? pkg.cycle.biologicalIndicator.result === 'NEGATIVE'
                                  ? 'success'
                                  : 'error'
                                : 'warning'
                            }
                          >
                            {pkg.cycle.biologicalIndicator.status === 'COMPLETED'
                              ? pkg.cycle.biologicalIndicator.result
                              : pkg.cycle.biologicalIndicator.status}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">N/A</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/resources/sterilization/packages/${pkg.id}`}>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* Release Dialog */}
      <Dialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release Packages from Quarantine</DialogTitle>
            <DialogDescription>
              You are about to release {selectedPackages.length} package(s) from
              quarantine. This should only be done after confirming a negative
              biological indicator test result.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription>
                Releasing packages confirms they are safe for patient use.
              </AlertDescription>
            </Alert>

            <FormField label="Release Notes (optional)">
              <Textarea
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                placeholder="Add any notes about this release..."
                rows={3}
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReleaseDialogOpen(false)}
              disabled={releasing}
            >
              Cancel
            </Button>
            <Button onClick={handleReleasePackages} disabled={releasing}>
              {releasing ? 'Releasing...' : 'Release Packages'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Result Dialog */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Biological Indicator Result</DialogTitle>
            <DialogDescription>
              {selectedTest && (
                <>
                  Recording result for Lot #{selectedTest.lotNumber}. This will
                  affect {selectedTest.quarantinedPackagesCount} quarantined
                  package(s).
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <FormField label="Test Result" required>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={testResult === 'NEGATIVE' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setTestResult('NEGATIVE')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Negative (Pass)
                </Button>
                <Button
                  type="button"
                  variant={testResult === 'POSITIVE' ? 'destructive' : 'outline'}
                  className="flex-1"
                  onClick={() => setTestResult('POSITIVE')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Positive (Fail)
                </Button>
              </div>
            </FormField>

            {testResult === 'POSITIVE' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  A positive result indicates sterilization failure. All
                  quarantined packages from this cycle will need to be
                  reprocessed.
                </AlertDescription>
              </Alert>
            )}

            <FormField label="Notes">
              <Textarea
                value={resultNotes}
                onChange={(e) => setResultNotes(e.target.value)}
                placeholder="Add any notes about this test result..."
                rows={3}
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResultDialogOpen(false)}
              disabled={recordingResult}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecordResult}
              disabled={recordingResult}
              variant={testResult === 'POSITIVE' ? 'destructive' : 'default'}
            >
              {recordingResult ? 'Recording...' : 'Record Result'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

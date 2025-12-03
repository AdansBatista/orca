'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Package,
  CheckCircle,
  AlertTriangle,
  Search,
  QrCode,
  User,
  Clock,
  ArrowRight,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField } from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PackageData {
  id: string;
  packageNumber: string;
  packageType: string;
  status: string;
  instrumentNames: string[];
  itemCount: number;
  sterilizedDate: string;
  expirationDate: string;
  cassetteName?: string;
}

interface PatientOption {
  id: string;
  name: string;
  patientNumber: string;
}

interface CheckoutFormProps {
  packageId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PackageCheckout({ packageId, onSuccess, onCancel }: CheckoutFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<'scan' | 'confirm' | 'complete'>(packageId ? 'confirm' : 'scan');

  // Scan step
  const [scanInput, setScanInput] = useState('');
  const [searching, setSearching] = useState(false);

  // Package data
  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const [loadingPackage, setLoadingPackage] = useState(!!packageId);

  // Checkout form
  const [patientId, setPatientId] = useState('');
  const [procedureType, setProcedureType] = useState('');
  const [notes, setNotes] = useState('');
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load package if ID provided
  useEffect(() => {
    if (packageId) {
      loadPackage(packageId);
    }
  }, [packageId]);

  // Load patients for selection
  useEffect(() => {
    const fetchPatients = async () => {
      setLoadingPatients(true);
      try {
        const response = await fetch('/api/patients?status=ACTIVE&pageSize=50');
        const result = await response.json();
        if (result.success) {
          setPatients(
            (result.data.items || []).map((p: { id: string; firstName: string; lastName: string; patientNumber: string }) => ({
              id: p.id,
              name: `${p.firstName} ${p.lastName}`,
              patientNumber: p.patientNumber,
            }))
          );
        }
      } catch {
        // Silent fail
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchPatients();
  }, []);

  const loadPackage = async (id: string) => {
    setLoadingPackage(true);
    setError(null);
    try {
      const response = await fetch(`/api/resources/sterilization/packages/${id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Package not found');
      }

      setPackageData(result.data);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load package');
    } finally {
      setLoadingPackage(false);
    }
  };

  const handleScan = async () => {
    if (!scanInput.trim()) return;

    setSearching(true);
    setError(null);

    try {
      // Try to look up by package number or scan QR code
      const response = await fetch(
        `/api/resources/sterilization/packages/lookup?q=${encodeURIComponent(scanInput.trim())}`
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Package not found');
      }

      setPackageData(result.data);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Package not found');
    } finally {
      setSearching(false);
    }
  };

  const handleCheckout = async () => {
    if (!packageData) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/resources/sterilization/packages/${packageData.id}/checkout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: patientId || null,
            procedureType: procedureType || null,
            notes: notes || null,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to check out package');
      }

      setStep('complete');

      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check out package');
    } finally {
      setSubmitting(false);
    }
  };

  const isPackageValid = () => {
    if (!packageData) return false;
    if (packageData.status !== 'STERILE') return false;
    if (new Date(packageData.expirationDate) < new Date()) return false;
    return true;
  };

  // Scan Step
  if (step === 'scan') {
    return (
      <Card>
        <CardHeader>
          <CardTitle size="sm" className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scan or Enter Package Number
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Scan QR code or enter package number..."
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                className="pl-10"
                autoFocus
              />
            </div>
            <Button onClick={handleScan} disabled={searching || !scanInput.trim()}>
              {searching ? 'Searching...' : 'Find Package'}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Scan the QR code on the sterilization package or manually enter the package number
          </p>

          {onCancel && (
            <div className="pt-4 border-t">
              <Button variant="outline" onClick={onCancel} className="w-full">
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Complete Step
  if (step === 'complete') {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-success-100 dark:bg-success-900/30 mb-4">
            <CheckCircle className="h-8 w-8 text-success-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Package Checked Out</h3>
          <p className="text-muted-foreground">
            {packageData?.packageNumber} is now marked as in use
          </p>
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setPackageData(null);
                setScanInput('');
                setPatientId('');
                setProcedureType('');
                setNotes('');
                setStep('scan');
              }}
            >
              Check Out Another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Confirm Step
  return (
    <Card>
      <CardHeader>
        <CardTitle size="sm" className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Confirm Package Checkout
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loadingPackage ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading package...
          </div>
        ) : packageData ? (
          <>
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Package Info */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{packageData.packageNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {packageData.packageType.replace(/_/g, ' ')}
                    {packageData.cassetteName && ` • ${packageData.cassetteName}`}
                  </p>
                </div>
                <Badge
                  variant={
                    packageData.status === 'STERILE' ? 'success' :
                    packageData.status === 'EXPIRED' ? 'error' :
                    packageData.status === 'QUARANTINED' ? 'warning' : 'secondary'
                  }
                >
                  {packageData.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Instruments</p>
                  <p className="font-medium">
                    {packageData.instrumentNames.slice(0, 3).join(', ')}
                    {packageData.instrumentNames.length > 3 && ` +${packageData.instrumentNames.length - 3}`}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Items</p>
                  <p className="font-medium">{packageData.itemCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sterilized</p>
                  <p className="font-medium">
                    {format(new Date(packageData.sterilizedDate), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expires</p>
                  <p className={`font-medium ${
                    new Date(packageData.expirationDate) < new Date() ? 'text-error-600' : ''
                  }`}>
                    {format(new Date(packageData.expirationDate), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>

            {/* Validation Warnings */}
            {!isPackageValid() && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {packageData.status !== 'STERILE' && 'This package is not sterile. '}
                  {new Date(packageData.expirationDate) < new Date() && 'This package has expired. '}
                  It cannot be used for patient care.
                </AlertDescription>
              </Alert>
            )}

            {/* Checkout Form */}
            {isPackageValid() && (
              <div className="space-y-4">
                <FormField label="Patient (optional)">
                  <Select
                    value={patientId}
                    onValueChange={setPatientId}
                    disabled={loadingPatients}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingPatients ? 'Loading...' : 'Select patient...'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No patient selected</SelectItem>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name} ({patient.patientNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Procedure Type (optional)">
                  <Select value={procedureType} onValueChange={setProcedureType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select procedure..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Not specified</SelectItem>
                      <SelectItem value="BONDING">Bonding</SelectItem>
                      <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                      <SelectItem value="DEBONDING">Debonding</SelectItem>
                      <SelectItem value="EMERGENCY">Emergency</SelectItem>
                      <SelectItem value="EXAM">Exam</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Notes (optional)">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    rows={2}
                  />
                </FormField>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  if (onCancel) {
                    onCancel();
                  } else {
                    setPackageData(null);
                    setScanInput('');
                    setStep('scan');
                  }
                }}
                disabled={submitting}
              >
                {packageId ? 'Cancel' : 'Back'}
              </Button>
              <Button
                onClick={handleCheckout}
                disabled={submitting || !isPackageValid()}
              >
                {submitting ? 'Checking Out...' : 'Confirm Checkout'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Package not found
          </div>
        )}
      </CardContent>
    </Card>
  );
}

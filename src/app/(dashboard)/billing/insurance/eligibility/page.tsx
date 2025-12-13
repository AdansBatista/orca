'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  Search,
  ArrowLeft,
  User,
  Building2,
  Shield,
  AlertCircle,
  XCircle,
  Clock,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

interface PatientInsurance {
  id: string;
  subscriberId: string;
  groupNumber: string | null;
  priority: string;
  company: {
    id: string;
    name: string;
    payerId: string | null;
  };
}

interface EligibilityResult {
  patientInsuranceId: string;
  status: string;
  isEligible: boolean;
  coverageStatus: string;
  effectiveDate: string | null;
  terminationDate: string | null;
  planName: string | null;
  coverageDetails: {
    orthodonticCoverage: boolean;
    lifetimeMaximum: number | null;
    usedAmount: number | null;
    remainingAmount: number | null;
    coinsurancePercent: number | null;
    waitingPeriodMet: boolean;
  } | null;
  rawResponse: Record<string, unknown> | null;
}

export default function EligibilityVerificationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [insurances, setInsurances] = useState<PatientInsurance[]>([]);
  const [selectedInsurance, setSelectedInsurance] = useState<PatientInsurance | null>(null);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);

  async function searchPatients(query: string) {
    if (!query.trim()) {
      setPatients([]);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/patients?search=${encodeURIComponent(query)}&pageSize=10`);
      const data = await res.json();
      if (data.success) {
        setPatients(data.data.items);
      }
    } catch (error) {
      console.error('Failed to search patients:', error);
    } finally {
      setLoading(false);
    }
  }

  async function selectPatient(patient: Patient) {
    setSelectedPatient(patient);
    setSelectedInsurance(null);
    setEligibilityResult(null);
    setSearchQuery('');
    setPatients([]);

    try {
      const res = await fetch(`/api/patients/${patient.id}/insurance`);
      const data = await res.json();
      if (data.success) {
        setInsurances(data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch patient insurance:', error);
    }
  }

  async function checkEligibility() {
    if (!selectedInsurance) return;

    try {
      setChecking(true);
      const res = await fetch('/api/insurance/eligibility/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientInsuranceId: selectedInsurance.id }),
      });
      const data = await res.json();

      if (data.success) {
        setEligibilityResult(data.data);
        setShowResultDialog(true);
      } else {
        alert(data.error?.message || 'Failed to check eligibility');
      }
    } catch (error) {
      console.error('Failed to check eligibility:', error);
      alert('Failed to check eligibility');
    } finally {
      setChecking(false);
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/billing/insurance">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Eligibility Verification</h1>
            <p className="text-muted-foreground">
              Verify patient insurance eligibility and benefits
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Patient
            </CardTitle>
            <CardDescription>Search for a patient to verify their insurance eligibility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPatient ? (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">
                    <PhiProtected fakeData={getFakeName()}>
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </PhiProtected>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    DOB: {formatDate(selectedPatient.dateOfBirth)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedPatient(null);
                    setInsurances([]);
                    setSelectedInsurance(null);
                    setEligibilityResult(null);
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchPatients(e.target.value);
                    }}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {loading ? (
                    <p className="text-center text-sm text-muted-foreground py-4">Searching...</p>
                  ) : patients.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      {searchQuery ? 'No patients found' : 'Start typing to search'}
                    </p>
                  ) : (
                    patients.map((patient) => (
                      <div
                        key={patient.id}
                        className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => selectPatient(patient)}
                      >
                        <div>
                          <p className="font-medium">
                            <PhiProtected fakeData={getFakeName()}>
                              {patient.firstName} {patient.lastName}
                            </PhiProtected>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            DOB: {formatDate(patient.dateOfBirth)}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          Select
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insurance Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Select Insurance
            </CardTitle>
            <CardDescription>Choose the insurance to verify</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedPatient ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Select a patient first
              </p>
            ) : insurances.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">No insurance on file</p>
                <Link href={`/patients/${selectedPatient.id}/insurance/add`}>
                  <Button variant="outline" size="sm" className="mt-4">
                    Add Insurance
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {insurances.map((insurance) => (
                  <div
                    key={insurance.id}
                    className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                      selectedInsurance?.id === insurance.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedInsurance(insurance)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{insurance.company.name}</p>
                          <Badge variant="outline">{insurance.priority}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Subscriber ID: {insurance.subscriberId}
                        </p>
                        {insurance.groupNumber && (
                          <p className="text-sm text-muted-foreground">
                            Group: {insurance.groupNumber}
                          </p>
                        )}
                      </div>
                      {selectedInsurance?.id === insurance.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Button */}
      {selectedPatient && selectedInsurance && (
        <div className="flex justify-center">
          <Button size="lg" onClick={checkEligibility} disabled={checking}>
            {checking ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Checking Eligibility...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Verify Eligibility
              </>
            )}
          </Button>
        </div>
      )}

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {eligibilityResult?.isEligible ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Patient is Eligible
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  Patient is Not Eligible
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {eligibilityResult && (
            <div className="space-y-4 py-4">
              {/* Coverage Status */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Coverage Status</span>
                  <Badge
                    variant={
                      eligibilityResult.coverageStatus === 'ACTIVE'
                        ? 'success'
                        : eligibilityResult.coverageStatus === 'INACTIVE'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {eligibilityResult.coverageStatus}
                  </Badge>
                </div>
                {eligibilityResult.planName && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Plan Name</span>
                    <span className="font-medium">{eligibilityResult.planName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Effective Date</span>
                  <span>{formatDate(eligibilityResult.effectiveDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Termination Date</span>
                  <span>{formatDate(eligibilityResult.terminationDate)}</span>
                </div>
              </div>

              {/* Orthodontic Benefits */}
              {eligibilityResult.coverageDetails && (
                <div className="rounded-lg border p-4 space-y-3">
                  <p className="font-medium">Orthodontic Benefits</p>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ortho Coverage</span>
                    <Badge
                      variant={
                        eligibilityResult.coverageDetails.orthodonticCoverage
                          ? 'success'
                          : 'secondary'
                      }
                    >
                      {eligibilityResult.coverageDetails.orthodonticCoverage ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lifetime Maximum</span>
                    <span className="font-medium">
                      {formatCurrency(eligibilityResult.coverageDetails.lifetimeMaximum)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Used Amount</span>
                    <span>{formatCurrency(eligibilityResult.coverageDetails.usedAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(eligibilityResult.coverageDetails.remainingAmount)}
                    </span>
                  </div>
                  {eligibilityResult.coverageDetails.coinsurancePercent !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Coinsurance</span>
                      <span>{eligibilityResult.coverageDetails.coinsurancePercent}%</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Waiting Period Met</span>
                    <Badge
                      variant={
                        eligibilityResult.coverageDetails.waitingPeriodMet ? 'success' : 'warning'
                      }
                    >
                      {eligibilityResult.coverageDetails.waitingPeriodMet ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              )}

              {!eligibilityResult.isEligible && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-4">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Coverage Not Active</p>
                    <p className="text-sm text-muted-foreground">
                      The patient&apos;s insurance coverage may be inactive or terminated. Please verify
                      with the insurance company.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResultDialog(false)}>
              Close
            </Button>
            {selectedPatient && (
              <Link href={`/patients/${selectedPatient.id}`}>
                <Button>View Patient</Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

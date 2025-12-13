'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  User,
  Building2,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  insurances?: Array<{
    id: string;
    priority: string;
    subscriberId: string;
    company: {
      id: string;
      name: string;
    };
  }>;
}

interface ClaimItem {
  procedureCode: string;
  description: string;
  toothNumbers: string[];
  quantity: number;
  unitFee: number;
  totalFee: number;
}

const CLAIM_TYPES = [
  { value: 'ORTHODONTIC', label: 'Orthodontic' },
  { value: 'GENERAL', label: 'General' },
  { value: 'PRE_TREATMENT', label: 'Pre-Treatment Estimate' },
];

export default function NewInsuranceClaimPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedInsuranceId, setSelectedInsuranceId] = useState<string>('');
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [formData, setFormData] = useState({
    claimType: 'ORTHODONTIC',
    serviceDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [items, setItems] = useState<ClaimItem[]>([
    {
      procedureCode: '',
      description: '',
      toothNumbers: [],
      quantity: 1,
      unitFee: 0,
      totalFee: 0,
    },
  ]);

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
    try {
      // Fetch patient with insurance details
      const res = await fetch(`/api/patients/${patient.id}/insurance`);
      const data = await res.json();
      if (data.success) {
        setSelectedPatient({
          ...patient,
          insurances: data.data.items,
        });
        // Auto-select primary insurance if available
        const primary = data.data.items.find((ins: { priority: string }) => ins.priority === 'PRIMARY');
        if (primary) {
          setSelectedInsuranceId(primary.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch patient insurance:', error);
      setSelectedPatient(patient);
    }
    setShowPatientSearch(false);
    setSearchQuery('');
    setPatients([]);
  }

  function addLineItem() {
    setItems([
      ...items,
      {
        procedureCode: '',
        description: '',
        toothNumbers: [],
        quantity: 1,
        unitFee: 0,
        totalFee: 0,
      },
    ]);
  }

  function updateLineItem(index: number, field: keyof ClaimItem, value: string | number | string[]) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate total fee
    if (field === 'quantity' || field === 'unitFee') {
      newItems[index].totalFee = newItems[index].quantity * newItems[index].unitFee;
    }

    setItems(newItems);
  }

  function removeLineItem(index: number) {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  }

  const totalBilled = items.reduce((sum, item) => sum + item.totalFee, 0);

  async function handleSubmit(saveAsDraft = true) {
    if (!selectedPatient || !selectedInsuranceId) {
      alert('Please select a patient and insurance');
      return;
    }

    const validItems = items.filter((item) => item.procedureCode && item.unitFee > 0);
    if (validItems.length === 0) {
      alert('Please add at least one line item with a procedure code and fee');
      return;
    }

    try {
      setSaving(true);
      const selectedInsurance = selectedPatient.insurances?.find((ins) => ins.id === selectedInsuranceId);

      const payload = {
        patientId: selectedPatient.id,
        patientInsuranceId: selectedInsuranceId,
        insuranceCompanyId: selectedInsurance?.company.id,
        claimType: formData.claimType,
        serviceDate: new Date(formData.serviceDate),
        notes: formData.notes || undefined,
        items: validItems.map((item, index) => ({
          lineNumber: index + 1,
          procedureCode: item.procedureCode,
          description: item.description,
          toothNumbers: item.toothNumbers,
          quantity: item.quantity,
          unitFee: item.unitFee,
        })),
      };

      const res = await fetch('/api/insurance/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        if (!saveAsDraft) {
          // Submit the claim immediately
          await fetch(`/api/insurance/claims/${data.data.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'submit' }),
          });
        }
        router.push(`/billing/insurance/claims/${data.data.id}`);
      } else {
        alert(data.error?.message || 'Failed to create claim');
      }
    } catch (error) {
      console.error('Failed to create claim:', error);
      alert('Failed to create claim');
    } finally {
      setSaving(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/billing/insurance/claims">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New Insurance Claim</h1>
            <p className="text-muted-foreground">
              Create a new insurance claim for submission
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Patient & Insurance */}
        <div className="space-y-6">
          {/* Patient Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPatient ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        <PhiProtected fakeData={getFakeName()}>
                          {selectedPatient.firstName} {selectedPatient.lastName}
                        </PhiProtected>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPatient(null);
                        setSelectedInsuranceId('');
                      }}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowPatientSearch(true)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Select Patient
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Insurance Selection */}
          {selectedPatient && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Insurance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPatient.insurances && selectedPatient.insurances.length > 0 ? (
                  <Select value={selectedInsuranceId} onValueChange={setSelectedInsuranceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select insurance" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedPatient.insurances.map((ins) => (
                        <SelectItem key={ins.id} value={ins.id}>
                          {ins.company.name} ({ins.priority})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No insurance on file for this patient
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Claim Details */}
          <Card>
            <CardHeader>
              <CardTitle>Claim Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Claim Type" required>
                <Select
                  value={formData.claimType}
                  onValueChange={(value) => setFormData({ ...formData, claimType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLAIM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Service Date" required>
                <Input
                  type="date"
                  value={formData.serviceDate}
                  onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                />
              </FormField>
              <FormField label="Notes">
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes..."
                  rows={3}
                />
              </FormField>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Line Items */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Add procedures and charges to the claim</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addLineItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Line
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-24">Teeth</TableHead>
                  <TableHead className="w-20 text-right">Qty</TableHead>
                  <TableHead className="w-28 text-right">Unit Fee</TableHead>
                  <TableHead className="w-28 text-right">Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        value={item.procedureCode}
                        onChange={(e) => updateLineItem(index, 'procedureCode', e.target.value)}
                        placeholder="D8080"
                        className="font-mono"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        placeholder="Procedure description"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.toothNumbers.join(',')}
                        onChange={(e) =>
                          updateLineItem(
                            index,
                            'toothNumbers',
                            e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                          )
                        }
                        placeholder="1,2,3"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitFee}
                        onChange={(e) => updateLineItem(index, 'unitFee', parseFloat(e.target.value) || 0)}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.totalFee)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLineItem(index)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Total */}
            <div className="flex items-center justify-end gap-4 border-t p-4">
              <span className="text-sm text-muted-foreground">Total Billed:</span>
              <span className="text-xl font-bold">{formatCurrency(totalBilled)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Link href="/billing/insurance/claims">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button
          variant="outline"
          onClick={() => handleSubmit(true)}
          disabled={saving || !selectedPatient || !selectedInsuranceId}
        >
          {saving ? 'Saving...' : 'Save as Draft'}
        </Button>
        <Button
          onClick={() => handleSubmit(false)}
          disabled={saving || !selectedPatient || !selectedInsuranceId}
        >
          {saving ? 'Saving...' : 'Save & Submit'}
        </Button>
      </div>

      {/* Patient Search Dialog */}
      <Dialog open={showPatientSearch} onOpenChange={setShowPatientSearch}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Patient</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                        DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPatientSearch(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

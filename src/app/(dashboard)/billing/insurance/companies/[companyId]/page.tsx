'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
  Users,
  DollarSign,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/ui/stat-card';
import { StatsRow } from '@/components/layout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
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

interface InsuranceCompany {
  id: string;
  name: string;
  payerId: string | null;
  type: string;
  phone: string | null;
  fax: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  claimsAddress: string | null;
  claimsCity: string | null;
  claimsState: string | null;
  claimsZipCode: string | null;
  electronicPayerId: string | null;
  acceptsElectronic: boolean;
  timely_filing_days: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    claims: number;
    patientInsurances: number;
  };
  claimStats?: {
    total: number;
    totalBilled: number;
    totalPaid: number;
    statusCounts: Record<string, { count: number; billedAmount: number; paidAmount: number }>;
  };
}

const INSURANCE_TYPES = [
  { value: 'PPO', label: 'PPO' },
  { value: 'HMO', label: 'HMO' },
  { value: 'INDEMNITY', label: 'Indemnity' },
  { value: 'MEDICAID', label: 'Medicaid' },
  { value: 'MEDICARE', label: 'Medicare' },
  { value: 'OTHER', label: 'Other' },
];

export default function InsuranceCompanyDetailPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = use(params);
  const router = useRouter();
  const [company, setCompany] = useState<InsuranceCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<InsuranceCompany>>({});

  useEffect(() => {
    fetchCompany();
  }, [companyId]);

  async function fetchCompany() {
    try {
      setLoading(true);
      const res = await fetch(`/api/insurance/companies/${companyId}`);
      const data = await res.json();

      if (data.success) {
        setCompany(data.data);
        setFormData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch company:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateCompany() {
    try {
      setSaving(true);
      const res = await fetch(`/api/insurance/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setCompany(data.data);
        setShowEditDialog(false);
      }
    } catch (error) {
      console.error('Failed to update company:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCompany() {
    try {
      setSaving(true);
      const res = await fetch(`/api/insurance/companies/${companyId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        router.push('/billing/insurance/companies');
      }
    } catch (error) {
      console.error('Failed to delete company:', error);
    } finally {
      setSaving(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Insurance company not found</p>
        <Link href="/billing/insurance/companies">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Companies
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/billing/insurance/companies">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
                <Badge variant={company.isActive ? 'success' : 'secondary'}>
                  {company.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {company.type} • Payer ID: {company.payerId || 'N/A'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsRow>
        <StatCard accentColor="primary">
          <p className="text-xs text-muted-foreground">Total Patients</p>
          <p className="text-2xl font-bold">{company._count?.patientInsurances || 0}</p>
          <p className="text-xs text-muted-foreground">With this insurance</p>
        </StatCard>
        <StatCard accentColor="accent">
          <p className="text-xs text-muted-foreground">Total Claims</p>
          <p className="text-2xl font-bold">{company.claimStats?.total || 0}</p>
          <p className="text-xs text-muted-foreground">All time</p>
        </StatCard>
        <StatCard accentColor="success">
          <p className="text-xs text-muted-foreground">Total Billed</p>
          <p className="text-2xl font-bold">{formatCurrency(company.claimStats?.totalBilled || 0)}</p>
          <p className="text-xs text-muted-foreground">Insurance charges</p>
        </StatCard>
        <StatCard accentColor="warning">
          <p className="text-xs text-muted-foreground">Total Paid</p>
          <p className="text-2xl font-bold">{formatCurrency(company.claimStats?.totalPaid || 0)}</p>
          <p className="text-xs text-muted-foreground">Received</p>
        </StatCard>
      </StatsRow>

      {/* Details Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {company.phone && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{company.phone}</p>
                </div>
              </div>
            )}
            {company.fax && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fax</p>
                  <p className="font-medium">{company.fax}</p>
                </div>
              </div>
            )}
            {company.email && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{company.email}</p>
                </div>
              </div>
            )}
            {company.website && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {company.website}
                  </a>
                </div>
              </div>
            )}
            {company.address && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">
                    {company.address}
                    {company.city && `, ${company.city}`}
                    {company.state && `, ${company.state}`}
                    {company.zipCode && ` ${company.zipCode}`}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing Information */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Electronic Claims</span>
              <Badge variant={company.acceptsElectronic ? 'success' : 'secondary'}>
                {company.acceptsElectronic ? (
                  <><CheckCircle className="mr-1 h-3 w-3" /> Accepted</>
                ) : (
                  <><XCircle className="mr-1 h-3 w-3" /> Not Accepted</>
                )}
              </Badge>
            </div>
            {company.electronicPayerId && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Electronic Payer ID</span>
                <code className="rounded bg-muted px-2 py-1 text-sm">
                  {company.electronicPayerId}
                </code>
              </div>
            )}
            {company.timely_filing_days && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Timely Filing Limit</span>
                <span className="font-medium">{company.timely_filing_days} days</span>
              </div>
            )}
            {company.claimsAddress && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Claims Mailing Address</p>
                <p className="font-medium">
                  {company.claimsAddress}
                  {company.claimsCity && `, ${company.claimsCity}`}
                  {company.claimsState && `, ${company.claimsState}`}
                  {company.claimsZipCode && ` ${company.claimsZipCode}`}
                </p>
              </div>
            )}
            {company.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Notes</p>
                <p className="text-sm">{company.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Claims Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Claims by Status</CardTitle>
            <CardDescription>Overview of claims submitted to this insurance</CardDescription>
          </CardHeader>
          <CardContent>
            {company.claimStats?.statusCounts ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Object.entries(company.claimStats.statusCounts).map(([status, data]) => (
                  <div
                    key={status}
                    className="rounded-lg border p-4 text-center"
                  >
                    <p className="text-2xl font-bold">{data.count}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {status.toLowerCase().replace('_', ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(data.billedAmount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No claims data available</p>
            )}
            <div className="mt-4 pt-4 border-t flex justify-end">
              <Link href={`/billing/insurance/claims?insuranceCompanyId=${company.id}`}>
                <Button variant="outline">
                  View All Claims
                  <FileText className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Insurance Company</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <FormField label="Company Name" required>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </FormField>
            <FormField label="Payer ID">
              <Input
                value={formData.payerId || ''}
                onChange={(e) => setFormData({ ...formData, payerId: e.target.value })}
              />
            </FormField>
            <FormField label="Type" required>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INSURANCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Phone">
              <Input
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </FormField>
            <FormField label="Fax">
              <Input
                value={formData.fax || ''}
                onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
              />
            </FormField>
            <FormField label="Email">
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </FormField>
            <FormField label="Website">
              <Input
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </FormField>
            <FormField label="Timely Filing Days">
              <Input
                type="number"
                value={formData.timely_filing_days || ''}
                onChange={(e) => setFormData({ ...formData, timely_filing_days: parseInt(e.target.value) || null })}
              />
            </FormField>
            <FormField label="Address" className="col-span-2">
              <Input
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </FormField>
            <FormField label="City">
              <Input
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="State">
                <Input
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  maxLength={2}
                />
              </FormField>
              <FormField label="ZIP Code">
                <Input
                  value={formData.zipCode || ''}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                />
              </FormField>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCompany} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Insurance Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {company.name}? This action cannot be undone.
              {(company._count?.claims || 0) > 0 && (
                <span className="block mt-2 text-destructive">
                  Warning: This company has {company._count?.claims} claims associated with it.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCompany}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

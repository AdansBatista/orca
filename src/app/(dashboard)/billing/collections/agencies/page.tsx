'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Building2, Phone, Mail, MoreVertical, Pencil, Trash2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { formatCurrency } from '@/lib/utils';

interface CollectionAgency {
  id: string;
  name: string;
  code: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  commissionRate: number;
  minimumBalance: number;
  isActive: boolean;
  _count?: {
    referrals: number;
  };
}

export default function CollectionAgenciesPage() {
  const [agencies, setAgencies] = useState<CollectionAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<CollectionAgency | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    commissionRate: 25,
    minimumBalance: 100,
  });

  useEffect(() => {
    fetchAgencies();
  }, []);

  async function fetchAgencies() {
    setLoading(true);
    try {
      const res = await fetch('/api/collections/agencies');
      const data = await res.json();

      if (data.success) {
        setAgencies(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch agencies:', error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingAgency(null);
    setFormData({
      name: '',
      code: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      commissionRate: 25,
      minimumBalance: 100,
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(agency: CollectionAgency) {
    setEditingAgency(agency);
    setFormData({
      name: agency.name,
      code: agency.code,
      contactName: agency.contactName || '',
      phone: agency.phone || '',
      email: agency.email || '',
      address: agency.address || '',
      commissionRate: agency.commissionRate,
      minimumBalance: agency.minimumBalance,
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const url = editingAgency
        ? `/api/collections/agencies/${editingAgency.id}`
        : '/api/collections/agencies';

      const res = await fetch(url, {
        method: editingAgency ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        fetchAgencies();
      }
    } catch (error) {
      console.error('Failed to save agency:', error);
    }
  }

  async function handleToggleStatus(agency: CollectionAgency) {
    try {
      const res = await fetch(`/api/collections/agencies/${agency.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !agency.isActive }),
      });

      if (res.ok) {
        fetchAgencies();
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  }

  async function handleDelete(agencyId: string) {
    if (!confirm('Are you sure you want to delete this agency?')) return;

    try {
      const res = await fetch(`/api/collections/agencies/${agencyId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchAgencies();
      }
    } catch (error) {
      console.error('Failed to delete agency:', error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/billing/collections">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Collection Agencies</h1>
          <p className="text-muted-foreground">
            Manage third-party collection agency partnerships
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Agency
        </Button>
      </div>

      {/* Agencies Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agencies ({agencies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading agencies...
            </div>
          ) : agencies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No collection agencies configured
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agency</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Min. Balance</TableHead>
                  <TableHead className="text-center">Referrals</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agencies.map((agency) => (
                  <TableRow key={agency.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{agency.name}</p>
                          <p className="text-sm text-muted-foreground">{agency.code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {agency.contactName && (
                          <p className="text-sm">{agency.contactName}</p>
                        )}
                        {agency.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {agency.phone}
                          </div>
                        )}
                        {agency.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {agency.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {agency.commissionRate}%
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(agency.minimumBalance)}
                    </TableCell>
                    <TableCell className="text-center">
                      {agency._count?.referrals || 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={agency.isActive ? 'success' : 'secondary'}>
                        {agency.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(agency)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(agency)}>
                            {agency.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(agency.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAgency ? 'Edit Agency' : 'Add Collection Agency'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Agency Name" required>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ABC Collections"
                  required
                />
              </FormField>
              <FormField label="Code" required>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="ABC"
                  required
                />
              </FormField>
            </div>

            <FormField label="Contact Name">
              <Input
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="John Smith"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Phone">
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </FormField>
              <FormField label="Email">
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@agency.com"
                />
              </FormField>
            </div>

            <FormField label="Address">
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City, ST 12345"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Commission Rate (%)" required>
                <Input
                  type="number"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
                  min={0}
                  max={100}
                  step={0.5}
                  required
                />
              </FormField>
              <FormField label="Minimum Balance ($)" required>
                <Input
                  type="number"
                  value={formData.minimumBalance}
                  onChange={(e) => setFormData({ ...formData, minimumBalance: parseFloat(e.target.value) })}
                  min={0}
                  step={10}
                  required
                />
              </FormField>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingAgency ? 'Save Changes' : 'Add Agency'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Package,
  Trash2,
  Search,
  AlertCircle,
  Loader2,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FormField } from '@/components/ui/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageHeader, PageContent } from '@/components/layout';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

// Simple debounce hook
function useDebounce<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedFn;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string | null;
}

interface Vendor {
  id: string;
  name: string;
  code: string;
  capabilities: string[];
}

interface Product {
  id: string;
  name: string;
  category: string;
  standardTurnaround: number;
  rushTurnaround: number | null;
  feeSchedules: Array<{
    basePrice: number;
    rushUpchargePercent: number | null;
  }>;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  arch?: string;
  notes?: string;
}

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const rushLevelOptions = [
  { value: 'PRIORITY', label: 'Priority (3-4 days)' },
  { value: 'RUSH', label: 'Rush (2-3 days)' },
  { value: 'EMERGENCY', label: 'Emergency (Same/Next day)' },
];

const archOptions = [
  { value: 'UPPER', label: 'Upper Arch' },
  { value: 'LOWER', label: 'Lower Arch' },
  { value: 'BOTH', label: 'Both Arches' },
];

/**
 * Inner component that uses useSearchParams
 * This must be wrapped in Suspense to support static generation
 */
function NewOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Patient search state
  const [patientSearch, setPatientSearch] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Vendor state
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');

  // Product state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Order state
  const [items, setItems] = useState<OrderItem[]>([]);
  const [priority, setPriority] = useState('STANDARD');
  const [isRush, setIsRush] = useState(false);
  const [rushLevel, setRushLevel] = useState('');
  const [rushReason, setRushReason] = useState('');
  const [neededByDate, setNeededByDate] = useState('');
  const [clinicNotes, setClinicNotes] = useState('');

  // Load vendors on mount
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch('/api/lab/vendors?status=ACTIVE&pageSize=100');
        const result = await response.json();
        if (result.success) {
          setVendors(result.data.items);
        }
      } catch (err) {
        console.error('Failed to fetch vendors:', err);
      }
    };
    fetchVendors();
  }, []);

  // Load preselected patient
  useEffect(() => {
    if (preselectedPatientId) {
      const fetchPatient = async () => {
        try {
          const response = await fetch(`/api/patients/${preselectedPatientId}`);
          const result = await response.json();
          if (result.success) {
            setSelectedPatient(result.data);
          }
        } catch (err) {
          console.error('Failed to fetch patient:', err);
        }
      };
      fetchPatient();
    }
  }, [preselectedPatientId]);

  // Load products when vendor changes
  useEffect(() => {
    if (selectedVendorId) {
      const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
          const response = await fetch(`/api/lab/products?vendorId=${selectedVendorId}&isActive=true&pageSize=100`);
          const result = await response.json();
          if (result.success) {
            setProducts(result.data.items);
          }
        } catch (err) {
          console.error('Failed to fetch products:', err);
        } finally {
          setLoadingProducts(false);
        }
      };
      fetchProducts();
    } else {
      // Load all products if no vendor selected
      const fetchAllProducts = async () => {
        setLoadingProducts(true);
        try {
          const response = await fetch('/api/lab/products?isActive=true&pageSize=100');
          const result = await response.json();
          if (result.success) {
            setProducts(result.data.items);
          }
        } catch (err) {
          console.error('Failed to fetch products:', err);
        } finally {
          setLoadingProducts(false);
        }
      };
      fetchAllProducts();
    }
  }, [selectedVendorId]);

  // Patient search function
  const doSearchPatients = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setPatientSearchResults([]);
      return;
    }

    setSearchingPatients(true);
    try {
      const response = await fetch(`/api/patients?search=${encodeURIComponent(query)}&pageSize=10`);
      const result = await response.json();
      if (result.success) {
        setPatientSearchResults(result.data.items);
      }
    } catch (err) {
      console.error('Failed to search patients:', err);
    } finally {
      setSearchingPatients(false);
    }
  }, []);

  // Debounced patient search
  const searchPatients = useDebounce(doSearchPatients, 300);

  useEffect(() => {
    searchPatients(patientSearch);
  }, [patientSearch, searchPatients]);

  const handleAddItem = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const price = product.feeSchedules[0]?.basePrice || 0;

    setItems([
      ...items,
      {
        productId,
        productName: product.name,
        quantity: 1,
        unitPrice: price,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, updates: Partial<OrderItem>) => {
    setItems(items.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  const calculateRushUpcharge = () => {
    if (!isRush) return 0;
    // Apply 50% rush upcharge by default
    return calculateSubtotal() * 0.5;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateRushUpcharge();
  };

  const handleSubmit = async (asDraft: boolean = true) => {
    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one item to the order');
      return;
    }

    if (!asDraft && !selectedVendorId) {
      setError('Please select a vendor before submitting');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Create the order
      const orderResponse = await fetch('/api/lab/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          vendorId: selectedVendorId || null,
          priority,
          isRush,
          rushLevel: isRush ? rushLevel : null,
          rushReason: isRush ? rushReason : null,
          neededByDate: neededByDate || null,
          clinicNotes: clinicNotes || null,
        }),
      });

      const orderResult = await orderResponse.json();

      if (!orderResult.success) {
        throw new Error(orderResult.error?.message || 'Failed to create order');
      }

      const orderId = orderResult.data.id;

      // Add items to the order
      for (const item of items) {
        const itemResponse = await fetch(`/api/lab/orders/${orderId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            arch: item.arch || null,
            notes: item.notes || null,
          }),
        });

        const itemResult = await itemResponse.json();
        if (!itemResult.success) {
          console.error('Failed to add item:', itemResult.error);
        }
      }

      // Submit the order if not saving as draft
      if (!asDraft && selectedVendorId) {
        const submitResponse = await fetch(`/api/lab/orders/${orderId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendorId: selectedVendorId }),
        });

        const submitResult = await submitResponse.json();
        if (!submitResult.success) {
          throw new Error(submitResult.error?.message || 'Failed to submit order');
        }
      }

      router.push(`/lab/orders/${orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  function getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  return (
    <>
      <PageHeader
        title="New Lab Order"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Lab', href: '/lab' },
          { label: 'Orders', href: '/lab/orders' },
          { label: 'New Order' },
        ]}
      />

      <PageContent density="comfortable">
        <div className="max-w-4xl mx-auto space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Patient Selection */}
          <Card variant="bento">
            <CardHeader>
              <CardTitle>Patient</CardTitle>
              <CardDescription>Select the patient for this lab order</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedPatient ? (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-primary text-white">
                        {getInitials(selectedPatient.firstName, selectedPatient.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <PhiProtected fakeData={getFakeName()}>
                        <p className="font-semibold">
                          {selectedPatient.firstName} {selectedPatient.lastName}
                        </p>
                      </PhiProtected>
                      <p className="text-sm text-muted-foreground">
                        DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedPatient(null)}>
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search patients by name..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {searchingPatients && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </div>
                  )}
                  {patientSearchResults.length > 0 && (
                    <div className="border rounded-lg divide-y">
                      {patientSearchResults.map((patient) => (
                        <button
                          key={patient.id}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 text-left"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setPatientSearch('');
                            setPatientSearchResults([]);
                          }}
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs bg-gradient-primary text-white">
                              {getInitials(patient.firstName, patient.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <PhiProtected fakeData={getFakeName()}>
                              <p className="font-medium text-sm">
                                {patient.firstName} {patient.lastName}
                              </p>
                            </PhiProtected>
                            <p className="text-xs text-muted-foreground">
                              DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vendor Selection */}
          <Card variant="bento">
            <CardHeader>
              <CardTitle>Lab Vendor</CardTitle>
              <CardDescription>Select the lab to send this order to</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a lab vendor..." />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">[{vendor.code}]</span>
                        {vendor.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card variant="bento">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>Add products to this order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Product */}
              <div className="flex gap-3">
                <Select
                  onValueChange={(productId) => {
                    if (productId) handleAddItem(productId);
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a product to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingProducts ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Loading products...
                      </div>
                    ) : products.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No products available
                      </div>
                    ) : (
                      products.map((product) => (
                        <SelectItem
                          key={product.id}
                          value={product.id}
                          disabled={items.some((i) => i.productId === product.id)}
                        >
                          <div className="flex items-center justify-between w-full gap-4">
                            <span>{product.name}</span>
                            {product.feeSchedules[0] && (
                              <span className="text-muted-foreground">
                                ${product.feeSchedules[0].basePrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Items List */}
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No items added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl"
                    >
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{item.productName}</p>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <FormField label="Quantity">
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItem(index, { quantity: parseInt(e.target.value) || 1 })
                              }
                            />
                          </FormField>
                          <FormField label="Unit Price">
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleUpdateItem(index, { unitPrice: parseFloat(e.target.value) || 0 })
                              }
                            />
                          </FormField>
                          <FormField label="Arch">
                            <Select
                              value={item.arch || ''}
                              onValueChange={(v) => handleUpdateItem(index, { arch: v || undefined })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                {archOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormField>
                        </div>
                        <FormField label="Notes">
                          <Input
                            placeholder="Special instructions for this item..."
                            value={item.notes || ''}
                            onChange={(e) => handleUpdateItem(index, { notes: e.target.value })}
                          />
                        </FormField>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card variant="bento">
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Priority">
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Needed By Date">
                  <Input
                    type="date"
                    value={neededByDate}
                    onChange={(e) => setNeededByDate(e.target.value)}
                  />
                </FormField>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-warning-600" />
                  <div>
                    <Label htmlFor="rush-toggle" className="font-medium">
                      Rush Order
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Expedited processing (additional fees apply)
                    </p>
                  </div>
                </div>
                <Switch
                  id="rush-toggle"
                  checked={isRush}
                  onCheckedChange={setIsRush}
                />
              </div>

              {isRush && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Rush Level">
                    <Select value={rushLevel} onValueChange={setRushLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select rush level..." />
                      </SelectTrigger>
                      <SelectContent>
                        {rushLevelOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Rush Reason">
                    <Input
                      placeholder="Reason for rush..."
                      value={rushReason}
                      onChange={(e) => setRushReason(e.target.value)}
                    />
                  </FormField>
                </div>
              )}

              <FormField label="Clinic Notes">
                <Textarea
                  placeholder="Additional instructions for the lab..."
                  value={clinicNotes}
                  onChange={(e) => setClinicNotes(e.target.value)}
                  rows={3}
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card variant="bento">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                {isRush && (
                  <div className="flex justify-between text-sm">
                    <span className="text-warning-600">Rush Upcharge (50%)</span>
                    <span className="text-warning-600">+${calculateRushUpcharge().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                disabled={submitting || !selectedPatient || items.length === 0}
                onClick={() => handleSubmit(true)}
              >
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save as Draft
              </Button>
              <Button
                disabled={submitting || !selectedPatient || items.length === 0 || !selectedVendorId}
                onClick={() => handleSubmit(false)}
              >
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Order
              </Button>
            </div>
          </div>
        </div>
      </PageContent>
    </>
  );
}

/**
 * Loading fallback for Suspense boundary
 */
function NewOrderLoading() {
  return (
    <>
      <PageHeader
        title="New Lab Order"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Lab', href: '/lab' },
          { label: 'Orders', href: '/lab/orders' },
          { label: 'New Order' },
        ]}
      />
      <PageContent density="comfortable">
        <div className="max-w-4xl mx-auto flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContent>
    </>
  );
}

/**
 * Main page component wrapped in Suspense boundary
 *
 * IMPORTANT: useSearchParams() requires a Suspense boundary in Next.js 13+ App Router.
 * This is because useSearchParams causes the page to bail out of static generation
 * and render dynamically on the client.
 *
 * @see https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
 */
export default function NewOrderPage() {
  return (
    <Suspense fallback={<NewOrderLoading />}>
      <NewOrderContent />
    </Suspense>
  );
}

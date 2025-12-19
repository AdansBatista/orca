'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  ArrowLeft,
  DollarSign,
  Banknote,
  Building,
  Check,
  Loader2,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { PhiProtected } from '@/components/ui/phi-protected';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getFakeName } from '@/lib/fake-data';

interface PatientAccount {
  id: string;
  accountNumber: string;
  currentBalance: number;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  balance: number;
  dueDate: string;
  status: string;
}

function ProcessPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Pre-fill from query params
  const prefilledAccountId = searchParams.get('accountId');
  const prefilledInvoiceId = searchParams.get('invoiceId');
  const prefilledAmount = searchParams.get('amount');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Account search
  const [accountSearch, setAccountSearch] = useState('');
  const [accounts, setAccounts] = useState<PatientAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<PatientAccount | null>(null);

  // Invoices for selected account
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  // Payment form
  const [paymentMethod, setPaymentMethod] = useState<string>('CREDIT_CARD');
  const [amount, setAmount] = useState(prefilledAmount || '');
  const [notes, setNotes] = useState('');

  // Card details (for display only - actual processing via Stripe)
  const [cardLast4, setCardLast4] = useState('');
  const [cardBrand, setCardBrand] = useState('');

  // Check details
  const [checkNumber, setCheckNumber] = useState('');
  const [checkBank, setCheckBank] = useState('');

  // Search accounts
  useEffect(() => {
    const searchAccounts = async () => {
      if (accountSearch.length < 2 && !prefilledAccountId) return;

      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          pageSize: '10',
          hasOutstandingBalance: 'true',
        });

        if (prefilledAccountId) {
          // Fetch specific account
          const response = await fetch(`/api/billing/accounts/${prefilledAccountId}`);
          const data = await response.json();
          if (data.success) {
            setAccounts([data.data]);
            setSelectedAccount(data.data);
          }
        } else if (accountSearch) {
          params.set('search', accountSearch);
          const response = await fetch(`/api/billing/accounts?${params}`);
          const data = await response.json();
          if (data.success) {
            setAccounts(data.data.items);
          }
        }
      } catch (error) {
        console.error('Failed to search accounts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchAccounts, 300);
    return () => clearTimeout(debounce);
  }, [accountSearch, prefilledAccountId]);

  // Fetch invoices when account is selected
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!selectedAccount) {
        setInvoices([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/billing/invoices?accountId=${selectedAccount.id}&status=PENDING,SENT,PARTIAL,OVERDUE&pageSize=50`
        );
        const data = await response.json();
        if (data.success) {
          setInvoices(data.data.items);

          // Pre-select invoice if specified
          if (prefilledInvoiceId) {
            setSelectedInvoices([prefilledInvoiceId]);
            const invoice = data.data.items.find((i: Invoice) => i.id === prefilledInvoiceId);
            if (invoice && !amount) {
              setAmount(invoice.balance.toString());
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
      }
    };

    fetchInvoices();
  }, [selectedAccount, prefilledInvoiceId, amount]);

  // Calculate total from selected invoices
  const selectedInvoiceTotal = invoices
    .filter((inv) => selectedInvoices.includes(inv.id))
    .reduce((sum, inv) => sum + inv.balance, 0);

  const toggleInvoice = (invoiceId: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const applyInvoiceTotal = () => {
    setAmount(selectedInvoiceTotal.toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccount) {
      toast({
        title: 'Error',
        description: 'Please select a patient account',
        variant: 'destructive',
      });
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Build allocations from selected invoices
      let allocations: { invoiceId: string; amount: number }[] = [];
      if (selectedInvoices.length > 0) {
        let remainingAmount = parsedAmount;
        for (const invoiceId of selectedInvoices) {
          const invoice = invoices.find((i) => i.id === invoiceId);
          if (invoice && remainingAmount > 0) {
            const allocAmount = Math.min(remainingAmount, invoice.balance);
            allocations.push({ invoiceId, amount: allocAmount });
            remainingAmount -= allocAmount;
          }
        }
      }

      const paymentData = {
        accountId: selectedAccount.id,
        patientId: selectedAccount.patient.id,
        amount: parsedAmount,
        paymentDate: new Date().toISOString(),
        paymentType: 'PATIENT',
        paymentMethodType: paymentMethod,
        sourceType: 'MANUAL',
        gateway: paymentMethod === 'CASH' || paymentMethod === 'CHECK' ? 'MANUAL' : 'STRIPE',
        cardLast4: paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD' ? cardLast4 : undefined,
        cardBrand: paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD' ? cardBrand : undefined,
        checkNumber: paymentMethod === 'CHECK' ? checkNumber : undefined,
        checkBank: paymentMethod === 'CHECK' ? checkBank : undefined,
        notes: notes || undefined,
        allocations: allocations.length > 0 ? allocations : undefined,
      };

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Payment processed',
          description: `Payment ${data.data.paymentNumber} has been recorded`,
        });
        router.push(`/billing/payments/${data.data.id}`);
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to process payment',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process payment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Process Payment"
        compact
        breadcrumbs={[
          { label: 'Billing', href: '/billing' },
          { label: 'Payments', href: '/billing/payments' },
          { label: 'New Payment' },
        ]}
        actions={
          <Link href="/billing/payments">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </Link>
        }
      />
      <PageContent density="comfortable">
        <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
          {/* Account Selection */}
          <Card>
            <CardHeader>
              <CardTitle size="sm">Patient Account</CardTitle>
              <CardDescription>Select the account to apply this payment to</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedAccount ? (
                <>
                  <FormField label="Search Account">
                    <Input
                      placeholder="Search by account number or patient name..."
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                    />
                  </FormField>

                  {isLoading && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  {!isLoading && accounts.length > 0 && (
                    <div className="space-y-2">
                      {accounts.map((account) => (
                        <button
                          key={account.id}
                          type="button"
                          onClick={() => setSelectedAccount(account)}
                          className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors text-left"
                        >
                          <div>
                            <p className="font-medium">{account.accountNumber}</p>
                            <PhiProtected fakeData={getFakeName()}>
                              <p className="text-sm text-muted-foreground">
                                {account.patient.firstName} {account.patient.lastName}
                              </p>
                            </PhiProtected>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(account.currentBalance)}</p>
                            <p className="text-xs text-muted-foreground">Balance</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <div>
                    <p className="font-medium">{selectedAccount.accountNumber}</p>
                    <PhiProtected fakeData={getFakeName()}>
                      <p className="text-sm text-muted-foreground">
                        {selectedAccount.patient.firstName} {selectedAccount.patient.lastName}
                      </p>
                    </PhiProtected>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(selectedAccount.currentBalance)}</p>
                      <p className="text-xs text-muted-foreground">Balance</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAccount(null);
                        setAccounts([]);
                        setAccountSearch('');
                        setSelectedInvoices([]);
                      }}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Selection */}
          {selectedAccount && invoices.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle size="sm">Apply to Invoices</CardTitle>
                    <CardDescription>Select invoices to apply this payment to</CardDescription>
                  </div>
                  {selectedInvoices.length > 0 && (
                    <Button type="button" variant="outline" size="sm" onClick={applyInvoiceTotal}>
                      Use Total: {formatCurrency(selectedInvoiceTotal)}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invoices.map((invoice) => (
                    <label
                      key={invoice.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedInvoices.includes(invoice.id)
                          ? 'bg-primary/5 border-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.includes(invoice.id)}
                          onChange={() => toggleInvoice(invoice.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            Due: {formatDate(invoice.dueDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(invoice.balance)}</p>
                        <Badge
                          variant={invoice.status === 'OVERDUE' ? 'destructive' : 'warning'}
                          className="text-xs"
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle size="sm">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Method */}
              <FormField label="Payment Method" required>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="grid grid-cols-2 gap-3 md:grid-cols-4"
                >
                  <div>
                    <RadioGroupItem value="CREDIT_CARD" id="credit_card" className="peer sr-only" />
                    <Label
                      htmlFor="credit_card"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <CreditCard className="h-6 w-6 mb-2" />
                      <span className="text-sm">Credit Card</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="DEBIT_CARD" id="debit_card" className="peer sr-only" />
                    <Label
                      htmlFor="debit_card"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <CreditCard className="h-6 w-6 mb-2" />
                      <span className="text-sm">Debit Card</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="CASH" id="cash" className="peer sr-only" />
                    <Label
                      htmlFor="cash"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Banknote className="h-6 w-6 mb-2" />
                      <span className="text-sm">Cash</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="CHECK" id="check" className="peer sr-only" />
                    <Label
                      htmlFor="check"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Check className="h-6 w-6 mb-2" />
                      <span className="text-sm">Check</span>
                    </Label>
                  </div>
                </RadioGroup>
              </FormField>

              <Separator />

              {/* Amount */}
              <FormField label="Amount" required>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </FormField>

              {/* Card Details */}
              {(paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD') && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Card Brand">
                    <Select value={cardBrand} onValueChange={setCardBrand}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visa">Visa</SelectItem>
                        <SelectItem value="mastercard">Mastercard</SelectItem>
                        <SelectItem value="amex">American Express</SelectItem>
                        <SelectItem value="discover">Discover</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Last 4 Digits">
                    <Input
                      placeholder="1234"
                      maxLength={4}
                      value={cardLast4}
                      onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
                    />
                  </FormField>
                </div>
              )}

              {/* Check Details */}
              {paymentMethod === 'CHECK' && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Check Number">
                    <Input
                      placeholder="Check #"
                      value={checkNumber}
                      onChange={(e) => setCheckNumber(e.target.value)}
                    />
                  </FormField>
                  <FormField label="Bank Name">
                    <Input
                      placeholder="Bank name"
                      value={checkBank}
                      onChange={(e) => setCheckBank(e.target.value)}
                    />
                  </FormField>
                </div>
              )}

              {/* Notes */}
              <FormField label="Notes">
                <Textarea
                  placeholder="Optional notes about this payment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-between pt-4">
            <Link href="/billing/payments">
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting || !selectedAccount}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Process Payment {amount && `(${formatCurrency(parseFloat(amount) || 0)})`}
                </>
              )}
            </Button>
          </div>
        </form>
      </PageContent>
    </>
  );
}

export default function ProcessPaymentPage() {
  return (
    <Suspense fallback={<div className="flex h-48 items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>}>
      <ProcessPaymentContent />
    </Suspense>
  );
}

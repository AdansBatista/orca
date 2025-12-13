'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Link2,
  ArrowLeft,
  Search,
  User,
  Calendar,
  FileText,
  Copy,
  Send,
  Loader2,
  Check,
} from 'lucide-react';

import { PageHeader, PageContent, DashboardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PhiProtected } from '@/components/ui/phi-protected';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getFakeName, getFakeEmail } from '@/lib/fake-data';

const createLinkSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().optional(),
  allowPartial: z.boolean().default(false),
  minimumAmount: z.number().optional(),
  expiresIn: z.string().optional(),
  invoiceId: z.string().optional(),
});

type CreateLinkFormData = z.infer<typeof createLinkSchema>;

interface Account {
  id: string;
  accountNumber: string;
  currentBalance: number;
  primaryPatient: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  balance: number;
  dueDate?: string;
}

export default function NewPaymentLinkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [createdLink, setCreatedLink] = useState<{ code: string; url: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateLinkFormData>({
    resolver: zodResolver(createLinkSchema),
    defaultValues: {
      allowPartial: false,
      expiresIn: '7',
    },
  });

  const allowPartial = watch('allowPartial');
  const amount = watch('amount');

  // Pre-fill from query params
  useEffect(() => {
    const accountId = searchParams.get('accountId');
    const invoiceId = searchParams.get('invoiceId');

    if (accountId) {
      // Fetch account details
      fetch(`/api/billing/accounts/${accountId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setSelectedAccount(data.data);
            setValue('accountId', data.data.id);
            setValue('amount', data.data.currentBalance);
          }
        });
    }

    if (invoiceId) {
      setValue('invoiceId', invoiceId);
    }
  }, [searchParams, setValue]);

  // Fetch invoices when account is selected
  useEffect(() => {
    if (selectedAccount) {
      fetch(`/api/billing/accounts/${selectedAccount.id}/invoices?status=UNPAID`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setInvoices(data.data.items || []);
          }
        });
    }
  }, [selectedAccount]);

  // Search accounts
  const handleSearchAccounts = async () => {
    if (!accountSearch.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/billing/accounts?search=${encodeURIComponent(accountSearch)}&pageSize=10`
      );
      const data = await response.json();
      if (data.success) {
        setAccounts(data.data.items || []);
      }
    } catch (error) {
      console.error('Failed to search accounts:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectAccount = (account: Account) => {
    setSelectedAccount(account);
    setValue('accountId', account.id);
    setValue('amount', account.currentBalance > 0 ? account.currentBalance : 0);
    setAccounts([]);
    setAccountSearch('');
  };

  const handleSelectInvoice = (invoice: Invoice) => {
    setValue('invoiceId', invoice.id);
    setValue('amount', invoice.balance);
    setValue('description', `Payment for Invoice ${invoice.invoiceNumber}`);
  };

  const onSubmit = async (data: CreateLinkFormData) => {
    setIsSubmitting(true);

    try {
      // Calculate expiration date
      let expiresAt: string | undefined;
      if (data.expiresIn && data.expiresIn !== 'never') {
        const days = parseInt(data.expiresIn);
        const expiresDate = new Date();
        expiresDate.setDate(expiresDate.getDate() + days);
        expiresAt = expiresDate.toISOString();
      }

      const response = await fetch('/api/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: data.accountId,
          patientId: selectedAccount?.primaryPatient.id,
          amount: data.amount,
          description: data.description,
          allowPartial: data.allowPartial,
          minimumAmount: data.allowPartial && data.minimumAmount ? data.minimumAmount : undefined,
          expiresAt,
          invoiceIds: data.invoiceId ? [data.invoiceId] : undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const baseUrl = window.location.origin;
        setCreatedLink({
          code: result.data.code,
          url: `${baseUrl}/pay/${result.data.code}`,
        });
        toast({
          title: 'Payment link created',
          description: 'The payment link is ready to send',
        });
      } else {
        toast({
          title: 'Failed to create link',
          description: result.error?.message || 'Could not create payment link',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create payment link',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!createdLink) return;
    try {
      await navigator.clipboard.writeText(createdLink.url);
      toast({
        title: 'Link copied',
        description: 'Payment link copied to clipboard',
      });
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy link to clipboard',
        variant: 'destructive',
      });
    }
  };

  // Success state - show the created link
  if (createdLink) {
    return (
      <>
        <PageHeader
          title="Payment Link Created"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Billing', href: '/billing' },
            { label: 'Payment Links', href: '/billing/payment-links' },
            { label: 'New' },
          ]}
        />
        <PageContent density="comfortable">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="h-16 w-16 rounded-full bg-success-500/20 flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-success-500" />
              </div>

              <div>
                <h2 className="text-xl font-semibold">Payment Link Created</h2>
                <p className="text-muted-foreground mt-1">
                  Share this link with your patient to collect payment
                </p>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <Label className="text-left block mb-2">Payment Link</Label>
                <div className="flex items-center gap-2">
                  <Input value={createdLink.url} readOnly className="font-mono text-sm" />
                  <Button variant="outline" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm">
                  <strong>Amount:</strong> {formatCurrency(amount || 0)}
                </p>
                <p className="text-sm">
                  <strong>Patient:</strong>{' '}
                  <PhiProtected fakeData={getFakeName()}>
                    {selectedAccount?.primaryPatient.firstName} {selectedAccount?.primaryPatient.lastName}
                  </PhiProtected>
                </p>
              </div>

              <div className="flex justify-center gap-3">
                <Link href={`/billing/payment-links/${createdLink.code}`}>
                  <Button variant="outline">
                    <Link2 className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </Link>
                <Link href="/billing/payment-links">
                  <Button>
                    Done
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Create Payment Link"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Billing', href: '/billing' },
          { label: 'Payment Links', href: '/billing/payment-links' },
          { label: 'New' },
        ]}
        actions={
          <Link href="/billing/payment-links">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </Link>
        }
      />

      <PageContent density="comfortable">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DashboardGrid>
            <DashboardGrid.TwoThirds>
              <div className="space-y-6">
                {/* Account Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Patient Account
                    </CardTitle>
                    <CardDescription>
                      Search for a patient account to create a payment link
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!selectedAccount ? (
                      <>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search by name or account number..."
                              value={accountSearch}
                              onChange={(e) => setAccountSearch(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchAccounts())}
                              className="pl-9"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleSearchAccounts}
                            disabled={isSearching}
                          >
                            {isSearching ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Search'
                            )}
                          </Button>
                        </div>

                        {accounts.length > 0 && (
                          <div className="border rounded-md divide-y max-h-64 overflow-auto">
                            {accounts.map((account) => (
                              <button
                                key={account.id}
                                type="button"
                                className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                                onClick={() => handleSelectAccount(account)}
                              >
                                <PhiProtected fakeData={getFakeName()}>
                                  <p className="font-medium">
                                    {account.primaryPatient.firstName} {account.primaryPatient.lastName}
                                  </p>
                                </PhiProtected>
                                <p className="text-sm text-muted-foreground">
                                  {account.accountNumber} • Balance: {formatCurrency(account.currentBalance)}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <PhiProtected fakeData={getFakeName()}>
                            <p className="font-medium">
                              {selectedAccount.primaryPatient.firstName}{' '}
                              {selectedAccount.primaryPatient.lastName}
                            </p>
                          </PhiProtected>
                          <p className="text-sm text-muted-foreground">
                            {selectedAccount.accountNumber}
                          </p>
                          <p className="text-sm">
                            Balance: {formatCurrency(selectedAccount.currentBalance)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAccount(null);
                            setValue('accountId', '');
                            setValue('invoiceId', '');
                            setInvoices([]);
                          }}
                        >
                          Change
                        </Button>
                      </div>
                    )}

                    {errors.accountId && (
                      <p className="text-sm text-destructive">{errors.accountId.message}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Invoice Selection (if account selected) */}
                {selectedAccount && invoices.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Link to Invoice (Optional)
                      </CardTitle>
                      <CardDescription>
                        Select an invoice to automatically apply the payment
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {invoices.map((invoice) => (
                          <button
                            key={invoice.id}
                            type="button"
                            className={`w-full p-3 text-left border rounded-md transition-colors ${
                              watch('invoiceId') === invoice.id
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => handleSelectInvoice(invoice)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{invoice.invoiceNumber}</p>
                                {invoice.dueDate && (
                                  <p className="text-xs text-muted-foreground">
                                    Due: {formatDate(invoice.dueDate)}
                                  </p>
                                )}
                              </div>
                              <p className="font-medium">{formatCurrency(invoice.balance)}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Payment Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Link2 className="h-5 w-5" />
                      Payment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="pl-7"
                            {...register('amount', { valueAsNumber: true })}
                          />
                        </div>
                        {errors.amount && (
                          <p className="text-sm text-destructive">{errors.amount.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="expiresIn">Expires In</Label>
                        <Select
                          value={watch('expiresIn')}
                          onValueChange={(value) => setValue('expiresIn', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 day</SelectItem>
                            <SelectItem value="3">3 days</SelectItem>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="14">14 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="never">Never</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="e.g., Monthly payment, Initial deposit..."
                        {...register('description')}
                      />
                    </div>

                    <div className="flex items-start space-x-3 pt-2">
                      <Checkbox
                        id="allowPartial"
                        checked={allowPartial}
                        onCheckedChange={(checked) => setValue('allowPartial', checked === true)}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="allowPartial" className="cursor-pointer">
                          Allow partial payments
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Let patients pay less than the full amount
                        </p>
                      </div>
                    </div>

                    {allowPartial && (
                      <div className="space-y-2 pl-7">
                        <Label htmlFor="minimumAmount">Minimum Payment Amount</Label>
                        <div className="relative w-48">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input
                            id="minimumAmount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="pl-7"
                            {...register('minimumAmount', { valueAsNumber: true })}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </DashboardGrid.TwoThirds>

            <DashboardGrid.OneThird>
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-2xl font-bold">{formatCurrency(amount || 0)}</p>
                  </div>

                  {selectedAccount && (
                    <div>
                      <p className="text-sm text-muted-foreground">Patient</p>
                      <PhiProtected fakeData={getFakeName()}>
                        <p className="font-medium">
                          {selectedAccount.primaryPatient.firstName}{' '}
                          {selectedAccount.primaryPatient.lastName}
                        </p>
                      </PhiProtected>
                      {selectedAccount.primaryPatient.email && (
                        <PhiProtected fakeData={getFakeEmail()}>
                          <p className="text-sm text-muted-foreground">
                            {selectedAccount.primaryPatient.email}
                          </p>
                        </PhiProtected>
                      )}
                    </div>
                  )}

                  {watch('expiresIn') && watch('expiresIn') !== 'never' && (
                    <div>
                      <p className="text-sm text-muted-foreground">Expires</p>
                      <p>
                        {watch('expiresIn')} {parseInt(watch('expiresIn') || '0') === 1 ? 'day' : 'days'} from now
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || !selectedAccount}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4 mr-2" />
                        Create Payment Link
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Alert>
                <AlertDescription className="text-sm">
                  After creating the link, you can send it to the patient via email or SMS, or copy
                  it to share manually.
                </AlertDescription>
              </Alert>
            </DashboardGrid.OneThird>
          </DashboardGrid>
        </form>
      </PageContent>
    </>
  );
}

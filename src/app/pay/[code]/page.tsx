'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  CreditCard,
  Building2,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lock,
  Calendar,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentLinkData {
  code: string;
  amount: number;
  description?: string;
  allowPartial: boolean;
  minimumAmount?: number;
  expiresAt?: string;
  clinic: {
    name: string;
    logo?: string;
  };
  patient: {
    firstName: string;
    lastName: string;
    email?: string;
  };
  accountNumber: string;
}

type PageStatus = 'loading' | 'ready' | 'processing' | 'error' | 'expired' | 'completed' | 'cancelled';

export default function PublicPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [status, setStatus] = useState<PageStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<PaymentLinkData | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');

  // Fetch payment link details
  useEffect(() => {
    async function fetchPaymentLink() {
      try {
        const response = await fetch(`/api/public/pay/${code}`);
        const data = await response.json();

        if (data.success) {
          setPaymentLink(data.data);
          setStatus('ready');
          setCustomAmount(data.data.amount.toString());
        } else {
          switch (data.error?.code) {
            case 'LINK_EXPIRED':
              setStatus('expired');
              setError('This payment link has expired.');
              break;
            case 'LINK_COMPLETED':
              setStatus('completed');
              setError('This payment has already been completed.');
              break;
            case 'LINK_CANCELLED':
              setStatus('cancelled');
              setError('This payment link has been cancelled.');
              break;
            default:
              setStatus('error');
              setError(data.error?.message || 'Payment link not found');
          }
        }
      } catch {
        setStatus('error');
        setError('Failed to load payment details');
      }
    }

    if (code) {
      fetchPaymentLink();
    }
  }, [code]);

  // Handle payment via Stripe Checkout
  const handlePayment = async () => {
    if (!paymentLink) return;

    setStatus('processing');
    setError(null);

    try {
      const amount = paymentLink.allowPartial ? parseFloat(customAmount) : paymentLink.amount;

      const response = await fetch(`/api/public/pay/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'checkout',
          amount,
        }),
      });

      const data = await response.json();

      if (data.success && data.data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.data.url;
      } else {
        setStatus('ready');
        setError(data.error?.message || 'Failed to start payment');
      }
    } catch {
      setStatus('ready');
      setError('Failed to process payment');
    }
  };

  // Validate custom amount
  const isValidAmount = () => {
    if (!paymentLink?.allowPartial) return true;

    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) return false;
    if (paymentLink.minimumAmount && amount < paymentLink.minimumAmount) return false;
    if (amount > paymentLink.amount) return false;
    return true;
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <Skeleton className="h-16 w-16 rounded-full mx-auto" />
            <Skeleton className="h-6 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error states
  if (status === 'error' || status === 'expired' || status === 'completed' || status === 'cancelled') {
    const icons = {
      error: <XCircle className="h-16 w-16 text-destructive" />,
      expired: <AlertTriangle className="h-16 w-16 text-warning-500" />,
      completed: <CheckCircle className="h-16 w-16 text-success-500" />,
      cancelled: <XCircle className="h-16 w-16 text-muted-foreground" />,
    };

    const titles = {
      error: 'Payment Link Not Found',
      expired: 'Link Expired',
      completed: 'Payment Completed',
      cancelled: 'Link Cancelled',
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            {icons[status]}
            <h1 className="text-xl font-semibold">{titles[status]}</h1>
            <p className="text-muted-foreground">{error}</p>
            {status === 'completed' && (
              <p className="text-sm text-muted-foreground">
                Thank you for your payment.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ready state - show payment form
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          {/* Clinic logo or icon */}
          {paymentLink?.clinic.logo ? (
            <img
              src={paymentLink.clinic.logo}
              alt={paymentLink.clinic.name}
              className="h-16 w-auto mx-auto"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          )}

          <div>
            <CardTitle className="text-xl">{paymentLink?.clinic.name}</CardTitle>
            <CardDescription>
              Payment for {paymentLink?.patient.firstName} {paymentLink?.patient.lastName}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Payment details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            {paymentLink?.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{paymentLink.description}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Account</p>
              <p className="font-medium">{paymentLink?.accountNumber}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Amount Due</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(paymentLink?.amount || 0)}
              </p>
            </div>

            {paymentLink?.expiresAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Expires {formatDate(paymentLink.expiresAt)}</span>
              </div>
            )}
          </div>

          {/* Custom amount input for partial payments */}
          {paymentLink?.allowPartial && (
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="pl-7"
                  min={paymentLink.minimumAmount || 0.01}
                  max={paymentLink.amount}
                  step="0.01"
                />
              </div>
              {paymentLink.minimumAmount && (
                <p className="text-xs text-muted-foreground">
                  Minimum payment: {formatCurrency(paymentLink.minimumAmount)}
                </p>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Pay button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handlePayment}
            disabled={status === 'processing' || !isValidAmount()}
          >
            {status === 'processing' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay {formatCurrency(
                  paymentLink?.allowPartial
                    ? parseFloat(customAmount) || 0
                    : paymentLink?.amount || 0
                )}
              </>
            )}
          </Button>

          {/* Security notice */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Secured by Stripe</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

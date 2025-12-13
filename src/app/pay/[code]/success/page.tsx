'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, XCircle, Download, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface PaymentConfirmation {
  success: boolean;
  paymentId?: string;
  amount?: number;
  receiptUrl?: string;
  error?: string;
}

export default function PaymentSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const code = params.code as string;
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [confirmation, setConfirmation] = useState<PaymentConfirmation | null>(null);

  useEffect(() => {
    async function verifyPayment() {
      if (!sessionId) {
        setStatus('error');
        setConfirmation({ success: false, error: 'No payment session found' });
        return;
      }

      try {
        // Verify the payment with our backend
        const response = await fetch(`/api/public/pay/${code}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setConfirmation({
            success: true,
            paymentId: data.data.paymentId,
            amount: data.data.amount,
            receiptUrl: data.data.receiptUrl,
          });
        } else {
          setStatus('error');
          setConfirmation({
            success: false,
            error: data.error?.message || 'Payment verification failed',
          });
        }
      } catch {
        setStatus('error');
        setConfirmation({
          success: false,
          error: 'Failed to verify payment',
        });
      }
    }

    verifyPayment();
  }, [code, sessionId]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <h1 className="text-xl font-semibold">Verifying Payment...</h1>
            <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-xl font-semibold">Payment Issue</h1>
            <p className="text-muted-foreground">
              {confirmation?.error || 'There was an issue with your payment.'}
            </p>
            <Button variant="outline" onClick={() => window.location.href = `/pay/${code}`}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-24 w-24 rounded-full bg-success-500/20 animate-ping" />
            </div>
            <CheckCircle className="h-16 w-16 text-success-500 mx-auto relative" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Payment Successful!</h1>
            <p className="text-muted-foreground">Thank you for your payment.</p>
          </div>

          {confirmation?.amount && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Amount Paid</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(confirmation.amount)}
              </p>
            </div>
          )}

          {confirmation?.paymentId && (
            <p className="text-sm text-muted-foreground">
              Confirmation: <span className="font-mono">{confirmation.paymentId}</span>
            </p>
          )}

          <div className="flex flex-col gap-2">
            {confirmation?.receiptUrl && (
              <Button variant="outline" asChild>
                <a href={confirmation.receiptUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </a>
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            A confirmation email has been sent to your email address.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clinicSlug = searchParams.get('clinic') || 'smile-ortho-main';
  const returnTo = searchParams.get('returnTo');

  const [activeTab, setActiveTab] = useState<'magic-link' | 'password'>('magic-link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/portal/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, clinicSlug }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error?.message || 'Failed to send login link');
        return;
      }

      setMagicLinkSent(true);

      // In development, if we get a dev token, auto-verify it
      if (result.devToken) {
        const verifyResponse = await fetch(`/api/portal/auth/magic-link?token=${result.devToken}`);
        if (verifyResponse.ok) {
          router.push(returnTo || '/portal');
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/portal/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, clinicSlug }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error?.message || 'Invalid email or password');
        return;
      }

      router.push(returnTo || '/portal');
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4 safe-area-inset">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Mail className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-xl">Check your email</CardTitle>
            <CardDescription className="text-base">
              We sent a login link to <strong className="text-foreground">{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <p className="text-sm text-muted-foreground text-center">
              Click the link in the email to sign in. The link will expire in 15 minutes.
            </p>
            <Button
              variant="outline"
              className="w-full h-12 text-base active:scale-[0.98] touch-action-manipulation"
              onClick={() => setMagicLinkSent(false)}
            >
              Use a different email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col safe-area-inset">
      {/* Header */}
      <header className="p-4 pt-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-xl">O</span>
          </div>
          <span className="font-semibold text-xl">Orca</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription className="text-base">
              Sign in to access your patient portal
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {error && (
              <Alert variant="destructive" className="mb-5">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'magic-link' | 'password')}>
              <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                <TabsTrigger value="magic-link" className="h-10 text-sm data-[state=active]:text-primary-foreground">
                  Email Link
                </TabsTrigger>
                <TabsTrigger value="password" className="h-10 text-sm data-[state=active]:text-primary-foreground">
                  Password
                </TabsTrigger>
              </TabsList>

              <TabsContent value="magic-link" className="mt-0">
                <form onSubmit={handleMagicLink} className="space-y-5">
                  <FormField label="Email address">
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11 h-12 text-base"
                        required
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                  </FormField>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base active:scale-[0.98] touch-action-manipulation"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Send login link
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>

                  <p className="text-sm text-muted-foreground text-center">
                    We'll send you a secure link to sign in without a password
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="password" className="mt-0">
                <form onSubmit={handlePasswordLogin} className="space-y-5">
                  <FormField label="Email address">
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11 h-12 text-base"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </FormField>

                  <FormField label="Password">
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 h-12 text-base"
                        required
                        autoComplete="current-password"
                      />
                    </div>
                  </FormField>

                  <div className="flex justify-end">
                    <Link
                      href={`/portal/forgot-password?clinic=${clinicSlug}`}
                      className="text-sm text-primary font-medium hover:underline active:opacity-70 touch-action-manipulation py-1"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base active:scale-[0.98] touch-action-manipulation"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link
                  href={`/portal/register?clinic=${clinicSlug}`}
                  className="text-primary font-medium hover:underline active:opacity-70 touch-action-manipulation"
                >
                  Create one
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="p-4 pb-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Orca Practice Management</p>
      </footer>
    </div>
  );
}

"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, LogIn, AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Error messages for different auth errors
const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid email or password",
  ACCOUNT_DISABLED: "Your account has been disabled. Contact your administrator.",
  ACCOUNT_LOCKED: "Your account is temporarily locked due to too many failed attempts. Try again in 15 minutes.",
  CLINIC_DISABLED: "This clinic has been disabled. Contact support.",
  default: "An error occurred during sign in. Please try again.",
};

/**
 * Login form component that uses useSearchParams
 * Wrapped in Suspense boundary for Next.js 15 compatibility
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam ? ERROR_MESSAGES[errorParam] || ERROR_MESSAGES.default : null
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(ERROR_MESSAGES[result.error] || ERROR_MESSAGES.default);
        setIsLoading(false);
        return;
      }

      // Success - redirect to callback URL
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError(ERROR_MESSAGES.default);
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-5">
        <FormField label="Email" required>
          <Input
            type="email"
            placeholder="you@clinic.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputSize="lg"
            disabled={isLoading}
            required
          />
        </FormField>

        <FormField label="Password" required>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="pr-12"
              inputSize="lg"
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </FormField>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" disabled={isLoading} />
            <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
              Remember me
            </Label>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isLoading}
          disabled={isLoading || !email || !password}
        >
          {!isLoading && <LogIn className="h-5 w-5" />}
          Sign in
        </Button>
      </form>
    </>
  );
}

/**
 * Loading fallback for Suspense boundary
 */
function LoginFormFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 sm:p-8 bg-background">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/images/logo/orca-logo-transparent.png"
            alt="Orca - Orthodontic Records & Clinical Administration"
            width={120}
            height={120}
            priority
          />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Form - wrapped in Suspense for useSearchParams */}
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>

        {/* Info Card */}
        <Card variant="ghost" padding="default" className="mt-8">
          <p className="text-sm text-muted-foreground text-center">
            Contact your clinic administrator if you need access or have forgotten your password.
          </p>
        </Card>

        {/* Footer Links */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Need help?{" "}
            <Link href="/support" className="text-primary-600 hover:text-primary-700 font-medium">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

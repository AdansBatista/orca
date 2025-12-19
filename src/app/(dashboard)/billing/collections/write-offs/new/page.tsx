'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, AlertTriangle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface AccountSearchResult {
  id: string;
  accountNumber: string;
  balance: number;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function NewWriteOffPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AccountSearchResult[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    amount: 0,
    reason: '',
    reasonDetails: '',
  });

  async function handleSearch() {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(`/api/billing/accounts?search=${encodeURIComponent(searchQuery)}&hasBalance=true`);
      const data = await res.json();

      if (data.success) {
        setSearchResults(data.data.items || []);
      }
    } catch (error) {
      console.error('Failed to search accounts:', error);
    } finally {
      setSearching(false);
    }
  }

  function handleSelectAccount(account: AccountSearchResult) {
    setSelectedAccount(account);
    setFormData({
      ...formData,
      amount: account.balance,
    });
    setSearchResults([]);
    setSearchQuery('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAccount) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/collections/write-offs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccount.id,
          amount: formData.amount,
          reason: formData.reason,
          reasonDetails: formData.reasonDetails || undefined,
        }),
      });

      if (res.ok) {
        router.push('/billing/collections/write-offs');
      } else {
        const error = await res.json();
        alert(error.error?.message || 'Failed to create write-off request');
      }
    } catch (error) {
      console.error('Failed to create write-off:', error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/billing/collections/write-offs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Request Write-off</h1>
          <p className="text-muted-foreground">
            Submit a bad debt write-off request for approval
          </p>
        </div>
      </div>

      {/* Warning */}
      <Card variant="ghost" className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/20">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">Important</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Write-offs require approval from an authorized supervisor. Ensure all collection
              efforts have been exhausted before requesting a write-off.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Selection */}
      {!selectedAccount ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by account number or patient name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searching}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>

            {searching && (
              <p className="text-center text-muted-foreground">Searching...</p>
            )}

            {searchResults.length > 0 && (
              <div className="border rounded-lg divide-y">
                {searchResults.map((account) => (
                  <button
                    key={account.id}
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 text-left"
                    onClick={() => handleSelectAccount(account)}
                  >
                    <div>
                      <p className="font-medium">{account.accountNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        <PhiProtected fakeData={getFakeName()}>
                          {account.patient.firstName} {account.patient.lastName}
                        </PhiProtected>
                      </p>
                    </div>
                    <p className="font-semibold text-red-600">
                      {formatCurrency(account.balance)}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {searchResults.length === 0 && searchQuery && !searching && (
              <p className="text-center text-muted-foreground">No accounts found with balance</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Selected Account */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Selected Account</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedAccount(null)}>
                Change
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedAccount.accountNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    <PhiProtected fakeData={getFakeName()}>
                      {selectedAccount.patient.firstName} {selectedAccount.patient.lastName}
                    </PhiProtected>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(selectedAccount.balance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Write-off Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Write-off Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Write-off Amount" required>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    min={0.01}
                    max={selectedAccount.balance}
                    step={0.01}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Maximum: {formatCurrency(selectedAccount.balance)}
                  </p>
                </FormField>

                <FormField label="Reason" required>
                  <Select
                    value={formData.reason}
                    onValueChange={(value) => setFormData({ ...formData, reason: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BANKRUPTCY">Bankruptcy</SelectItem>
                      <SelectItem value="DECEASED">Deceased</SelectItem>
                      <SelectItem value="UNCOLLECTIBLE">Uncollectible</SelectItem>
                      <SelectItem value="STATUTE_OF_LIMITATIONS">Statute of Limitations</SelectItem>
                      <SelectItem value="SMALL_BALANCE">Small Balance</SelectItem>
                      <SelectItem value="HARDSHIP">Financial Hardship</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Additional Details">
                  <Textarea
                    value={formData.reasonDetails}
                    onChange={(e) => setFormData({ ...formData, reasonDetails: e.target.value })}
                    placeholder="Provide additional context for this write-off request..."
                    rows={4}
                  />
                </FormField>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" asChild className="flex-1">
                    <Link href="/billing/collections/write-offs">Cancel</Link>
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submitting || !formData.reason || formData.amount <= 0}
                  >
                    {submitting ? 'Submitting...' : 'Submit for Approval'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

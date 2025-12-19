'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  DollarSign,
  Clock,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  Send,
  Building2,
  History,
  Plus,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName, getFakePhone, getFakeEmail } from '@/lib/fake-data';

interface AccountCollection {
  id: string;
  status: string;
  currentStage: string;
  originalBalance: number;
  currentBalance: number;
  totalCollected: number;
  lastContactDate: string | null;
  nextActionDate: string | null;
  assignedTo: string | null;
  notes: string | null;
  account: {
    id: string;
    accountNumber: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
    };
  };
  workflow: {
    id: string;
    name: string;
  };
  promises: Array<{
    id: string;
    promisedAmount: number;
    promisedDate: string;
    status: string;
  }>;
  activities: Array<{
    id: string;
    activityType: string;
    description: string;
    performedAt: string;
    performedBy: string | null;
  }>;
  agencyReferral: {
    id: string;
    agency: {
      id: string;
      name: string;
    };
    referralDate: string;
    status: string;
    amountReferred: number;
    amountCollected: number;
  } | null;
}

export default function AccountCollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [collection, setCollection] = useState<AccountCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPromiseDialogOpen, setIsPromiseDialogOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [promiseData, setPromiseData] = useState({
    amount: 0,
    date: '',
    notes: '',
  });
  const [activityData, setActivityData] = useState({
    type: 'NOTE',
    description: '',
  });

  useEffect(() => {
    if (params.id) {
      fetchCollection(params.id as string);
    }
  }, [params.id]);

  async function fetchCollection(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/collections/accounts/${id}`);
      const data = await res.json();

      if (data.success) {
        setCollection(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch collection:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePauseResume() {
    if (!collection) return;

    const action = collection.status === 'PAUSED' ? 'resume' : 'pause';
    const reason = action === 'pause' ? prompt('Enter pause reason:') : undefined;

    try {
      const res = await fetch(`/api/collections/accounts/${collection.id}?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        fetchCollection(collection.id);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }

  async function handleAdvanceStage() {
    if (!collection) return;

    try {
      const res = await fetch(`/api/collections/accounts/${collection.id}?action=advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        fetchCollection(collection.id);
      }
    } catch (error) {
      console.error('Failed to advance stage:', error);
    }
  }

  async function handleSendToAgency() {
    if (!collection) return;

    // In a real app, you'd show a dialog to select agency
    const agencyId = prompt('Enter agency ID:');
    if (!agencyId) return;

    try {
      const res = await fetch(`/api/collections/accounts/${collection.id}/send-to-agency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId }),
      });

      if (res.ok) {
        fetchCollection(collection.id);
      }
    } catch (error) {
      console.error('Failed to send to agency:', error);
    }
  }

  async function handleCreatePromise(e: React.FormEvent) {
    e.preventDefault();
    if (!collection) return;

    try {
      const res = await fetch(`/api/collections/accounts/${collection.id}/promise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promisedAmount: promiseData.amount,
          promisedDate: promiseData.date,
          notes: promiseData.notes,
        }),
      });

      if (res.ok) {
        setIsPromiseDialogOpen(false);
        setPromiseData({ amount: 0, date: '', notes: '' });
        fetchCollection(collection.id);
      }
    } catch (error) {
      console.error('Failed to create promise:', error);
    }
  }

  async function handleLogActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!collection) return;

    try {
      const res = await fetch(`/api/collections/accounts/${collection.id}?action=activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: activityData.type,
          description: activityData.description,
        }),
      });

      if (res.ok) {
        setIsActivityDialogOpen(false);
        setActivityData({ type: 'NOTE', description: '' });
        fetchCollection(collection.id);
      }
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  function getStatusColor(status: string): "success" | "info" | "warning" | "destructive" | "secondary" {
    switch (status) {
      case 'ACTIVE':
        return 'warning';
      case 'PAUSED':
        return 'secondary';
      case 'PAYMENT_PLAN':
        return 'info';
      case 'SETTLED':
      case 'COMPLETED':
        return 'success';
      case 'WRITTEN_OFF':
        return 'destructive';
      case 'AGENCY':
        return 'info';
      default:
        return 'secondary';
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/billing/collections/workqueue">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Account Collection</h1>
        </div>
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/billing/collections/workqueue">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Account Collection</h1>
        </div>
        <div className="text-center py-12 text-muted-foreground">Account not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/billing/collections/workqueue">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">
              <PhiProtected fakeData={getFakeName()}>
                {collection.account.patient.firstName} {collection.account.patient.lastName}
              </PhiProtected>
            </h1>
            <Badge variant={getStatusColor(collection.status)}>
              {collection.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Account: {collection.account.accountNumber} | Stage: {collection.currentStage}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePauseResume}>
            {collection.status === 'PAUSED' ? (
              <>
                <Play className="mr-2 h-4 w-4" />
                Resume
              </>
            ) : (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </>
            )}
          </Button>
          {collection.status === 'ACTIVE' && (
            <>
              <Button variant="outline" onClick={handleAdvanceStage}>
                Advance Stage
              </Button>
              <Button variant="outline" onClick={handleSendToAgency}>
                <Building2 className="mr-2 h-4 w-4" />
                Send to Agency
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-xl font-bold">{formatCurrency(collection.currentBalance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Collected</p>
                <p className="text-xl font-bold">{formatCurrency(collection.totalCollected)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Original Balance</p>
                <p className="text-xl font-bold">{formatCurrency(collection.originalBalance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Action</p>
                <p className="text-lg font-medium">
                  {collection.nextActionDate
                    ? new Date(collection.nextActionDate).toLocaleDateString()
                    : 'Not scheduled'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Info & Details */}
      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {collection.account.patient.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <PhiProtected fakeData={getFakePhone()}>
                  {collection.account.patient.phone}
                </PhiProtected>
              </div>
            )}
            {collection.account.patient.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <PhiProtected fakeData={getFakeEmail()}>
                  {collection.account.patient.email}
                </PhiProtected>
              </div>
            )}
            {collection.lastContactDate && (
              <div className="text-sm text-muted-foreground mt-4">
                Last contacted: {new Date(collection.lastContactDate).toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Workflow: {collection.workflow.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Stage</p>
                <p className="font-medium">{collection.currentStage}</p>
              </div>
              {collection.notes && (
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{collection.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Promises, Activities, Agency */}
      <Tabs defaultValue="promises">
        <TabsList>
          <TabsTrigger value="promises">Payment Promises</TabsTrigger>
          <TabsTrigger value="activities">Activity Log</TabsTrigger>
          {collection.agencyReferral && <TabsTrigger value="agency">Agency Referral</TabsTrigger>}
        </TabsList>

        <TabsContent value="promises" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Payment Promises</CardTitle>
              <Button size="sm" onClick={() => setIsPromiseDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Promise
              </Button>
            </CardHeader>
            <CardContent>
              {collection.promises.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No payment promises recorded</p>
              ) : (
                <div className="space-y-3">
                  {collection.promises.map((promise) => (
                    <div key={promise.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{formatCurrency(promise.promisedAmount)}</p>
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(promise.promisedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={promise.status === 'FULFILLED' ? 'success' : promise.status === 'BROKEN' ? 'destructive' : 'warning'}>
                        {promise.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Activity Log</CardTitle>
              <Button size="sm" onClick={() => setIsActivityDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Log Activity
              </Button>
            </CardHeader>
            <CardContent>
              {collection.activities.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No activities recorded</p>
              ) : (
                <div className="space-y-3">
                  {collection.activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <History className="h-4 w-4 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="soft-primary" size="sm">{activity.activityType}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(activity.performedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{activity.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {collection.agencyReferral && (
          <TabsContent value="agency" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Agency Referral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Agency</p>
                    <p className="font-medium">{collection.agencyReferral.agency.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={collection.agencyReferral.status === 'ACTIVE' ? 'warning' : 'success'}>
                      {collection.agencyReferral.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Referred</p>
                    <p className="font-medium">{formatCurrency(collection.agencyReferral.amountReferred)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Collected</p>
                    <p className="font-medium">{formatCurrency(collection.agencyReferral.amountCollected)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Referral Date</p>
                    <p className="font-medium">{new Date(collection.agencyReferral.referralDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Create Promise Dialog */}
      <Dialog open={isPromiseDialogOpen} onOpenChange={setIsPromiseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Promise</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePromise} className="space-y-4">
            <FormField label="Promised Amount" required>
              <Input
                type="number"
                value={promiseData.amount}
                onChange={(e) => setPromiseData({ ...promiseData, amount: parseFloat(e.target.value) })}
                min={0}
                step={0.01}
                required
              />
            </FormField>
            <FormField label="Promise Date" required>
              <Input
                type="date"
                value={promiseData.date}
                onChange={(e) => setPromiseData({ ...promiseData, date: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Notes">
              <Textarea
                value={promiseData.notes}
                onChange={(e) => setPromiseData({ ...promiseData, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPromiseDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Promise</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Log Activity Dialog */}
      <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Activity</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogActivity} className="space-y-4">
            <FormField label="Activity Type" required>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={activityData.type}
                onChange={(e) => setActivityData({ ...activityData, type: e.target.value })}
              >
                <option value="NOTE">Note</option>
                <option value="CALL_ATTEMPTED">Call Attempted</option>
                <option value="CALL_COMPLETED">Call Completed</option>
                <option value="EMAIL_SENT">Email Sent</option>
                <option value="LETTER_SENT">Letter Sent</option>
                <option value="PAYMENT_RECEIVED">Payment Received</option>
                <option value="PROMISE_MADE">Promise Made</option>
                <option value="DISPUTE">Dispute</option>
              </select>
            </FormField>
            <FormField label="Description" required>
              <Textarea
                value={activityData.description}
                onChange={(e) => setActivityData({ ...activityData, description: e.target.value })}
                placeholder="Describe the activity..."
                required
              />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsActivityDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Log Activity</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  FileText,
  AlertCircle,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  FileCheck,
  ArrowRight,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { StatsRow } from '@/components/layout';

interface DashboardStats {
  companies: { total: number };
  claims: {
    total: number;
    draft: number;
    submitted: number;
    pending: number;
    paid: number;
    denied: number;
    totalBilled: number;
    totalPaid: number;
  };
  eobs: {
    pending: number;
    needsReview: number;
    totalReceived: number;
  };
  denials: {
    total: number;
    urgentCount: number;
  };
}

export default function InsuranceDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch claims stats
        const claimsRes = await fetch('/api/insurance/claims?pageSize=1');
        const claimsData = await claimsRes.json();

        // Fetch companies count
        const companiesRes = await fetch('/api/insurance/companies?pageSize=1');
        const companiesData = await companiesRes.json();

        // Fetch EOBs stats
        const eobsRes = await fetch('/api/insurance/eobs?pageSize=1');
        const eobsData = await eobsRes.json();

        // Fetch denials count
        const denialsRes = await fetch('/api/insurance/denials?pageSize=1');
        const denialsData = await denialsRes.json();

        const claimStats = claimsData.data?.stats?.statusCounts || {};
        const eobStats = eobsData.data?.stats || {};

        setStats({
          companies: { total: companiesData.data?.total || 0 },
          claims: {
            total: claimsData.data?.total || 0,
            draft: claimStats.DRAFT?.count || 0,
            submitted: claimStats.SUBMITTED?.count || 0,
            pending: (claimStats.ACCEPTED?.count || 0) + (claimStats.IN_PROCESS?.count || 0),
            paid: claimStats.PAID?.count || 0,
            denied: claimStats.DENIED?.count || 0,
            totalBilled: Object.values(claimStats).reduce((sum: number, s: unknown) =>
              sum + ((s as { billedAmount?: number }).billedAmount || 0), 0),
            totalPaid: Object.values(claimStats).reduce((sum: number, s: unknown) =>
              sum + ((s as { paidAmount?: number }).paidAmount || 0), 0),
          },
          eobs: {
            pending: eobStats.statusCounts?.PENDING?.count || 0,
            needsReview: eobStats.needsReviewCount || 0,
            totalReceived: eobsData.data?.total || 0,
          },
          denials: {
            total: denialsData.data?.total || 0,
            urgentCount: denialsData.data?.stats?.urgentCount || 0,
          },
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Insurance Claims</h1>
          <p className="text-muted-foreground">
            Manage insurance claims, eligibility, and EOB processing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/billing/insurance/eligibility">
            <Button variant="outline">
              <CheckCircle className="mr-2 h-4 w-4" />
              Verify Eligibility
            </Button>
          </Link>
          <Link href="/billing/insurance/claims/new">
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              New Claim
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <StatsRow>
        <StatCard
          accentColor="primary"
          label="Total Claims"
          value={stats?.claims.total || 0}
          description="All time"
        />
        <StatCard
          accentColor="accent"
          label="Total Billed"
          value={formatCurrency(stats?.claims.totalBilled || 0)}
          description="Insurance charges"
        />
        <StatCard
          accentColor="success"
          label="Total Paid"
          value={formatCurrency(stats?.claims.totalPaid || 0)}
          description="Received from insurance"
        />
        <StatCard
          accentColor="warning"
          label="Pending EOBs"
          value={stats?.eobs.pending || 0}
          description={`${stats?.eobs.needsReview || 0} need review`}
        />
      </StatsRow>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Pending Claims */}
        <Link href="/billing/insurance/claims?status=SUBMITTED">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.claims.submitted || 0}</p>
                <p className="text-sm text-muted-foreground">Submitted Claims</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Denied Claims */}
        <Link href="/billing/insurance/denials">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.denials.total || 0}</p>
                <p className="text-sm text-muted-foreground">
                  Denied Claims
                  {(stats?.denials.urgentCount || 0) > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {stats?.denials.urgentCount} urgent
                    </Badge>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* EOBs to Review */}
        <Link href="/billing/insurance/eobs?needsReview=true">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <FileCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.eobs.needsReview || 0}</p>
                <p className="text-sm text-muted-foreground">EOBs Need Review</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Insurance Companies */}
        <Link href="/billing/insurance/companies">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.companies.total || 0}</p>
                <p className="text-sm text-muted-foreground">Insurance Companies</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Claims by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Claims Overview
            </CardTitle>
            <CardDescription>Claims by status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gray-400" />
                  <span className="text-sm">Draft</span>
                </div>
                <span className="font-medium">{stats?.claims.draft || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Submitted</span>
                </div>
                <span className="font-medium">{stats?.claims.submitted || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-indigo-500" />
                  <span className="text-sm">Pending</span>
                </div>
                <span className="font-medium">{stats?.claims.pending || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm">Paid</span>
                </div>
                <span className="font-medium">{stats?.claims.paid || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm">Denied</span>
                </div>
                <span className="font-medium">{stats?.claims.denied || 0}</span>
              </div>
            </div>
            <Link href="/billing/insurance/claims">
              <Button variant="outline" className="w-full">
                View All Claims
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common insurance tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/billing/insurance/claims/new">
              <Button variant="ghost" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Create New Claim
              </Button>
            </Link>
            <Link href="/billing/insurance/eligibility">
              <Button variant="ghost" className="w-full justify-start">
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify Patient Eligibility
              </Button>
            </Link>
            <Link href="/billing/insurance/eobs">
              <Button variant="ghost" className="w-full justify-start">
                <FileCheck className="mr-2 h-4 w-4" />
                Process EOBs
              </Button>
            </Link>
            <Link href="/billing/insurance/denials">
              <Button variant="ghost" className="w-full justify-start">
                <AlertCircle className="mr-2 h-4 w-4" />
                Manage Denials
              </Button>
            </Link>
            <Link href="/billing/insurance/preauthorizations">
              <Button variant="ghost" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                Pre-Authorizations
              </Button>
            </Link>
            <Link href="/billing/insurance/companies">
              <Button variant="ghost" className="w-full justify-start">
                <Building2 className="mr-2 h-4 w-4" />
                Insurance Companies
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

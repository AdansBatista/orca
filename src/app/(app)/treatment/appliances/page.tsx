'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutGrid,
  Workflow,
  SmilePlus,
  Shield,
  Plus,
  ChevronRight,
  Search,
  Filter,
  Package,
  Clock,
  CircleDot,
  RotateCw,
} from 'lucide-react';

import { PageHeader, PageContent, StatsRow, DashboardGrid } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ListItem, ListItemTitle, ListItemDescription } from '@/components/ui/list-item';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface ApplianceStats {
  activeAppliances: number;
  activeBrackets: number;
  activeAligners: number;
  pendingRetainers: number;
  wiresChangedThisMonth: number;
  alignerDeliveriesThisMonth: number;
}

interface RecentAppliance {
  id: string;
  patientName: string;
  applianceType: string;
  status: string;
  arch: string;
  placedDate: string | null;
}

interface RecentAligner {
  id: string;
  patientName: string;
  alignerSystem: string;
  currentAligner: number;
  totalAligners: number;
  status: string;
}

const applianceTypeLabels: Record<string, string> = {
  BRACKETS: 'Brackets',
  BANDS: 'Bands',
  ALIGNERS: 'Aligners',
  RETAINER_FIXED: 'Fixed Retainer',
  RETAINER_REMOVABLE: 'Removable Retainer',
  EXPANDER: 'Expander',
  HERBST: 'Herbst',
  MARA: 'MARA',
  HEADGEAR: 'Headgear',
  FACEMASK: 'Facemask',
  TAD: 'TAD',
  ELASTICS: 'Elastics',
  SPRING: 'Spring',
  POWER_CHAIN: 'Power Chain',
  OTHER: 'Other',
};

const archLabels: Record<string, string> = {
  UPPER: 'Upper',
  LOWER: 'Lower',
  BOTH: 'Both',
};

const statusVariants: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'secondary'> = {
  ACTIVE: 'success',
  ORDERED: 'info',
  RECEIVED: 'info',
  ADJUSTED: 'warning',
  REMOVED: 'secondary',
  REPLACED: 'secondary',
  LOST: 'destructive',
  BROKEN: 'destructive',
  IN_PROGRESS: 'success',
  SUBMITTED: 'info',
  APPROVED: 'info',
  MANUFACTURING: 'warning',
  REFINEMENT: 'warning',
  COMPLETED: 'success',
  DISCONTINUED: 'secondary',
};

export default function ApplianceManagementPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ApplianceStats>({
    activeAppliances: 0,
    activeBrackets: 0,
    activeAligners: 0,
    pendingRetainers: 0,
    wiresChangedThisMonth: 0,
    alignerDeliveriesThisMonth: 0,
  });
  const [recentAppliances, setRecentAppliances] = useState<RecentAppliance[]>([]);
  const [recentAligners, setRecentAligners] = useState<RecentAligner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch stats and recent data in parallel
        const [appliancesRes, alignersRes, retainersRes] = await Promise.all([
          fetch('/api/appliances?status=ACTIVE&pageSize=5&sortBy=createdAt&sortOrder=desc'),
          fetch('/api/aligners?status=IN_PROGRESS&pageSize=5&sortBy=createdAt&sortOrder=desc'),
          fetch('/api/retainers?status=ORDERED&pageSize=5'),
        ]);

        const [appliancesData, alignersData, retainersData] = await Promise.all([
          appliancesRes.json(),
          alignersRes.json(),
          retainersRes.json(),
        ]);

        // Calculate stats
        const activeAppliances = appliancesData.success ? appliancesData.data.total : 0;
        const activeAligners = alignersData.success ? alignersData.data.total : 0;
        const pendingRetainers = retainersData.success ? retainersData.data.total : 0;

        // Count brackets specifically
        const bracketsRes = await fetch('/api/appliances?applianceType=BRACKETS&status=ACTIVE&pageSize=1');
        const bracketsData = await bracketsRes.json();
        const activeBrackets = bracketsData.success ? bracketsData.data.total : 0;

        setStats({
          activeAppliances,
          activeBrackets,
          activeAligners,
          pendingRetainers,
          wiresChangedThisMonth: 0, // Would need separate API call with date filter
          alignerDeliveriesThisMonth: 0, // Would need separate API call
        });

        // Set recent data
        if (appliancesData.success && appliancesData.data.items) {
          setRecentAppliances(
            appliancesData.data.items.map((item: {
              id: string;
              patient: { firstName: string; lastName: string };
              applianceType: string;
              status: string;
              arch: string;
              placedDate: string | null;
            }) => ({
              id: item.id,
              patientName: `${item.patient.firstName} ${item.patient.lastName}`,
              applianceType: item.applianceType,
              status: item.status,
              arch: item.arch,
              placedDate: item.placedDate,
            }))
          );
        }

        if (alignersData.success && alignersData.data.items) {
          setRecentAligners(
            alignersData.data.items.map((item: {
              id: string;
              patient: { firstName: string; lastName: string };
              alignerSystem: string;
              currentAligner: number;
              totalAligners: number;
              status: string;
            }) => ({
              id: item.id,
              patientName: `${item.patient.firstName} ${item.patient.lastName}`,
              alignerSystem: item.alignerSystem,
              currentAligner: item.currentAligner,
              totalAligners: item.totalAligners,
              status: item.status,
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching appliance data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const quickLinks = [
    {
      label: 'Brackets & Bands',
      href: '/treatment/appliances/brackets',
      icon: LayoutGrid,
      description: 'Fixed appliances',
    },
    {
      label: 'Wire Tracking',
      href: '/treatment/appliances/wires',
      icon: Workflow,
      description: 'Wire progressions',
    },
    {
      label: 'Aligners',
      href: '/treatment/appliances/aligners',
      icon: SmilePlus,
      description: 'Clear aligner cases',
    },
    {
      label: 'Retainers',
      href: '/treatment/appliances/retainers',
      icon: Shield,
      description: 'Retention management',
    },
    {
      label: 'Elastics',
      href: '/treatment/appliances/elastics',
      icon: CircleDot,
      description: 'Elastic prescriptions',
    },
    {
      label: 'Activations',
      href: '/treatment/appliances/activations',
      icon: RotateCw,
      description: 'Expander activations',
    },
  ];

  return (
    <>
      <PageHeader
        title="Appliance Management"
        description="Track brackets, wires, aligners, and retainers"
        actions={
          <Button onClick={() => router.push('/treatment/appliances/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Appliance
          </Button>
        }
      />

      <PageContent>
        {/* Stats Row */}
        <StatsRow>
          <StatCard accentColor="primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Appliances</p>
                <p className="text-2xl font-bold">{stats.activeAppliances}</p>
                <p className="text-xs text-muted-foreground">Currently placed</p>
              </div>
              <LayoutGrid className="h-8 w-8 text-primary-500" />
            </div>
          </StatCard>
          <StatCard accentColor="success">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Brackets</p>
                <p className="text-2xl font-bold">{stats.activeBrackets}</p>
                <p className="text-xs text-muted-foreground">Patients in braces</p>
              </div>
              <Package className="h-8 w-8 text-success-500" />
            </div>
          </StatCard>
          <StatCard accentColor="accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Aligner Cases</p>
                <p className="text-2xl font-bold">{stats.activeAligners}</p>
                <p className="text-xs text-muted-foreground">In progress</p>
              </div>
              <SmilePlus className="h-8 w-8 text-accent-500" />
            </div>
          </StatCard>
          <StatCard accentColor="warning">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending Retainers</p>
                <p className="text-2xl font-bold">{stats.pendingRetainers}</p>
                <p className="text-xs text-muted-foreground">Ordered/awaiting</p>
              </div>
              <Shield className="h-8 w-8 text-warning-500" />
            </div>
          </StatCard>
        </StatsRow>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <link.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{link.label}</p>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Main Content Grid */}
        <DashboardGrid>
          <DashboardGrid.TwoThirds>
            {/* Recent Appliances */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle size="sm">Recent Appliances</CardTitle>
                <Link href="/treatment/appliances/brackets">
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : recentAppliances.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active appliances found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentAppliances.map((appliance) => (
                      <ListItem
                        key={appliance.id}
                        showArrow
                        onClick={() => router.push(`/treatment/appliances/brackets/${appliance.id}`)}
                        leading={
                          <div className="p-2 rounded-lg bg-muted">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                        }
                        trailing={
                          <Badge variant={statusVariants[appliance.status] || 'secondary'}>
                            {appliance.status}
                          </Badge>
                        }
                      >
                        <ListItemTitle>
                          <PhiProtected fakeData={getFakeName()}>
                            {appliance.patientName}
                          </PhiProtected>
                        </ListItemTitle>
                        <ListItemDescription>
                          {applianceTypeLabels[appliance.applianceType] || appliance.applianceType} •{' '}
                          {archLabels[appliance.arch] || appliance.arch}
                          {appliance.placedDate && (
                            <> • Placed {new Date(appliance.placedDate).toLocaleDateString()}</>
                          )}
                        </ListItemDescription>
                      </ListItem>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Aligner Cases */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle size="sm">Active Aligner Cases</CardTitle>
                <Link href="/treatment/appliances/aligners">
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : recentAligners.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active aligner cases found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentAligners.map((aligner) => (
                      <ListItem
                        key={aligner.id}
                        showArrow
                        onClick={() => router.push(`/treatment/appliances/aligners/${aligner.id}`)}
                        leading={
                          <div className="p-2 rounded-lg bg-muted">
                            <SmilePlus className="h-4 w-4 text-accent" />
                          </div>
                        }
                        trailing={
                          <div className="text-right">
                            <p className="font-medium text-sm">
                              {aligner.currentAligner}/{aligner.totalAligners}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {Math.round((aligner.currentAligner / aligner.totalAligners) * 100)}% complete
                            </p>
                          </div>
                        }
                      >
                        <ListItemTitle>
                          <PhiProtected fakeData={getFakeName()}>
                            {aligner.patientName}
                          </PhiProtected>
                        </ListItemTitle>
                        <ListItemDescription>
                          {aligner.alignerSystem}
                        </ListItemDescription>
                      </ListItem>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </DashboardGrid.TwoThirds>

          <DashboardGrid.OneThird>
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle size="sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/treatment/appliances/brackets/new')}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Place Brackets
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/treatment/appliances/wires/new')}
                >
                  <Workflow className="h-4 w-4 mr-2" />
                  Record Wire Change
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/treatment/appliances/aligners/new')}
                >
                  <SmilePlus className="h-4 w-4 mr-2" />
                  Start Aligner Case
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/treatment/appliances/retainers/new')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Order Retainer
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/treatment/appliances/elastics/new')}
                >
                  <CircleDot className="h-4 w-4 mr-2" />
                  Prescribe Elastics
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/treatment/appliances/activations/new')}
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Record Activation
                </Button>
              </CardContent>
            </Card>

            {/* Appliance Types Reference */}
            <Card>
              <CardHeader>
                <CardTitle size="sm">Appliance Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <LayoutGrid className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Fixed Appliances</p>
                      <p className="text-muted-foreground">Brackets, bands, expanders</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Workflow className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Wires</p>
                      <p className="text-muted-foreground">NiTi, SS, TMA sequences</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <SmilePlus className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Clear Aligners</p>
                      <p className="text-muted-foreground">Invisalign, ClearCorrect, etc.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Retainers</p>
                      <p className="text-muted-foreground">Hawley, Essix, fixed bonded</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </DashboardGrid.OneThird>
        </DashboardGrid>
      </PageContent>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Shield,
  ArrowLeft,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Activity,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface RetentionProtocol {
  id: string;
  treatmentPlanId: string;
  planNumber: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  startDate: string;
  currentPhase: string;
  currentWearSchedule: string;
  complianceLevel: string;
  upperRetainerType: string | null;
  lowerRetainerType: string | null;
  nextCheckDate: string | null;
  isActive: boolean;
  totalChecks: number;
  lastCheckDate: string | null;
}

const phaseLabels: Record<string, string> = {
  FULL_TIME: 'Full Time',
  NIGHTS_ONLY: 'Nights Only',
  ALTERNATING_NIGHTS: 'Alternating Nights',
  WEEKLY: 'Weekly',
  AS_NEEDED: 'As Needed',
  COMPLETED: 'Completed',
};

const complianceColors: Record<string, string> = {
  EXCELLENT: 'text-success-600 bg-success-100',
  GOOD: 'text-info-600 bg-info-100',
  FAIR: 'text-warning-600 bg-warning-100',
  POOR: 'text-destructive bg-destructive/10',
  UNKNOWN: 'text-muted-foreground bg-muted',
};

const retainerTypeLabels: Record<string, string> = {
  HAWLEY: 'Hawley',
  ESSIX: 'Essix',
  BONDED: 'Bonded',
  VIVERA: 'Vivera',
  ZENDURA: 'Zendura',
  OTHER: 'Other',
};

export default function RetentionProtocolsPage() {
  const router = useRouter();
  const [protocols, setProtocols] = useState<RetentionProtocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<string>('all');

  useEffect(() => {
    const fetchProtocols = async () => {
      try {
        // In production, this would fetch from the actual API
        setProtocols([
          {
            id: '1',
            treatmentPlanId: 'plan-1',
            planNumber: 'TP-2023-032',
            patient: { id: '1', firstName: 'Jessica', lastName: 'Taylor' },
            startDate: new Date(Date.now() - 90 * 86400000).toISOString(),
            currentPhase: 'NIGHTS_ONLY',
            currentWearSchedule: 'NIGHTS_ONLY',
            complianceLevel: 'EXCELLENT',
            upperRetainerType: 'ESSIX',
            lowerRetainerType: 'BONDED',
            nextCheckDate: new Date(Date.now() + 30 * 86400000).toISOString(),
            isActive: true,
            totalChecks: 3,
            lastCheckDate: new Date(Date.now() - 30 * 86400000).toISOString(),
          },
          {
            id: '2',
            treatmentPlanId: 'plan-2',
            planNumber: 'TP-2023-041',
            patient: { id: '2', firstName: 'Robert', lastName: 'Garcia' },
            startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
            currentPhase: 'FULL_TIME',
            currentWearSchedule: 'FULL_TIME',
            complianceLevel: 'GOOD',
            upperRetainerType: 'VIVERA',
            lowerRetainerType: 'VIVERA',
            nextCheckDate: new Date(Date.now() + 14 * 86400000).toISOString(),
            isActive: true,
            totalChecks: 1,
            lastCheckDate: new Date(Date.now() - 7 * 86400000).toISOString(),
          },
          {
            id: '3',
            treatmentPlanId: 'plan-3',
            planNumber: 'TP-2023-028',
            patient: { id: '3', firstName: 'Amanda', lastName: 'Lee' },
            startDate: new Date(Date.now() - 180 * 86400000).toISOString(),
            currentPhase: 'ALTERNATING_NIGHTS',
            currentWearSchedule: 'ALTERNATING_NIGHTS',
            complianceLevel: 'FAIR',
            upperRetainerType: 'HAWLEY',
            lowerRetainerType: 'ESSIX',
            nextCheckDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            isActive: true,
            totalChecks: 5,
            lastCheckDate: new Date(Date.now() - 45 * 86400000).toISOString(),
          },
          {
            id: '4',
            treatmentPlanId: 'plan-4',
            planNumber: 'TP-2022-089',
            patient: { id: '4', firstName: 'Kevin', lastName: 'White' },
            startDate: new Date(Date.now() - 365 * 86400000).toISOString(),
            currentPhase: 'AS_NEEDED',
            currentWearSchedule: 'AS_NEEDED',
            complianceLevel: 'EXCELLENT',
            upperRetainerType: 'ESSIX',
            lowerRetainerType: 'BONDED',
            nextCheckDate: new Date(Date.now() + 90 * 86400000).toISOString(),
            isActive: true,
            totalChecks: 8,
            lastCheckDate: new Date(Date.now() - 90 * 86400000).toISOString(),
          },
          {
            id: '5',
            treatmentPlanId: 'plan-5',
            planNumber: 'TP-2023-055',
            patient: { id: '5', firstName: 'Michelle', lastName: 'Harris' },
            startDate: new Date(Date.now() - 14 * 86400000).toISOString(),
            currentPhase: 'FULL_TIME',
            currentWearSchedule: 'FULL_TIME',
            complianceLevel: 'POOR',
            upperRetainerType: 'ESSIX',
            lowerRetainerType: 'ESSIX',
            nextCheckDate: new Date(Date.now() + 3 * 86400000).toISOString(),
            isActive: true,
            totalChecks: 1,
            lastCheckDate: new Date(Date.now() - 7 * 86400000).toISOString(),
          },
        ]);
      } catch (error) {
        console.error('Error fetching protocols:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProtocols();
  }, []);

  const filteredProtocols = protocols.filter((protocol) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const patientName = `${protocol.patient.firstName} ${protocol.patient.lastName}`.toLowerCase();
      if (!patientName.includes(query) && !protocol.planNumber.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Phase filter
    if (phaseFilter !== 'all' && protocol.currentPhase !== phaseFilter) return false;

    // Compliance filter
    if (complianceFilter !== 'all' && protocol.complianceLevel !== complianceFilter) return false;

    return true;
  });

  // Summary stats
  const totalActive = protocols.filter((p) => p.isActive).length;
  const excellentCompliance = protocols.filter((p) => p.complianceLevel === 'EXCELLENT').length;
  const poorCompliance = protocols.filter((p) => p.complianceLevel === 'POOR').length;
  const upcomingChecks = protocols.filter(
    (p) => p.nextCheckDate && new Date(p.nextCheckDate) <= new Date(Date.now() + 7 * 86400000)
  ).length;

  if (loading) {
    return (
      <>
        <PageHeader
          title="Retention Protocols"
          compact
          breadcrumbs={[
            { label: 'Treatment', href: '/treatment' },
            { label: 'Tracking', href: '/treatment/tracking' },
            { label: 'Retention' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Retention Protocols"
        description="Monitor patient retention wear and compliance"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Tracking', href: '/treatment/tracking' },
          { label: 'Retention' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Protocol
            </Button>
          </div>
        }
      />
      <PageContent density="comfortable">
        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{totalActive}</p>
              <p className="text-sm text-muted-foreground">Active Protocols</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-success-600">{excellentCompliance}</p>
              <p className="text-sm text-muted-foreground">Excellent Compliance</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-destructive">{poorCompliance}</p>
              <p className="text-sm text-muted-foreground">Poor Compliance</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-warning-600">{upcomingChecks}</p>
              <p className="text-sm text-muted-foreground">Checks This Week</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients or plan numbers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  <SelectItem value="FULL_TIME">Full Time</SelectItem>
                  <SelectItem value="NIGHTS_ONLY">Nights Only</SelectItem>
                  <SelectItem value="ALTERNATING_NIGHTS">Alternating</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="AS_NEEDED">As Needed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={complianceFilter} onValueChange={setComplianceFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Compliance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Compliance</SelectItem>
                  <SelectItem value="EXCELLENT">Excellent</SelectItem>
                  <SelectItem value="GOOD">Good</SelectItem>
                  <SelectItem value="FAIR">Fair</SelectItem>
                  <SelectItem value="POOR">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Protocols List */}
        <Card>
          <CardHeader compact>
            <CardTitle size="sm" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Retention Protocols ({filteredProtocols.length})
            </CardTitle>
          </CardHeader>
          <CardContent compact>
            {filteredProtocols.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium mb-2">No Protocols Found</p>
                <p className="text-muted-foreground">
                  {searchQuery || phaseFilter !== 'all' || complianceFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No retention protocols have been created'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProtocols.map((protocol) => (
                  <Link key={protocol.id} href={`/treatment/tracking/retention/${protocol.id}`}>
                    <div className="flex items-start justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            complianceColors[protocol.complianceLevel]
                          }`}
                        >
                          {protocol.complianceLevel === 'EXCELLENT' ? (
                            <CheckCircle2 className="h-6 w-6" />
                          ) : protocol.complianceLevel === 'POOR' ? (
                            <AlertTriangle className="h-6 w-6" />
                          ) : (
                            <Activity className="h-6 w-6" />
                          )}
                        </div>
                        <div>
                          <PhiProtected fakeData={getFakeName()}>
                            <p className="font-medium">
                              {protocol.patient.firstName} {protocol.patient.lastName}
                            </p>
                          </PhiProtected>
                          <p className="text-sm text-muted-foreground">{protocol.planNumber}</p>
                          <div className="flex items-center gap-4 mt-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Started: {format(new Date(protocol.startDate), 'MMM d, yyyy')}
                              </span>
                            </div>
                            {protocol.nextCheckDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <span
                                  className={`text-xs ${
                                    new Date(protocol.nextCheckDate) <= new Date(Date.now() + 7 * 86400000)
                                      ? 'text-warning-600 font-medium'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  Next check: {format(new Date(protocol.nextCheckDate), 'MMM d')}
                                </span>
                              </div>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {protocol.totalChecks} check{protocol.totalChecks !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{phaseLabels[protocol.currentPhase]}</Badge>
                          <Badge
                            className={complianceColors[protocol.complianceLevel]}
                          >
                            {protocol.complianceLevel}
                          </Badge>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          {protocol.upperRetainerType && (
                            <span>Upper: {retainerTypeLabels[protocol.upperRetainerType] || protocol.upperRetainerType}</span>
                          )}
                          {protocol.upperRetainerType && protocol.lowerRetainerType && ' / '}
                          {protocol.lowerRetainerType && (
                            <span>Lower: {retainerTypeLabels[protocol.lowerRetainerType] || protocol.lowerRetainerType}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}

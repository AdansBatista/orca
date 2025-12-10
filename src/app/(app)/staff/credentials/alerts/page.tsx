'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, differenceInDays, addDays } from 'date-fns';
import Link from 'next/link';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  RefreshCw,
  Shield,
  Calendar,
  Bell,
  User,
  Filter,
} from 'lucide-react';

import { PageHeader, PageContent, StatsRow, CardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { FormField } from '@/components/ui/form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface Credential {
  id: string;
  credentialType: string;
  credentialNumber: string;
  issuingAuthority: string;
  issuingState: string | null;
  expirationDate: string | null;
  status: string;
  staffProfile: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
}

interface Certification {
  id: string;
  certificationType: string;
  certificationName: string;
  expirationDate: string | null;
  status: string;
  staffProfile: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
}

type ExpiringItem = {
  id: string;
  type: 'credential' | 'certification';
  name: string;
  itemType: string;
  expirationDate: string;
  daysUntilExpiration: number;
  status: 'expired' | 'critical' | 'warning' | 'upcoming';
  staffId: string;
  staffName: string;
  staffTitle: string | null;
};

const ALERT_THRESHOLDS = {
  expired: 0,
  critical: 30, // 30 days
  warning: 60, // 60 days
  upcoming: 90, // 90 days
};

export default function CredentialAlertsPage() {
  const [items, setItems] = useState<ExpiringItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [stats, setStats] = useState({
    expired: 0,
    critical: 0,
    warning: 0,
    upcoming: 0,
  });

  const fetchExpiringItems = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch expiring credentials and certifications from the API
      const response = await fetch('/api/staff/credentials/expiring?days=90');
      const data = await response.json();

      if (data.success) {
        const now = new Date();
        const allItems: ExpiringItem[] = [];

        // Process credentials
        if (data.data.credentials) {
          data.data.credentials.forEach((cred: { id: string; number: string; type: string; expirationDate: string | null; staffProfile: { id: string; firstName: string; lastName: string; title: string | null } }) => {
            if (cred.expirationDate) {
              const expDate = new Date(cred.expirationDate);
              const daysUntil = differenceInDays(expDate, now);
              let status: ExpiringItem['status'] = 'upcoming';
              if (daysUntil < 0) status = 'expired';
              else if (daysUntil <= ALERT_THRESHOLDS.critical) status = 'critical';
              else if (daysUntil <= ALERT_THRESHOLDS.warning) status = 'warning';

              allItems.push({
                id: cred.id,
                type: 'credential',
                name: cred.number,
                itemType: cred.type.replace(/_/g, ' '),
                expirationDate: cred.expirationDate,
                daysUntilExpiration: daysUntil,
                status,
                staffId: cred.staffProfile.id,
                staffName: `${cred.staffProfile.firstName} ${cred.staffProfile.lastName}`,
                staffTitle: cred.staffProfile.title,
              });
            }
          });
        }

        // Process certifications
        if (data.data.certifications) {
          data.data.certifications.forEach((cert: { id: string; name: string; type: string; expirationDate: string | null; staffProfile: { id: string; firstName: string; lastName: string; title: string | null } }) => {
            if (cert.expirationDate) {
              const expDate = new Date(cert.expirationDate);
              const daysUntil = differenceInDays(expDate, now);
              let status: ExpiringItem['status'] = 'upcoming';
              if (daysUntil < 0) status = 'expired';
              else if (daysUntil <= ALERT_THRESHOLDS.critical) status = 'critical';
              else if (daysUntil <= ALERT_THRESHOLDS.warning) status = 'warning';

              allItems.push({
                id: cert.id,
                type: 'certification',
                name: cert.name,
                itemType: cert.type.replace(/_/g, ' '),
                expirationDate: cert.expirationDate,
                daysUntilExpiration: daysUntil,
                status,
                staffId: cert.staffProfile.id,
                staffName: `${cert.staffProfile.firstName} ${cert.staffProfile.lastName}`,
                staffTitle: cert.staffProfile.title,
              });
            }
          });
        }

        // Sort by days until expiration (expired first, then by urgency)
        allItems.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);

        setItems(allItems);

        // Calculate stats
        setStats({
          expired: allItems.filter((i) => i.status === 'expired').length,
          critical: allItems.filter((i) => i.status === 'critical').length,
          warning: allItems.filter((i) => i.status === 'warning').length,
          upcoming: allItems.filter((i) => i.status === 'upcoming').length,
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load expiring credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpiringItems();
  }, [fetchExpiringItems]);

  const getStatusIcon = (status: ExpiringItem['status']) => {
    switch (status) {
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-error-500" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-error-500" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-warning-500" />;
      case 'upcoming':
        return <Calendar className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: ExpiringItem['status']) => {
    switch (status) {
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'critical':
        return <Badge variant="destructive">Expiring Soon</Badge>;
      case 'warning':
        return <Badge variant="warning">Due Soon</Badge>;
      case 'upcoming':
        return <Badge variant="secondary">Upcoming</Badge>;
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter !== 'all' && item.status !== filter) return false;
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    return true;
  });

  return (
    <>
      <PageHeader
        title="Credential Expiration Alerts"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Staff', href: '/staff' },
          { label: 'Credential Alerts' },
        ]}
        actions={
          <Button variant="outline" onClick={fetchExpiringItems} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Stats */}
          <StatsRow>
            <StatCard accentColor="error">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Expired</p>
                  <p className="text-lg font-bold">{stats.expired}</p>
                  <p className="text-xs text-error-600">Requires immediate action</p>
                </div>
                <AlertCircle className="h-5 w-5 text-error-500" />
              </div>
            </StatCard>
            <StatCard accentColor="error">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Critical (≤30 days)</p>
                  <p className="text-lg font-bold">{stats.critical}</p>
                  <p className="text-xs text-error-600">Urgent attention needed</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-error-500" />
              </div>
            </StatCard>
            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Warning (≤60 days)</p>
                  <p className="text-lg font-bold">{stats.warning}</p>
                  <p className="text-xs text-warning-600">Plan renewal soon</p>
                </div>
                <Clock className="h-5 w-5 text-warning-500" />
              </div>
            </StatCard>
            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Upcoming (≤90 days)</p>
                  <p className="text-lg font-bold">{stats.upcoming}</p>
                  <p className="text-xs text-muted-foreground">On your radar</p>
                </div>
                <Calendar className="h-5 w-5 text-primary-500" />
              </div>
            </StatCard>
          </StatsRow>

          {/* Filters */}
          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex items-end gap-4 flex-wrap">
                <FormField label="Status">
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Type">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="credential">Credentials</SelectItem>
                      <SelectItem value="certification">Certifications</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilter('all');
                    setTypeFilter('all');
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Alerts Table */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                {filteredItems.length} Expiring Items
              </CardTitle>
              <CardDescription>
                Credentials and certifications requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent compact>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Expiration Date</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <CheckCircle className="h-8 w-8 mx-auto text-success-500 mb-2" />
                        <p className="text-muted-foreground">No expiring credentials found</p>
                        <p className="text-xs text-muted-foreground">
                          All credentials are up to date
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={`${item.type}-${item.id}`}>
                        <TableCell>{getStatusIcon(item.status)}</TableCell>
                        <TableCell>
                          <Link
                            href={`/staff/${item.staffId}`}
                            className="hover:text-primary-600"
                          >
                            <PhiProtected fakeData={getFakeName()}>
                              <span className="font-medium">{item.staffName}</span>
                            </PhiProtected>
                            {item.staffTitle && (
                              <span className="text-xs text-muted-foreground block">
                                {item.staffTitle}
                              </span>
                            )}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {item.type === 'credential' ? (
                              <Shield className="h-3 w-3 mr-1" />
                            ) : (
                              <User className="h-3 w-3 mr-1" />
                            )}
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.itemType}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {item.name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(item.expirationDate), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-bold ${
                              item.daysUntilExpiration < 0
                                ? 'text-error-600'
                                : item.daysUntilExpiration <= 30
                                  ? 'text-error-600'
                                  : item.daysUntilExpiration <= 60
                                    ? 'text-warning-600'
                                    : 'text-muted-foreground'
                            }`}
                          >
                            {item.daysUntilExpiration < 0
                              ? `${Math.abs(item.daysUntilExpiration)} days ago`
                              : `${item.daysUntilExpiration} days`}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Alert Thresholds</p>
                  <ul className="space-y-1">
                    <li>
                      <Badge variant="destructive" className="mr-2">
                        Expired
                      </Badge>
                      Credential has passed expiration date
                    </li>
                    <li>
                      <Badge variant="destructive" className="mr-2">
                        Critical
                      </Badge>
                      Expiring within 30 days - requires immediate attention
                    </li>
                    <li>
                      <Badge variant="warning" className="mr-2">
                        Warning
                      </Badge>
                      Expiring within 60 days - plan for renewal
                    </li>
                    <li>
                      <Badge variant="secondary" className="mr-2">
                        Upcoming
                      </Badge>
                      Expiring within 90 days - on your radar
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </>
  );
}

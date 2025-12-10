'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Zap,
  Plus,
  Search,
  RefreshCw,
  MoreHorizontal,
  Play,
  Pause,
  Pencil,
  Trash2,
  ArrowLeft,
  Mail,
  MessageSquare,
  Clock,
  Users,
  TrendingUp,
  CalendarClock,
} from 'lucide-react';

import { PageHeader, PageContent, StatsRow } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  type: string;
  triggerType: string;
  triggerEvent: string | null;
  status: string;
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  stepCount: number;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CampaignsData {
  items: Campaign[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type TypeFilter = 'all' | 'MARKETING' | 'REMINDER' | 'FOLLOW_UP' | 'SURVEY' | 'WELCOME' | 'EDUCATION';
type StatusFilter = 'all' | 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);
      params.set('pageSize', '50');

      const response = await fetch(`/api/campaigns?${params}`);
      const result = await response.json();

      if (result.success) {
        setCampaigns(result.data);
      } else {
        toast.error('Failed to load campaigns');
      }
    } catch {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Handle delete
  const handleDelete = async () => {
    if (!deletingCampaign) return;

    try {
      const response = await fetch(`/api/campaigns/${deletingCampaign.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Campaign deleted');
        fetchCampaigns();
      } else {
        toast.error(result.error?.message || 'Failed to delete campaign');
      }
    } catch {
      toast.error('Failed to delete campaign');
    } finally {
      setDeletingCampaign(null);
    }
  };

  // Handle activate/pause
  const handleToggleStatus = async (campaign: Campaign) => {
    const action = campaign.status === 'ACTIVE' ? 'pause' : 'activate';
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/${action}`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success(action === 'activate' ? 'Campaign activated' : 'Campaign paused');
        fetchCampaigns();
      } else {
        toast.error(result.error?.message || `Failed to ${action} campaign`);
      }
    } catch {
      toast.error(`Failed to ${action} campaign`);
    }
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success" dot>Active</Badge>;
      case 'DRAFT':
        return <Badge variant="ghost">Draft</Badge>;
      case 'PAUSED':
        return <Badge variant="warning">Paused</Badge>;
      case 'COMPLETED':
        return <Badge variant="info">Completed</Badge>;
      case 'SCHEDULED':
        return <Badge variant="soft-primary">Scheduled</Badge>;
      default:
        return <Badge variant="ghost">{status}</Badge>;
    }
  };

  // Get type icon and label
  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'MARKETING':
        return { icon: <TrendingUp className="h-4 w-4" />, label: 'Marketing', color: 'text-purple-500' };
      case 'REMINDER':
        return { icon: <Clock className="h-4 w-4" />, label: 'Reminder', color: 'text-blue-500' };
      case 'FOLLOW_UP':
        return { icon: <Mail className="h-4 w-4" />, label: 'Follow-up', color: 'text-green-500' };
      case 'SURVEY':
        return { icon: <MessageSquare className="h-4 w-4" />, label: 'Survey', color: 'text-amber-500' };
      case 'WELCOME':
        return { icon: <Users className="h-4 w-4" />, label: 'Welcome', color: 'text-cyan-500' };
      case 'EDUCATION':
        return { icon: <Zap className="h-4 w-4" />, label: 'Education', color: 'text-orange-500' };
      default:
        return { icon: <Zap className="h-4 w-4" />, label: type, color: 'text-muted-foreground' };
    }
  };

  // Get trigger type badge
  const getTriggerBadge = (triggerType: string, triggerEvent: string | null) => {
    switch (triggerType) {
      case 'EVENT':
        return (
          <Badge variant="outline" size="sm" className="gap-1">
            <Zap className="h-3 w-3" />
            {triggerEvent?.split('.')[1] || 'Event'}
          </Badge>
        );
      case 'SCHEDULED':
        return (
          <Badge variant="outline" size="sm" className="gap-1">
            <CalendarClock className="h-3 w-3" />
            Scheduled
          </Badge>
        );
      case 'RECURRING':
        return (
          <Badge variant="outline" size="sm" className="gap-1">
            <RefreshCw className="h-3 w-3" />
            Recurring
          </Badge>
        );
      default:
        return null;
    }
  };

  // Calculate stats
  const stats = {
    total: campaigns?.total || 0,
    active: campaigns?.items.filter((c) => c.status === 'ACTIVE').length || 0,
    draft: campaigns?.items.filter((c) => c.status === 'DRAFT').length || 0,
    totalSent: campaigns?.items.reduce((sum, c) => sum + c.totalSent, 0) || 0,
  };

  return (
    <>
      <PageHeader
        title="Automated Campaigns"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Communications', href: '/communications' },
          { label: 'Campaigns' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/communications">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Inbox
              </Button>
            </Link>
            <Link href="/communications/campaigns/templates">
              <Button variant="outline" size="sm">
                Browse Templates
              </Button>
            </Link>
            <Link href="/communications/campaigns/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </Link>
          </div>
        }
      />

      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Stats */}
          <StatsRow>
            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Campaigns</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
                <Zap className="h-8 w-8 text-primary-500/60" />
              </div>
            </StatCard>
            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-xl font-bold">{stats.active}</p>
                </div>
                <Play className="h-8 w-8 text-success-500/60" />
              </div>
            </StatCard>
            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Drafts</p>
                  <p className="text-xl font-bold">{stats.draft}</p>
                </div>
                <Pencil className="h-8 w-8 text-warning-500/60" />
              </div>
            </StatCard>
            <StatCard accentColor="accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Sent</p>
                  <p className="text-xl font-bold">{stats.totalSent.toLocaleString()}</p>
                </div>
                <Mail className="h-8 w-8 text-accent-500/60" />
              </div>
            </StatCard>
          </StatsRow>

          {/* Filters */}
          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search campaigns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Type Filter */}
                <Select
                  value={typeFilter}
                  onValueChange={(v) => setTypeFilter(v as TypeFilter)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="MARKETING">Marketing</SelectItem>
                    <SelectItem value="REMINDER">Reminder</SelectItem>
                    <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
                    <SelectItem value="SURVEY">Survey</SelectItem>
                    <SelectItem value="WELCOME">Welcome</SelectItem>
                    <SelectItem value="EDUCATION">Education</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>

                {/* Refresh */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={fetchCampaigns}
                  disabled={loading}
                  className="ml-auto"
                >
                  <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Campaigns
                {campaigns && <Badge variant="ghost">{campaigns.total}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading && !campaigns ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : campaigns?.items.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                  <p>No campaigns found</p>
                  <Link href="/communications/campaigns/new">
                    <Button variant="outline" size="sm" className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Campaign
                    </Button>
                  </Link>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Sent</TableHead>
                      <TableHead className="text-right">Delivered</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns?.items.map((campaign) => {
                      const typeInfo = getTypeInfo(campaign.type);
                      return (
                        <TableRow key={campaign.id}>
                          <TableCell>
                            <Link
                              href={`/communications/campaigns/${campaign.id}`}
                              className="hover:underline"
                            >
                              <p className="font-medium">{campaign.name}</p>
                              {campaign.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                                  {campaign.description}
                                </p>
                              )}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className={cn('flex items-center gap-1.5', typeInfo.color)}>
                              {typeInfo.icon}
                              <span className="text-sm">{typeInfo.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getTriggerBadge(campaign.triggerType, campaign.triggerEvent)}
                          </TableCell>
                          <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {campaign.totalSent.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {campaign.totalDelivered.toLocaleString()}
                            {campaign.totalSent > 0 && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({Math.round((campaign.totalDelivered / campaign.totalSent) * 100)}%)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(campaign.updatedAt), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <Link href={`/communications/campaigns/${campaign.id}`}>
                                  <DropdownMenuItem>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                </Link>
                                {campaign.status === 'ACTIVE' ? (
                                  <DropdownMenuItem onClick={() => handleToggleStatus(campaign)}>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pause
                                  </DropdownMenuItem>
                                ) : ['DRAFT', 'PAUSED'].includes(campaign.status) ? (
                                  <DropdownMenuItem onClick={() => handleToggleStatus(campaign)}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Activate
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeletingCampaign(campaign)}
                                  disabled={campaign.status === 'ACTIVE'}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContent>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingCampaign}
        onOpenChange={(open: boolean) => !open && setDeletingCampaign(null)}
        title="Delete Campaign"
        description={`Are you sure you want to delete "${deletingCampaign?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}

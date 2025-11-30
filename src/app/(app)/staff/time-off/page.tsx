'use client';

import { useState, useEffect } from 'react';
import { Plus, Filter, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { TimeOffRequest, StaffProfile } from '@prisma/client';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TimeOffRequestCard, TimeOffRequestForm } from '@/components/staff';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

type TimeOffWithStaff = TimeOffRequest & {
  staffProfile?: Pick<StaffProfile, 'id' | 'firstName' | 'lastName' | 'title' | 'department'>;
};

interface PaginatedResponse {
  items: TimeOffWithStaff[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function TimeOffPage() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TimeOffWithStaff | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [requestToReject, setRequestToReject] = useState<TimeOffWithStaff | null>(null);

  // Stats
  const stats = {
    pending: data?.items.filter(r => r.status === 'PENDING').length || 0,
    approved: data?.items.filter(r => r.status === 'APPROVED').length || 0,
    rejected: data?.items.filter(r => r.status === 'REJECTED').length || 0,
  };

  // Fetch time-off requests
  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (statusFilter) params.set('status', statusFilter);
        params.set('pageSize', '50');

        const response = await fetch(`/api/staff/time-off?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch time-off requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [statusFilter]);

  const handleApprove = async (request: TimeOffWithStaff) => {
    try {
      const response = await fetch(`/api/staff/time-off/${request.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      if (result.success) {
        // Refresh data
        setStatusFilter(prev => prev); // Trigger re-fetch
        window.location.reload();
      } else {
        throw new Error(result.error?.message || 'Failed to approve');
      }
    } catch (error) {
      console.error('Failed to approve:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve request');
    }
  };

  const handleReject = (request: TimeOffWithStaff) => {
    setRequestToReject(request);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    if (!requestToReject || !rejectReason.trim()) return;

    try {
      const response = await fetch(`/api/staff/time-off/${requestToReject.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: rejectReason }),
      });

      const result = await response.json();
      if (result.success) {
        setRejectDialogOpen(false);
        setRequestToReject(null);
        window.location.reload();
      } else {
        throw new Error(result.error?.message || 'Failed to reject');
      }
    } catch (error) {
      console.error('Failed to reject:', error);
      alert(error instanceof Error ? error.message : 'Failed to reject request');
    }
  };

  const handleCancel = async (request: TimeOffWithStaff) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;

    try {
      const response = await fetch(`/api/staff/time-off/${request.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        window.location.reload();
      } else {
        throw new Error(result.error?.message || 'Failed to cancel');
      }
    } catch (error) {
      console.error('Failed to cancel:', error);
      alert(error instanceof Error ? error.message : 'Failed to cancel request');
    }
  };

  const handleSubmitRequest = async (formData: unknown) => {
    try {
      // For now, we need a staff profile ID - in a real app, this would come from selection
      const staffResponse = await fetch('/api/staff?pageSize=1');
      const staffResult = await staffResponse.json();
      const staffProfileId = staffResult.data?.items?.[0]?.id;

      if (!staffProfileId) {
        throw new Error('No staff profile available');
      }

      const url = selectedRequest
        ? `/api/staff/time-off/${selectedRequest.id}`
        : `/api/staff/${staffProfileId}/time-off`;

      const response = await fetch(url, {
        method: selectedRequest ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save request');
      }

      setIsFormOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Failed to save request:', error);
      alert(error instanceof Error ? error.message : 'Failed to save request');
    }
  };

  return (
    <>
      <PageHeader
        title="Time Off Requests"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Staff', href: '/staff' },
          { label: 'Time Off' },
        ]}
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-warning-500" />
              </div>
            </StatCard>
            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success-500" />
              </div>
            </StatCard>
            <StatCard accentColor="error">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-error-500" />
              </div>
            </StatCard>
          </div>

          {/* Header actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter || "all"} onValueChange={(val) => setStatusFilter(val === "all" ? "" : val)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => { setSelectedRequest(null); setIsFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Request Time Off
            </Button>
          </div>

          {/* Requests List */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-64" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : data?.items.length === 0 ? (
            <Card variant="ghost">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-foreground mb-1">No requests found</h3>
                <p className="text-muted-foreground mb-4">
                  {statusFilter
                    ? 'Try adjusting your filter'
                    : 'No time-off requests have been submitted yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {data?.items.map((request) => (
                <TimeOffRequestCard
                  key={request.id}
                  request={request}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onEdit={(r) => { setSelectedRequest(r); setIsFormOpen(true); }}
                  onCancel={handleCancel}
                  showStaffName
                  isAdmin
                />
              ))}
            </div>
          )}
        </div>

        {/* Request Form Dialog */}
        <TimeOffRequestForm
          request={selectedRequest || undefined}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleSubmitRequest}
        />

        {/* Reject Confirmation Dialog */}
        <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject Time Off Request</AlertDialogTitle>
              <AlertDialogDescription>
                Please provide a reason for rejecting this request. This will be visible to the staff member.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Input
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmReject}
                disabled={!rejectReason.trim()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Reject Request
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageContent>
    </>
  );
}

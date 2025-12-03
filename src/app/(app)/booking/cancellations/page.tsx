"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  XCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Clock,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";

import { PageHeader, PageContent, StatsRow } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PhiProtected } from "@/components/ui/phi-protected";
import { getFakeName, getFakePhone, getFakeEmail } from "@/lib/fake-data";

// Types
interface CancellationRecord {
  id: string;
  appointmentId: string;
  cancellationType: "CANCELLED" | "LATE_CANCEL" | "NO_SHOW" | "PRACTICE_CANCEL";
  reason: string;
  reasonDetails: string | null;
  cancelledAt: string;
  originalStartTime: string;
  noticeHours: number | null;
  isLateCancel: boolean;
  lateCancelFee: number | null;
  feeWaived: boolean;
  recoveryStatus: "PENDING" | "IN_PROGRESS" | "RECOVERED" | "LOST" | "NOT_NEEDED";
  recoveryAttempts: number;
  lastRecoveryAttemptAt: string | null;
  recoveryNotes: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
  };
}

interface CancellationStats {
  totalCancellations: number;
  noShows: number;
  lateCancels: number;
  pendingRecovery: number;
  recovered: number;
  lost: number;
}

const CANCELLATION_TYPE_LABELS: Record<string, string> = {
  CANCELLED: "Cancelled",
  LATE_CANCEL: "Late Cancel",
  NO_SHOW: "No Show",
  PRACTICE_CANCEL: "Practice Cancelled",
};

const CANCELLATION_TYPE_VARIANTS: Record<string, "warning" | "destructive" | "secondary" | "info"> = {
  CANCELLED: "secondary",
  LATE_CANCEL: "warning",
  NO_SHOW: "destructive",
  PRACTICE_CANCEL: "info",
};

const RECOVERY_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  RECOVERED: "Recovered",
  LOST: "Lost",
  NOT_NEEDED: "Not Needed",
};

const RECOVERY_STATUS_VARIANTS: Record<string, "warning" | "info" | "success" | "destructive" | "secondary"> = {
  PENDING: "warning",
  IN_PROGRESS: "info",
  RECOVERED: "success",
  LOST: "destructive",
  NOT_NEEDED: "secondary",
};

const REASON_LABELS: Record<string, string> = {
  SCHEDULE_CONFLICT: "Schedule Conflict",
  ILLNESS: "Illness",
  TRANSPORTATION: "Transportation",
  FORGOT: "Forgot",
  FINANCIAL: "Financial",
  WEATHER: "Weather",
  FAMILY_EMERGENCY: "Family Emergency",
  CHANGED_PROVIDERS: "Changed Providers",
  PRACTICE_CLOSURE: "Practice Closure",
  PROVIDER_UNAVAILABLE: "Provider Unavailable",
  OTHER: "Other",
};

export default function CancellationsPage() {
  const router = useRouter();
  const [cancellations, setCancellations] = React.useState<CancellationRecord[]>([]);
  const [stats, setStats] = React.useState<CancellationStats>({
    totalCancellations: 0,
    noShows: 0,
    lateCancels: 0,
    pendingRecovery: 0,
    recovered: 0,
    lost: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [recoveryFilter, setRecoveryFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const pageSize = 20;

  // Recovery dialog state
  const [recoveryDialogOpen, setRecoveryDialogOpen] = React.useState(false);
  const [selectedCancellation, setSelectedCancellation] = React.useState<CancellationRecord | null>(null);
  const [recoveryNotes, setRecoveryNotes] = React.useState("");
  const [recoveryResult, setRecoveryResult] = React.useState<string>("PENDING");
  const [submittingRecovery, setSubmittingRecovery] = React.useState(false);

  // Fetch cancellations
  const fetchCancellations = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (typeFilter !== "all") {
        params.set("cancellationType", typeFilter);
      }
      if (recoveryFilter !== "all") {
        params.set("recoveryStatus", recoveryFilter);
      }

      const response = await fetch(`/api/booking/cancellations?${params}`);
      const data = await response.json();

      if (data.success) {
        setCancellations(data.data.items);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch cancellations:", error);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, recoveryFilter]);

  // Fetch stats
  const fetchStats = React.useCallback(async () => {
    try {
      const response = await fetch("/api/booking/cancellations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  React.useEffect(() => {
    fetchCancellations();
    fetchStats();
  }, [fetchCancellations, fetchStats]);

  // Filter by search query (client-side)
  const filteredCancellations = React.useMemo(() => {
    if (!searchQuery) return cancellations;

    const query = searchQuery.toLowerCase();
    return cancellations.filter((c) => {
      const patientName = `${c.patient.firstName} ${c.patient.lastName}`.toLowerCase();
      return patientName.includes(query);
    });
  }, [cancellations, searchQuery]);

  // Open recovery dialog
  const openRecoveryDialog = (cancellation: CancellationRecord) => {
    setSelectedCancellation(cancellation);
    setRecoveryNotes(cancellation.recoveryNotes || "");
    setRecoveryResult("PENDING");
    setRecoveryDialogOpen(true);
  };

  // Submit recovery attempt
  const handleRecoverySubmit = async () => {
    if (!selectedCancellation) return;

    setSubmittingRecovery(true);
    try {
      const response = await fetch(`/api/booking/cancellations/${selectedCancellation.id}/recovery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: recoveryNotes,
          result: recoveryResult,
        }),
      });

      if (response.ok) {
        setRecoveryDialogOpen(false);
        fetchCancellations();
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to log recovery attempt:", error);
    } finally {
      setSubmittingRecovery(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Cancellations & No-Shows"
        description="Track cancelled appointments, no-shows, and recovery efforts"
      />

      <PageContent>
        {/* Stats Row */}
        <StatsRow>
          <StatCard accentColor="secondary">
            <p className="text-xs text-muted-foreground">Total Cancellations</p>
            <p className="text-2xl font-bold">{stats.totalCancellations}</p>
          </StatCard>
          <StatCard accentColor="error">
            <p className="text-xs text-muted-foreground">No Shows</p>
            <p className="text-2xl font-bold">{stats.noShows}</p>
          </StatCard>
          <StatCard accentColor="warning">
            <p className="text-xs text-muted-foreground">Late Cancels</p>
            <p className="text-2xl font-bold">{stats.lateCancels}</p>
          </StatCard>
          <StatCard accentColor="primary">
            <p className="text-xs text-muted-foreground">Pending Recovery</p>
            <p className="text-2xl font-bold">{stats.pendingRecovery}</p>
          </StatCard>
          <StatCard accentColor="success">
            <p className="text-xs text-muted-foreground">Recovered</p>
            <p className="text-2xl font-bold">{stats.recovered}</p>
          </StatCard>
          <StatCard accentColor="error">
            <p className="text-xs text-muted-foreground">Lost</p>
            <p className="text-2xl font-bold">{stats.lost}</p>
          </StatCard>
        </StatsRow>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="LATE_CANCEL">Late Cancel</SelectItem>
                  <SelectItem value="NO_SHOW">No Show</SelectItem>
                  <SelectItem value="PRACTICE_CANCEL">Practice Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={recoveryFilter} onValueChange={setRecoveryFilter}>
                <SelectTrigger className="w-[180px]">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Recovery Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RECOVERED">Recovered</SelectItem>
                  <SelectItem value="LOST">Lost</SelectItem>
                  <SelectItem value="NOT_NEEDED">Not Needed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Cancellations Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Cancellation Records</span>
              <span className="text-sm font-normal text-muted-foreground">
                {total} total records
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCancellations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <XCircle className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No cancellations found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Scheduled For</TableHead>
                      <TableHead>Cancelled</TableHead>
                      <TableHead>Recovery</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCancellations.map((cancellation) => (
                      <TableRow key={cancellation.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <PhiProtected fakeData={getFakeName()}>
                              <span className="font-medium">
                                {cancellation.patient.firstName} {cancellation.patient.lastName}
                              </span>
                            </PhiProtected>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              {cancellation.patient.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <PhiProtected fakeData={getFakePhone()}>
                                    {cancellation.patient.phone}
                                  </PhiProtected>
                                </span>
                              )}
                              {cancellation.patient.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  <PhiProtected fakeData={getFakeEmail()}>
                                    {cancellation.patient.email}
                                  </PhiProtected>
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={CANCELLATION_TYPE_VARIANTS[cancellation.cancellationType]}>
                            {CANCELLATION_TYPE_LABELS[cancellation.cancellationType]}
                          </Badge>
                          {cancellation.isLateCancel && cancellation.noticeHours !== null && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {cancellation.noticeHours}h notice
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {REASON_LABELS[cancellation.reason] || cancellation.reason}
                          </span>
                          {cancellation.reasonDetails && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                              {cancellation.reasonDetails}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{format(parseISO(cancellation.originalStartTime), "MMM d, yyyy")}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(parseISO(cancellation.originalStartTime), "h:mm a")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDistanceToNow(parseISO(cancellation.cancelledAt), { addSuffix: true })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={RECOVERY_STATUS_VARIANTS[cancellation.recoveryStatus]}>
                              {RECOVERY_STATUS_LABELS[cancellation.recoveryStatus]}
                            </Badge>
                            {cancellation.recoveryAttempts > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {cancellation.recoveryAttempts} attempt{cancellation.recoveryAttempts !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {(cancellation.recoveryStatus === "PENDING" ||
                            cancellation.recoveryStatus === "IN_PROGRESS") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRecoveryDialog(cancellation)}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Log Attempt
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {(page - 1) * pageSize + 1} to{" "}
                      {Math.min(page * pageSize, total)} of {total} records
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </PageContent>

      {/* Recovery Attempt Dialog */}
      <Dialog open={recoveryDialogOpen} onOpenChange={setRecoveryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Recovery Attempt</DialogTitle>
            <DialogDescription>
              Record your recovery attempt for this cancelled appointment.
            </DialogDescription>
          </DialogHeader>

          {selectedCancellation && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-medium">
                  <PhiProtected fakeData={getFakeName()}>
                    {selectedCancellation.patient.firstName} {selectedCancellation.patient.lastName}
                  </PhiProtected>
                </p>
                <p className="text-sm text-muted-foreground">
                  Originally scheduled: {format(parseISO(selectedCancellation.originalStartTime), "PPp")}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Result</label>
                <Select value={recoveryResult} onValueChange={setRecoveryResult}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Still Pending</SelectItem>
                    <SelectItem value="NO_RESPONSE">No Response</SelectItem>
                    <SelectItem value="RESCHEDULED">Rescheduled</SelectItem>
                    <SelectItem value="DECLINED">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={recoveryNotes}
                  onChange={(e) => setRecoveryNotes(e.target.value)}
                  placeholder="Add notes about this recovery attempt..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRecoveryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecoverySubmit} disabled={submittingRecovery}>
              {submittingRecovery ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Log Attempt
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

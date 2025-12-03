"use client";

import * as React from "react";
import {
  AlertTriangle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  RefreshCw,
  CheckCircle,
  Calendar,
  TrendingUp,
  TrendingDown,
  User,
  History,
  ClipboardList,
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
interface RiskScore {
  id: string;
  patientId: string;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskFactors: {
    noShowCount: number;
    lateCancelCount: number;
    cancellationRate: number;
    daysSinceLastVisit: number;
    daysSinceLastScheduled: number;
  } | null;
  recommendedActions: string[];
  status: "ACTIVE" | "REVIEWED" | "RESOLVED" | "DROPPED_OUT";
  interventionStatus: "PENDING" | "IN_PROGRESS" | "SUCCESSFUL" | "UNSUCCESSFUL" | null;
  interventionNotes: string | null;
  reviewNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  calculatedAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
  };
}

interface RiskStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  pendingIntervention: number;
}

const RISK_LEVEL_VARIANTS: Record<string, "destructive" | "warning" | "info" | "secondary"> = {
  CRITICAL: "destructive",
  HIGH: "warning",
  MEDIUM: "info",
  LOW: "secondary",
};

const STATUS_VARIANTS: Record<string, "warning" | "info" | "success" | "secondary"> = {
  ACTIVE: "warning",
  REVIEWED: "info",
  RESOLVED: "success",
  DROPPED_OUT: "secondary",
};

const INTERVENTION_VARIANTS: Record<string, "warning" | "info" | "success" | "destructive"> = {
  PENDING: "warning",
  IN_PROGRESS: "info",
  SUCCESSFUL: "success",
  UNSUCCESSFUL: "destructive",
};

export default function AtRiskPatientsPage() {
  const [riskScores, setRiskScores] = React.useState<RiskScore[]>([]);
  const [stats, setStats] = React.useState<RiskStats>({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    pendingIntervention: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [riskLevelFilter, setRiskLevelFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("ACTIVE");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const pageSize = 20;

  // Intervention dialog state
  const [interventionDialogOpen, setInterventionDialogOpen] = React.useState(false);
  const [selectedRiskScore, setSelectedRiskScore] = React.useState<RiskScore | null>(null);
  const [interventionNotes, setInterventionNotes] = React.useState("");
  const [interventionStatus, setInterventionStatus] = React.useState<string>("IN_PROGRESS");
  const [submitting, setSubmitting] = React.useState(false);

  // Recalculating state
  const [recalculating, setRecalculating] = React.useState(false);

  // Fetch risk scores
  const fetchRiskScores = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (riskLevelFilter !== "all") {
        params.set("riskLevel", riskLevelFilter);
      }
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/booking/at-risk?${params}`);
      const data = await response.json();

      if (data.success) {
        setRiskScores(data.data.items);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);

        // Calculate stats from response
        const items = data.data.items as RiskScore[];
        setStats({
          total: data.data.total,
          critical: items.filter((r) => r.riskLevel === "CRITICAL").length,
          high: items.filter((r) => r.riskLevel === "HIGH").length,
          medium: items.filter((r) => r.riskLevel === "MEDIUM").length,
          pendingIntervention: items.filter(
            (r) => r.interventionStatus === "PENDING" || r.interventionStatus === "IN_PROGRESS"
          ).length,
        });
      }
    } catch (error) {
      console.error("Failed to fetch risk scores:", error);
    } finally {
      setLoading(false);
    }
  }, [page, riskLevelFilter, statusFilter]);

  React.useEffect(() => {
    fetchRiskScores();
  }, [fetchRiskScores]);

  // Filter by search query (client-side)
  const filteredRiskScores = React.useMemo(() => {
    if (!searchQuery) return riskScores;

    const query = searchQuery.toLowerCase();
    return riskScores.filter((r) => {
      const patientName = `${r.patient.firstName} ${r.patient.lastName}`.toLowerCase();
      return patientName.includes(query);
    });
  }, [riskScores, searchQuery]);

  // Recalculate risk scores
  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const response = await fetch("/api/booking/at-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calculateAll: true }),
      });

      if (response.ok) {
        fetchRiskScores();
      }
    } catch (error) {
      console.error("Failed to recalculate risk scores:", error);
    } finally {
      setRecalculating(false);
    }
  };

  // Open intervention dialog
  const openInterventionDialog = (riskScore: RiskScore) => {
    setSelectedRiskScore(riskScore);
    setInterventionNotes(riskScore.interventionNotes || "");
    setInterventionStatus(riskScore.interventionStatus || "IN_PROGRESS");
    setInterventionDialogOpen(true);
  };

  // Submit intervention
  const handleInterventionSubmit = async () => {
    if (!selectedRiskScore) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/booking/at-risk/${selectedRiskScore.patientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interventionStatus,
          interventionNotes,
        }),
      });

      if (response.ok) {
        setInterventionDialogOpen(false);
        fetchRiskScores();
      }
    } catch (error) {
      console.error("Failed to log intervention:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Get risk score color for progress bar
  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return "bg-destructive";
    if (score >= 50) return "bg-warning-500";
    if (score >= 30) return "bg-info-500";
    return "bg-success-500";
  };

  return (
    <>
      <PageHeader
        title="At-Risk Patients"
        description="Monitor patients at risk of dropping out and manage intervention efforts"
        actions={
          <Button onClick={handleRecalculate} disabled={recalculating}>
            {recalculating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Recalculating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Recalculate Scores
              </>
            )}
          </Button>
        }
      />

      <PageContent>
        {/* Stats Row */}
        <StatsRow>
          <StatCard accentColor="secondary">
            <p className="text-xs text-muted-foreground">Total At-Risk</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </StatCard>
          <StatCard accentColor="error">
            <p className="text-xs text-muted-foreground">Critical</p>
            <p className="text-2xl font-bold">{stats.critical}</p>
          </StatCard>
          <StatCard accentColor="warning">
            <p className="text-xs text-muted-foreground">High Risk</p>
            <p className="text-2xl font-bold">{stats.high}</p>
          </StatCard>
          <StatCard accentColor="accent">
            <p className="text-xs text-muted-foreground">Medium Risk</p>
            <p className="text-2xl font-bold">{stats.medium}</p>
          </StatCard>
          <StatCard accentColor="primary">
            <p className="text-xs text-muted-foreground">Pending Intervention</p>
            <p className="text-2xl font-bold">{stats.pendingIntervention}</p>
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

              <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="DROPPED_OUT">Dropped Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Risk Scores Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>At-Risk Patient List</span>
              <span className="text-sm font-normal text-muted-foreground">
                {total} patients
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRiskScores.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No at-risk patients found</p>
                <p className="text-sm">Try adjusting your filters or recalculate scores</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Risk Factors</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Intervention</TableHead>
                      <TableHead>Last Calculated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRiskScores.map((riskScore) => (
                      <TableRow key={riskScore.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <PhiProtected fakeData={getFakeName()}>
                              <span className="font-medium">
                                {riskScore.patient.firstName} {riskScore.patient.lastName}
                              </span>
                            </PhiProtected>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              {riskScore.patient.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <PhiProtected fakeData={getFakePhone()}>
                                    {riskScore.patient.phone}
                                  </PhiProtected>
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5 min-w-[100px]">
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold">
                                {Math.round(riskScore.riskScore)}
                              </span>
                              <Badge variant={RISK_LEVEL_VARIANTS[riskScore.riskLevel]}>
                                {riskScore.riskLevel}
                              </Badge>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${getRiskScoreColor(riskScore.riskScore)}`}
                                style={{ width: `${riskScore.riskScore}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {riskScore.riskFactors && (
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">No Shows:</span>
                                <span className="font-medium">{riskScore.riskFactors.noShowCount}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Late Cancels:</span>
                                <span className="font-medium">{riskScore.riskFactors.lateCancelCount}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Days Since Visit:</span>
                                <span className="font-medium">{riskScore.riskFactors.daysSinceLastVisit}</span>
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANTS[riskScore.status]}>
                            {riskScore.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {riskScore.interventionStatus ? (
                            <Badge variant={INTERVENTION_VARIANTS[riskScore.interventionStatus]}>
                              {riskScore.interventionStatus.replace("_", " ")}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {formatDistanceToNow(parseISO(riskScore.calculatedAt), { addSuffix: true })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openInterventionDialog(riskScore)}
                          >
                            <ClipboardList className="h-4 w-4 mr-1" />
                            {riskScore.interventionStatus ? "Update" : "Intervene"}
                          </Button>
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
                      {Math.min(page * pageSize, total)} of {total} patients
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

      {/* Intervention Dialog */}
      <Dialog open={interventionDialogOpen} onOpenChange={setInterventionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Intervention</DialogTitle>
            <DialogDescription>
              Record intervention efforts for this at-risk patient.
            </DialogDescription>
          </DialogHeader>

          {selectedRiskScore && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-medium">
                  <PhiProtected fakeData={getFakeName()}>
                    {selectedRiskScore.patient.firstName} {selectedRiskScore.patient.lastName}
                  </PhiProtected>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-muted-foreground">Risk Score:</span>
                  <span className="font-bold">{Math.round(selectedRiskScore.riskScore)}</span>
                  <Badge variant={RISK_LEVEL_VARIANTS[selectedRiskScore.riskLevel]}>
                    {selectedRiskScore.riskLevel}
                  </Badge>
                </div>
              </div>

              {/* Recommended Actions */}
              {selectedRiskScore.recommendedActions.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recommended Actions</label>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {selectedRiskScore.recommendedActions.map((action, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 mt-0.5 text-primary" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Intervention Status</label>
                <Select value={interventionStatus} onValueChange={setInterventionStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="SUCCESSFUL">Successful</SelectItem>
                    <SelectItem value="UNSUCCESSFUL">Unsuccessful</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={interventionNotes}
                  onChange={(e) => setInterventionNotes(e.target.value)}
                  placeholder="Document the intervention attempt, outcomes, and next steps..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setInterventionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInterventionSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Intervention
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

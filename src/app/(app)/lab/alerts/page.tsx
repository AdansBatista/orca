"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Truck,
  Package,
  RefreshCw,
  FileText,
  CheckCircle2,
  XCircle,
  Bell,
  Calendar,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListItem, ListItemTitle, ListItemDescription } from "@/components/ui/list-item";
import {
  PageHeader,
  PageContent,
  DashboardGrid,
  StatsRow,
} from "@/components/layout";
import { StatCard } from "@/components/ui/card";
import { PhiProtected } from "@/components/ui/phi-protected";
import { getFakeName } from "@/lib/fake-data";

// Mock alerts data
const alerts = [
  {
    id: "1",
    type: "OVERDUE",
    severity: "CRITICAL",
    title: "Order LAB-2024-0035 is overdue",
    message: "Needed by Feb 8 - Status: IN_PROGRESS",
    orderId: "LAB-2024-0035",
    patient: "Michael Brown",
    vendor: "OLS",
    dueDate: "2024-02-08",
    createdAt: "2 days ago",
  },
  {
    id: "2",
    type: "DUE_TODAY",
    severity: "WARNING",
    title: "Order LAB-2024-0040 is due today",
    message: "Status: SHIPPED",
    orderId: "LAB-2024-0040",
    patient: "Sarah Johnson",
    vendor: "PO",
    dueDate: "2024-02-12",
    createdAt: "Today",
  },
  {
    id: "3",
    type: "SHIPMENT_DELAYED",
    severity: "WARNING",
    title: "Shipment delayed for order LAB-2024-0038",
    message: "Expected Feb 10 via FedEx",
    orderId: "LAB-2024-0038",
    patient: "Emily Davis",
    vendor: "OLS",
    dueDate: null,
    createdAt: "Yesterday",
  },
  {
    id: "4",
    type: "REMAKE_APPROVAL",
    severity: "WARNING",
    title: "Remake request pending approval",
    message: "Order LAB-2024-0032 - Fit issue reported",
    orderId: "LAB-2024-0032",
    patient: "James Wilson",
    vendor: "CAC",
    dueDate: null,
    createdAt: "3 hours ago",
  },
  {
    id: "5",
    type: "APPROACHING_DUE",
    severity: "INFO",
    title: "Order LAB-2024-0042 due soon",
    message: "Due Feb 15 - Status: IN_PROGRESS",
    orderId: "LAB-2024-0042",
    patient: "John Smith",
    vendor: "OLS",
    dueDate: "2024-02-15",
    createdAt: "1 hour ago",
  },
  {
    id: "6",
    type: "CONTRACT_EXPIRING",
    severity: "INFO",
    title: 'Contract "Clear Aligner Partnership" expiring soon',
    message: "Expires May 31 - Clear Aligner Co",
    orderId: null,
    patient: null,
    vendor: "CAC",
    dueDate: "2024-05-31",
    createdAt: "Today",
  },
];

function getAlertIcon(type: string) {
  switch (type) {
    case "OVERDUE":
      return <XCircle className="h-5 w-5 text-error-500" />;
    case "DUE_TODAY":
      return <Clock className="h-5 w-5 text-warning-500" />;
    case "APPROACHING_DUE":
      return <Calendar className="h-5 w-5 text-info-500" />;
    case "SHIPMENT_DELAYED":
      return <Truck className="h-5 w-5 text-warning-500" />;
    case "REMAKE_APPROVAL":
      return <RefreshCw className="h-5 w-5 text-warning-500" />;
    case "CONTRACT_EXPIRING":
      return <FileText className="h-5 w-5 text-info-500" />;
    default:
      return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
  }
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return <Badge variant="destructive" size="sm">Critical</Badge>;
    case "WARNING":
      return <Badge variant="warning" size="sm">Warning</Badge>;
    case "INFO":
      return <Badge variant="info" size="sm">Info</Badge>;
    default:
      return <Badge variant="outline" size="sm">{severity}</Badge>;
  }
}

export default function LabAlertsPage() {
  const [selectedTab, setSelectedTab] = useState("all");

  const criticalAlerts = alerts.filter((a) => a.severity === "CRITICAL");
  const warningAlerts = alerts.filter((a) => a.severity === "WARNING");
  const infoAlerts = alerts.filter((a) => a.severity === "INFO");

  const getFilteredAlerts = () => {
    switch (selectedTab) {
      case "critical":
        return criticalAlerts;
      case "warning":
        return warningAlerts;
      case "info":
        return infoAlerts;
      default:
        return alerts;
    }
  };

  return (
    <>
      <PageHeader
        title="Lab Alerts"
        compact
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Lab", href: "/lab" },
          { label: "Alerts" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <CheckCircle2 className="h-4 w-4" />
              Mark All Read
            </Button>
          </div>
        }
      />

      <PageContent density="comfortable">
        {/* Stats */}
        <StatsRow className="mb-6">
          <StatCard accentColor="error">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold">{criticalAlerts.length}</p>
                <p className="text-xs text-error-600 mt-1">Requires immediate action</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-error-100 p-2 text-error-600">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="warning">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold">{warningAlerts.length}</p>
                <p className="text-xs text-warning-600 mt-1">Needs attention</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-warning-100 p-2 text-warning-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Informational</p>
                <p className="text-2xl font-bold">{infoAlerts.length}</p>
                <p className="text-xs text-accent-600 mt-1">For your awareness</p>
              </div>
              <div className="icon-container-accent">
                <Bell className="h-5 w-5" />
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Alerts</p>
                <p className="text-2xl font-bold">{alerts.length}</p>
              </div>
              <div className="icon-container">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </StatCard>
        </StatsRow>

        {/* Alerts List */}
        <Card variant="bento">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Alerts</CardTitle>
                <CardDescription>
                  Notifications requiring your attention
                </CardDescription>
              </div>
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList>
                  <TabsTrigger value="all">
                    All
                    <Badge variant="outline" size="sm" className="ml-2">
                      {alerts.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="critical">
                    Critical
                    {criticalAlerts.length > 0 && (
                      <Badge variant="destructive" size="sm" className="ml-2">
                        {criticalAlerts.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="warning">
                    Warning
                    {warningAlerts.length > 0 && (
                      <Badge variant="warning" size="sm" className="ml-2">
                        {warningAlerts.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="info">Info</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getFilteredAlerts().map((alert) => (
                <ListItem
                  key={alert.id}
                  variant="bordered"
                  className={
                    alert.severity === "CRITICAL"
                      ? "border-error-200 bg-error-50/30"
                      : alert.severity === "WARNING"
                      ? "border-warning-200 bg-warning-50/30"
                      : ""
                  }
                  leading={getAlertIcon(alert.type)}
                  trailing={
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(alert.severity)}
                      {alert.orderId && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/lab/orders/${alert.orderId}`}>
                            View
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  }
                >
                  <ListItemTitle>{alert.title}</ListItemTitle>
                  <ListItemDescription>{alert.message}</ListItemDescription>
                  <div className="flex items-center gap-3 mt-2">
                    {alert.patient && (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[8px] bg-muted">
                            {alert.patient.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          <PhiProtected fakeData={getFakeName()}>
                            {alert.patient}
                          </PhiProtected>
                        </span>
                      </div>
                    )}
                    {alert.vendor && (
                      <Badge variant="outline" size="sm">
                        {alert.vendor}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {alert.createdAt}
                    </span>
                  </div>
                </ListItem>
              ))}

              {getFilteredAlerts().length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-success-500" />
                  <p className="font-medium">No alerts</p>
                  <p className="text-sm">All caught up!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}

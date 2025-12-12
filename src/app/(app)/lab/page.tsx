"use client";

import {
  Package,
  Truck,
  Clock,
  AlertCircle,
  TrendingUp,
  Building2,
  Plus,
  Search,
  ChevronRight,
  ArrowUpRight,
  PackageCheck,
  MoreHorizontal,
  Calendar,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  StatCard,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ListItem,
  ListItemTitle,
  ListItemDescription,
  ListActivity,
} from "@/components/ui/list-item";
import {
  PageHeader,
  PageContent,
  DashboardGrid,
  StatsRow,
} from "@/components/layout";
import { PhiProtected } from "@/components/ui/phi-protected";
import { getFakeName } from "@/lib/fake-data";

// Mock data for demo
const recentOrders = [
  {
    orderNumber: "LAB-2024-0042",
    patient: "John Smith",
    initials: "JS",
    vendor: "Ortho Lab Solutions",
    vendorCode: "OLS",
    product: "Hawley Retainer",
    status: "IN_PROGRESS",
    neededBy: "Feb 15",
    isRush: false,
  },
  {
    orderNumber: "LAB-2024-0041",
    patient: "Sarah Johnson",
    initials: "SJ",
    vendor: "Precision Orthodontics",
    vendorCode: "PO",
    product: "RPE (Hyrax)",
    status: "SHIPPED",
    neededBy: "Feb 12",
    isRush: true,
  },
  {
    orderNumber: "LAB-2024-0040",
    patient: "Michael Brown",
    initials: "MB",
    vendor: "Clear Aligner Co",
    vendorCode: "CAC",
    product: "Clear Retainer Set",
    status: "SUBMITTED",
    neededBy: "Feb 18",
    isRush: false,
  },
  {
    orderNumber: "LAB-2024-0039",
    patient: "Emily Davis",
    initials: "ED",
    vendor: "Ortho Lab Solutions",
    vendorCode: "OLS",
    product: "Indirect Bonding Tray",
    status: "COMPLETED",
    neededBy: "Feb 10",
    isRush: false,
  },
  {
    orderNumber: "LAB-2024-0038",
    patient: "James Wilson",
    initials: "JW",
    vendor: "Precision Orthodontics",
    vendorCode: "PO",
    product: "Herbst Appliance",
    status: "DELIVERED",
    neededBy: "Feb 8",
    isRush: false,
  },
];

const vendorPerformance = [
  { name: "Ortho Lab Solutions", code: "OLS", orders: 45, onTime: 98, quality: 96 },
  { name: "Precision Orthodontics", code: "PO", orders: 32, onTime: 95, quality: 94 },
  { name: "Clear Aligner Co", code: "CAC", orders: 28, onTime: 92, quality: 97 },
  { name: "RetainerWorks", code: "RW", orders: 18, onTime: 100, quality: 95 },
];

const recentActivity = [
  { type: "shipped", message: "RPE for Sarah Johnson shipped via FedEx", time: "10 min ago", color: "info" },
  { type: "delivered", message: "Clear retainers for Michael Brown delivered", time: "1 hour ago", color: "success" },
  { type: "remake", message: "Remake requested for Order #0035", time: "2 hours ago", color: "warning" },
  { type: "submitted", message: "New order submitted to Ortho Lab Solutions", time: "3 hours ago", color: "primary" },
];

const awaitingPickup = [
  { patient: "Emma Thompson", initials: "ET", item: "Hawley Retainer", arrivedAt: "Yesterday" },
  { patient: "David Lee", initials: "DL", item: "Sport Mouth Guard", arrivedAt: "2 days ago" },
  { patient: "Olivia Martinez", initials: "OM", item: "Clear Retainer", arrivedAt: "3 days ago" },
];

function getStatusBadge(status: string, isRush: boolean) {
  const variants: Record<string, { variant: "success" | "warning" | "info" | "destructive" | "soft-primary"; label: string }> = {
    DRAFT: { variant: "soft-primary", label: "Draft" },
    SUBMITTED: { variant: "info", label: "Submitted" },
    ACKNOWLEDGED: { variant: "info", label: "Acknowledged" },
    IN_PROGRESS: { variant: "warning", label: "In Progress" },
    COMPLETED: { variant: "success", label: "Completed" },
    SHIPPED: { variant: "info", label: "Shipped" },
    DELIVERED: { variant: "success", label: "Delivered" },
    RECEIVED: { variant: "success", label: "Received" },
    CANCELLED: { variant: "destructive", label: "Cancelled" },
  };

  const { variant, label } = variants[status] || { variant: "soft-primary" as const, label: status };

  return (
    <div className="flex items-center gap-1">
      <Badge variant={variant} size="sm" dot>
        {label}
      </Badge>
      {isRush && (
        <Badge variant="destructive" size="sm">
          Rush
        </Badge>
      )}
    </div>
  );
}

export default function LabDashboardPage() {
  return (
    <>
      <PageHeader
        title="Lab Work Management"
        compact
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Lab" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search orders..." className="pl-9 w-64" inputSize="sm" />
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/lab/vendors">
                <Building2 className="h-4 w-4" />
                Vendors
              </Link>
            </Button>
            <Button asChild>
              <Link href="/lab/orders/new">
                <Plus className="h-4 w-4" />
                New Order
              </Link>
            </Button>
          </div>
        }
      />

      <PageContent density="comfortable">
        <DashboardGrid>
          {/* Stats Row */}
          <DashboardGrid.FullWidth>
            <StatsRow>
              <StatCard accentColor="primary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Active Orders</p>
                    <p className="text-2xl font-bold">24</p>
                    <p className="text-xs text-muted-foreground mt-1">8 in progress, 16 pending</p>
                  </div>
                  <div className="icon-container">
                    <Package className="h-5 w-5" />
                  </div>
                </div>
              </StatCard>

              <StatCard accentColor="accent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">In Transit</p>
                    <p className="text-2xl font-bold">6</p>
                    <p className="text-xs text-muted-foreground mt-1">2 arriving today</p>
                  </div>
                  <div className="icon-container-accent">
                    <Truck className="h-5 w-5" />
                  </div>
                </div>
              </StatCard>

              <StatCard accentColor="warning">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Due Soon</p>
                    <p className="text-2xl font-bold">5</p>
                    <p className="text-xs text-warning-600 mt-1">Within 3 days</p>
                  </div>
                  <div className="flex items-center justify-center rounded-xl bg-warning-100 p-2 text-warning-600">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
              </StatCard>

              <StatCard accentColor="success">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Awaiting Pickup</p>
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-xs text-success-600 flex items-center gap-1 mt-1">
                      <PackageCheck className="h-3 w-3" />
                      Ready for patients
                    </p>
                  </div>
                  <div className="flex items-center justify-center rounded-xl bg-success-100 p-2 text-success-600">
                    <PackageCheck className="h-5 w-5" />
                  </div>
                </div>
              </StatCard>
            </StatsRow>
          </DashboardGrid.FullWidth>

          {/* Recent Orders */}
          <DashboardGrid.TwoThirds>
            <Card variant="bento" className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Track lab orders and their status</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/lab/orders">
                      View All
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="text-xs h-9">Order</TableHead>
                        <TableHead className="text-xs h-9">Patient</TableHead>
                        <TableHead className="text-xs h-9">Product</TableHead>
                        <TableHead className="text-xs h-9">Lab</TableHead>
                        <TableHead className="text-xs h-9">Status</TableHead>
                        <TableHead className="text-xs h-9">Needed By</TableHead>
                        <TableHead className="text-xs h-9 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((order, i) => (
                        <TableRow key={i} className="h-12">
                          <TableCell className="font-mono text-sm font-medium">
                            <Link href={`/lab/orders/${order.orderNumber}`} className="text-primary-600 hover:underline">
                              {order.orderNumber}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-[10px] bg-gradient-primary text-white">
                                  {order.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                <PhiProtected fakeData={getFakeName()}>
                                  {order.patient}
                                </PhiProtected>
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {order.product}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" size="sm">
                              {order.vendorCode}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(order.status, order.isRush)}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {order.neededBy}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>Track Shipment</DropdownMenuItem>
                                <DropdownMenuItem>Contact Lab</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">Request Remake</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </DashboardGrid.TwoThirds>

          {/* Vendor Performance */}
          <DashboardGrid.OneThird>
            <Card variant="bento" className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Vendor Performance</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/lab/vendors">
                      View All
                      <ArrowUpRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {vendorPerformance.map((vendor, i) => (
                  <ListItem
                    key={i}
                    showArrow
                    leading={
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-accent text-white text-xs">
                          {vendor.code}
                        </AvatarFallback>
                      </Avatar>
                    }
                    trailing={
                      <div className="text-right">
                        <p className="text-sm font-medium">{vendor.onTime}%</p>
                        <p className="text-xs text-muted-foreground">on-time</p>
                      </div>
                    }
                  >
                    <ListItemTitle>{vendor.name}</ListItemTitle>
                    <ListItemDescription>{vendor.orders} orders this month</ListItemDescription>
                    <div className="mt-1.5">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-accent rounded-full transition-all"
                          style={{ width: `${vendor.quality}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{vendor.quality}% quality score</p>
                    </div>
                  </ListItem>
                ))}
              </CardContent>
            </Card>
          </DashboardGrid.OneThird>

          {/* Awaiting Pickup */}
          <DashboardGrid.Half>
            <Card variant="bento">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Awaiting Patient Pickup</CardTitle>
                  <Badge variant="success" size="sm">
                    {awaitingPickup.length} items
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {awaitingPickup.map((item, i) => (
                  <ListItem
                    key={i}
                    variant="bordered"
                    leading={
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-[10px] bg-success-100 text-success-600">
                          {item.initials}
                        </AvatarFallback>
                      </Avatar>
                    }
                    trailing={
                      <Button variant="outline" size="sm">
                        Confirm Pickup
                      </Button>
                    }
                  >
                    <ListItemTitle>
                      <PhiProtected fakeData={getFakeName()}>
                        {item.patient}
                      </PhiProtected>
                    </ListItemTitle>
                    <ListItemDescription>
                      {item.item} &bull; Arrived {item.arrivedAt}
                    </ListItemDescription>
                  </ListItem>
                ))}
              </CardContent>
            </Card>
          </DashboardGrid.Half>

          {/* Recent Activity */}
          <DashboardGrid.Half>
            <Card variant="bento">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Activity</CardTitle>
                  <Button variant="ghost" size="icon-sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentActivity.map((activity, i) => (
                  <ListActivity
                    key={i}
                    indicatorColor={activity.color as "primary" | "success" | "warning" | "info"}
                  >
                    <p className="text-sm leading-tight">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </ListActivity>
                ))}
              </CardContent>
            </Card>
          </DashboardGrid.Half>

          {/* Quick Actions */}
          <DashboardGrid.FullWidth>
            <Card variant="ghost">
              <CardContent className="py-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="soft" size="sm" asChild>
                    <Link href="/lab/orders/new">
                      <Plus className="h-4 w-4" />
                      New Order
                    </Link>
                  </Button>
                  <Button variant="soft" size="sm" asChild>
                    <Link href="/lab/tracking">
                      <Truck className="h-4 w-4" />
                      Track Shipments
                    </Link>
                  </Button>
                  <Button variant="soft" size="sm" asChild>
                    <Link href="/lab/vendors">
                      <Building2 className="h-4 w-4" />
                      Manage Vendors
                    </Link>
                  </Button>
                  <Button variant="soft" size="sm" asChild>
                    <Link href="/lab/products">
                      <Package className="h-4 w-4" />
                      Product Catalog
                    </Link>
                  </Button>
                  <Button variant="soft-accent" size="sm">
                    <AlertCircle className="h-4 w-4" />
                    View At-Risk Orders
                  </Button>
                  <Button variant="soft-accent" size="sm">
                    <TrendingUp className="h-4 w-4" />
                    Quality Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </DashboardGrid.FullWidth>
        </DashboardGrid>
      </PageContent>
    </>
  );
}

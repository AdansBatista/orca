"use client";

import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Clock,
  RefreshCw,
  Building2,
  BarChart3,
  PieChart,
  Calendar,
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListItem, ListItemTitle, ListItemDescription } from "@/components/ui/list-item";
import {
  PageHeader,
  PageContent,
  DashboardGrid,
  StatsRow,
} from "@/components/layout";
import { StatCard } from "@/components/ui/card";

// Mock analytics data
const stats = {
  totalOrders: 156,
  ordersChange: 12,
  totalSpend: 24850,
  spendChange: -5,
  avgTurnaround: 6.2,
  turnaroundChange: -0.8,
  remakeRate: 3.2,
  remakeChange: -1.1,
};

const vendorMetrics = [
  { name: "Ortho Lab Solutions", code: "OLS", orders: 68, spend: 10250, onTime: 98, quality: 96 },
  { name: "Precision Orthodontics", code: "PO", orders: 45, spend: 8100, onTime: 95, quality: 94 },
  { name: "Clear Aligner Co", code: "CAC", orders: 28, spend: 4200, onTime: 92, quality: 97 },
  { name: "RetainerWorks", code: "RW", orders: 15, spend: 2300, onTime: 100, quality: 95 },
];

const productBreakdown = [
  { name: "Retainers", count: 52, percentage: 33 },
  { name: "Appliances", count: 38, percentage: 24 },
  { name: "Aligners", count: 28, percentage: 18 },
  { name: "Indirect Bonding", count: 22, percentage: 14 },
  { name: "Other", count: 16, percentage: 11 },
];

const monthlyTrend = [
  { month: "Sep", orders: 32, spend: 4200 },
  { month: "Oct", orders: 38, spend: 5100 },
  { month: "Nov", orders: 42, spend: 6200 },
  { month: "Dec", orders: 35, spend: 4800 },
  { month: "Jan", orders: 45, spend: 6850 },
  { month: "Feb", orders: 48, spend: 7200 },
];

export default function LabAnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Lab Analytics"
        compact
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Lab", href: "/lab" },
          { label: "Analytics" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Select defaultValue="30">
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        }
      />

      <PageContent density="comfortable">
        {/* Key Metrics */}
        <StatsRow className="mb-6">
          <StatCard accentColor="primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stats.ordersChange > 0 ? (
                    <TrendingUp className="h-3 w-3 text-success-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-error-600" />
                  )}
                  <span className={`text-xs ${stats.ordersChange > 0 ? "text-success-600" : "text-error-600"}`}>
                    {stats.ordersChange > 0 ? "+" : ""}{stats.ordersChange}% vs last period
                  </span>
                </div>
              </div>
              <div className="icon-container">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Spend</p>
                <p className="text-2xl font-bold">${stats.totalSpend.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stats.spendChange < 0 ? (
                    <TrendingDown className="h-3 w-3 text-success-600" />
                  ) : (
                    <TrendingUp className="h-3 w-3 text-error-600" />
                  )}
                  <span className={`text-xs ${stats.spendChange < 0 ? "text-success-600" : "text-error-600"}`}>
                    {stats.spendChange}% vs last period
                  </span>
                </div>
              </div>
              <div className="icon-container-accent">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="success">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Turnaround</p>
                <p className="text-2xl font-bold">{stats.avgTurnaround} days</p>
                <div className="flex items-center gap-1 mt-1">
                  {stats.turnaroundChange < 0 ? (
                    <TrendingDown className="h-3 w-3 text-success-600" />
                  ) : (
                    <TrendingUp className="h-3 w-3 text-error-600" />
                  )}
                  <span className={`text-xs ${stats.turnaroundChange < 0 ? "text-success-600" : "text-error-600"}`}>
                    {stats.turnaroundChange} days
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-success-100 p-2 text-success-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="warning">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Remake Rate</p>
                <p className="text-2xl font-bold">{stats.remakeRate}%</p>
                <div className="flex items-center gap-1 mt-1">
                  {stats.remakeChange < 0 ? (
                    <TrendingDown className="h-3 w-3 text-success-600" />
                  ) : (
                    <TrendingUp className="h-3 w-3 text-error-600" />
                  )}
                  <span className={`text-xs ${stats.remakeChange < 0 ? "text-success-600" : "text-error-600"}`}>
                    {stats.remakeChange}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-warning-100 p-2 text-warning-600">
                <RefreshCw className="h-5 w-5" />
              </div>
            </div>
          </StatCard>
        </StatsRow>

        <DashboardGrid>
          {/* Vendor Performance */}
          <DashboardGrid.TwoThirds>
            <Card variant="bento" className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Vendor Performance</CardTitle>
                    <CardDescription>Order volume and quality metrics by vendor</CardDescription>
                  </div>
                  <Badge variant="outline">
                    <Building2 className="h-3 w-3 mr-1" />
                    {vendorMetrics.length} vendors
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {vendorMetrics.map((vendor) => (
                  <div key={vendor.code} className="p-4 rounded-xl border border-border/50 bg-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-accent text-white text-xs">
                            {vendor.code}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{vendor.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {vendor.orders} orders • ${vendor.spend.toLocaleString()} spend
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-semibold text-success-600">{vendor.onTime}%</p>
                          <p className="text-xs text-muted-foreground">On-time</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-primary-600">{vendor.quality}%</p>
                          <p className="text-xs text-muted-foreground">Quality</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">On-time Delivery</span>
                          <span>{vendor.onTime}%</span>
                        </div>
                        <Progress value={vendor.onTime} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Quality Score</span>
                          <span>{vendor.quality}%</span>
                        </div>
                        <Progress value={vendor.quality} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </DashboardGrid.TwoThirds>

          {/* Product Breakdown */}
          <DashboardGrid.OneThird>
            <Card variant="bento" className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Product Breakdown</CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {productBreakdown.map((product) => (
                  <div key={product.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span>{product.name}</span>
                      <span className="font-medium">{product.count}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={product.percentage} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {product.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </DashboardGrid.OneThird>

          {/* Monthly Trend */}
          <DashboardGrid.FullWidth>
            <Card variant="bento">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Monthly Trend</CardTitle>
                    <CardDescription>Orders and spend over time</CardDescription>
                  </div>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-4">
                  {monthlyTrend.map((month) => (
                    <div key={month.month} className="text-center">
                      <div className="h-24 flex items-end justify-center gap-1 mb-2">
                        <div
                          className="w-6 bg-primary-500 rounded-t"
                          style={{ height: `${(month.orders / 50) * 100}%` }}
                          title={`${month.orders} orders`}
                        />
                        <div
                          className="w-6 bg-accent-500 rounded-t"
                          style={{ height: `${(month.spend / 8000) * 100}%` }}
                          title={`$${month.spend}`}
                        />
                      </div>
                      <p className="text-xs font-medium">{month.month}</p>
                      <p className="text-xs text-muted-foreground">{month.orders} orders</p>
                      <p className="text-xs text-muted-foreground">${month.spend.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-primary-500" />
                    <span className="text-xs text-muted-foreground">Orders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-accent-500" />
                    <span className="text-xs text-muted-foreground">Spend</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </DashboardGrid.FullWidth>
        </DashboardGrid>
      </PageContent>
    </>
  );
}

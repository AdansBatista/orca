'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  Package,
  DollarSign,
  Activity,
  Calendar,
  Filter,
  RefreshCw,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { StatsRow } from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface UsageSummary {
  totalUsage: number;
  totalCost: number;
  averageDailyUsage: number;
  averageDailyCost: number;
  uniqueItems: number;
  dateRange: {
    from: string;
    to: string;
    days: number;
  };
}

interface ChartDataPoint {
  key: string;
  label: string;
  quantity: number;
  cost: number;
  uniqueItems: number;
}

interface TopItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  cost: number;
}

interface UsageAnalyticsData {
  summary: UsageSummary;
  chartData: ChartDataPoint[];
  topItems: TopItem[];
}

const CATEGORY_COLORS: Record<string, string> = {
  BRACKETS: '#2563eb',
  WIRES: '#7c3aed',
  ELASTICS: '#db2777',
  BANDS: '#ea580c',
  BONDING: '#16a34a',
  IMPRESSION: '#0891b2',
  RETAINERS: '#6366f1',
  INSTRUMENTS: '#8b5cf6',
  DISPOSABLES: '#64748b',
  PPE: '#f59e0b',
  OFFICE_SUPPLIES: '#84cc16',
  CLEANING: '#06b6d4',
  OTHER: '#94a3b8',
};

// Note: Select.Item cannot have empty string values. Use '__all__' for "all" options
// and convert to empty string when building API queries.
const categoryOptions = [
  { value: '__all__', label: 'All Categories' },
  { value: 'BRACKETS', label: 'Brackets' },
  { value: 'WIRES', label: 'Wires' },
  { value: 'ELASTICS', label: 'Elastics' },
  { value: 'BANDS', label: 'Bands' },
  { value: 'BONDING', label: 'Bonding' },
  { value: 'IMPRESSION', label: 'Impression' },
  { value: 'RETAINERS', label: 'Retainers' },
  { value: 'INSTRUMENTS', label: 'Instruments' },
  { value: 'DISPOSABLES', label: 'Disposables' },
  { value: 'PPE', label: 'PPE' },
  { value: 'CLEANING', label: 'Cleaning' },
];

const timeRangeOptions = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '180', label: 'Last 6 months' },
  { value: '365', label: 'Last year' },
];

const groupByOptions = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

interface UsageAnalyticsProps {
  className?: string;
}

export function UsageAnalytics({ className }: UsageAnalyticsProps) {
  const [data, setData] = useState<UsageAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  // Use '__all__' as default for Select components (they can't have empty string values)
  const [category, setCategory] = useState('__all__');
  const [timeRange, setTimeRange] = useState('30');
  const [groupBy, setGroupBy] = useState('day');

  // Fetch analytics data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      // Convert '__all__' back to empty (don't send filter) for API calls
      if (category && category !== '__all__') params.set('category', category);
      params.set('groupBy', groupBy);

      // Calculate date range
      const dateTo = new Date();
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - parseInt(timeRange));
      params.set('dateFrom', dateFrom.toISOString());
      params.set('dateTo', dateTo.toISOString());

      const response = await fetch(`/api/resources/inventory/analytics/usage?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [category, timeRange, groupBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Aggregate by category
  const categoryData = useMemo(() => {
    if (!data?.topItems) return [];

    const categoryMap: Record<string, { name: string; category: string; value: number; cost: number }> = {};

    for (const item of data.topItems) {
      if (!categoryMap[item.category]) {
        categoryMap[item.category] = {
          name: item.category.replace('_', ' '),
          category: item.category,
          value: 0,
          cost: 0,
        };
      }
      categoryMap[item.category].value += item.quantity;
      categoryMap[item.category].cost += item.cost;
    }

    return Object.values(categoryMap).sort((a, b) => b.value - a.value);
  }, [data?.topItems]);

  if (error) {
    return (
      <Card variant="ghost" className={className}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-error-500 mx-auto mb-2" />
          <p className="text-error-600">{error}</p>
          <Button variant="outline" onClick={fetchData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Filters */}
      <Card variant="ghost">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groupByOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1" />

            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {loading ? (
        <StatsRow>
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCard key={i} accentColor="primary">
              <Skeleton className="h-16 w-full" />
            </StatCard>
          ))}
        </StatsRow>
      ) : data?.summary && (
        <StatsRow>
          <StatCard accentColor="primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Usage</p>
                <p className="text-xl font-bold">{data.summary.totalUsage.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">units consumed</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 p-2">
                <Package className="h-4 w-4 text-primary-600" />
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Cost</p>
                <p className="text-xl font-bold">{formatCurrency(data.summary.totalCost)}</p>
                <p className="text-xs text-muted-foreground">in {data.summary.dateRange.days} days</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-accent-100 dark:bg-accent-900/30 p-2">
                <DollarSign className="h-4 w-4 text-accent-600" />
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="success">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Daily Average</p>
                <p className="text-xl font-bold">{data.summary.averageDailyUsage.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">units/day</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-success-100 dark:bg-success-900/30 p-2">
                <Activity className="h-4 w-4 text-success-600" />
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="secondary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Unique Items</p>
                <p className="text-xl font-bold">{data.summary.uniqueItems}</p>
                <p className="text-xs text-muted-foreground">items used</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-secondary-100 dark:bg-secondary-900/30 p-2">
                <TrendingUp className="h-4 w-4 text-secondary-600" />
              </div>
            </div>
          </StatCard>
        </StatsRow>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Usage Trend Chart (Simple Bar Chart) */}
        <Card>
          <CardHeader>
            <CardTitle size="sm" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Usage Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : data?.chartData && data.chartData.length > 0 ? (
              <SimpleBarChart
                data={data.chartData}
                dataKey="quantity"
                color="#2563eb"
                label="Units"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No usage data for selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle size="sm" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Cost Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : data?.chartData && data.chartData.length > 0 ? (
              <SimpleBarChart
                data={data.chartData}
                dataKey="cost"
                color="#7c3aed"
                label="Cost"
                formatValue={(v) => formatCurrency(v)}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No cost data for selected period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Items Table */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Top Used Items</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data?.topItems && data.topItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.OTHER,
                          color: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.OTHER,
                        }}
                      >
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.cost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No items used during this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Distribution */}
      {categoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle size="sm" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Usage by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Simple Pie Chart */}
              <SimplePieChart data={categoryData} />

              {/* Category Legend */}
              <div className="space-y-2">
                {categoryData.map((cat) => {
                  const total = categoryData.reduce((sum, c) => sum + c.value, 0);
                  const percentage = total > 0 ? ((cat.value / total) * 100).toFixed(1) : '0';

                  return (
                    <div key={cat.category} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#64748b' }}
                        />
                        <span className="text-sm">{cat.name}</span>
                        <span className="text-xs text-muted-foreground">({percentage}%)</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{cat.value.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(cat.cost)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Simple Bar Chart component (no external library)
 */
interface SimpleBarChartProps {
  data: ChartDataPoint[];
  dataKey: 'quantity' | 'cost';
  color: string;
  label: string;
  formatValue?: (value: number) => string;
}

function SimpleBarChart({ data, dataKey, color, label, formatValue }: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d[dataKey]));
  const displayData = data.slice(-10); // Show last 10 data points

  return (
    <div className="h-64 flex items-end gap-2 pt-4">
      {displayData.map((point, index) => {
        const value = point[dataKey];
        const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
        const formattedValue = formatValue ? formatValue(value) : value.toLocaleString();

        return (
          <div
            key={point.key}
            className="flex-1 flex flex-col items-center gap-1 group"
          >
            {/* Value tooltip */}
            <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {formattedValue}
            </div>

            {/* Bar */}
            <div className="w-full relative" style={{ height: '180px' }}>
              <div
                className="absolute bottom-0 w-full rounded-t transition-all duration-300 hover:opacity-80"
                style={{
                  height: `${height}%`,
                  backgroundColor: color,
                  minHeight: value > 0 ? '4px' : '0',
                }}
              />
            </div>

            {/* Label */}
            <div className="text-xs text-muted-foreground truncate w-full text-center">
              {point.label.length > 10 ? point.label.slice(0, 10) : point.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Simple Pie Chart component (CSS-based)
 */
interface SimplePieChartProps {
  data: { name: string; category: string; value: number; cost: number }[];
}

function SimplePieChart({ data }: SimplePieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return null;

  // Calculate cumulative percentages for conic-gradient
  let cumulative = 0;
  const gradientStops = data.map((item) => {
    const start = cumulative;
    const percentage = (item.value / total) * 100;
    cumulative += percentage;
    return {
      color: CATEGORY_COLORS[item.category] || '#64748b',
      start,
      end: cumulative,
    };
  });

  const gradientString = gradientStops
    .map((stop) => `${stop.color} ${stop.start}% ${stop.end}%`)
    .join(', ');

  return (
    <div className="flex items-center justify-center h-64">
      <div
        className="w-48 h-48 rounded-full relative"
        style={{
          background: `conic-gradient(${gradientString})`,
        }}
      >
        {/* Inner circle for donut effect */}
        <div className="absolute inset-8 rounded-full bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold">{total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Units</p>
          </div>
        </div>
      </div>
    </div>
  );
}

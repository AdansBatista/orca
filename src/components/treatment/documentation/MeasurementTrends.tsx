'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, Activity, Calendar, ArrowRight } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

export interface MeasurementRecord {
  id: string;
  measurementType: string;
  value: number;
  unit: string;
  recordedAt: Date;
  notes?: string;
}

interface MeasurementTrendsProps {
  measurements: MeasurementRecord[];
  patientId?: string;
  treatmentPlanId?: string;
}

const measurementTypeLabels: Record<string, { label: string; description: string; idealRange?: { min: number; max: number } }> = {
  OVERJET: { label: 'Overjet', description: 'Horizontal overlap of incisors', idealRange: { min: 1, max: 3 } },
  OVERBITE: { label: 'Overbite', description: 'Vertical overlap of incisors', idealRange: { min: 1, max: 3 } },
  OVERBITE_PERCENT: { label: 'Overbite %', description: 'Percentage overlap', idealRange: { min: 10, max: 30 } },
  CROWDING_UPPER: { label: 'Crowding (Upper)', description: 'Upper arch crowding', idealRange: { min: 0, max: 0 } },
  CROWDING_LOWER: { label: 'Crowding (Lower)', description: 'Lower arch crowding', idealRange: { min: 0, max: 0 } },
  SPACING_UPPER: { label: 'Spacing (Upper)', description: 'Upper arch spacing', idealRange: { min: 0, max: 0 } },
  SPACING_LOWER: { label: 'Spacing (Lower)', description: 'Lower arch spacing', idealRange: { min: 0, max: 0 } },
  MIDLINE_UPPER: { label: 'Midline (Upper)', description: 'Upper midline deviation', idealRange: { min: 0, max: 1 } },
  MIDLINE_LOWER: { label: 'Midline (Lower)', description: 'Lower midline deviation', idealRange: { min: 0, max: 1 } },
  INTERCANINE_WIDTH_UPPER: { label: 'Intercanine (Upper)', description: 'Upper arch width at canines' },
  INTERCANINE_WIDTH_LOWER: { label: 'Intercanine (Lower)', description: 'Lower arch width at canines' },
  INTERMOLAR_WIDTH_UPPER: { label: 'Intermolar (Upper)', description: 'Upper arch width at molars' },
  INTERMOLAR_WIDTH_LOWER: { label: 'Intermolar (Lower)', description: 'Lower arch width at molars' },
  MOLAR_RELATIONSHIP_RIGHT: { label: 'Molar (Right)', description: 'Right molar relationship' },
  MOLAR_RELATIONSHIP_LEFT: { label: 'Molar (Left)', description: 'Left molar relationship' },
  CANINE_RELATIONSHIP_RIGHT: { label: 'Canine (Right)', description: 'Right canine relationship' },
  CANINE_RELATIONSHIP_LEFT: { label: 'Canine (Left)', description: 'Left canine relationship' },
};

export function MeasurementTrends({ measurements }: MeasurementTrendsProps) {
  const [selectedType, setSelectedType] = useState<string>('all');

  // Group measurements by type and sort by date
  const groupedMeasurements = useMemo(() => {
    const grouped: Record<string, MeasurementRecord[]> = {};
    measurements.forEach((m) => {
      if (!grouped[m.measurementType]) {
        grouped[m.measurementType] = [];
      }
      grouped[m.measurementType].push(m);
    });
    // Sort each group by date
    Object.keys(grouped).forEach((type) => {
      grouped[type].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
    });
    return grouped;
  }, [measurements]);

  const measurementTypes = Object.keys(groupedMeasurements);

  // Calculate trends for each measurement type
  const trends = useMemo(() => {
    const result: Record<string, { trend: 'up' | 'down' | 'stable'; change: number; first: number; last: number; count: number }> = {};
    Object.entries(groupedMeasurements).forEach(([type, records]) => {
      if (records.length < 2) {
        result[type] = { trend: 'stable', change: 0, first: records[0]?.value || 0, last: records[0]?.value || 0, count: records.length };
      } else {
        const first = records[0].value;
        const last = records[records.length - 1].value;
        const change = last - first;
        result[type] = {
          trend: change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'stable',
          change,
          first,
          last,
          count: records.length,
        };
      }
    });
    return result;
  }, [groupedMeasurements]);

  const getTypeLabel = (type: string) => measurementTypeLabels[type]?.label || type;
  const getTypeDescription = (type: string) => measurementTypeLabels[type]?.description || '';
  const getIdealRange = (type: string) => measurementTypeLabels[type]?.idealRange;

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendColor = (type: string, trend: 'up' | 'down' | 'stable') => {
    // For most measurements, decreasing towards 0 is good (crowding, spacing, midline deviation)
    const negativeIsGood = [
      'CROWDING_UPPER', 'CROWDING_LOWER', 'SPACING_UPPER', 'SPACING_LOWER',
      'MIDLINE_UPPER', 'MIDLINE_LOWER',
    ];

    if (trend === 'stable') return 'secondary';

    if (negativeIsGood.includes(type)) {
      return trend === 'down' ? 'success' : 'warning';
    }

    // For overjet/overbite, it depends on whether it's moving toward ideal
    return 'info';
  };

  const isWithinIdealRange = (type: string, value: number) => {
    const range = getIdealRange(type);
    if (!range) return null;
    return value >= range.min && value <= range.max;
  };

  const filteredTypes = selectedType === 'all' ? measurementTypes : [selectedType];

  if (measurements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle size="sm" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Measurement Trends
          </CardTitle>
          <CardDescription>Track changes in clinical measurements over time</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No measurement data available. Record measurements during progress notes to see trends.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle size="sm" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Measurement Trends
            </CardTitle>
            <CardDescription>Track changes in clinical measurements over time</CardDescription>
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Measurements</SelectItem>
              {measurementTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {getTypeLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {filteredTypes.slice(0, 4).map((type) => {
            const trendData = trends[type];
            const records = groupedMeasurements[type];
            const lastRecord = records[records.length - 1];
            const withinIdeal = isWithinIdealRange(type, lastRecord.value);

            return (
              <div key={type} className="p-4 rounded-lg bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{getTypeLabel(type)}</p>
                  <Badge
                    variant={getTrendColor(type, trendData.trend) as "success" | "warning" | "info" | "secondary"}
                    size="sm"
                  >
                    {getTrendIcon(trendData.trend)}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{lastRecord.value}</span>
                  <span className="text-sm text-muted-foreground">{lastRecord.unit}</span>
                </div>
                {trendData.count > 1 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">
                      {trendData.change > 0 ? '+' : ''}{trendData.change.toFixed(1)} from start
                    </span>
                  </div>
                )}
                {withinIdeal !== null && (
                  <Badge
                    variant={withinIdeal ? 'success' : 'warning'}
                    size="sm"
                  >
                    {withinIdeal ? 'Within ideal range' : 'Outside ideal range'}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Detailed Trend List */}
        <div className="space-y-4">
          {filteredTypes.map((type) => {
            const records = groupedMeasurements[type];
            const trendData = trends[type];
            const idealRange = getIdealRange(type);

            return (
              <div key={type} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-medium">{getTypeLabel(type)}</h4>
                    <p className="text-sm text-muted-foreground">{getTypeDescription(type)}</p>
                    {idealRange && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Ideal range: {idealRange.min} - {idealRange.max} {records[0]?.unit}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={getTrendColor(type, trendData.trend) as "success" | "warning" | "info" | "secondary"}
                  >
                    {getTrendIcon(trendData.trend)}
                    <span className="ml-1">
                      {trendData.trend === 'stable' ? 'Stable' : trendData.change > 0 ? `+${trendData.change.toFixed(1)}` : trendData.change.toFixed(1)}
                    </span>
                  </Badge>
                </div>

                {/* Visual Timeline */}
                <div className="relative">
                  {/* Progress Bar Background */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    {idealRange && (
                      <div
                        className="absolute h-2 bg-success-100 rounded-full"
                        style={{
                          left: `${Math.max(0, (idealRange.min / 10) * 100)}%`,
                          width: `${Math.min(100, ((idealRange.max - idealRange.min) / 10) * 100)}%`,
                        }}
                      />
                    )}
                  </div>

                  {/* Data Points */}
                  <div className="flex items-center justify-between mt-4">
                    {records.map((record, idx) => {
                      const withinIdeal = isWithinIdealRange(type, record.value);
                      const isFirst = idx === 0;
                      const isLast = idx === records.length - 1;

                      return (
                        <div
                          key={record.id}
                          className={`flex flex-col items-center ${
                            isFirst || isLast ? 'flex-1' : 'flex-shrink-0'
                          }`}
                          style={{ minWidth: isFirst || isLast ? 'auto' : '60px' }}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                              withinIdeal === true
                                ? 'bg-success-100 text-success-700'
                                : withinIdeal === false
                                ? 'bg-warning-100 text-warning-700'
                                : 'bg-primary-100 text-primary-700'
                            } ${isLast ? 'ring-2 ring-primary-500' : ''}`}
                          >
                            {record.value}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(record.recordedAt), 'MMM d')}
                          </p>
                          {!isLast && idx < records.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-muted-foreground absolute" style={{ left: `${(idx + 1) * (100 / records.length)}%`, top: '8px' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* First vs Last Comparison */}
                {records.length > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">First Recording</p>
                      <p className="font-medium">
                        {records[0].value} {records[0].unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(records[0].recordedAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge
                        variant={getTrendColor(type, trendData.trend) === 'success' ? 'success' : getTrendColor(type, trendData.trend) === 'warning' ? 'warning' : 'info'}
                      >
                        {trendData.change > 0 ? '+' : ''}{trendData.change.toFixed(1)} {records[0].unit}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Latest Recording</p>
                      <p className="font-medium">
                        {records[records.length - 1].value} {records[records.length - 1].unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(records[records.length - 1].recordedAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                )}

                {/* All Records Table */}
                {records.length > 2 && (
                  <details className="mt-4">
                    <summary className="text-sm text-primary-600 cursor-pointer hover:underline">
                      View all {records.length} recordings
                    </summary>
                    <div className="mt-2 rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-2 font-medium">Date</th>
                            <th className="text-right p-2 font-medium">Value</th>
                            <th className="text-right p-2 font-medium">Change</th>
                            <th className="text-left p-2 font-medium">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {records.map((record, idx) => {
                            const prevValue = idx > 0 ? records[idx - 1].value : null;
                            const change = prevValue !== null ? record.value - prevValue : null;
                            return (
                              <tr key={record.id}>
                                <td className="p-2">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    {format(new Date(record.recordedAt), 'MMM d, yyyy')}
                                  </div>
                                </td>
                                <td className="p-2 text-right font-medium">
                                  {record.value} {record.unit}
                                </td>
                                <td className="p-2 text-right">
                                  {change !== null ? (
                                    <span className={change > 0 ? 'text-warning-600' : change < 0 ? 'text-success-600' : 'text-muted-foreground'}>
                                      {change > 0 ? '+' : ''}{change.toFixed(1)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                                <td className="p-2 text-muted-foreground">
                                  {record.notes || '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

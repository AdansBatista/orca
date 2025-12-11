'use client';

import { Check, X, Star, Clock, Calendar, DollarSign } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TreatmentOption } from './TreatmentOptionCard';

interface TreatmentOptionCompareProps {
  options: TreatmentOption[];
  onSelect?: (optionId: string) => Promise<void>;
}

const applianceTypeLabels: Record<string, string> = {
  TRADITIONAL_METAL: 'Traditional Metal',
  CERAMIC_CLEAR: 'Ceramic/Clear',
  SELF_LIGATING_DAMON: 'Damon',
  SELF_LIGATING_OTHER: 'Self-Ligating',
  LINGUAL_INCOGNITO: 'Incognito',
  LINGUAL_OTHER: 'Lingual',
  INVISALIGN: 'Invisalign',
  CLEAR_CORRECT: 'ClearCorrect',
  OTHER_ALIGNER: 'Aligners',
  FUNCTIONAL_APPLIANCE: 'Functional',
  EXPANDER: 'Expander',
  HEADGEAR: 'Headgear',
  RETAINER_ONLY: 'Retainer',
};

interface ComparisonRow {
  label: string;
  key: keyof TreatmentOption | 'appliance' | 'insurance' | 'patient';
  format?: (value: unknown, option: TreatmentOption) => React.ReactNode;
}

const comparisonRows: ComparisonRow[] = [
  {
    label: 'Appliance Type',
    key: 'appliance',
    format: (_, option) => applianceTypeLabels[option.applianceType] || option.applianceType,
  },
  {
    label: 'Duration',
    key: 'estimatedDuration',
    format: (value) => (value ? `${value} months` : '-'),
  },
  {
    label: 'Est. Visits',
    key: 'estimatedVisits',
    format: (value) => (value ? String(value) : '-'),
  },
  {
    label: 'Complexity',
    key: 'complexity',
    format: (value) => {
      const colors: Record<string, string> = {
        SIMPLE: 'text-success-600',
        MODERATE: 'text-warning-600',
        COMPLEX: 'text-error-600',
        SEVERE: 'text-error-700',
      };
      return (
        <span className={colors[value as string] || ''}>
          {(value as string)?.charAt(0) + (value as string)?.slice(1).toLowerCase()}
        </span>
      );
    },
  },
  {
    label: 'Total Fee',
    key: 'totalFee',
    format: (value) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(value as number),
  },
  {
    label: 'Insurance Est.',
    key: 'insurance',
    format: (_, option) =>
      option.insuranceEstimate
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
          }).format(option.insuranceEstimate)
        : '-',
  },
  {
    label: 'Patient Est.',
    key: 'patient',
    format: (_, option) =>
      option.patientEstimate
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
          }).format(option.patientEstimate)
        : '-',
  },
];

export function TreatmentOptionCompare({ options, onSelect }: TreatmentOptionCompareProps) {
  if (options.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No treatment options to compare.
        </CardContent>
      </Card>
    );
  }

  const getValue = (option: TreatmentOption, key: ComparisonRow['key']) => {
    if (key === 'appliance' || key === 'insurance' || key === 'patient') {
      return option;
    }
    return option[key];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle size="sm">Compare Treatment Options</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 bg-muted/30 font-medium text-muted-foreground w-40">
                Feature
              </th>
              {options.map((option) => (
                <th
                  key={option.id}
                  className={`p-4 text-center ${
                    option.isSelected
                      ? 'bg-primary-50'
                      : option.isRecommended
                        ? 'bg-accent-50'
                        : ''
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-bold">Option {option.optionNumber}</span>
                      {option.isRecommended && (
                        <Star className="h-4 w-4 text-accent-500 fill-accent-500" />
                      )}
                    </div>
                    <p className="text-sm font-normal text-muted-foreground">{option.optionName}</p>
                    <div className="flex justify-center gap-1">
                      {option.isSelected && (
                        <Badge variant="success" size="sm">
                          Selected
                        </Badge>
                      )}
                      {option.isRecommended && !option.isSelected && (
                        <Badge variant="soft-primary" size="sm">
                          Recommended
                        </Badge>
                      )}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row) => (
              <tr key={row.key} className="border-b last:border-0">
                <td className="p-4 bg-muted/30 font-medium text-sm">{row.label}</td>
                {options.map((option) => {
                  const value = getValue(option, row.key);
                  return (
                    <td
                      key={option.id}
                      className={`p-4 text-center ${
                        option.isSelected
                          ? 'bg-primary-50/50'
                          : option.isRecommended
                            ? 'bg-accent-50/50'
                            : ''
                      }`}
                    >
                      {row.format ? row.format(value, option) : String(value)}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Description Row */}
            <tr className="border-b">
              <td className="p-4 bg-muted/30 font-medium text-sm align-top">Description</td>
              {options.map((option) => (
                <td
                  key={option.id}
                  className={`p-4 text-sm ${
                    option.isSelected
                      ? 'bg-primary-50/50'
                      : option.isRecommended
                        ? 'bg-accent-50/50'
                        : ''
                  }`}
                >
                  {option.description || '-'}
                </td>
              ))}
            </tr>

            {/* Recommendation Reason Row (if any option is recommended) */}
            {options.some((o) => o.isRecommended && o.recommendationReason) && (
              <tr className="border-b">
                <td className="p-4 bg-muted/30 font-medium text-sm align-top">Why Recommended</td>
                {options.map((option) => (
                  <td
                    key={option.id}
                    className={`p-4 text-sm ${
                      option.isSelected
                        ? 'bg-primary-50/50'
                        : option.isRecommended
                          ? 'bg-accent-50/50'
                          : ''
                    }`}
                  >
                    {option.isRecommended && option.recommendationReason
                      ? option.recommendationReason
                      : '-'}
                  </td>
                ))}
              </tr>
            )}

            {/* Action Row */}
            {onSelect && (
              <tr>
                <td className="p-4 bg-muted/30"></td>
                {options.map((option) => (
                  <td
                    key={option.id}
                    className={`p-4 text-center ${
                      option.isSelected
                        ? 'bg-primary-50/50'
                        : option.isRecommended
                          ? 'bg-accent-50/50'
                          : ''
                    }`}
                  >
                    {option.isSelected ? (
                      <div className="flex items-center justify-center gap-2 text-success-600">
                        <Check className="h-5 w-5" />
                        <span className="font-medium">Selected</span>
                      </div>
                    ) : (
                      <Button
                        variant={option.isRecommended ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onSelect(option.id)}
                      >
                        Select
                      </Button>
                    )}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

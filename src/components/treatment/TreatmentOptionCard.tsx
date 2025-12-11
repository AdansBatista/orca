'use client';

import { useState } from 'react';
import { Check, Star, Clock, Calendar, DollarSign, MoreVertical, Edit, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

export interface TreatmentOption {
  id: string;
  optionNumber: number;
  optionName: string;
  description: string | null;
  applianceType: string;
  estimatedDuration: number | null;
  estimatedVisits: number | null;
  complexity: string;
  totalFee: number;
  insuranceEstimate: number | null;
  patientEstimate: number | null;
  isRecommended: boolean;
  recommendationReason: string | null;
  isSelected: boolean;
  selectedDate: string | null;
}

interface TreatmentOptionCardProps {
  option: TreatmentOption;
  treatmentPlanId: string;
  onSelect?: (optionId: string) => Promise<void>;
  onEdit?: (option: TreatmentOption) => void;
  onDelete?: (optionId: string) => Promise<void>;
  compact?: boolean;
}

const applianceTypeLabels: Record<string, string> = {
  TRADITIONAL_METAL: 'Traditional Metal Braces',
  CERAMIC_CLEAR: 'Ceramic/Clear Braces',
  SELF_LIGATING_DAMON: 'Damon Braces',
  SELF_LIGATING_OTHER: 'Self-Ligating Braces',
  LINGUAL_INCOGNITO: 'Incognito Lingual',
  LINGUAL_OTHER: 'Lingual Braces',
  INVISALIGN: 'Invisalign',
  CLEAR_CORRECT: 'ClearCorrect',
  OTHER_ALIGNER: 'Clear Aligners',
  FUNCTIONAL_APPLIANCE: 'Functional Appliance',
  EXPANDER: 'Expander',
  HEADGEAR: 'Headgear',
  RETAINER_ONLY: 'Retainer Only',
};

const complexityColors: Record<string, string> = {
  SIMPLE: 'bg-success-100 text-success-700',
  MODERATE: 'bg-warning-100 text-warning-700',
  COMPLEX: 'bg-error-100 text-error-700',
  SEVERE: 'bg-error-200 text-error-800',
};

export function TreatmentOptionCard({
  option,
  treatmentPlanId,
  onSelect,
  onEdit,
  onDelete,
  compact = false,
}: TreatmentOptionCardProps) {
  const [selecting, setSelecting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSelect = async () => {
    if (!onSelect || option.isSelected) return;
    setSelecting(true);
    try {
      await onSelect(option.id);
    } finally {
      setSelecting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(option.id);
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <Card
        className={`relative transition-all ${
          option.isSelected
            ? 'ring-2 ring-primary-500 bg-primary-50/50'
            : option.isRecommended
              ? 'ring-1 ring-accent-300'
              : ''
        }`}
      >
        {/* Badges */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {option.isRecommended && (
            <Badge variant="soft-primary" className="gap-1">
              <Star className="h-3 w-3" />
              Recommended
            </Badge>
          )}
          {option.isSelected && (
            <Badge variant="success" className="gap-1">
              <Check className="h-3 w-3" />
              Selected
            </Badge>
          )}
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(option)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Option
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-error-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Option
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <CardHeader className={compact ? 'pb-2' : ''}>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
              {option.optionNumber}
            </div>
            <div className="flex-1 pr-24">
              <CardTitle size={compact ? 'sm' : 'default'}>{option.optionName}</CardTitle>
              <CardDescription className="mt-1">
                {applianceTypeLabels[option.applianceType] || option.applianceType}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className={compact ? 'pt-0' : ''}>
          {option.description && !compact && (
            <p className="text-sm text-muted-foreground mb-4">{option.description}</p>
          )}

          {/* Stats Grid */}
          <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} mb-4`}>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-medium">
                  {option.estimatedDuration ? `${option.estimatedDuration} mo` : '-'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Visits</p>
                <p className="text-sm font-medium">{option.estimatedVisits || '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Total Fee</p>
                <p className="text-sm font-bold text-primary-600">
                  {formatCurrency(option.totalFee)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Complexity</p>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  complexityColors[option.complexity] || 'bg-muted text-muted-foreground'
                }`}
              >
                {option.complexity}
              </span>
            </div>
          </div>

          {/* Insurance Breakdown */}
          {!compact && (option.insuranceEstimate || option.patientEstimate) && (
            <div className="bg-muted/30 rounded-lg p-3 mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Payment Estimate</p>
              <div className="flex justify-between text-sm">
                {option.insuranceEstimate && (
                  <div>
                    <span className="text-muted-foreground">Insurance:</span>{' '}
                    <span className="font-medium">{formatCurrency(option.insuranceEstimate)}</span>
                  </div>
                )}
                {option.patientEstimate && (
                  <div>
                    <span className="text-muted-foreground">Patient:</span>{' '}
                    <span className="font-medium">{formatCurrency(option.patientEstimate)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommendation Reason */}
          {!compact && option.isRecommended && option.recommendationReason && (
            <div className="bg-accent-50 rounded-lg p-3 mb-4">
              <p className="text-xs font-medium text-accent-700 mb-1">Why Recommended</p>
              <p className="text-sm text-accent-600">{option.recommendationReason}</p>
            </div>
          )}

          {/* Select Button */}
          {onSelect && !option.isSelected && (
            <Button
              className="w-full"
              variant={option.isRecommended ? 'default' : 'outline'}
              onClick={handleSelect}
              disabled={selecting}
            >
              {selecting ? 'Selecting...' : 'Select This Option'}
            </Button>
          )}

          {option.isSelected && option.selectedDate && (
            <p className="text-center text-sm text-muted-foreground">
              Selected on {new Date(option.selectedDate).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Treatment Option</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{option.optionName}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-error-600 hover:bg-error-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

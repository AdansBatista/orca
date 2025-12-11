'use client';

/**
 * RetentionPolicyForm Component
 *
 * Dialog form for creating and editing image retention policies.
 */

import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { RetentionPolicy } from '@/hooks/use-retention';

const IMAGE_CATEGORIES = [
  { value: 'EXTRAORAL_PHOTO', label: 'Extraoral Photos' },
  { value: 'INTRAORAL_PHOTO', label: 'Intraoral Photos' },
  { value: 'PANORAMIC_XRAY', label: 'Panoramic X-Rays' },
  { value: 'CEPHALOMETRIC_XRAY', label: 'Cephalometric X-Rays' },
  { value: 'PERIAPICAL_XRAY', label: 'Periapical X-Rays' },
  { value: 'CBCT', label: 'CBCT Scans' },
  { value: 'SCAN_3D', label: '3D Scans' },
  { value: 'OTHER', label: 'Other' },
];

interface FormData {
  name: string;
  description: string;
  isDefault: boolean;
  imageCategories: string[];
  retentionYears: number;
  retentionForMinorsYears: number | null;
  archiveAfterYears: number | null;
  notifyBeforeArchive: number | null;
  autoExtendOnAccess: boolean;
}

const DEFAULT_FORM_DATA: FormData = {
  name: '',
  description: '',
  isDefault: false,
  imageCategories: [],
  retentionYears: 7,
  retentionForMinorsYears: null,
  archiveAfterYears: null,
  notifyBeforeArchive: null,
  autoExtendOnAccess: false,
};

interface RetentionPolicyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy?: RetentionPolicy | null;
  onSubmit: (data: FormData) => Promise<boolean>;
}

export function RetentionPolicyForm({
  open,
  onOpenChange,
  policy,
  onSubmit,
}: RetentionPolicyFormProps) {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!policy;

  // Reset form when dialog opens/closes or policy changes
  useEffect(() => {
    if (open) {
      if (policy) {
        setFormData({
          name: policy.name,
          description: policy.description || '',
          isDefault: policy.isDefault,
          imageCategories: policy.imageCategories,
          retentionYears: policy.retentionYears,
          retentionForMinorsYears: policy.retentionForMinorsYears ?? null,
          archiveAfterYears: policy.archiveAfterYears ?? null,
          notifyBeforeArchive: policy.notifyBeforeArchive ?? null,
          autoExtendOnAccess: policy.autoExtendOnAccess,
        });
      } else {
        setFormData(DEFAULT_FORM_DATA);
      }
      setErrors({});
    }
  }, [open, policy]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Policy name is required';
    }

    if (formData.retentionYears < 1) {
      newErrors.retentionYears = 'Retention period must be at least 1 year';
    }

    if (formData.retentionYears > 100) {
      newErrors.retentionYears = 'Retention period cannot exceed 100 years';
    }

    if (formData.archiveAfterYears !== null) {
      if (formData.archiveAfterYears < 1) {
        newErrors.archiveAfterYears = 'Archive threshold must be at least 1 year';
      }
      if (formData.archiveAfterYears >= formData.retentionYears) {
        newErrors.archiveAfterYears = 'Archive threshold must be less than retention period';
      }
    }

    if (formData.retentionForMinorsYears !== null && formData.retentionForMinorsYears < 0) {
      newErrors.retentionForMinorsYears = 'Additional years for minors cannot be negative';
    }

    if (formData.notifyBeforeArchive !== null) {
      if (formData.notifyBeforeArchive < 1) {
        newErrors.notifyBeforeArchive = 'Notification must be at least 1 day before';
      }
      if (formData.notifyBeforeArchive > 365) {
        newErrors.notifyBeforeArchive = 'Notification cannot exceed 365 days before';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    const success = await onSubmit(formData);
    setSubmitting(false);

    if (success) {
      onOpenChange(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      imageCategories: prev.imageCategories.includes(category)
        ? prev.imageCategories.filter((c) => c !== category)
        : [...prev.imageCategories, category],
    }));
  };

  const handleSelectAllCategories = () => {
    if (formData.imageCategories.length === IMAGE_CATEGORIES.length) {
      setFormData((prev) => ({ ...prev, imageCategories: [] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        imageCategories: IMAGE_CATEGORIES.map((c) => c.value),
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Retention Policy' : 'Create Retention Policy'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the retention policy settings. Changes will apply to all images using this policy.'
              : 'Create a new retention policy to manage image storage and comply with regulations.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Basic Information</h4>

            <FormField label="Policy Name" required error={errors.name}>
              <Input
                placeholder="e.g., Standard 7-Year Retention"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </FormField>

            <FormField label="Description">
              <Textarea
                placeholder="Describe when this policy should be applied..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </FormField>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isDefault">Default Policy</Label>
                <p className="text-xs text-muted-foreground">
                  Apply this policy to images that don&apos;t match other policies
                </p>
              </div>
              <Switch
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
              />
            </div>
          </div>

          {/* Image Categories */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Image Categories</h4>
              <Button variant="ghost" size="sm" onClick={handleSelectAllCategories}>
                {formData.imageCategories.length === IMAGE_CATEGORIES.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Select which image categories this policy applies to. Leave empty to apply to all categories.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {IMAGE_CATEGORIES.map((category) => (
                <div key={category.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={category.value}
                    checked={formData.imageCategories.includes(category.value)}
                    onCheckedChange={() => handleCategoryToggle(category.value)}
                  />
                  <Label htmlFor={category.value} className="text-sm font-normal cursor-pointer">
                    {category.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Retention Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Retention Settings</h4>

            <FormField
              label="Retention Period (years)"
              required
              error={errors.retentionYears}
              description="HIPAA requires minimum 7 years for medical records"
            >
              <Input
                type="number"
                min={1}
                max={100}
                value={formData.retentionYears}
                onChange={(e) =>
                  setFormData({ ...formData, retentionYears: parseInt(e.target.value) || 1 })
                }
              />
            </FormField>

            <FormField
              label="Additional Years for Minors"
              error={errors.retentionForMinorsYears}
              description="Additional years to retain after patient turns 21"
            >
              <Input
                type="number"
                min={0}
                max={50}
                placeholder="Leave empty for same as standard"
                value={formData.retentionForMinorsYears ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    retentionForMinorsYears: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
              />
            </FormField>
          </div>

          {/* Archive Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Archive Settings</h4>

            <FormField
              label="Archive After (years)"
              error={errors.archiveAfterYears}
              description="Move images to cold storage after this many years"
            >
              <Input
                type="number"
                min={1}
                max={50}
                placeholder="Leave empty to disable auto-archive"
                value={formData.archiveAfterYears ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    archiveAfterYears: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
              />
            </FormField>

            <FormField
              label="Notify Before Archive (days)"
              error={errors.notifyBeforeArchive}
              description="Send notification this many days before archiving"
            >
              <Input
                type="number"
                min={1}
                max={365}
                placeholder="Leave empty to disable notifications"
                value={formData.notifyBeforeArchive ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notifyBeforeArchive: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
              />
            </FormField>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoExtend">Auto-extend on Access</Label>
                <p className="text-xs text-muted-foreground">
                  Reset retention timer when image is accessed
                </p>
              </div>
              <Switch
                id="autoExtend"
                checked={formData.autoExtendOnAccess}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, autoExtendOnAccess: checked })
                }
              />
            </div>
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>HIPAA Compliance:</strong> Medical records must be retained for a minimum of 7
              years from the date of service, or until the patient reaches age 21 if a minor,
              whichever is longer. State regulations may require longer retention periods.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !formData.name.trim()}>
            {submitting ? (isEditing ? 'Saving...' : 'Creating...') : isEditing ? 'Save Changes' : 'Create Policy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

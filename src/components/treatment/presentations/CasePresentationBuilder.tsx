'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  FileText,
  DollarSign,
  Calendar,
  ChevronUp,
  ChevronDown,
  Save,
  Eye,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const presentationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  presentationType: z.enum(['INITIAL_CONSULTATION', 'TREATMENT_OPTIONS', 'PROGRESS_REVIEW', 'COMPLETION']),
});

type PresentationFormData = z.infer<typeof presentationSchema>;

export interface PresentationSlide {
  id: string;
  type: 'intro' | 'diagnosis' | 'treatment_option' | 'comparison' | 'timeline' | 'financial' | 'photos' | 'custom';
  title: string;
  content: string;
  imageUrls?: string[];
  order: number;
  isVisible: boolean;
  metadata?: Record<string, unknown>;
}

export interface TreatmentOptionSlide {
  optionId: string;
  optionName: string;
  applianceType: string;
  duration: number;
  totalFee: number;
  features: string[];
  isRecommended: boolean;
}

export interface CasePresentationBuilderProps {
  patientId: string;
  treatmentPlanId?: string;
  existingPresentation?: {
    id: string;
    title: string;
    description?: string;
    presentationType: string;
    slides: PresentationSlide[];
  };
  treatmentOptions?: TreatmentOptionSlide[];
  onSave: (data: {
    title: string;
    description?: string;
    presentationType: string;
    slides: PresentationSlide[];
  }) => Promise<void>;
  onPreview?: () => void;
}

const slideTemplates = [
  { type: 'intro', label: 'Introduction', icon: FileText, description: 'Welcome and overview' },
  { type: 'diagnosis', label: 'Diagnosis', icon: FileText, description: 'Current condition analysis' },
  { type: 'treatment_option', label: 'Treatment Option', icon: FileText, description: 'Single treatment option details' },
  { type: 'comparison', label: 'Options Comparison', icon: FileText, description: 'Compare multiple options' },
  { type: 'timeline', label: 'Timeline', icon: Calendar, description: 'Treatment timeline overview' },
  { type: 'financial', label: 'Financial', icon: DollarSign, description: 'Cost and payment options' },
  { type: 'photos', label: 'Photos', icon: ImageIcon, description: 'Before/after or progress photos' },
  { type: 'custom', label: 'Custom', icon: FileText, description: 'Custom content slide' },
];

export function CasePresentationBuilder({
  patientId,
  treatmentPlanId,
  existingPresentation,
  treatmentOptions = [],
  onSave,
  onPreview,
}: CasePresentationBuilderProps) {
  const [slides, setSlides] = useState<PresentationSlide[]>(
    existingPresentation?.slides || []
  );
  const [saving, setSaving] = useState(false);
  const [showAddSlide, setShowAddSlide] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PresentationFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(presentationSchema) as any,
    defaultValues: {
      title: existingPresentation?.title || '',
      description: existingPresentation?.description || '',
      presentationType: (existingPresentation?.presentationType as PresentationFormData['presentationType']) || 'INITIAL_CONSULTATION',
    },
  });

  const addSlide = (type: PresentationSlide['type']) => {
    const template = slideTemplates.find((t) => t.type === type);
    const newSlide: PresentationSlide = {
      id: `slide-${Date.now()}`,
      type,
      title: template?.label || 'New Slide',
      content: '',
      order: slides.length,
      isVisible: true,
    };
    setSlides([...slides, newSlide]);
    setShowAddSlide(false);
  };

  const updateSlide = (id: string, updates: Partial<PresentationSlide>) => {
    setSlides(slides.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeSlide = (id: string) => {
    setSlides(slides.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })));
  };

  const moveSlide = (id: string, direction: 'up' | 'down') => {
    const index = slides.findIndex((s) => s.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === slides.length - 1)
    ) {
      return;
    }

    const newSlides = [...slides];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];
    setSlides(newSlides.map((s, i) => ({ ...s, order: i })));
  };

  const handleSave = async (formData: PresentationFormData) => {
    setSaving(true);
    try {
      await onSave({
        ...formData,
        slides,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
      {/* Presentation Info */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Presentation Details</CardTitle>
          <CardDescription>Basic information about the case presentation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Title" required error={errors.title?.message}>
              <Input {...register('title')} placeholder="e.g., Treatment Options for John" />
            </FormField>

            <FormField label="Presentation Type" required>
              <Select
                value={watch('presentationType')}
                onValueChange={(v) => {
                  // Form will update via watch
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INITIAL_CONSULTATION">Initial Consultation</SelectItem>
                  <SelectItem value="TREATMENT_OPTIONS">Treatment Options</SelectItem>
                  <SelectItem value="PROGRESS_REVIEW">Progress Review</SelectItem>
                  <SelectItem value="COMPLETION">Treatment Completion</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Description">
            <Textarea
              {...register('description')}
              placeholder="Brief description of the presentation..."
              rows={2}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Slides */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle size="sm">Slides</CardTitle>
              <CardDescription>Build your presentation slides</CardDescription>
            </div>
            <Badge variant="secondary">{slides.length} slides</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {slides.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No slides yet. Add your first slide below.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`p-4 rounded-lg border ${
                    slide.isVisible ? 'bg-background' : 'bg-muted/30 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSlide(slide.id, 'up')}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <GripVertical className="h-4 w-4 text-muted-foreground mx-auto" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSlide(slide.id, 'down')}
                        disabled={index === slides.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" size="sm">
                          {slideTemplates.find((t) => t.type === slide.type)?.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Slide {index + 1}
                        </span>
                      </div>

                      <Input
                        value={slide.title}
                        onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                        placeholder="Slide title"
                        className="font-medium"
                      />

                      <Textarea
                        value={slide.content}
                        onChange={(e) => updateSlide(slide.id, { content: e.target.value })}
                        placeholder="Slide content..."
                        rows={3}
                      />

                      {/* Treatment option selector for treatment_option slides */}
                      {slide.type === 'treatment_option' && treatmentOptions.length > 0 && (
                        <Select
                          value={slide.metadata?.optionId as string}
                          onValueChange={(v) =>
                            updateSlide(slide.id, {
                              metadata: { ...slide.metadata, optionId: v },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select treatment option" />
                          </SelectTrigger>
                          <SelectContent>
                            {treatmentOptions.map((opt) => (
                              <SelectItem key={opt.optionId} value={opt.optionId}>
                                {opt.optionName} ({opt.applianceType})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={slide.isVisible}
                          onCheckedChange={(checked) =>
                            updateSlide(slide.id, { isVisible: checked })
                          }
                        />
                        <Label className="text-xs">Visible</Label>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSlide(slide.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Add Slide */}
          {showAddSlide ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {slideTemplates.map((template) => (
                <Button
                  key={template.type}
                  type="button"
                  variant="outline"
                  className="h-auto py-3 flex-col gap-1"
                  onClick={() => addSlide(template.type as PresentationSlide['type'])}
                >
                  <template.icon className="h-5 w-5" />
                  <span className="text-xs">{template.label}</span>
                </Button>
              ))}
              <Button
                type="button"
                variant="ghost"
                className="h-auto py-3"
                onClick={() => setShowAddSlide(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowAddSlide(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Slide
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onPreview && (
          <Button type="button" variant="outline" onClick={onPreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        )}
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Presentation'}
        </Button>
      </div>
    </form>
  );
}

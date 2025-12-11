'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Plus,
  FileText,
  ImageIcon,
  Ruler,
  Clock,
  Save,
  Download,
  Eye,
  ArrowLeft,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ReportSectionEditor } from './ReportSectionEditor';
import type {
  ReportSection,
  SectionType,
  ProgressReportData,
  PatientImageData,
  ReportType,
} from './types';
import { REPORT_TYPE_LABELS, SECTION_TYPE_LABELS } from './types';

interface ReportBuilderProps {
  patientId: string;
  patientName: string;
  patientImages: PatientImageData[];
  initialData?: Partial<ProgressReportData>;
  onSave: (data: ProgressReportData) => Promise<void>;
  onExport: (format: 'PDF' | 'PNG') => Promise<void>;
  onBack?: () => void;
  className?: string;
}

const ADDABLE_SECTIONS: { type: SectionType; label: string; icon: React.ReactNode }[] = [
  { type: 'SUMMARY', label: 'Summary', icon: <FileText className="h-4 w-4" /> },
  { type: 'IMAGES', label: 'Image Gallery', icon: <ImageIcon className="h-4 w-4" /> },
  { type: 'COMPARISON', label: 'Before/After', icon: <ImageIcon className="h-4 w-4" /> },
  { type: 'COLLAGE', label: 'Collage', icon: <ImageIcon className="h-4 w-4" /> },
  { type: 'MEASUREMENTS', label: 'Measurements', icon: <Ruler className="h-4 w-4" /> },
  { type: 'TIMELINE', label: 'Timeline', icon: <Clock className="h-4 w-4" /> },
  { type: 'NOTES', label: 'Notes', icon: <FileText className="h-4 w-4" /> },
];

function generateId(): string {
  return `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function ReportBuilder({
  patientId,
  patientName,
  patientImages,
  initialData,
  onSave,
  onExport,
  onBack,
  className,
}: ReportBuilderProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [reportType, setReportType] = useState<ReportType>(
    initialData?.reportType || 'PROGRESS'
  );
  const [sections, setSections] = useState<ReportSection[]>(
    initialData?.sections || [
      {
        id: generateId(),
        type: 'HEADER',
        title: 'Progress Report',
        content: '',
        order: 0,
      },
    ]
  );
  const [visibleToPatient, setVisibleToPatient] = useState(
    initialData?.visibleToPatient || false
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleAddSection = useCallback((type: SectionType) => {
    setSections((prev) => [
      ...prev,
      {
        id: generateId(),
        type,
        title: SECTION_TYPE_LABELS[type],
        order: prev.length,
      },
    ]);
  }, []);

  const handleUpdateSection = useCallback((id: string, updatedSection: ReportSection) => {
    setSections((prev) =>
      prev.map((section) => (section.id === id ? updatedSection : section))
    );
  }, []);

  const handleDeleteSection = useCallback((id: string) => {
    setSections((prev) => prev.filter((section) => section.id !== id));
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave({
        patientId,
        title: title || `${REPORT_TYPE_LABELS[reportType]} - ${new Date().toLocaleDateString()}`,
        reportType,
        reportDate: new Date(),
        sections,
        visibleToPatient,
      });
    } finally {
      setIsSaving(false);
    }
  }, [patientId, title, reportType, sections, visibleToPatient, onSave]);

  const sectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    sections.forEach((s) => {
      counts[s.type] = (counts[s.type] || 0) + 1;
    });
    return counts;
  }, [sections]);

  return (
    <div className={cn('flex h-full', className)}>
      {/* Main Editor */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div className="flex-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Enter report title (e.g., ${patientName} - ${REPORT_TYPE_LABELS[reportType]})`}
              className="text-lg font-semibold"
            />
          </div>
          <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section) => (
            <ReportSectionEditor
              key={section.id}
              section={section}
              patientImages={patientImages}
              onUpdate={(updated) => handleUpdateSection(section.id, updated)}
              onDelete={() => handleDeleteSection(section.id)}
            />
          ))}

          {/* Add Section Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full border-dashed">
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              {ADDABLE_SECTIONS.map((item) => (
                <DropdownMenuItem
                  key={item.type}
                  onClick={() => handleAddSection(item.type)}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-72 border-l bg-muted/30 p-4 flex flex-col">
        <Card className="mb-4">
          <CardHeader compact>
            <CardTitle size="sm">Report Details</CardTitle>
          </CardHeader>
          <CardContent compact className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Patient</p>
              <p className="font-medium">{patientName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Report Type</p>
              <Badge>{REPORT_TYPE_LABELS[reportType]}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sections</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(sectionCounts).map(([type, count]) => (
                  <Badge key={type} variant="outline" className="text-xs">
                    {SECTION_TYPE_LABELS[type as SectionType]} ({count})
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="visibleToPatient"
                checked={visibleToPatient}
                onChange={(e) => setVisibleToPatient(e.target.checked)}
                className="rounded border-muted-foreground/50"
              />
              <label htmlFor="visibleToPatient" className="text-sm">
                Visible to patient
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader compact>
            <CardTitle size="sm">Available Images</CardTitle>
          </CardHeader>
          <CardContent compact>
            <p className="text-sm text-muted-foreground">
              {patientImages.length} images available
            </p>
            <div className="grid grid-cols-3 gap-1 mt-2">
              {patientImages.slice(0, 6).map((image) => (
                <div
                  key={image.id}
                  className="aspect-square rounded-sm overflow-hidden border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.thumbnailUrl || image.fileUrl}
                    alt={image.fileName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            {patientImages.length > 6 && (
              <p className="text-xs text-muted-foreground mt-1 text-center">
                +{patientImages.length - 6} more
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-auto space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onExport('PDF')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onExport('PDF')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Report'}
          </Button>
        </div>
      </div>
    </div>
  );
}

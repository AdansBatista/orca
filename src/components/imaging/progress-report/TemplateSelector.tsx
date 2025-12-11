'use client';

import { useState, useMemo } from 'react';
import { Search, FileText, Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ReportTemplate, ReportType } from './types';
import { REPORT_TYPE_LABELS } from './types';

interface ReportTemplateSelectorProps {
  templates: ReportTemplate[];
  selectedTemplate: ReportTemplate | null;
  onSelect: (template: ReportTemplate) => void;
  className?: string;
}

const TYPE_COLORS: Record<ReportType, string> = {
  INITIAL: 'bg-blue-500/10 text-blue-600',
  PROGRESS: 'bg-green-500/10 text-green-600',
  FINAL: 'bg-purple-500/10 text-purple-600',
  COMPARISON: 'bg-orange-500/10 text-orange-600',
};

export function ReportTemplateSelector({
  templates,
  selectedTemplate,
  onSelect,
  className,
}: ReportTemplateSelectorProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<ReportType | 'ALL'>('ALL');

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        search === '' ||
        template.name.toLowerCase().includes(search.toLowerCase()) ||
        template.description.toLowerCase().includes(search.toLowerCase());

      const matchesType =
        filterType === 'ALL' || template.reportType === filterType;

      return matchesSearch && matchesType;
    });
  }, [templates, search, filterType]);

  const groupedTemplates = useMemo(() => {
    const groups: Record<ReportType, ReportTemplate[]> = {
      INITIAL: [],
      PROGRESS: [],
      FINAL: [],
      COMPARISON: [],
    };

    filteredTemplates.forEach((template) => {
      groups[template.reportType].push(template);
    });

    return groups;
  }, [filteredTemplates]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={filterType === 'ALL' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilterType('ALL')}
          >
            All
          </Badge>
          {(Object.keys(REPORT_TYPE_LABELS) as ReportType[]).map((type) => (
            <Badge
              key={type}
              variant={filterType === type ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterType(type)}
            >
              {REPORT_TYPE_LABELS[type]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      {filterType === 'ALL' ? (
        // Grouped view
        Object.entries(groupedTemplates).map(([type, typeTemplates]) => {
          if (typeTemplates.length === 0) return null;

          return (
            <div key={type}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {REPORT_TYPE_LABELS[type as ReportType]}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {typeTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplate?.id === template.id}
                    onSelect={() => onSelect(template)}
                  />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        // Flat view for filtered type
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplate?.id === template.id}
              onSelect={() => onSelect(template)}
            />
          ))}
        </div>
      )}

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No templates found</p>
        </div>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: ReportTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  const requiredCount = template.sections.filter((s) => s.required).length;
  const optionalCount = template.sections.length - requiredCount;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold">{template.name}</h4>
            <Badge
              variant="secondary"
              className={cn('text-xs mt-1', TYPE_COLORS[template.reportType])}
            >
              {REPORT_TYPE_LABELS[template.reportType]}
            </Badge>
          </div>
          {isSelected && (
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Check className="h-4 w-4" />
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{requiredCount} required sections</span>
          {optionalCount > 0 && <span>• {optionalCount} optional</span>}
        </div>
      </CardContent>
    </Card>
  );
}

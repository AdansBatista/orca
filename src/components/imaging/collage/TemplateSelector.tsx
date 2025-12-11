'use client';

import { useState, useMemo } from 'react';
import { Grid3X3, Columns, LayoutGrid, Presentation, Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CollagePreview } from './CollagePreview';
import type { CollageTemplateData } from './types';
import { DEFAULT_COLLAGE_TEMPLATES } from './types';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  PROGRESS: LayoutGrid,
  COMPARISON: Columns,
  TREATMENT: Grid3X3,
  PRESENTATION: Presentation,
};

const CATEGORY_COLORS: Record<string, string> = {
  PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  COMPARISON: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  TREATMENT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  PRESENTATION: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

interface TemplateSelectorProps {
  templates?: CollageTemplateData[];
  selectedTemplate?: CollageTemplateData | null;
  onSelect: (template: CollageTemplateData) => void;
  className?: string;
}

export function TemplateSelector({
  templates = DEFAULT_COLLAGE_TEMPLATES,
  selectedTemplate,
  onSelect,
  className,
}: TemplateSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        !searchTerm ||
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        !categoryFilter || template.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [templates, searchTerm, categoryFilter]);

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, CollageTemplateData[]> = {};
    filteredTemplates.forEach((template) => {
      if (!groups[template.category]) {
        groups[template.category] = [];
      }
      groups[template.category].push(template);
    });
    return groups;
  }, [filteredTemplates]);

  const categories = ['PROGRESS', 'COMPARISON', 'TREATMENT', 'PRESENTATION'];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category.charAt(0) + category.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Template grid by category */}
      {categoryFilter ? (
        // Flat grid when filtering by category
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.name}
              template={template}
              isSelected={selectedTemplate?.name === template.name}
              onClick={() => onSelect(template)}
            />
          ))}
        </div>
      ) : (
        // Grouped by category when no filter
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryTemplates = groupedTemplates[category];
            if (!categoryTemplates?.length) return null;

            const Icon = CATEGORY_ICONS[category];

            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
                  <h3 className="font-medium">
                    {category.charAt(0) + category.slice(1).toLowerCase()}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {categoryTemplates.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categoryTemplates.map((template) => (
                    <TemplateCard
                      key={template.name}
                      template={template}
                      isSelected={selectedTemplate?.name === template.name}
                      onClick={() => onSelect(template)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No templates found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: CollageTemplateData;
  isSelected: boolean;
  onClick: () => void;
}

function TemplateCard({ template, isSelected, onClick }: TemplateCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        {/* Preview */}
        <div className="mb-3">
          <CollagePreview
            layout={template.layout}
            slots={template.slots}
            aspectRatio={template.aspectRatio}
            background={template.background}
            padding={4}
            gap={2}
            showLabels={false}
            scale={0.25}
          />
        </div>

        {/* Info */}
        <div>
          <p className="font-medium text-sm truncate">{template.name}</p>
          {template.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {template.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge
              className={cn(
                'text-xs',
                CATEGORY_COLORS[template.category]
              )}
            >
              {template.category.toLowerCase()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {template.slots.length} slots
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

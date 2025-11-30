'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronRight, Shield } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Permission {
  code: string;
  label: string;
  description: string;
  category: string;
  categoryLabel: string;
}

interface PermissionCategory {
  label: string;
  description: string;
  permissions: Array<{
    code: string;
    label: string;
    description: string;
  }>;
}

interface PermissionMatrixProps {
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
}

export function PermissionMatrix({
  selectedPermissions,
  onChange,
  disabled = false,
}: PermissionMatrixProps) {
  const [categories, setCategories] = useState<Record<string, PermissionCategory>>({});
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Fetch available permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await fetch('/api/permissions');
        const result = await response.json();

        if (result.success) {
          setCategories(result.data.categories);
          // Expand categories that have selected permissions
          const expandSet = new Set<string>();
          for (const [categoryKey, category] of Object.entries(result.data.categories)) {
            const cat = category as PermissionCategory;
            const hasSelected = cat.permissions.some((p) =>
              selectedPermissions.includes(p.code)
            );
            if (hasSelected) {
              expandSet.add(categoryKey);
            }
          }
          setExpandedCategories(expandSet);
        }
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryKey)) {
        next.delete(categoryKey);
      } else {
        next.add(categoryKey);
      }
      return next;
    });
  };

  const togglePermission = (code: string) => {
    if (disabled) return;

    const newPermissions = selectedPermissions.includes(code)
      ? selectedPermissions.filter((p) => p !== code)
      : [...selectedPermissions, code];
    onChange(newPermissions);
  };

  const toggleAllInCategory = (categoryKey: string) => {
    if (disabled) return;

    const category = categories[categoryKey];
    if (!category) return;

    const categoryPermissions = category.permissions.map((p) => p.code);
    const allSelected = categoryPermissions.every((p) =>
      selectedPermissions.includes(p)
    );

    let newPermissions: string[];
    if (allSelected) {
      // Remove all category permissions
      newPermissions = selectedPermissions.filter(
        (p) => !categoryPermissions.includes(p)
      );
    } else {
      // Add all category permissions
      newPermissions = [
        ...selectedPermissions.filter((p) => !categoryPermissions.includes(p)),
        ...categoryPermissions,
      ];
    }
    onChange(newPermissions);
  };

  const getCategorySelectionState = (categoryKey: string): 'all' | 'some' | 'none' => {
    const category = categories[categoryKey];
    if (!category) return 'none';

    const categoryPermissions = category.permissions.map((p) => p.code);
    const selectedCount = categoryPermissions.filter((p) =>
      selectedPermissions.includes(p)
    ).length;

    if (selectedCount === 0) return 'none';
    if (selectedCount === categoryPermissions.length) return 'all';
    return 'some';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} variant="ghost">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Object.entries(categories).map(([categoryKey, category]) => {
        const isExpanded = expandedCategories.has(categoryKey);
        const selectionState = getCategorySelectionState(categoryKey);

        return (
          <Card key={categoryKey} variant="ghost" className="overflow-hidden">
            {/* Category header */}
            <div
              className={cn(
                'flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors',
                disabled && 'cursor-not-allowed opacity-60'
              )}
              onClick={() => toggleCategory(categoryKey)}
            >
              <button
                type="button"
                className="p-0.5 hover:bg-muted rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategory(categoryKey);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              <Checkbox
                checked={selectionState === 'all'}
                // Use data attribute for indeterminate state
                data-state={selectionState === 'some' ? 'indeterminate' : undefined}
                className={cn(
                  selectionState === 'some' && 'bg-primary/50 border-primary'
                )}
                onCheckedChange={() => toggleAllInCategory(categoryKey)}
                onClick={(e) => e.stopPropagation()}
                disabled={disabled}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {category.label}
                  </span>
                  {selectionState !== 'none' && (
                    <Badge variant="soft-primary" size="sm">
                      {
                        category.permissions.filter((p) =>
                          selectedPermissions.includes(p.code)
                        ).length
                      }
                      /{category.permissions.length}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {category.description}
                </p>
              </div>
            </div>

            {/* Permissions list */}
            {isExpanded && (
              <div className="border-t border-border/50 bg-muted/20">
                <div className="divide-y divide-border/30">
                  {category.permissions.map((permission) => {
                    const isSelected = selectedPermissions.includes(permission.code);

                    return (
                      <label
                        key={permission.code}
                        className={cn(
                          'flex items-start gap-3 p-3 pl-12 cursor-pointer hover:bg-muted/30 transition-colors',
                          disabled && 'cursor-not-allowed opacity-60'
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => togglePermission(permission.code)}
                          disabled={disabled}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {permission.label}
                            </span>
                            <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {permission.code}
                            </code>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {permission.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {/* Summary */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
        <Shield className="h-4 w-4" />
        <span>
          {selectedPermissions.length} permission
          {selectedPermissions.length !== 1 ? 's' : ''} selected
        </span>
      </div>
    </div>
  );
}

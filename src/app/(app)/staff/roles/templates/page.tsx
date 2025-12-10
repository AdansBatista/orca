'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  Stethoscope,
  Calendar,
  DollarSign,
  Eye,
  UserCog,
  ClipboardList,
  Phone,
  Check,
  Loader2,
  ArrowRight,
} from 'lucide-react';

import { PageHeader, PageContent, CardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

interface RoleTemplate {
  id: string;
  name: string;
  code: string;
  description: string;
  category: 'clinical' | 'administrative' | 'management' | 'billing' | 'support';
  icon: React.ComponentType<{ className?: string }>;
  permissions: string[];
  level: number;
  recommended?: boolean;
}

const ROLE_TEMPLATES: RoleTemplate[] = [
  // Clinical Roles
  {
    id: 'orthodontist',
    name: 'Orthodontist',
    code: 'orthodontist',
    description: 'Primary treatment provider with full clinical access and treatment authority.',
    category: 'clinical',
    icon: Stethoscope,
    recommended: true,
    level: 90,
    permissions: [
      'patients:view', 'patients:edit', 'patients:create',
      'treatment:view', 'treatment:edit', 'treatment:create', 'treatment:approve',
      'clinical:view', 'clinical:edit', 'clinical:prescribe',
      'appointments:view', 'appointments:edit',
      'imaging:view', 'imaging:edit',
      'staff:view',
      'reports:view', 'reports:clinical',
    ],
  },
  {
    id: 'clinical_lead',
    name: 'Clinical Lead',
    code: 'clinical_lead',
    description: 'Supervises clinical staff, manages clinical protocols and patient flow.',
    category: 'clinical',
    icon: UserCog,
    level: 70,
    permissions: [
      'patients:view', 'patients:edit',
      'treatment:view', 'treatment:edit',
      'clinical:view', 'clinical:edit',
      'appointments:view', 'appointments:edit',
      'imaging:view', 'imaging:edit',
      'staff:view', 'staff:schedule',
      'reports:view',
    ],
  },
  {
    id: 'orthodontic_assistant',
    name: 'Orthodontic Assistant',
    code: 'orthodontic_assistant',
    description: 'Chair-side patient care, bracket placement, wire changes, and patient education.',
    category: 'clinical',
    icon: Users,
    recommended: true,
    level: 40,
    permissions: [
      'patients:view',
      'treatment:view',
      'clinical:view', 'clinical:assist',
      'appointments:view',
      'imaging:view', 'imaging:capture',
    ],
  },
  {
    id: 'expanded_function_assistant',
    name: 'Expanded Function Assistant (EFDA)',
    code: 'efda',
    description: 'Advanced clinical procedures with expanded function certification.',
    category: 'clinical',
    icon: Shield,
    level: 50,
    permissions: [
      'patients:view', 'patients:edit',
      'treatment:view', 'treatment:edit',
      'clinical:view', 'clinical:edit', 'clinical:expanded',
      'appointments:view',
      'imaging:view', 'imaging:capture', 'imaging:edit',
    ],
  },
  // Administrative Roles
  {
    id: 'treatment_coordinator',
    name: 'Treatment Coordinator',
    code: 'treatment_coordinator',
    description: 'Patient consultations, case presentations, and financial discussions.',
    category: 'administrative',
    icon: ClipboardList,
    recommended: true,
    level: 50,
    permissions: [
      'patients:view', 'patients:edit', 'patients:create',
      'treatment:view',
      'appointments:view', 'appointments:edit', 'appointments:create',
      'financial:view', 'financial:quotes',
      'communications:view', 'communications:edit',
    ],
  },
  {
    id: 'front_desk',
    name: 'Front Desk Coordinator',
    code: 'front_desk',
    description: 'Patient scheduling, check-in/out, and communications.',
    category: 'administrative',
    icon: Phone,
    recommended: true,
    level: 30,
    permissions: [
      'patients:view', 'patients:create',
      'appointments:view', 'appointments:edit', 'appointments:create',
      'communications:view', 'communications:edit',
      'scheduling:view', 'scheduling:edit',
    ],
  },
  {
    id: 'scheduling_coordinator',
    name: 'Scheduling Coordinator',
    code: 'scheduling_coordinator',
    description: 'Manages appointment scheduling and provider calendars.',
    category: 'administrative',
    icon: Calendar,
    level: 35,
    permissions: [
      'patients:view',
      'appointments:view', 'appointments:edit', 'appointments:create',
      'scheduling:view', 'scheduling:edit', 'scheduling:templates',
      'staff:view', 'staff:schedule',
    ],
  },
  // Management Roles
  {
    id: 'office_manager',
    name: 'Office Manager',
    code: 'office_manager',
    description: 'Overall practice operations, staff management, and administrative oversight.',
    category: 'management',
    icon: UserCog,
    recommended: true,
    level: 80,
    permissions: [
      'patients:view', 'patients:edit',
      'appointments:view', 'appointments:edit',
      'staff:view', 'staff:edit', 'staff:schedule',
      'reports:view', 'reports:operations',
      'settings:view', 'settings:edit',
      'communications:view', 'communications:edit',
      'financial:view',
    ],
  },
  {
    id: 'hr_manager',
    name: 'HR Manager',
    code: 'hr_manager',
    description: 'Staff records, credentials, performance, and HR documentation.',
    category: 'management',
    icon: Users,
    level: 75,
    permissions: [
      'staff:view', 'staff:edit', 'staff:create', 'staff:hr',
      'staff:credentials', 'staff:performance',
      'reports:view', 'reports:hr',
    ],
  },
  // Billing Roles
  {
    id: 'billing_specialist',
    name: 'Billing Specialist',
    code: 'billing_specialist',
    description: 'Insurance claims, payment processing, and financial records.',
    category: 'billing',
    icon: DollarSign,
    recommended: true,
    level: 45,
    permissions: [
      'patients:view',
      'financial:view', 'financial:edit', 'financial:billing',
      'insurance:view', 'insurance:edit', 'insurance:claims',
      'reports:view', 'reports:financial',
    ],
  },
  {
    id: 'insurance_coordinator',
    name: 'Insurance Coordinator',
    code: 'insurance_coordinator',
    description: 'Insurance verification, pre-authorizations, and benefits coordination.',
    category: 'billing',
    icon: ClipboardList,
    level: 40,
    permissions: [
      'patients:view',
      'insurance:view', 'insurance:edit', 'insurance:verify',
      'financial:view',
    ],
  },
  // Support Roles
  {
    id: 'read_only',
    name: 'Read Only',
    code: 'read_only_user',
    description: 'View-only access across all permitted areas. Cannot make changes.',
    category: 'support',
    icon: Eye,
    level: 10,
    permissions: [
      'patients:view',
      'appointments:view',
      'reports:view',
    ],
  },
];

const CATEGORY_INFO = {
  clinical: { label: 'Clinical', variant: 'success' as const },
  administrative: { label: 'Administrative', variant: 'info' as const },
  management: { label: 'Management', variant: 'warning' as const },
  billing: { label: 'Billing', variant: 'secondary' as const },
  support: { label: 'Support', variant: 'outline' as const },
};

export default function RoleTemplatesPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<RoleTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedTemplate.name,
          code: selectedTemplate.code,
          description: selectedTemplate.description,
          permissions: selectedTemplate.permissions,
          level: selectedTemplate.level,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        if (result.error?.code === 'DUPLICATE_CODE') {
          toast({
            title: 'Role Already Exists',
            description: `A role with code "${selectedTemplate.code}" already exists. You can edit it instead.`,
            variant: 'destructive',
          });
          return;
        }
        throw new Error(result.error?.message || 'Failed to create role');
      }

      toast({
        title: 'Role Created',
        description: `${selectedTemplate.name} role has been created successfully.`,
      });
      router.push(`/staff/roles/${result.data.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create role',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
      setSelectedTemplate(null);
    }
  };

  const templatesByCategory = ROLE_TEMPLATES.reduce(
    (acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    },
    {} as Record<string, RoleTemplate[]>
  );

  return (
    <>
      <PageHeader
        title="Role Templates"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Staff', href: '/staff' },
          { label: 'Roles', href: '/staff/roles' },
          { label: 'Templates' },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.push('/staff/roles/new')}>
            Create Custom Role
          </Button>
        }
      />
      <PageContent density="comfortable">
        <div className="space-y-8">
          <Card variant="ghost">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                Choose from pre-configured role templates designed for orthodontic practices.
                Templates include appropriate permissions for each role type. You can customize
                permissions after creation.
              </p>
            </CardContent>
          </Card>

          {Object.entries(templatesByCategory).map(([category, templates]) => {
            const categoryInfo = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-semibold">{categoryInfo.label} Roles</h2>
                  <Badge variant={categoryInfo.variant}>{templates.length}</Badge>
                </div>
                <CardGrid columns={3}>
                  {templates.map((template) => {
                    const Icon = template.icon;
                    return (
                      <Card
                        key={template.id}
                        variant="bento"
                        interactive
                        className="cursor-pointer relative"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        {template.recommended && (
                          <Badge
                            variant="accent"
                            className="absolute top-2 right-2 text-xs"
                          >
                            Recommended
                          </Badge>
                        )}
                        <CardHeader compact>
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                              <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle size="sm">{template.name}</CardTitle>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {template.code}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent compact>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {template.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {template.permissions.length} permissions
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Level {template.level}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </CardGrid>
              </div>
            );
          })}
        </div>
      </PageContent>

      {/* Template Preview Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate && (
                <>
                  <selectedTemplate.icon className="h-5 w-5 text-primary-500" />
                  {selectedTemplate.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Included Permissions</h4>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                  {selectedTemplate.permissions.map((perm) => (
                    <Badge key={perm} variant="soft-primary" className="text-xs">
                      {perm}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">Role Level</p>
                  <p className="text-xs text-muted-foreground">
                    Determines hierarchy position
                  </p>
                </div>
                <Badge variant="outline">{selectedTemplate.level}</Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFromTemplate} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

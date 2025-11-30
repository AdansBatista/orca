'use client';

import { use, useState, useEffect } from 'react';
import { PageHeader, PageContent } from '@/components/layout';
import { RoleForm } from '@/components/roles';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Role {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isSystem: boolean;
  permissions: string[];
}

interface EditRolePageProps {
  params: Promise<{ id: string }>;
}

function EditRoleSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditRolePage({ params }: EditRolePageProps) {
  const { id } = use(params);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const response = await fetch(`/api/roles/${id}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch role');
        }

        setRole(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [id]);

  if (loading) {
    return (
      <>
        <PageHeader
          title="Edit Role"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Staff', href: '/staff' },
            { label: 'Roles', href: '/staff/roles' },
            { label: 'Edit' },
          ]}
        />
        <PageContent density="comfortable" maxWidth="2xl">
          <EditRoleSkeleton />
        </PageContent>
      </>
    );
  }

  if (error || !role) {
    return (
      <>
        <PageHeader
          title="Edit Role"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Staff', href: '/staff' },
            { label: 'Roles', href: '/staff/roles' },
            { label: 'Edit' },
          ]}
        />
        <PageContent density="comfortable">
          <Card variant="ghost">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-warning-500 mb-4" />
              <h3 className="font-semibold text-foreground mb-1">
                {error || 'Role not found'}
              </h3>
              <p className="text-muted-foreground mb-4">
                The role you're trying to edit doesn't exist or you don't have access.
              </p>
              <Link href="/staff/roles">
                <Button variant="outline">Back to Roles</Button>
              </Link>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Edit ${role.name}`}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Staff', href: '/staff' },
          { label: 'Roles', href: '/staff/roles' },
          { label: role.name, href: `/staff/roles/${id}` },
          { label: 'Edit' },
        ]}
      />
      <PageContent density="comfortable" maxWidth="2xl">
        <RoleForm role={role} mode="edit" />
      </PageContent>
    </>
  );
}

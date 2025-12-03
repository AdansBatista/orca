'use client';

import Link from 'next/link';
import { Plus, FileText, Package, ShieldCheck } from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/button';
import { ComplianceDashboard } from '@/components/sterilization/ComplianceDashboard';

export default function SterilizationDashboardPage() {
  return (
    <>
      <PageHeader
        title="Sterilization Dashboard"
        description="Compliance overview and real-time monitoring"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Sterilization', href: '/resources/sterilization' },
          { label: 'Dashboard' },
        ]}
        actions={
          <div className="flex gap-2">
            <Link href="/resources/sterilization/reports">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Reports
              </Button>
            </Link>
            <Link href="/resources/sterilization/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Cycle
              </Button>
            </Link>
          </div>
        }
      />
      <PageContent density="comfortable">
        <ComplianceDashboard />
      </PageContent>
    </>
  );
}

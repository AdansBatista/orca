'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Clock, CalendarClock, LayoutTemplate } from 'lucide-react';
import { PageHeader, PageContent } from '@/components/layout';
import { ProviderScheduleManager } from '@/components/booking';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

function ProviderScheduleSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-[200px]" />
      </div>

      {/* Week grid skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProviderSchedulesPage() {
  return (
    <>
      <PageHeader
        title="Booking Settings"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Booking', href: '/booking' },
          { label: 'Settings' },
        ]}
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Settings Navigation */}
          <Tabs value="provider-schedules" className="w-full">
            <TabsList>
              <TabsTrigger value="appointment-types" asChild>
                <Link href="/booking/settings/appointment-types" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Appointment Types
                </Link>
              </TabsTrigger>
              <TabsTrigger value="provider-schedules" asChild>
                <Link href="/booking/settings/provider-schedules" className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  Provider Schedules
                </Link>
              </TabsTrigger>
              <TabsTrigger value="templates" asChild>
                <Link href="/booking/settings/templates" className="flex items-center gap-2">
                  <LayoutTemplate className="h-4 w-4" />
                  Schedule Templates
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Suspense fallback={<ProviderScheduleSkeleton />}>
            <ProviderScheduleManager />
          </Suspense>
        </div>
      </PageContent>
    </>
  );
}

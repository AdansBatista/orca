'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Filter, LayoutTemplate, CalendarX } from 'lucide-react';
import type { StaffShift, StaffProfile } from '@prisma/client';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScheduleCalendar, ShiftForm } from '@/components/staff';

type ShiftWithStaff = StaffShift & {
  staffProfile?: Pick<StaffProfile, 'id' | 'firstName' | 'lastName' | 'title'>;
};

export default function SchedulesPage() {
  const [selectedShift, setSelectedShift] = useState<ShiftWithStaff | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newShiftDate, setNewShiftDate] = useState<Date | null>(null);
  const [staffFilter, setStaffFilter] = useState<string>('');
  const [staffProfiles, setStaffProfiles] = useState<Pick<StaffProfile, 'id' | 'firstName' | 'lastName'>[]>([]);

  // Fetch staff profiles for filter
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await fetch('/api/staff?pageSize=100');
        const result = await response.json();
        if (result.success) {
          setStaffProfiles(result.data.items);
        }
      } catch (error) {
        console.error('Failed to fetch staff:', error);
      }
    };
    fetchStaff();
  }, []);

  const handleShiftClick = (shift: ShiftWithStaff) => {
    setSelectedShift(shift);
    setIsFormOpen(true);
  };

  const handleAddShift = (date: Date) => {
    setNewShiftDate(date);
    setSelectedShift(null);
    setIsFormOpen(true);
  };

  const handleSubmitShift = async (data: Record<string, unknown>) => {
    try {
      const staffProfileId = staffFilter || (staffProfiles[0]?.id);
      if (!staffProfileId) {
        alert('Please select a staff member');
        return;
      }

      const url = selectedShift
        ? `/api/staff/shifts/${selectedShift.id}`
        : `/api/staff/${staffProfileId}/shifts`;

      const response = await fetch(url, {
        method: selectedShift ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save shift');
      }

      // Refresh calendar (by closing and reopening form to trigger re-fetch)
      setIsFormOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Failed to save shift:', error);
      alert(error instanceof Error ? error.message : 'Failed to save shift');
    }
  };

  return (
    <>
      <PageHeader
        title="Staff Schedules"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Staff', href: '/staff' },
          { label: 'Schedules' },
        ]}
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Header actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={staffFilter || "all"} onValueChange={(val) => setStaffFilter(val === "all" ? "" : val)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {staffProfiles.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.firstName} {staff.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/staff/schedules/templates">
                <Button variant="outline">
                  <LayoutTemplate className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              </Link>
              <Link href="/staff/schedules/blackout-dates">
                <Button variant="outline">
                  <CalendarX className="h-4 w-4 mr-2" />
                  Blackout Dates
                </Button>
              </Link>
              <Button onClick={() => handleAddShift(new Date())}>
                <Plus className="h-4 w-4 mr-2" />
                Add Shift
              </Button>
            </div>
          </div>

          {/* Calendar */}
          <ScheduleCalendar
            staffProfileId={staffFilter || undefined}
            onShiftClick={handleShiftClick}
            onAddShift={handleAddShift}
          />

          {/* Legend */}
          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900" />
                  <span>Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900" />
                  <span>Confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900" />
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-900" />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-900" />
                  <span>Cancelled</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shift Form Dialog */}
        <ShiftForm
          shift={selectedShift || undefined}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleSubmitShift}
          locationId={selectedShift?.locationId}
        />
      </PageContent>
    </>
  );
}

"use client";

import {
  Users,
  Calendar,
  Clock,
  Check,
  TrendingUp,
  Bell,
  Search,
  Plus,
  MoreHorizontal,
  FileText,
  MessageSquare,
  ChevronRight,
  ArrowUpRight,
  Activity,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  StatCard,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ListItem,
  ListItemTitle,
  ListItemDescription,
  ListActivity,
} from "@/components/ui/list-item";
import {
  PageHeader,
  PageContent,
  DashboardGrid,
  StatsRow,
} from "@/components/layout";

// Mock data
const todayAppointments = [
  { time: "9:00 AM", patient: "John Doe", initials: "JD", type: "Adjustment", status: "completed", provider: "Dr. Smith" },
  { time: "10:30 AM", patient: "Jane Smith", initials: "JS", type: "Consultation", status: "in-progress", provider: "Dr. Smith" },
  { time: "11:30 AM", patient: "Robert Johnson", initials: "RJ", type: "Check-up", status: "upcoming", provider: "Dr. Jones" },
  { time: "2:00 PM", patient: "Emily Davis", initials: "ED", type: "Adjustment", status: "upcoming", provider: "Dr. Smith" },
  { time: "3:30 PM", patient: "Michael Brown", initials: "MB", type: "Retainer Check", status: "upcoming", provider: "Dr. Jones" },
];

const recentPatients = [
  { name: "John Doe", initials: "JD", status: "Active", lastVisit: "Today", progress: 75, nextAppt: "Feb 15" },
  { name: "Jane Smith", initials: "JS", status: "Pending", lastVisit: "Yesterday", progress: 45, nextAppt: "Feb 10" },
  { name: "Robert Johnson", initials: "RJ", status: "Active", lastVisit: "Jan 25", progress: 90, nextAppt: "Mar 1" },
  { name: "Sarah Wilson", initials: "SW", status: "Active", lastVisit: "Jan 22", progress: 60, nextAppt: "Feb 20" },
];

const notifications = [
  { type: "appointment", message: "New appointment request from Sarah Wilson", time: "5 min ago", color: "primary" },
  { type: "payment", message: "Payment received for Invoice #1234", time: "1 hour ago", color: "success" },
  { type: "reminder", message: "Treatment plan review due for 3 patients", time: "2 hours ago", color: "warning" },
  { type: "message", message: "New message from Jane Smith", time: "3 hours ago", color: "info" },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        compact
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Dashboard" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search patients..." className="pl-9 w-64" inputSize="sm" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-error-500 text-[10px] text-white flex items-center justify-center">
                    4
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.slice(0, 3).map((notif, i) => (
                  <DropdownMenuItem key={i} className="flex items-start gap-3 py-3">
                    <div className={`h-2 w-2 rounded-full bg-${notif.color}-500 mt-1.5 shrink-0`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm leading-tight">{notif.message}</p>
                      <p className="text-xs text-muted-foreground">{notif.time}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-primary-600">
                  View all notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button>
              <Plus className="h-4 w-4" />
              New Appointment
            </Button>
          </div>
        }
      />

      <PageContent density="comfortable">
        <DashboardGrid>
          {/* Stats Row */}
          <DashboardGrid.FullWidth>
            <StatsRow>
              <StatCard accentColor="primary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Patients</p>
                    <p className="text-2xl font-bold">1,234</p>
                    <p className="text-xs text-success-600 flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" />
                      +12% from last month
                    </p>
                  </div>
                  <div className="icon-container">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
              </StatCard>

              <StatCard accentColor="accent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Today&apos;s Appointments</p>
                    <p className="text-2xl font-bold">8</p>
                    <p className="text-xs text-muted-foreground mt-1">3 completed, 5 remaining</p>
                  </div>
                  <div className="icon-container-accent">
                    <Calendar className="h-5 w-5" />
                  </div>
                </div>
              </StatCard>

              <StatCard accentColor="warning">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Pending Tasks</p>
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-xs text-warning-600 mt-1">4 high priority</p>
                  </div>
                  <div className="flex items-center justify-center rounded-xl bg-warning-100 p-2 text-warning-600">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
              </StatCard>

              <StatCard accentColor="success">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">This Week</p>
                    <p className="text-2xl font-bold">42</p>
                    <p className="text-xs text-success-600 flex items-center gap-1 mt-1">
                      <Check className="h-3 w-3" />
                      98% completion rate
                    </p>
                  </div>
                  <div className="flex items-center justify-center rounded-xl bg-success-100 p-2 text-success-600">
                    <Activity className="h-5 w-5" />
                  </div>
                </div>
              </StatCard>
            </StatsRow>
          </DashboardGrid.FullWidth>
          {/* Today's Schedule */}
          <DashboardGrid.TwoThirds>
            <Card variant="bento" className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Today&apos;s Schedule</CardTitle>
                    <CardDescription>
                      {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    View Calendar
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="text-xs h-9">Time</TableHead>
                        <TableHead className="text-xs h-9">Patient</TableHead>
                        <TableHead className="text-xs h-9">Type</TableHead>
                        <TableHead className="text-xs h-9">Provider</TableHead>
                        <TableHead className="text-xs h-9">Status</TableHead>
                        <TableHead className="text-xs h-9 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todayAppointments.map((apt, i) => (
                        <TableRow key={i} className="h-12">
                          <TableCell className="text-sm font-medium">{apt.time}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-[10px] bg-gradient-primary text-white">
                                  {apt.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{apt.patient}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{apt.type}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{apt.provider}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                apt.status === "completed" ? "success" :
                                apt.status === "in-progress" ? "warning" : "info"
                              }
                              size="sm"
                              dot
                            >
                              {apt.status === "completed" ? "Completed" :
                               apt.status === "in-progress" ? "In Progress" : "Upcoming"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>Start Appointment</DropdownMenuItem>
                                <DropdownMenuItem>Reschedule</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </DashboardGrid.TwoThirds>

          {/* Recent Patients */}
          <DashboardGrid.OneThird>
            <Card variant="bento" className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Patients</CardTitle>
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentPatients.map((patient, i) => (
                  <ListItem
                    key={i}
                    showArrow
                    leading={
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-primary text-white text-sm">
                          {patient.initials}
                        </AvatarFallback>
                      </Avatar>
                    }
                    trailing={
                      <Badge
                        variant={patient.status === "Active" ? "success" : "warning"}
                        size="sm"
                        dot
                      >
                        {patient.status}
                      </Badge>
                    }
                  >
                    <div className="flex items-center justify-between">
                      <ListItemTitle>{patient.name}</ListItemTitle>
                    </div>
                    <ListItemDescription>Next: {patient.nextAppt}</ListItemDescription>
                    <div className="mt-1.5">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-primary rounded-full transition-all"
                          style={{ width: `${patient.progress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{patient.progress}% treatment</p>
                    </div>
                  </ListItem>
                ))}
              </CardContent>
            </Card>
          </DashboardGrid.OneThird>

          {/* Quick Actions */}
          <DashboardGrid.Half>
            <Card variant="bento">
              <CardHeader className="pb-3">
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="soft" className="h-auto py-4 flex-col gap-2 hover:shadow-md transition-shadow">
                    <Users className="h-5 w-5" />
                    <span className="text-xs">New Patient</span>
                  </Button>
                  <Button variant="soft" className="h-auto py-4 flex-col gap-2 hover:shadow-md transition-shadow">
                    <Calendar className="h-5 w-5" />
                    <span className="text-xs">Schedule</span>
                  </Button>
                  <Button variant="soft-accent" className="h-auto py-4 flex-col gap-2 hover:shadow-md transition-shadow">
                    <FileText className="h-5 w-5" />
                    <span className="text-xs">New Record</span>
                  </Button>
                  <Button variant="soft-accent" className="h-auto py-4 flex-col gap-2 hover:shadow-md transition-shadow">
                    <MessageSquare className="h-5 w-5" />
                    <span className="text-xs">Send Message</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </DashboardGrid.Half>

          {/* Notifications */}
          <DashboardGrid.Half>
            <Card variant="bento">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Activity</CardTitle>
                  <Badge variant="soft-primary" size="sm">{notifications.length} new</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {notifications.map((notif, i) => (
                  <ListActivity
                    key={i}
                    indicatorColor={notif.color as "primary" | "success" | "warning" | "info"}
                  >
                    <p className="text-sm leading-tight">{notif.message}</p>
                    <p className="text-xs text-muted-foreground">{notif.time}</p>
                  </ListActivity>
                ))}
              </CardContent>
            </Card>
          </DashboardGrid.Half>
        </DashboardGrid>
      </PageContent>
    </>
  );
}

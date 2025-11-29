"use client";

import { useState } from "react";
import {
  Users,
  Calendar,
  Settings,
  Plus,
  Search,
  X,
  Check,
  AlertTriangle,
  Info,
  Bell,
  Mail,
  Phone,
  Clock,
  Trash2,
  Edit,
  Eye,
  Download,
  MoreHorizontal,
  User,
  LogOut,
  Activity,
  Zap,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  StatCard,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import {
  AppShell,
  PageHeader,
  PageContent,
  PageSection,
  DashboardGrid,
  StatsRow,
  CardGrid,
  MasterDetail,
  DataTableLayout,
} from "@/components/layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

export default function UIShowcasePage() {
  const [switchValue, setSwitchValue] = useState(false);
  const [loadingBtn, setLoadingBtn] = useState(false);

  const handleLoadingDemo = () => {
    setLoadingBtn(true);
    setTimeout(() => setLoadingBtn(false), 2000);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-silk bg-mesh">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-gradient">Orca</span>
              <Badge variant="soft-primary" size="sm">Modern UI</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm">
                <Bell className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-gradient-accent text-white text-xs">
                        JD
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-sm">
                    <User className="mr-2 h-3.5 w-3.5" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-sm">
                    <Settings className="mr-2 h-3.5 w-3.5" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-sm text-destructive">
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="container py-6">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="text-sm">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm">UI Showcase</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-balance">
              Modern <span className="text-gradient">UI Components</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              A comprehensive showcase of Orca&apos;s modern design system with glass morphism, gradients, and bento-box layouts.
            </p>
          </div>

          <Tabs defaultValue="layouts" className="space-y-6">
            <TabsList className="h-9 p-1 bg-muted/50 backdrop-blur-sm rounded-full">
              <TabsTrigger value="layouts" className="rounded-full text-xs px-3">Layouts</TabsTrigger>
              <TabsTrigger value="colors" className="rounded-full text-xs px-3">Colors</TabsTrigger>
              <TabsTrigger value="buttons" className="rounded-full text-xs px-3">Buttons</TabsTrigger>
              <TabsTrigger value="cards" className="rounded-full text-xs px-3">Cards</TabsTrigger>
              <TabsTrigger value="forms" className="rounded-full text-xs px-3">Forms</TabsTrigger>
              <TabsTrigger value="badges" className="rounded-full text-xs px-3">Badges</TabsTrigger>
              <TabsTrigger value="overlays" className="rounded-full text-xs px-3">Overlays</TabsTrigger>
              <TabsTrigger value="data" className="rounded-full text-xs px-3">Data</TabsTrigger>
            </TabsList>

            {/* Layouts Tab */}
            <TabsContent value="layouts" className="space-y-6">
              {/* Layout Architecture Overview */}
              <Card variant="bento">
                <CardHeader compact>
                  <CardTitle size="sm">Layout Architecture</CardTitle>
                  <CardDescription>
                    Orca uses a consistent layout system with collapsible sidebar, sticky headers, and content density options
                  </CardDescription>
                </CardHeader>
                <CardContent compact>
                  <div className="rounded-xl border border-border/50 bg-muted/30 p-4 font-mono text-xs">
                    <pre className="text-muted-foreground">{`┌─────────────────────────────────────────────────────────────┐
│ ┌──────┐ ┌────────────────────────────────────────────────┐ │
│ │      │ │ PageHeader (sticky)                   [Actions]│ │
│ │      │ ├────────────────────────────────────────────────┤ │
│ │ Side │ │                                                │ │
│ │ bar  │ │  PageContent                                   │ │
│ │      │ │                                                │ │
│ │ w-64 │ │  (scrollable, density variants)                │ │
│ │  ↔   │ │                                                │ │
│ │ w-16 │ │                                                │ │
│ └──────┘ └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘`}</pre>
                  </div>
                </CardContent>
              </Card>

              {/* Dashboard Grid Pattern */}
              <Card variant="bento">
                <CardHeader compact>
                  <CardTitle size="sm">Dashboard Grid Pattern</CardTitle>
                  <CardDescription>
                    12-column grid system with StatsRow and flexible grid items
                  </CardDescription>
                </CardHeader>
                <CardContent compact className="space-y-4">
                  {/* Stats Row Demo */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">StatsRow - Auto-responsive stat cards</p>
                    <StatsRow>
                      <StatCard accentColor="primary">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Patients</p>
                            <p className="text-lg font-bold">1,234</p>
                          </div>
                          <Users className="h-5 w-5 text-primary-500" />
                        </div>
                      </StatCard>
                      <StatCard accentColor="accent">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Appointments</p>
                            <p className="text-lg font-bold">24</p>
                          </div>
                          <Calendar className="h-5 w-5 text-accent-500" />
                        </div>
                      </StatCard>
                      <StatCard accentColor="warning">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Pending</p>
                            <p className="text-lg font-bold">8</p>
                          </div>
                          <Clock className="h-5 w-5 text-warning-500" />
                        </div>
                      </StatCard>
                      <StatCard accentColor="success">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Completed</p>
                            <p className="text-lg font-bold">16</p>
                          </div>
                          <Check className="h-5 w-5 text-success-500" />
                        </div>
                      </StatCard>
                    </StatsRow>
                  </div>

                  <Separator />

                  {/* Dashboard Grid Demo */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">DashboardGrid - Flexible 12-column layout</p>
                    <DashboardGrid gap="default">
                      <DashboardGrid.TwoThirds>
                        <Card variant="bento" className="h-32">
                          <CardContent className="flex items-center justify-center h-full">
                            <span className="text-sm text-muted-foreground">TwoThirds (8 cols)</span>
                          </CardContent>
                        </Card>
                      </DashboardGrid.TwoThirds>
                      <DashboardGrid.OneThird>
                        <Card variant="bento" className="h-32">
                          <CardContent className="flex items-center justify-center h-full">
                            <span className="text-sm text-muted-foreground">OneThird (4 cols)</span>
                          </CardContent>
                        </Card>
                      </DashboardGrid.OneThird>
                      <DashboardGrid.Half>
                        <Card variant="bento" className="h-24">
                          <CardContent className="flex items-center justify-center h-full">
                            <span className="text-sm text-muted-foreground">Half (6 cols)</span>
                          </CardContent>
                        </Card>
                      </DashboardGrid.Half>
                      <DashboardGrid.Half>
                        <Card variant="bento" className="h-24">
                          <CardContent className="flex items-center justify-center h-full">
                            <span className="text-sm text-muted-foreground">Half (6 cols)</span>
                          </CardContent>
                        </Card>
                      </DashboardGrid.Half>
                    </DashboardGrid>
                  </div>
                </CardContent>
              </Card>

              {/* Master-Detail Pattern */}
              <Card variant="bento">
                <CardHeader compact>
                  <CardTitle size="sm">Master-Detail Pattern</CardTitle>
                  <CardDescription>
                    Split view with list panel and detail panel - ideal for patient lists, messages, etc.
                  </CardDescription>
                </CardHeader>
                <CardContent compact>
                  <div className="rounded-xl border border-border/50 overflow-hidden h-80">
                    <MasterDetail listWidth="narrow">
                      <MasterDetail.List>
                        <MasterDetail.ListHeader>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Search patients..." className="pl-9" inputSize="sm" />
                          </div>
                        </MasterDetail.ListHeader>
                        <MasterDetail.ListContent>
                          <MasterDetail.ListItem active>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gradient-primary text-white text-xs">JD</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">John Doe</p>
                                <p className="text-xs text-muted-foreground">Last visit: Jan 10</p>
                              </div>
                              <Badge variant="success" size="sm" dot>Active</Badge>
                            </div>
                          </MasterDetail.ListItem>
                          <MasterDetail.ListItem>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gradient-accent text-white text-xs">JS</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">Jane Smith</p>
                                <p className="text-xs text-muted-foreground">Last visit: Jan 8</p>
                              </div>
                              <Badge variant="warning" size="sm" dot>Pending</Badge>
                            </div>
                          </MasterDetail.ListItem>
                          <MasterDetail.ListItem>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-secondary-500 text-white text-xs">RJ</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">Robert Johnson</p>
                                <p className="text-xs text-muted-foreground">Last visit: Jan 5</p>
                              </div>
                              <Badge variant="info" size="sm" dot>Scheduled</Badge>
                            </div>
                          </MasterDetail.ListItem>
                        </MasterDetail.ListContent>
                      </MasterDetail.List>
                      <MasterDetail.Detail>
                        <MasterDetail.DetailHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-gradient-primary text-white">JD</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold">John Doe</h3>
                                <p className="text-xs text-muted-foreground">Patient #12345</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">Edit</Button>
                              <Button size="sm">Schedule</Button>
                            </div>
                          </div>
                        </MasterDetail.DetailHeader>
                        <MasterDetail.DetailContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Email</p>
                                <p className="text-sm">john.doe@example.com</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Phone</p>
                                <p className="text-sm">(555) 123-4567</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Date of Birth</p>
                                <p className="text-sm">March 15, 1990</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Status</p>
                                <Badge variant="success" size="sm" dot>Active Treatment</Badge>
                              </div>
                            </div>
                            <Separator />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">Treatment Progress</p>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full w-3/4 bg-gradient-primary rounded-full" />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">75% complete - 6 months remaining</p>
                            </div>
                          </div>
                        </MasterDetail.DetailContent>
                      </MasterDetail.Detail>
                    </MasterDetail>
                  </div>
                </CardContent>
              </Card>

              {/* Data Table Layout Pattern */}
              <Card variant="bento">
                <CardHeader compact>
                  <CardTitle size="sm">Data Table Layout Pattern</CardTitle>
                  <CardDescription>
                    Full-width table with toolbar, filters, and pagination
                  </CardDescription>
                </CardHeader>
                <CardContent compact>
                  <div className="rounded-xl border border-border/50 overflow-hidden h-80">
                    <DataTableLayout>
                      <DataTableLayout.Toolbar>
                        <DataTableLayout.ToolbarSection>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Search..." className="pl-9 w-64" inputSize="sm" />
                          </div>
                          <Select>
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        </DataTableLayout.ToolbarSection>
                        <DataTableLayout.ToolbarSection align="end">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                            Export
                          </Button>
                          <Button size="sm">
                            <Plus className="h-4 w-4" />
                            Add New
                          </Button>
                        </DataTableLayout.ToolbarSection>
                      </DataTableLayout.Toolbar>
                      <DataTableLayout.Table>
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                              <TableHead className="text-xs h-9">Name</TableHead>
                              <TableHead className="text-xs h-9">Email</TableHead>
                              <TableHead className="text-xs h-9">Status</TableHead>
                              <TableHead className="text-xs h-9">Date</TableHead>
                              <TableHead className="text-xs h-9 text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[
                              { name: "John Doe", email: "john@example.com", status: "Active", date: "Jan 15" },
                              { name: "Jane Smith", email: "jane@example.com", status: "Pending", date: "Jan 14" },
                              { name: "Robert Johnson", email: "robert@example.com", status: "Active", date: "Jan 13" },
                              { name: "Emily Davis", email: "emily@example.com", status: "Inactive", date: "Jan 12" },
                            ].map((row, i) => (
                              <TableRow key={i} className="h-10">
                                <TableCell className="text-sm">{row.name}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{row.email}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={row.status === "Active" ? "success" : row.status === "Pending" ? "warning" : "ghost"}
                                    size="sm"
                                    dot
                                  >
                                    {row.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">{row.date}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon-sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </DataTableLayout.Table>
                      <DataTableLayout.Pagination>
                        <span className="text-xs text-muted-foreground">Showing 1-4 of 24 results</span>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" disabled>Previous</Button>
                          <Button variant="soft" size="sm">1</Button>
                          <Button variant="ghost" size="sm">2</Button>
                          <Button variant="ghost" size="sm">3</Button>
                          <Button variant="outline" size="sm">Next</Button>
                        </div>
                      </DataTableLayout.Pagination>
                    </DataTableLayout>
                  </div>
                </CardContent>
              </Card>

              {/* Card Grid Pattern */}
              <Card variant="bento">
                <CardHeader compact>
                  <CardTitle size="sm">Card Grid Pattern</CardTitle>
                  <CardDescription>
                    Responsive grid for card-based content with configurable columns
                  </CardDescription>
                </CardHeader>
                <CardContent compact>
                  <CardGrid columns={3} gap="default">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Card key={i} variant="bento" interactive>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="icon-container">
                              <Users className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Card {i}</p>
                              <p className="text-xs text-muted-foreground">Interactive card</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardGrid>
                </CardContent>
              </Card>

              {/* Density Comparison */}
              <Card variant="bento">
                <CardHeader compact>
                  <CardTitle size="sm">Content Density Options</CardTitle>
                  <CardDescription>
                    PageContent supports three density levels: compact, comfortable, and spacious
                  </CardDescription>
                </CardHeader>
                <CardContent compact>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl border border-border/50 overflow-hidden">
                      <div className="bg-muted/50 px-3 py-1.5 border-b border-border/50">
                        <span className="text-xs font-medium">Compact (p-4)</span>
                      </div>
                      <div className="p-4 space-y-4">
                        <div className="h-4 bg-muted rounded" />
                        <div className="h-4 bg-muted rounded" />
                        <div className="h-4 bg-muted rounded w-3/4" />
                      </div>
                    </div>
                    <div className="rounded-xl border border-primary-200 overflow-hidden bg-primary-50/30">
                      <div className="bg-primary-100/50 px-3 py-1.5 border-b border-primary-200">
                        <span className="text-xs font-medium text-primary-700">Comfortable (p-6) - Default</span>
                      </div>
                      <div className="p-6 space-y-6">
                        <div className="h-4 bg-primary-100 rounded" />
                        <div className="h-4 bg-primary-100 rounded" />
                        <div className="h-4 bg-primary-100 rounded w-3/4" />
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/50 overflow-hidden">
                      <div className="bg-muted/50 px-3 py-1.5 border-b border-border/50">
                        <span className="text-xs font-medium">Spacious (p-8)</span>
                      </div>
                      <div className="p-8 space-y-8">
                        <div className="h-4 bg-muted rounded" />
                        <div className="h-4 bg-muted rounded" />
                        <div className="h-4 bg-muted rounded w-3/4" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Link to Full Demo */}
              <Card variant="gradient">
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <h3 className="font-semibold">See Full Layout Demo</h3>
                    <p className="text-sm text-muted-foreground">
                      View the complete AppShell with sidebar navigation
                    </p>
                  </div>
                  <Button asChild>
                    <a href="/demo/dashboard">Open Demo</a>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Primary Colors */}
                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm">Primary - Cyan/Teal</CardTitle>
                    <CardDescription>Modern green-blue for primary actions</CardDescription>
                  </CardHeader>
                  <CardContent compact>
                    <div className="flex gap-1">
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-primary-50 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">primary-50</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-primary-100 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">primary-100</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-primary-200 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">primary-200</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-primary-300 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">primary-300</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-primary-400 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">primary-400</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-primary-500 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">primary-500</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-primary-600 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">primary-600</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-primary-700 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">primary-700</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-primary-800 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">primary-800</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-primary-900 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">primary-900</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-primary-950 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">primary-950</p></TooltipContent></Tooltip>
                    </div>
                    <div className="mt-3 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white text-sm font-medium shadow-glow">
                      Gradient Primary
                    </div>
                  </CardContent>
                </Card>

                {/* Silk/Slate Colors */}
                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm">Silk - Dark Slate</CardTitle>
                    <CardDescription>Sophisticated neutrals for backgrounds</CardDescription>
                  </CardHeader>
                  <CardContent compact>
                    <div className="flex gap-1">
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-silk-50 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">silk-50</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-silk-100 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">silk-100</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-silk-200 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">silk-200</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-silk-300 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">silk-300</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-silk-400 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">silk-400</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-silk-500 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">silk-500</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-silk-600 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">silk-600</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-silk-700 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">silk-700</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-silk-800 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">silk-800</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-silk-900 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">silk-900</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-silk-950 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">silk-950</p></TooltipContent></Tooltip>
                    </div>
                    <div className="mt-3 h-12 rounded-xl bg-gradient-dark flex items-center justify-center text-white text-sm font-medium">
                      Gradient Dark
                    </div>
                  </CardContent>
                </Card>

                {/* Accent Colors */}
                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm">Accent - Emerald</CardTitle>
                    <CardDescription>Vibrant green for highlights</CardDescription>
                  </CardHeader>
                  <CardContent compact>
                    <div className="flex gap-1">
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-accent-50 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">accent-50</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-accent-100 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">accent-100</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-accent-200 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">accent-200</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-accent-300 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">accent-300</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-accent-400 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">accent-400</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-accent-500 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">accent-500</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-accent-600 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">accent-600</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-accent-700 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">accent-700</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-accent-800 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">accent-800</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-accent-900 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">accent-900</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-accent-950 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">accent-950</p></TooltipContent></Tooltip>
                    </div>
                    <div className="mt-3 h-12 rounded-xl bg-gradient-accent flex items-center justify-center text-white text-sm font-medium shadow-glow-accent">
                      Gradient Accent
                    </div>
                  </CardContent>
                </Card>

                {/* Secondary Colors */}
                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm">Secondary - Violet</CardTitle>
                    <CardDescription>Soft purple for variety</CardDescription>
                  </CardHeader>
                  <CardContent compact>
                    <div className="flex gap-1">
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-secondary-50 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">secondary-50</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-secondary-100 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">secondary-100</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-secondary-200 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">secondary-200</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-secondary-300 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">secondary-300</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-secondary-400 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">secondary-400</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-secondary-500 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">secondary-500</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-secondary-600 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">secondary-600</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-secondary-700 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">secondary-700</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-secondary-800 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">secondary-800</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-secondary-900 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">secondary-900</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><div className="h-10 w-8 rounded-lg bg-secondary-950 transition-transform hover:scale-110" /></TooltipTrigger><TooltipContent><p className="text-xs">secondary-950</p></TooltipContent></Tooltip>
                    </div>
                    <div className="mt-3 h-12 rounded-xl bg-gradient-to-r from-secondary-500 to-secondary-600 flex items-center justify-center text-white text-sm font-medium">
                      Gradient Secondary
                    </div>
                  </CardContent>
                </Card>

                {/* Semantic Colors */}
                <Card variant="bento" className="md:col-span-2">
                  <CardHeader compact>
                    <CardTitle size="sm">Semantic Colors</CardTitle>
                    <CardDescription>Status and feedback indicators</CardDescription>
                  </CardHeader>
                  <CardContent compact>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          <div className="h-8 flex-1 rounded-lg bg-success-100" />
                          <div className="h-8 flex-1 rounded-lg bg-success-500" />
                          <div className="h-8 flex-1 rounded-lg bg-success-700" />
                        </div>
                        <p className="text-xs text-center text-muted-foreground">Success</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          <div className="h-8 flex-1 rounded-lg bg-warning-100" />
                          <div className="h-8 flex-1 rounded-lg bg-warning-500" />
                          <div className="h-8 flex-1 rounded-lg bg-warning-700" />
                        </div>
                        <p className="text-xs text-center text-muted-foreground">Warning</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          <div className="h-8 flex-1 rounded-lg bg-error-100" />
                          <div className="h-8 flex-1 rounded-lg bg-error-500" />
                          <div className="h-8 flex-1 rounded-lg bg-error-700" />
                        </div>
                        <p className="text-xs text-center text-muted-foreground">Error</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          <div className="h-8 flex-1 rounded-lg bg-info-100" />
                          <div className="h-8 flex-1 rounded-lg bg-info-500" />
                          <div className="h-8 flex-1 rounded-lg bg-info-700" />
                        </div>
                        <p className="text-xs text-center text-muted-foreground">Info</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Buttons Tab */}
            <TabsContent value="buttons" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm">Button Variants</CardTitle>
                    <CardDescription>Gradient and pill-shaped buttons</CardDescription>
                  </CardHeader>
                  <CardContent compact className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Button>Primary</Button>
                      <Button variant="accent">Accent</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="destructive">Destructive</Button>
                    </div>
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="soft">Soft</Button>
                      <Button variant="soft-accent">Soft Accent</Button>
                      <Button variant="link">Link</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm">Button Sizes</CardTitle>
                    <CardDescription>Compact to large sizing options</CardDescription>
                  </CardHeader>
                  <CardContent compact className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm">Small</Button>
                      <Button size="default">Default</Button>
                      <Button size="lg">Large</Button>
                      <Button size="xl">Extra Large</Button>
                    </div>
                    <Separator />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="icon-sm" variant="soft">
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="soft">
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button size="icon-lg" variant="soft">
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm">With Icons</CardTitle>
                    <CardDescription>Buttons with leading/trailing icons</CardDescription>
                  </CardHeader>
                  <CardContent compact>
                    <div className="flex flex-wrap gap-2">
                      <Button>
                        <Plus className="h-4 w-4" />
                        Add Patient
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4" />
                        Export
                      </Button>
                      <Button variant="accent">
                        <Zap className="h-4 w-4" />
                        Quick Action
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm">States</CardTitle>
                    <CardDescription>Loading, disabled, and interactive states</CardDescription>
                  </CardHeader>
                  <CardContent compact>
                    <div className="flex flex-wrap gap-2">
                      <Button>Normal</Button>
                      <Button disabled>Disabled</Button>
                      <Button loading={loadingBtn} onClick={handleLoadingDemo}>
                        {loadingBtn ? null : "Click Me"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="bento" className="md:col-span-2">
                  <CardHeader compact>
                    <CardTitle size="sm">Action Dropdown Buttons</CardTitle>
                    <CardDescription>Buttons with dropdown options</CardDescription>
                  </CardHeader>
                  <CardContent compact>
                    <div className="flex flex-wrap gap-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                              <MoreHorizontal className="h-4 w-4" />
                              Actions
                              <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="soft">
                              <Download className="h-4 w-4" />
                              Export
                              <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                            <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                            <DropdownMenuItem>Export as Excel</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="sm">
                              Status
                              <svg className="h-3.5 w-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <span className="mr-2 h-2 w-2 rounded-full bg-success-500" />
                              Active
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <span className="mr-2 h-2 w-2 rounded-full bg-warning-500" />
                              Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <span className="mr-2 h-2 w-2 rounded-full bg-error-500" />
                              Inactive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Cards Tab */}
            <TabsContent value="cards" className="space-y-6">
              {/* Bento Grid Demo */}
              <div className="grid gap-3 md:grid-cols-4">
                <Card variant="bento" className="md:col-span-2 md:row-span-2">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="icon-container">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>Bento Layout</CardTitle>
                        <CardDescription>Large feature card</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      This is a large bento-style card that spans multiple columns and rows.
                      Perfect for featured content or dashboards.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-muted/50 p-3">
                        <p className="text-2xl font-bold text-gradient">1,234</p>
                        <p className="text-xs text-muted-foreground">Total Users</p>
                      </div>
                      <div className="rounded-xl bg-muted/50 p-3">
                        <p className="text-2xl font-bold text-gradient-accent">89%</p>
                        <p className="text-xs text-muted-foreground">Success Rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="glass">
                  <CardHeader compact>
                    <CardTitle size="sm">Glass Card</CardTitle>
                  </CardHeader>
                  <CardContent compact>
                    <p className="text-xs text-muted-foreground">Frosted glass effect</p>
                  </CardContent>
                </Card>

                <Card variant="elevated">
                  <CardHeader compact>
                    <CardTitle size="sm">Elevated</CardTitle>
                  </CardHeader>
                  <CardContent compact>
                    <p className="text-xs text-muted-foreground">Shadow emphasis</p>
                  </CardContent>
                </Card>

                <Card variant="gradient">
                  <CardHeader compact>
                    <CardTitle size="sm">Gradient</CardTitle>
                  </CardHeader>
                  <CardContent compact>
                    <p className="text-xs text-muted-foreground">Subtle gradient</p>
                  </CardContent>
                </Card>

                <Card variant="ghost">
                  <CardHeader compact>
                    <CardTitle size="sm">Ghost</CardTitle>
                  </CardHeader>
                  <CardContent compact>
                    <p className="text-xs text-muted-foreground">Minimal styling</p>
                  </CardContent>
                </Card>
              </div>

              {/* Stat Cards */}
              <div className="grid gap-3 md:grid-cols-4">
                <StatCard accentColor="primary">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Patients</p>
                      <p className="text-xl font-bold">1,234</p>
                    </div>
                    <div className="icon-container">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                </StatCard>

                <StatCard accentColor="accent">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Today&apos;s Appointments</p>
                      <p className="text-xl font-bold">24</p>
                    </div>
                    <div className="icon-container-accent">
                      <Calendar className="h-4 w-4" />
                    </div>
                  </div>
                </StatCard>

                <StatCard accentColor="warning">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Pending Tasks</p>
                      <p className="text-xl font-bold">12</p>
                    </div>
                    <div className="flex items-center justify-center rounded-xl bg-warning-100 p-2 text-warning-600">
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                </StatCard>

                <StatCard accentColor="success">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="text-xl font-bold">18</p>
                    </div>
                    <div className="flex items-center justify-center rounded-xl bg-success-100 p-2 text-success-600">
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                </StatCard>
              </div>

              {/* Interactive Card */}
              <Card variant="bento" interactive className="max-w-md">
                <CardHeader className="flex flex-row items-center gap-3 p-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-primary text-white">JD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle size="sm">John Doe</CardTitle>
                    <CardDescription>Patient #12345</CardDescription>
                  </div>
                  <Badge variant="success" dot>Active</Badge>
                </CardHeader>
                <CardContent compact>
                  <div className="grid gap-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs">john.doe@example.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs">(555) 123-4567</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter compact className="justify-end gap-2">
                  <Button variant="ghost" size="sm">View</Button>
                  <Button size="sm">Edit</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Forms Tab */}
            <TabsContent value="forms" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {/* FormField Pattern */}
                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm">FormField Pattern</CardTitle>
                    <CardDescription>Standard form field with label, input, and validation</CardDescription>
                  </CardHeader>
                  <CardContent compact className="space-y-3">
                    <FormField label="Patient Name" required>
                      <Input placeholder="Enter patient name" />
                    </FormField>

                    <FormField label="Email" description="We'll send appointment reminders here">
                      <Input type="email" placeholder="patient@example.com" />
                    </FormField>

                    <FormField label="Phone" error="Please enter a valid phone number" required>
                      <Input placeholder="(555) 123-4567" error />
                    </FormField>

                    <FormField label="Notes" disabled>
                      <Input placeholder="Disabled field" />
                    </FormField>
                  </CardContent>
                </Card>

                {/* Input Sizes & Icons */}
                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm">Input Sizes</CardTitle>
                    <CardDescription>Different input sizes for various contexts</CardDescription>
                  </CardHeader>
                  <CardContent compact className="space-y-3">
                    <div className="flex gap-2">
                      <FormField label="Small" className="flex-1">
                        <Input inputSize="sm" placeholder="Compact" />
                      </FormField>
                      <FormField label="Default" className="flex-1">
                        <Input placeholder="Standard" />
                      </FormField>
                      <FormField label="Large" className="flex-1">
                        <Input inputSize="lg" placeholder="Prominent" />
                      </FormField>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">With Icon</Label>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-silk-400 pointer-events-none z-10" />
                        <Input placeholder="Search..." className="pl-11" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">With Right Icon</Label>
                      <div className="relative">
                        <Input placeholder="patient@example.com" className="pr-11" />
                        <Mail className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-silk-400 pointer-events-none z-10" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Select & Textarea */}
                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm">Select & Textarea</CardTitle>
                    <CardDescription>Dropdowns and multi-line inputs</CardDescription>
                  </CardHeader>
                  <CardContent compact className="space-y-3">
                    <FormField label="Provider" required>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dr-smith">Dr. Smith</SelectItem>
                          <SelectItem value="dr-jones">Dr. Jones</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="Provider" error="Please select a provider">
                      <Select>
                        <SelectTrigger error>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dr-smith">Dr. Smith</SelectItem>
                          <SelectItem value="dr-jones">Dr. Jones</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="Notes" description="Optional treatment notes">
                      <Textarea placeholder="Enter notes..." />
                    </FormField>

                    <FormField label="Notes" error="Notes are required for this procedure">
                      <Textarea placeholder="Enter notes..." error />
                    </FormField>
                  </CardContent>
                </Card>

                {/* Selection Controls */}
                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm">Selection Controls</CardTitle>
                    <CardDescription>Checkboxes and switches</CardDescription>
                  </CardHeader>
                  <CardContent compact className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Notifications</Label>
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="c1" defaultChecked />
                          <Label htmlFor="c1" className="text-xs font-normal">Email notifications</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="c2" />
                          <Label htmlFor="c2" className="text-xs font-normal">SMS notifications</Label>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-medium">Dark Mode</Label>
                        <p className="text-[10px] text-muted-foreground">Toggle theme</p>
                      </div>
                      <Switch checked={switchValue} onCheckedChange={setSwitchValue} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-medium">Auto-save</Label>
                        <p className="text-[10px] text-muted-foreground">Save changes automatically</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Badges Tab */}
            <TabsContent value="badges" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm">Badge Variants</CardTitle>
                    <CardDescription>Gradient and soft badge styles</CardDescription>
                  </CardHeader>
                  <CardContent compact className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge>Primary</Badge>
                      <Badge variant="accent">Accent</Badge>
                      <Badge variant="secondary">Secondary</Badge>
                      <Badge variant="destructive">Destructive</Badge>
                    </div>
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Outline</Badge>
                      <Badge variant="ghost">Ghost</Badge>
                      <Badge variant="soft-primary">Soft Primary</Badge>
                      <Badge variant="soft-accent">Soft Accent</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm">Status Badges</CardTitle>
                    <CardDescription>Semantic status indicators</CardDescription>
                  </CardHeader>
                  <CardContent compact className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="success">Success</Badge>
                      <Badge variant="warning">Warning</Badge>
                      <Badge variant="error">Error</Badge>
                      <Badge variant="info">Info</Badge>
                    </div>
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="success" dot>Active</Badge>
                      <Badge variant="warning" dot>Pending</Badge>
                      <Badge variant="error" dot>Cancelled</Badge>
                      <Badge variant="info" dot>Scheduled</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="bento" className="md:col-span-2">
                  <CardHeader compact>
                    <CardTitle size="sm">Badge Sizes</CardTitle>
                    <CardDescription>Small to large sizing options</CardDescription>
                  </CardHeader>
                  <CardContent compact>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge size="sm">Small</Badge>
                      <Badge size="default">Default</Badge>
                      <Badge size="lg">Large</Badge>
                      <Badge variant="accent" size="sm">Small Accent</Badge>
                      <Badge variant="accent" size="default">Default Accent</Badge>
                      <Badge variant="accent" size="lg">Large Accent</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Overlays Tab */}
            <TabsContent value="overlays" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Dialogs */}
                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm">Dialogs</CardTitle>
                    <CardDescription>Modal dialogs for focused interactions</CardDescription>
                  </CardHeader>
                  <CardContent compact className="space-y-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>Open Dialog</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Appointment</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to schedule this appointment for John Doe on January 15, 2025?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <FormField label="Notes" description="Optional notes for this appointment">
                            <Textarea placeholder="Add any special instructions..." />
                          </FormField>
                        </div>
                        <DialogFooter>
                          <Button variant="outline">Cancel</Button>
                          <Button>Confirm</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive">Delete Dialog</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Patient Record</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. This will permanently delete the patient record and all associated data.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline">Cancel</Button>
                          <Button variant="destructive">Delete</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>

                {/* Sheets */}
                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm">Sheets</CardTitle>
                    <CardDescription>Slide-out panels for detailed content</CardDescription>
                  </CardHeader>
                  <CardContent compact className="flex flex-wrap gap-2">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline">Right Sheet</Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Patient Details</SheetTitle>
                          <SheetDescription>View and edit patient information</SheetDescription>
                        </SheetHeader>
                        <div className="py-4 space-y-3">
                          <FormField label="Name">
                            <Input defaultValue="John Doe" />
                          </FormField>
                          <FormField label="Email">
                            <Input defaultValue="john@example.com" />
                          </FormField>
                          <FormField label="Phone">
                            <Input defaultValue="(555) 123-4567" />
                          </FormField>
                        </div>
                        <SheetFooter>
                          <Button>Save Changes</Button>
                        </SheetFooter>
                      </SheetContent>
                    </Sheet>

                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline">Bottom Sheet</Button>
                      </SheetTrigger>
                      <SheetContent side="bottom">
                        <SheetHeader>
                          <SheetTitle>Quick Actions</SheetTitle>
                          <SheetDescription>Select an action to perform</SheetDescription>
                        </SheetHeader>
                        <div className="py-4 flex flex-wrap gap-2">
                          <Button variant="soft">Schedule Appointment</Button>
                          <Button variant="soft">Send Reminder</Button>
                          <Button variant="soft">View History</Button>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </CardContent>
                </Card>

                {/* Popovers */}
                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm">Popovers</CardTitle>
                    <CardDescription>Contextual floating content</CardDescription>
                  </CardHeader>
                  <CardContent compact className="flex flex-wrap gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline">Open Popover</Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Patient Info</h4>
                          <p className="text-xs text-muted-foreground">Quick view of patient details and status.</p>
                          <div className="flex items-center gap-2 pt-2">
                            <Badge variant="success" dot>Active</Badge>
                            <span className="text-xs text-muted-foreground">Since Jan 2024</span>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Info className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-60">
                        <p className="text-xs text-muted-foreground">
                          This field requires a valid email address that will be used for appointment reminders.
                        </p>
                      </PopoverContent>
                    </Popover>
                  </CardContent>
                </Card>

                {/* Tooltips */}
                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm">Tooltips</CardTitle>
                    <CardDescription>Brief hints on hover</CardDescription>
                  </CardHeader>
                  <CardContent compact className="flex flex-wrap gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="soft">Hover me</Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This is a tooltip</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="soft" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Settings</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="soft" size="icon">
                          <Bell className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Notifications</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardContent>
                </Card>

                {/* Toasts */}
                <Card variant="bento" className="md:col-span-2">
                  <CardHeader compact>
                    <CardTitle size="sm">Toast Notifications</CardTitle>
                    <CardDescription>Temporary feedback messages</CardDescription>
                  </CardHeader>
                  <CardContent compact className="flex flex-wrap gap-2">
                    <Button
                      variant="soft"
                      onClick={() => toast("Appointment scheduled for January 15, 2025")}
                    >
                      Default Toast
                    </Button>
                    <Button
                      variant="soft"
                      onClick={() => toast.success("Patient record saved successfully")}
                    >
                      Success Toast
                    </Button>
                    <Button
                      variant="soft"
                      onClick={() => toast.error("Failed to send reminder")}
                    >
                      Error Toast
                    </Button>
                    <Button
                      variant="soft"
                      onClick={() => toast.warning("Patient has outstanding balance")}
                    >
                      Warning Toast
                    </Button>
                    <Button
                      variant="soft"
                      onClick={() => toast.info("New message from Dr. Smith")}
                    >
                      Info Toast
                    </Button>
                    <Button
                      variant="soft"
                      onClick={() =>
                        toast("Appointment reminder sent", {
                          description: "Email sent to john@example.com",
                          action: {
                            label: "Undo",
                            onClick: () => toast("Reminder cancelled"),
                          },
                        })
                      }
                    >
                      Toast with Action
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Data Display Tab */}
            <TabsContent value="data" className="space-y-6">
              <Card variant="bento">
                <CardHeader compact>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle size="sm">Patient List</CardTitle>
                      <CardDescription>Compact data table with modern styling</CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="h-3.5 w-3.5" />
                      Add Patient
                    </Button>
                  </div>
                </CardHeader>
                <CardContent compact>
                  <div className="rounded-xl border border-border/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableHead className="text-xs h-8">Patient</TableHead>
                          <TableHead className="text-xs h-8">Email</TableHead>
                          <TableHead className="text-xs h-8">Status</TableHead>
                          <TableHead className="text-xs h-8">Next Appt</TableHead>
                          <TableHead className="text-xs h-8 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { name: "John Doe", initials: "JD", email: "john@example.com", status: "success", statusText: "Active", date: "Jan 15" },
                          { name: "Jane Smith", initials: "JS", email: "jane@example.com", status: "warning", statusText: "Pending", date: "Jan 18" },
                          { name: "Robert Johnson", initials: "RJ", email: "robert@example.com", status: "info", statusText: "Scheduled", date: "Jan 20" },
                        ].map((patient, i) => (
                          <TableRow key={i} className="hover:bg-muted/20">
                            <TableCell className="py-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-[10px] bg-gradient-primary text-white">
                                    {patient.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium">{patient.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 text-xs text-muted-foreground">{patient.email}</TableCell>
                            <TableCell className="py-2">
                              <Badge variant={patient.status as "success" | "warning" | "info"} size="sm" dot>
                                {patient.statusText}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2 text-xs">{patient.date}</TableCell>
                            <TableCell className="py-2 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="text-xs">
                                    <Eye className="mr-2 h-3 w-3" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-xs">
                                    <Edit className="mr-2 h-3 w-3" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-xs text-destructive">
                                    <Trash2 className="mr-2 h-3 w-3" />
                                    Delete
                                  </DropdownMenuItem>
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

              {/* Alerts */}
              <div className="grid gap-3 md:grid-cols-2">
                <Alert className="border-info-200 bg-info-50">
                  <Info className="h-4 w-4 text-info-600" />
                  <AlertTitle className="text-sm text-info-700">Information</AlertTitle>
                  <AlertDescription className="text-xs text-info-600">
                    This is an informational alert.
                  </AlertDescription>
                </Alert>

                <Alert className="border-success-200 bg-success-50">
                  <Check className="h-4 w-4 text-success-600" />
                  <AlertTitle className="text-sm text-success-700">Success</AlertTitle>
                  <AlertDescription className="text-xs text-success-600">
                    Operation completed successfully.
                  </AlertDescription>
                </Alert>

                <Alert className="border-warning-200 bg-warning-50">
                  <AlertTriangle className="h-4 w-4 text-warning-600" />
                  <AlertTitle className="text-sm text-warning-700">Warning</AlertTitle>
                  <AlertDescription className="text-xs text-warning-600">
                    Please review before proceeding.
                  </AlertDescription>
                </Alert>

                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertTitle className="text-sm">Error</AlertTitle>
                  <AlertDescription className="text-xs">
                    Something went wrong.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Loading States */}
              <Card variant="bento">
                <CardHeader compact>
                  <CardTitle size="sm">Loading States</CardTitle>
                  <CardDescription>Skeleton placeholders with shimmer</CardDescription>
                </CardHeader>
                <CardContent compact>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}

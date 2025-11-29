"use client";

import { useState } from "react";
import {
  Home,
  Users,
  Calendar,
  Settings,
  ChevronRight,
  Plus,
  Search,
  X,
  Check,
  AlertTriangle,
  Info,
  Bell,
  Mail,
  Phone,
  MapPin,
  Clock,
  Star,
  Heart,
  Trash2,
  Edit,
  Eye,
  Download,
  Upload,
  Filter,
  MoreHorizontal,
  Menu,
  User,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";

export default function UIShowcasePage() {
  const [switchValue, setSwitchValue] = useState(false);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-primary-600">Orca</h1>
              <span className="text-sm text-muted-foreground">UI Showcase</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="container py-8">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>UI Showcase</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mb-8">
            <h1 className="text-3xl font-bold">UI Component Showcase</h1>
            <p className="mt-2 text-muted-foreground">
              A comprehensive demonstration of all Orca UI components based on
              our design system.
            </p>
          </div>

          <Tabs defaultValue="buttons" className="space-y-8">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="buttons">Buttons</TabsTrigger>
              <TabsTrigger value="forms">Forms</TabsTrigger>
              <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="data">Data Display</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
            </TabsList>

            {/* Buttons Tab */}
            <TabsContent value="buttons" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Button Variants</CardTitle>
                  <CardDescription>
                    Different button styles for various use cases
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="mb-3 text-sm font-medium">Variants</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="default">Primary</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="destructive">Destructive</Button>
                      <Button variant="link">Link</Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="mb-3 text-sm font-medium">Sizes</h4>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button size="sm">Small</Button>
                      <Button size="default">Default</Button>
                      <Button size="lg">Large</Button>
                      <Button size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="mb-3 text-sm font-medium">With Icons</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Patient
                      </Button>
                      <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                      <Button variant="secondary">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                      </Button>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="mb-3 text-sm font-medium">States</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button>Normal</Button>
                      <Button disabled>Disabled</Button>
                      <Button className="pointer-events-none opacity-50">
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Loading...
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Forms Tab */}
            <TabsContent value="forms" className="space-y-8">
              <div className="grid gap-8 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Text Inputs</CardTitle>
                    <CardDescription>
                      Input fields for text entry
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Patient Name</Label>
                      <Input id="name" placeholder="Enter patient name" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="patient@example.com"
                      />
                      <p className="text-sm text-muted-foreground">
                        We&apos;ll never share your email.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (with icon)</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="phone"
                          placeholder="(555) 123-4567"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="error-input">With Error</Label>
                      <Input
                        id="error-input"
                        className="border-destructive focus-visible:ring-destructive"
                        defaultValue="Invalid value"
                      />
                      <p className="text-sm text-destructive">
                        This field is required.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="disabled-input">Disabled</Label>
                      <Input
                        id="disabled-input"
                        disabled
                        placeholder="Disabled input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Enter additional notes..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Selection Controls</CardTitle>
                    <CardDescription>
                      Checkboxes, radios, switches, and selects
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Provider</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dr-smith">Dr. Smith</SelectItem>
                          <SelectItem value="dr-jones">Dr. Jones</SelectItem>
                          <SelectItem value="dr-wilson">Dr. Wilson</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label>Notifications</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="email-notif" defaultChecked />
                          <Label htmlFor="email-notif" className="font-normal">
                            Email notifications
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="sms-notif" />
                          <Label htmlFor="sms-notif" className="font-normal">
                            SMS notifications
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="push-notif" disabled />
                          <Label
                            htmlFor="push-notif"
                            className="font-normal text-muted-foreground"
                          >
                            Push notifications (coming soon)
                          </Label>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label>Appointment Type</Label>
                      <RadioGroup defaultValue="consultation">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="consultation" id="consult" />
                          <Label htmlFor="consult" className="font-normal">
                            Consultation
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="followup" id="followup" />
                          <Label htmlFor="followup" className="font-normal">
                            Follow-up
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="emergency" id="emergency" />
                          <Label htmlFor="emergency" className="font-normal">
                            Emergency
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Toggle dark mode appearance
                        </p>
                      </div>
                      <Switch
                        checked={switchValue}
                        onCheckedChange={setSwitchValue}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Cards Tab */}
            <TabsContent value="cards" className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Card</CardTitle>
                    <CardDescription>
                      A simple card with header and content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      This is a basic card component that can be used to display
                      content in a contained format.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Card with Footer</CardTitle>
                    <CardDescription>
                      Includes action buttons in footer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Cards can include footers with actions like save or cancel
                      buttons.
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save</Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary-100 text-primary-600">
                        JD
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">John Doe</CardTitle>
                      <CardDescription>Patient #12345</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>john.doe@example.com</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>(555) 123-4567</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>123 Main St, City</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      View Profile
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Stats Cards</CardTitle>
                  <CardDescription>
                    Dashboard-style statistics cards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-l-4 border-l-primary-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Total Patients
                            </p>
                            <p className="text-2xl font-bold">1,234</p>
                          </div>
                          <Users className="h-8 w-8 text-primary-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-secondary-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Today&apos;s Appointments
                            </p>
                            <p className="text-2xl font-bold">24</p>
                          </div>
                          <Calendar className="h-8 w-8 text-secondary-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-warning-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Pending Tasks
                            </p>
                            <p className="text-2xl font-bold">12</p>
                          </div>
                          <Clock className="h-8 w-8 text-warning-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-success-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Completed Today
                            </p>
                            <p className="text-2xl font-bold">18</p>
                          </div>
                          <Check className="h-8 w-8 text-success-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Feedback Tab */}
            <TabsContent value="feedback" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Alerts</CardTitle>
                  <CardDescription>
                    Contextual feedback messages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Information</AlertTitle>
                    <AlertDescription>
                      This is an informational alert for general notices.
                    </AlertDescription>
                  </Alert>

                  <Alert className="border-success-600 bg-success-100 text-success-600 [&>svg]:text-success-600">
                    <Check className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>
                      Patient record has been saved successfully.
                    </AlertDescription>
                  </Alert>

                  <Alert className="border-warning-600 bg-warning-100 text-warning-600 [&>svg]:text-warning-600">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                      This patient has an outstanding balance of $250.00.
                    </AlertDescription>
                  </Alert>

                  <Alert variant="destructive">
                    <X className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      Failed to save patient record. Please try again.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dialogs & Overlays</CardTitle>
                  <CardDescription>
                    Modal dialogs and overlays for user interaction
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>Open Dialog</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Action</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to proceed? This action cannot
                          be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button>Confirm</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline">Open Sheet</Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Patient Details</SheetTitle>
                        <SheetDescription>
                          View and edit patient information
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6 space-y-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input defaultValue="John Doe" />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input defaultValue="john@example.com" />
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">Open Popover</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">Quick Info</h4>
                        <p className="text-sm text-muted-foreground">
                          Popovers are perfect for displaying additional
                          information without navigating away.
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline">Hover for Tooltip</Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This is a helpful tooltip</p>
                    </TooltipContent>
                  </Tooltip>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Toast Notifications</CardTitle>
                  <CardDescription>
                    Temporary notifications that appear and auto-dismiss
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                  <Button onClick={() => toast.success("Patient saved successfully!")}>
                    Success Toast
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => toast.error("Failed to save patient")}
                  >
                    Error Toast
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      toast.info("New appointment request received")
                    }
                  >
                    Info Toast
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      toast("Appointment scheduled", {
                        description: "Monday, January 15 at 9:00 AM",
                        action: {
                          label: "Undo",
                          onClick: () => console.log("Undo"),
                        },
                      })
                    }
                  >
                    Toast with Action
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Display Tab */}
            <TabsContent value="data" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Badges</CardTitle>
                  <CardDescription>
                    Status indicators and labels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </div>
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-success-600">Active</Badge>
                    <Badge className="bg-warning-600">Pending</Badge>
                    <Badge className="bg-error-600">Cancelled</Badge>
                    <Badge className="bg-info-600">Scheduled</Badge>
                    <Badge className="bg-secondary-600">In Treatment</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Avatars</CardTitle>
                  <CardDescription>
                    User profile images and fallbacks
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-4">
                  <Avatar>
                    <AvatarImage src="/avatars/01.png" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback className="bg-primary-100 text-primary-600">
                      AB
                    </AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback className="bg-secondary-100 text-secondary-600">
                      CD
                    </AvatarFallback>
                  </Avatar>
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      LG
                    </AvatarFallback>
                  </Avatar>
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-muted text-muted-foreground text-lg">
                      XL
                    </AvatarFallback>
                  </Avatar>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Table</CardTitle>
                  <CardDescription>
                    Tabular data display with actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Next Appointment</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>JD</AvatarFallback>
                            </Avatar>
                            John Doe
                          </div>
                        </TableCell>
                        <TableCell>john@example.com</TableCell>
                        <TableCell>
                          <Badge className="bg-success-600">Active</Badge>
                        </TableCell>
                        <TableCell>Jan 15, 2025</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>JS</AvatarFallback>
                            </Avatar>
                            Jane Smith
                          </div>
                        </TableCell>
                        <TableCell>jane@example.com</TableCell>
                        <TableCell>
                          <Badge className="bg-warning-600">Pending</Badge>
                        </TableCell>
                        <TableCell>Jan 18, 2025</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>RJ</AvatarFallback>
                            </Avatar>
                            Robert Johnson
                          </div>
                        </TableCell>
                        <TableCell>robert@example.com</TableCell>
                        <TableCell>
                          <Badge className="bg-secondary-600">
                            In Treatment
                          </Badge>
                        </TableCell>
                        <TableCell>Jan 20, 2025</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skeleton Loading</CardTitle>
                  <CardDescription>
                    Placeholder content while loading
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                  <Skeleton className="h-[125px] w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Headings</CardTitle>
                  <CardDescription>
                    Typography scale for headings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h1 className="text-4xl font-bold">Heading 1 (text-4xl)</h1>
                  <h2 className="text-3xl font-bold">Heading 2 (text-3xl)</h2>
                  <h3 className="text-2xl font-bold">Heading 3 (text-2xl)</h3>
                  <h4 className="text-xl font-semibold">
                    Heading 4 (text-xl)
                  </h4>
                  <h5 className="text-lg font-semibold">Heading 5 (text-lg)</h5>
                  <h6 className="text-base font-semibold">
                    Heading 6 (text-base)
                  </h6>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Body Text</CardTitle>
                  <CardDescription>
                    Text sizes for body content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-lg">
                    Large text (text-lg) - Use for emphasis or lead paragraphs.
                  </p>
                  <p className="text-base">
                    Base text (text-base) - The default body text size for most
                    content.
                  </p>
                  <p className="text-sm">
                    Small text (text-sm) - Use for secondary information,
                    labels, and captions.
                  </p>
                  <p className="text-xs">
                    Extra small text (text-xs) - Use for fine print and badges.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Text Colors</CardTitle>
                  <CardDescription>
                    Color variations for different contexts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-foreground">
                    Foreground - Primary text color
                  </p>
                  <p className="text-muted-foreground">
                    Muted Foreground - Secondary/helper text
                  </p>
                  <p className="text-primary-600">
                    Primary - Links and emphasis
                  </p>
                  <p className="text-secondary-600">
                    Secondary - Alternative emphasis
                  </p>
                  <p className="text-success-600">
                    Success - Positive feedback
                  </p>
                  <p className="text-warning-600">Warning - Caution messages</p>
                  <p className="text-error-600">Error - Error messages</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Font Weights</CardTitle>
                  <CardDescription>
                    Available font weight variations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-normal">
                    Normal (400) - Regular body text
                  </p>
                  <p className="font-medium">
                    Medium (500) - Labels and emphasis
                  </p>
                  <p className="font-semibold">
                    Semibold (600) - Buttons and subheadings
                  </p>
                  <p className="font-bold">Bold (700) - Headings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Color Palette</CardTitle>
                  <CardDescription>
                    Design system color tokens
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="mb-3 text-sm font-medium">Primary</h4>
                    <div className="flex gap-1">
                      <div className="h-12 w-12 rounded bg-primary-50" title="50" />
                      <div className="h-12 w-12 rounded bg-primary-100" title="100" />
                      <div className="h-12 w-12 rounded bg-primary-200" title="200" />
                      <div className="h-12 w-12 rounded bg-primary-300" title="300" />
                      <div className="h-12 w-12 rounded bg-primary-400" title="400" />
                      <div className="h-12 w-12 rounded bg-primary-500" title="500" />
                      <div className="h-12 w-12 rounded bg-primary-600" title="600" />
                      <div className="h-12 w-12 rounded bg-primary-700" title="700" />
                      <div className="h-12 w-12 rounded bg-primary-800" title="800" />
                      <div className="h-12 w-12 rounded bg-primary-900" title="900" />
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-sm font-medium">Secondary (Teal)</h4>
                    <div className="flex gap-1">
                      <div className="h-12 w-12 rounded bg-secondary-50" title="50" />
                      <div className="h-12 w-12 rounded bg-secondary-100" title="100" />
                      <div className="h-12 w-12 rounded bg-secondary-200" title="200" />
                      <div className="h-12 w-12 rounded bg-secondary-300" title="300" />
                      <div className="h-12 w-12 rounded bg-secondary-400" title="400" />
                      <div className="h-12 w-12 rounded bg-secondary-500" title="500" />
                      <div className="h-12 w-12 rounded bg-secondary-600" title="600" />
                      <div className="h-12 w-12 rounded bg-secondary-700" title="700" />
                      <div className="h-12 w-12 rounded bg-secondary-800" title="800" />
                      <div className="h-12 w-12 rounded bg-secondary-900" title="900" />
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-sm font-medium">Semantic</h4>
                    <div className="flex gap-4">
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          <div className="h-12 w-12 rounded bg-success-100" />
                          <div className="h-12 w-12 rounded bg-success-600" />
                        </div>
                        <p className="text-xs text-center">Success</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          <div className="h-12 w-12 rounded bg-warning-100" />
                          <div className="h-12 w-12 rounded bg-warning-600" />
                        </div>
                        <p className="text-xs text-center">Warning</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          <div className="h-12 w-12 rounded bg-error-100" />
                          <div className="h-12 w-12 rounded bg-error-600" />
                        </div>
                        <p className="text-xs text-center">Error</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          <div className="h-12 w-12 rounded bg-info-100" />
                          <div className="h-12 w-12 rounded bg-info-600" />
                        </div>
                        <p className="text-xs text-center">Info</p>
                      </div>
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

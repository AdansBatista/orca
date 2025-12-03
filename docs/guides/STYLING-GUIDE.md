# Styling Guide

This document defines the design system and UI/UX standards for the Orca project. All user interface development must follow these guidelines for visual consistency and a cohesive user experience.

---

## 1. Design Tokens

### 1.1 Color Palette

#### Primary Colors

The primary color represents trust, professionalism, and modern healthcare with a fresh cyan-teal palette.

| Token         | Hex     | RGB                | Usage                |
| ------------- | ------- | ------------------ | -------------------- |
| `primary-50`  | #ecfeff | rgb(236, 254, 255) | Lightest backgrounds |
| `primary-100` | #cffafe | rgb(207, 250, 254) | Light backgrounds    |
| `primary-200` | #a5f3fc | rgb(165, 243, 252) | Hover states         |
| `primary-300` | #67e8f9 | rgb(103, 232, 249) | Borders              |
| `primary-400` | #22d3ee | rgb(34, 211, 238)  | Icons                |
| `primary-500` | #06b6d4 | rgb(6, 182, 212)   | Light variant        |
| `primary-600` | #0891b2 | rgb(8, 145, 178)   | **Default primary**  |
| `primary-700` | #0e7490 | rgb(14, 116, 144)  | Hover/Active         |
| `primary-800` | #155e75 | rgb(21, 94, 117)   | Dark variant         |
| `primary-900` | #164e63 | rgb(22, 78, 99)    | Darkest              |
| `primary-950` | #083344 | rgb(8, 51, 68)     | Deepest              |

#### Secondary Colors

The secondary color provides a calming healthcare aesthetic.

| Token           | Hex     | RGB                | Usage                 |
| --------------- | ------- | ------------------ | --------------------- |
| `secondary-50`  | #F0FDFA | rgb(240, 253, 250) | Lightest backgrounds  |
| `secondary-100` | #CCFBF1 | rgb(204, 251, 241) | Light backgrounds     |
| `secondary-200` | #99F6E4 | rgb(153, 246, 228) | Hover states          |
| `secondary-300` | #5EEAD4 | rgb(94, 234, 212)  | Borders               |
| `secondary-400` | #2DD4BF | rgb(45, 212, 191)  | Icons                 |
| `secondary-500` | #14B8A6 | rgb(20, 184, 166)  | Light variant         |
| `secondary-600` | #0D9488 | rgb(13, 148, 136)  | **Default secondary** |
| `secondary-700` | #0F766E | rgb(15, 118, 110)  | Hover/Active          |
| `secondary-800` | #115E59 | rgb(17, 94, 89)    | Dark variant          |
| `secondary-900` | #134E4A | rgb(19, 78, 74)    | Darkest               |

#### Semantic Colors

| Purpose           | Token         | Hex     | Usage                           |
| ----------------- | ------------- | ------- | ------------------------------- |
| **Success**       | `success-600` | #16A34A | Confirmations, completed status |
| **Success Light** | `success-100` | #DCFCE7 | Success backgrounds             |
| **Warning**       | `warning-600` | #CA8A04 | Caution, pending actions        |
| **Warning Light** | `warning-100` | #FEF9C3 | Warning backgrounds             |
| **Error**         | `error-600`   | #DC2626 | Errors, destructive actions     |
| **Error Light**   | `error-100`   | #FEE2E2 | Error backgrounds               |
| **Info**          | `info-600`    | #2563EB | Information, hints              |
| **Info Light**    | `info-100`    | #DBEAFE | Info backgrounds                |

#### Neutral Colors

| Token      | Hex     | Usage                                |
| ---------- | ------- | ------------------------------------ |
| `gray-50`  | #F9FAFB | Page backgrounds                     |
| `gray-100` | #F3F4F6 | Subtle backgrounds, alternating rows |
| `gray-200` | #E5E7EB | Borders, dividers                    |
| `gray-300` | #D1D5DB | Disabled states, muted borders       |
| `gray-400` | #9CA3AF | Placeholder text, disabled text      |
| `gray-500` | #6B7280 | Secondary text, icons                |
| `gray-600` | #4B5563 | Body text                            |
| `gray-700` | #374151 | Headings, emphasis                   |
| `gray-800` | #1F2937 | Dark text, high contrast             |
| `gray-900` | #111827 | Darkest text                         |
| `white`    | #FFFFFF | Backgrounds, cards                   |
| `black`    | #000000 | Rarely used directly                 |

### 1.2 Typography

#### Font Families

```css
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", "Consolas", monospace;
```

#### Font Sizes

| Token       | Size            | Line Height    | Usage                  |
| ----------- | --------------- | -------------- | ---------------------- |
| `text-xs`   | 0.75rem (12px)  | 1rem (16px)    | Captions, badges       |
| `text-sm`   | 0.875rem (14px) | 1.25rem (20px) | Secondary text, labels |
| `text-base` | 1rem (16px)     | 1.5rem (24px)  | Body text              |
| `text-lg`   | 1.125rem (18px) | 1.75rem (28px) | Large body text        |
| `text-xl`   | 1.25rem (20px)  | 1.75rem (28px) | Subheadings            |
| `text-2xl`  | 1.5rem (24px)   | 2rem (32px)    | Section headings       |
| `text-3xl`  | 1.875rem (30px) | 2.25rem (36px) | Page headings          |
| `text-4xl`  | 2.25rem (36px)  | 2.5rem (40px)  | Large headings         |

#### Font Weights

| Token           | Weight | Usage                |
| --------------- | ------ | -------------------- |
| `font-normal`   | 400    | Body text            |
| `font-medium`   | 500    | Labels, emphasis     |
| `font-semibold` | 600    | Buttons, subheadings |
| `font-bold`     | 700    | Headings             |

#### Text Colors

| Token                   | Color       | Usage           |
| ----------------------- | ----------- | --------------- |
| `text-foreground`       | gray-900    | Primary text    |
| `text-muted-foreground` | gray-500    | Secondary text  |
| `text-primary`          | primary-600 | Links, emphasis |
| `text-destructive`      | error-600   | Error messages  |

### 1.3 Spacing Scale

Based on 4px base unit (Tailwind default).

| Token       | Value    | Pixels |
| ----------- | -------- | ------ |
| `space-0`   | 0        | 0px    |
| `space-0.5` | 0.125rem | 2px    |
| `space-1`   | 0.25rem  | 4px    |
| `space-1.5` | 0.375rem | 6px    |
| `space-2`   | 0.5rem   | 8px    |
| `space-2.5` | 0.625rem | 10px   |
| `space-3`   | 0.75rem  | 12px   |
| `space-3.5` | 0.875rem | 14px   |
| `space-4`   | 1rem     | 16px   |
| `space-5`   | 1.25rem  | 20px   |
| `space-6`   | 1.5rem   | 24px   |
| `space-7`   | 1.75rem  | 28px   |
| `space-8`   | 2rem     | 32px   |
| `space-9`   | 2.25rem  | 36px   |
| `space-10`  | 2.5rem   | 40px   |
| `space-12`  | 3rem     | 48px   |
| `space-14`  | 3.5rem   | 56px   |
| `space-16`  | 4rem     | 64px   |
| `space-20`  | 5rem     | 80px   |
| `space-24`  | 6rem     | 96px   |

### 1.4 Border Radius

| Token          | Value          | Usage            |
| -------------- | -------------- | ---------------- |
| `rounded-none` | 0              | No rounding      |
| `rounded-sm`   | 0.125rem (2px) | Subtle rounding  |
| `rounded`      | 0.25rem (4px)  | Default rounding |
| `rounded-md`   | 0.375rem (6px) | Buttons, inputs  |
| `rounded-lg`   | 0.5rem (8px)   | Cards, modals    |
| `rounded-xl`   | 0.75rem (12px) | Large cards      |
| `rounded-2xl`  | 1rem (16px)    | Feature cards    |
| `rounded-full` | 9999px         | Pills, avatars   |

### 1.5 Shadows

| Token       | Value                                                     | Usage              |
| ----------- | --------------------------------------------------------- | ------------------ |
| `shadow-sm` | 0 1px 2px rgba(0,0,0,0.05)                                | Subtle elevation   |
| `shadow`    | 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)     | Default cards      |
| `shadow-md` | 0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)     | Elevated cards     |
| `shadow-lg` | 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)   | Modals, dropdowns  |
| `shadow-xl` | 0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04) | Prominent elements |

### 1.6 Z-Index Scale

| Token     | Value | Usage                 |
| --------- | ----- | --------------------- |
| `z-0`     | 0     | Base                  |
| `z-10`    | 10    | Dropdowns             |
| `z-20`    | 20    | Sticky elements       |
| `z-30`    | 30    | Fixed elements        |
| `z-40`    | 40    | Modals                |
| `z-50`    | 50    | Toasts, notifications |
| `z-[100]` | 100   | Critical overlays     |

---

## 2. Component Patterns

### 2.1 Buttons

#### Variants

```tsx
// Primary - Main actions
<Button variant="default">Save Patient</Button>

// Secondary - Secondary actions
<Button variant="secondary">Cancel</Button>

// Outline - Tertiary actions
<Button variant="outline">View Details</Button>

// Ghost - Subtle actions
<Button variant="ghost">More Options</Button>

// Destructive - Dangerous actions
<Button variant="destructive">Delete</Button>

// Link - Text-like buttons
<Button variant="link">Learn More</Button>
```

#### Sizes

```tsx
<Button size="sm">Small</Button>    // h-8 px-3 text-sm
<Button size="default">Default</Button>  // h-10 px-4 text-sm
<Button size="lg">Large</Button>    // h-12 px-6 text-base
<Button size="icon">             // h-10 w-10 (square)
  <IconPlus />
</Button>
```

#### States

| State    | Style                          |
| -------- | ------------------------------ |
| Default  | Normal colors                  |
| Hover    | Darker shade (700 for primary) |
| Active   | Even darker (800 for primary)  |
| Disabled | 50% opacity, no pointer events |
| Loading  | Spinner icon, disabled state   |

#### Button Guidelines

- Use **Primary** for the main action on a page (1 per section)
- Use **Secondary** for supporting actions
- Use **Destructive** for delete/remove actions (always confirm)
- Include loading state for async operations
- Icons should be 16px (sm) or 20px (default/lg)

### 2.2 Forms

#### Input Fields

```tsx
// Text Input
<Input
  type="text"
  placeholder="Enter patient name"
  className="w-full"
/>

// With Label
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="patient@example.com" />
</div>

// With Error
<div className="space-y-2">
  <Label htmlFor="phone">Phone</Label>
  <Input id="phone" className="border-error-600" />
  <p className="text-sm text-error-600">Please enter a valid phone number</p>
</div>

// With Helper Text
<div className="space-y-2">
  <Label htmlFor="dob">Date of Birth</Label>
  <Input id="dob" type="date" />
  <p className="text-sm text-muted-foreground">Format: YYYY-MM-DD</p>
</div>
```

#### Select

```tsx
<Select>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Select provider" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="dr-smith">Dr. Smith</SelectItem>
    <SelectItem value="dr-jones">Dr. Jones</SelectItem>
  </SelectContent>
</Select>
```

#### Checkbox & Radio

```tsx
// Checkbox
<div className="flex items-center space-x-2">
  <Checkbox id="consent" />
  <Label htmlFor="consent">I agree to the terms</Label>
</div>

// Radio Group
<RadioGroup defaultValue="option-1">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-1" id="option-1" />
    <Label htmlFor="option-1">Option 1</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-2" id="option-2" />
    <Label htmlFor="option-2">Option 2</Label>
  </div>
</RadioGroup>
```

#### Form Layout Guidelines

- Labels above inputs (not inline except checkboxes)
- Required fields marked with asterisk (\*)
- Error messages below input, in red
- Group related fields together
- Use 24px (space-6) gap between form groups
- Full-width inputs on mobile, max-width on desktop

### 2.3 Cards & Containers

#### Basic Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Patient Information</CardTitle>
    <CardDescription>View and edit patient details</CardDescription>
  </CardHeader>
  <CardContent>{/* Content */}</CardContent>
  <CardFooter className="flex justify-end gap-2">
    <Button variant="outline">Cancel</Button>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

#### Card Variants

| Variant  | Usage              | Style                           |
| -------- | ------------------ | ------------------------------- |
| Default  | General content    | White bg, shadow-sm, rounded-lg |
| Elevated | Featured content   | White bg, shadow-md             |
| Outlined | Lists, grids       | White bg, border, no shadow     |
| Muted    | Background content | Gray-50 bg, no shadow           |

### 2.4 Modals & Dialogs

#### Simple Dialog (confirmations, short forms)

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>This action cannot be undone.</DialogDescription>
    </DialogHeader>
    <div className="px-6 py-4">{/* Dialog content */}</div>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Scrollable Dialog (long forms, complex content)

For dialogs with tall content, use `DialogBody` to create a scrollable middle section with sticky header and footer:

```tsx
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle } from '@/components/ui/dialog';

<Dialog>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Edit Settings</DialogTitle>
      <DialogDescription>Configure your preferences below.</DialogDescription>
    </DialogHeader>
    <DialogBody>
      {/* This content will scroll if it exceeds viewport */}
      <form className="space-y-6">
        {/* Form fields... */}
      </form>
    </DialogBody>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Save Changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Dialog Structure

| Component       | Purpose                                  | Behavior                        |
| --------------- | ---------------------------------------- | ------------------------------- |
| `DialogHeader`  | Title & description                      | Sticky at top, has border       |
| `DialogBody`    | Main content (forms, lists, etc.)        | Scrollable, flex-1              |
| `DialogFooter`  | Action buttons                           | Sticky at bottom, has border    |

#### Modal Sizes

| Size    | Max Width | Usage                       |
| ------- | --------- | --------------------------- |
| Small   | 425px     | Confirmations, simple forms |
| Default | 525px     | Standard forms              |
| Large   | 700px     | Complex forms, details      |
| Full    | 90vw      | Data tables, viewers        |

#### Modal Guidelines

- Always include a close button
- Trap focus within modal
- Close on Escape key
- Close on backdrop click (unless dangerous action)
- Stack buttons right-aligned: Cancel, then Primary Action
- **Height constraint**: Dialogs are constrained to `max-h-[90vh]`
- **For tall content**: Use `DialogBody` wrapper - header stays sticky at top, footer stays sticky at bottom, body scrolls
- **For simple content**: Content can be placed directly between header and footer with `px-6 py-4` classes

### 2.5 Tables & Data Display

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-[200px]">Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {patients.map((patient) => (
      <TableRow key={patient.id}>
        <TableCell className="font-medium">{patient.name}</TableCell>
        <TableCell>{patient.email}</TableCell>
        <TableCell>
          <Badge
            variant={patient.status === "active" ? "default" : "secondary"}
          >
            {patient.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### Table Guidelines

- Use alternating row colors for readability (gray-50)
- Align numbers and dates to the right
- Include sortable column headers where appropriate
- Show loading skeleton while fetching data
- Empty state with helpful message
- Pagination for large datasets

### 2.6 Navigation

#### Sidebar Navigation

```tsx
<nav className="flex flex-col space-y-1">
  <NavLink href="/dashboard" icon={<HomeIcon />}>
    Dashboard
  </NavLink>
  <NavLink href="/patients" icon={<UsersIcon />}>
    Patients
  </NavLink>
  <NavLink href="/appointments" icon={<CalendarIcon />}>
    Appointments
  </NavLink>
</nav>
```

#### Breadcrumbs

```tsx
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/patients">Patients</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>John Doe</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

### 2.7 Alerts & Notifications

#### Alert Component

```tsx
// Info
<Alert>
  <InfoIcon className="h-4 w-4" />
  <AlertTitle>Information</AlertTitle>
  <AlertDescription>This is an informational message.</AlertDescription>
</Alert>

// Success
<Alert variant="success">
  <CheckIcon className="h-4 w-4" />
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>Patient record saved successfully.</AlertDescription>
</Alert>

// Warning
<Alert variant="warning">
  <AlertTriangleIcon className="h-4 w-4" />
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>This patient has outstanding balance.</AlertDescription>
</Alert>

// Destructive
<Alert variant="destructive">
  <XCircleIcon className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Failed to save patient record.</AlertDescription>
</Alert>
```

#### Toast Notifications

```tsx
// Success toast
toast.success("Patient saved successfully");

// Error toast
toast.error("Failed to save patient");

// With action
toast("Appointment scheduled", {
  action: {
    label: "Undo",
    onClick: () => undoAction(),
  },
});
```

#### Notification Guidelines

- Toasts: Transient feedback (auto-dismiss 5s)
- Alerts: Persistent information on page
- Use appropriate severity level
- Include actionable information when possible
- Position toasts in top-right corner

### 2.8 Additional Components

#### Sheet (Slide-out Panel)

```tsx
// Right-side sheet
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Open Filters</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Filter Patients</SheetTitle>
      <SheetDescription>
        Refine your patient list with filters
      </SheetDescription>
    </SheetHeader>
    <div className="py-4 space-y-4">
      {/* Filter controls */}
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select>
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <SheetFooter>
      <Button variant="outline">Reset</Button>
      <Button>Apply Filters</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>

// Left-side sheet (mobile menu)
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon">
      <Menu className="h-5 w-5" />
    </Button>
  </SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Navigation</SheetTitle>
    </SheetHeader>
    <nav className="flex flex-col space-y-2 mt-4">
      {/* Navigation items */}
    </nav>
  </SheetContent>
</Sheet>
```

#### Tabs

```tsx
// Standard tabs
<Tabs defaultValue="overview" className="w-full">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
    <TabsTrigger value="documents">Documents</TabsTrigger>
    <TabsTrigger value="billing">Billing</TabsTrigger>
  </TabsList>
  <TabsContent value="overview" className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle>Patient Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Overview content */}
      </CardContent>
    </Card>
  </TabsContent>
  <TabsContent value="history">
    {/* History content */}
  </TabsContent>
  <TabsContent value="documents">
    {/* Documents content */}
  </TabsContent>
  <TabsContent value="billing">
    {/* Billing content */}
  </TabsContent>
</Tabs>

// Vertical tabs (for settings)
<Tabs defaultValue="general" orientation="vertical" className="flex gap-4">
  <TabsList className="flex-col h-auto">
    <TabsTrigger value="general" className="w-full justify-start">
      General
    </TabsTrigger>
    <TabsTrigger value="security" className="w-full justify-start">
      Security
    </TabsTrigger>
    <TabsTrigger value="notifications" className="w-full justify-start">
      Notifications
    </TabsTrigger>
  </TabsList>
  <div className="flex-1">
    <TabsContent value="general">{/* General settings */}</TabsContent>
    <TabsContent value="security">{/* Security settings */}</TabsContent>
    <TabsContent value="notifications">{/* Notification settings */}</TabsContent>
  </div>
</Tabs>
```

#### Tooltip

```tsx
// Basic tooltip
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon">
      <Info className="h-4 w-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    <p>Additional information about this field</p>
  </TooltipContent>
</Tooltip>

// Tooltip with icon and text
<Tooltip>
  <TooltipTrigger asChild>
    <span className="inline-flex items-center gap-1 cursor-help">
      HIPAA Compliant
      <HelpCircle className="h-3 w-3 text-muted-foreground" />
    </span>
  </TooltipTrigger>
  <TooltipContent className="max-w-xs">
    <p>This feature meets all HIPAA security and privacy requirements</p>
  </TooltipContent>
</Tooltip>

// Tooltip with custom side
<Tooltip>
  <TooltipTrigger asChild>
    <Button>Hover me</Button>
  </TooltipTrigger>
  <TooltipContent side="right">
    <p>Tooltip appears on the right</p>
  </TooltipContent>
</Tooltip>
```

#### Popover

```tsx
// Date picker popover
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" className="w-full justify-start">
      <Calendar className="mr-2 h-4 w-4" />
      {date ? format(date, 'PPP') : 'Pick a date'}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0" align="start">
    <CalendarComponent
      mode="single"
      selected={date}
      onSelect={setDate}
    />
  </PopoverContent>
</Popover>

// Filter popover
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">
      <Filter className="mr-2 h-4 w-4" />
      Filters
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-80">
    <div className="space-y-4">
      <h4 className="font-medium">Filter Options</h4>
      <div className="space-y-2">
        <Label htmlFor="status-filter">Status</Label>
        <Select>
          <SelectTrigger id="status-filter">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm">Reset</Button>
        <Button size="sm">Apply</Button>
      </div>
    </div>
  </PopoverContent>
</Popover>
```

#### Dropdown Menu

```tsx
// Action menu
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuItem>
      <Edit className="mr-2 h-4 w-4" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem>
      <Copy className="mr-2 h-4 w-4" />
      Duplicate
    </DropdownMenuItem>
    <DropdownMenuItem>
      <Share className="mr-2 h-4 w-4" />
      Share
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">
      <Trash className="mr-2 h-4 w-4" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// User menu with sections
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
      <Avatar>
        <AvatarImage src="/avatar.jpg" alt="User" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-56" align="end">
    <DropdownMenuLabel>
      <div className="flex flex-col space-y-1">
        <p className="text-sm font-medium">Dr. John Doe</p>
        <p className="text-xs text-muted-foreground">john@example.com</p>
      </div>
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuItem>
        <User className="mr-2 h-4 w-4" />
        Profile
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Settings className="mr-2 h-4 w-4" />
        Settings
      </DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      <LogOut className="mr-2 h-4 w-4" />
      Log out
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// With checkboxes
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">View Options</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Show Columns</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuCheckboxItem checked={showName} onCheckedChange={setShowName}>
      Name
    </DropdownMenuCheckboxItem>
    <DropdownMenuCheckboxItem checked={showEmail} onCheckedChange={setShowEmail}>
      Email
    </DropdownMenuCheckboxItem>
    <DropdownMenuCheckboxItem checked={showPhone} onCheckedChange={setShowPhone}>
      Phone
    </DropdownMenuCheckboxItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### Badge

```tsx
// Status badges
<Badge variant="default">Active</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="outline">Draft</Badge>
<Badge variant="destructive">Cancelled</Badge>

// Custom semantic badges
<Badge className="bg-success-100 text-success-700 hover:bg-success-200">
  Completed
</Badge>
<Badge className="bg-warning-100 text-warning-700 hover:bg-warning-200">
  Overdue
</Badge>
<Badge className="bg-info-100 text-info-700 hover:bg-info-200">
  Scheduled
</Badge>

// With icon
<Badge>
  <CheckCircle className="mr-1 h-3 w-3" />
  Verified
</Badge>
<Badge variant="destructive">
  <AlertCircle className="mr-1 h-3 w-3" />
  Alert
</Badge>

// Sizes
<Badge className="text-xs px-2 py-0.5">Small</Badge>
<Badge>Default</Badge>
<Badge className="text-sm px-3 py-1">Large</Badge>

// Pill badges (for counts)
<Button variant="ghost" className="relative">
  Notifications
  <Badge className="ml-2 rounded-full px-2 py-0.5 text-xs">3</Badge>
</Button>
```

#### Avatar

```tsx
// Basic avatar with image
<Avatar>
  <AvatarImage src="/patient-photo.jpg" alt="Patient Name" />
  <AvatarFallback>PN</AvatarFallback>
</Avatar>

// Sizes
<Avatar className="h-6 w-6 text-xs">  {/* Extra Small */}
  <AvatarImage src="/photo.jpg" alt="User" />
  <AvatarFallback>XS</AvatarFallback>
</Avatar>
<Avatar className="h-8 w-8 text-sm">  {/* Small */}
  <AvatarImage src="/photo.jpg" alt="User" />
  <AvatarFallback>SM</AvatarFallback>
</Avatar>
<Avatar className="h-10 w-10">  {/* Default */}
  <AvatarImage src="/photo.jpg" alt="User" />
  <AvatarFallback>MD</AvatarFallback>
</Avatar>
<Avatar className="h-12 w-12">  {/* Large */}
  <AvatarImage src="/photo.jpg" alt="User" />
  <AvatarFallback>LG</AvatarFallback>
</Avatar>
<Avatar className="h-16 w-16 text-lg">  {/* Extra Large */}
  <AvatarImage src="/photo.jpg" alt="User" />
  <AvatarFallback>XL</AvatarFallback>
</Avatar>

// Avatar group (stacked)
<div className="flex -space-x-2">
  <Avatar className="border-2 border-white">
    <AvatarImage src="/user1.jpg" alt="User 1" />
    <AvatarFallback>U1</AvatarFallback>
  </Avatar>
  <Avatar className="border-2 border-white">
    <AvatarImage src="/user2.jpg" alt="User 2" />
    <AvatarFallback>U2</AvatarFallback>
  </Avatar>
  <Avatar className="border-2 border-white">
    <AvatarImage src="/user3.jpg" alt="User 3" />
    <AvatarFallback>U3</AvatarFallback>
  </Avatar>
  <Avatar className="border-2 border-white bg-gray-200">
    <AvatarFallback>+5</AvatarFallback>
  </Avatar>
</div>

// With status indicator
<div className="relative inline-block">
  <Avatar>
    <AvatarImage src="/user.jpg" alt="User" />
    <AvatarFallback>JD</AvatarFallback>
  </Avatar>
  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success-600 border-2 border-white" />
</div>
```

#### Skeleton

```tsx
// Text skeleton
<div className="space-y-2">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-5/6" />
  <Skeleton className="h-4 w-4/6" />
</div>

// Avatar with text
<div className="flex items-center space-x-4">
  <Skeleton className="h-12 w-12 rounded-full" />
  <div className="space-y-2 flex-1">
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-3 w-1/3" />
  </div>
</div>

// Card skeleton
<Card>
  <CardHeader>
    <Skeleton className="h-6 w-48" />
    <Skeleton className="h-4 w-32 mt-2" />
  </CardHeader>
  <CardContent className="space-y-3">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-20 w-full mt-4" />
  </CardContent>
  <CardFooter className="flex justify-end gap-2">
    <Skeleton className="h-10 w-20" />
    <Skeleton className="h-10 w-24" />
  </CardFooter>
</Card>

// Table skeleton
<Table>
  <TableHeader>
    <TableRow>
      <TableHead><Skeleton className="h-4 w-24" /></TableHead>
      <TableHead><Skeleton className="h-4 w-32" /></TableHead>
      <TableHead><Skeleton className="h-4 w-20" /></TableHead>
      <TableHead><Skeleton className="h-4 w-16" /></TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {[...Array(5)].map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### 2.9 Loading States

Loading states provide visual feedback during asynchronous operations. Use skeleton loaders to maintain layout stability and improve perceived performance.

#### Loading State Patterns

```tsx
// Page loading
function PatientListPage() {
  const { data: patients, isLoading } = usePatients();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return <PatientList patients={patients} />;
}

// Inline loading (button)
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? "Saving..." : "Save Patient"}
</Button>;

// Spinner overlay
{
  isLoading && (
    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
    </div>
  );
}
```

#### Skeleton Component Patterns

```tsx
// Patient card skeleton
function PatientCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-32" />
      </CardFooter>
    </Card>
  );
}

// Dashboard stats skeleton
function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

// Form skeleton
function FormSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
```

#### Progressive Loading

```tsx
// Load critical content first, then secondary content
function PatientProfile({ patientId }: { patientId: string }) {
  const { data: patient, isLoading: patientLoading } = usePatient(patientId);
  const { data: appointments, isLoading: appointmentsLoading } =
    useAppointments(patientId);

  return (
    <div className="space-y-6">
      {/* Critical content */}
      {patientLoading ? (
        <PatientCardSkeleton />
      ) : (
        <PatientCard patient={patient} />
      )}

      {/* Secondary content */}
      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {appointmentsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <AppointmentList appointments={appointments} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

#### Loading State Guidelines

- **Match layout**: Skeleton should match the final content's layout
- **Realistic timing**: Show skeletons for operations taking >300ms
- **Progressive disclosure**: Load critical content first
- **Avoid spinners alone**: Use skeletons for better UX
- **Maintain interactivity**: Don't block the entire page unless necessary
- **Animate subtly**: Use pulse animation for skeletons

```tsx
// Skeleton with pulse animation (default in shadcn)
<Skeleton className="h-4 w-full" /> // Already includes pulse

// Custom skeleton animation
<div className="animate-pulse bg-gray-200 h-4 w-full rounded" />
```

### 2.10 Error States

Error states provide clear feedback when something goes wrong and guide users toward resolution.

#### Empty States

```tsx
// No results found
function EmptyPatientList() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="rounded-full bg-gray-100 p-4 mb-4">
        <Users className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No patients found</h3>
      <p className="text-muted-foreground text-center mb-6 max-w-sm">
        Get started by adding your first patient to the system
      </p>
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Add Patient
      </Button>
    </div>
  );
}

// No search results
function NoSearchResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="rounded-full bg-gray-100 p-4 mb-4">
        <Search className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No results for "{query}"</h3>
      <p className="text-muted-foreground text-center mb-6 max-w-sm">
        Try adjusting your search or filter to find what you're looking for
      </p>
      <Button variant="outline" onClick={() => clearSearch()}>
        Clear Search
      </Button>
    </div>
  );
}

// Empty state with illustration
function EmptyAppointments() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-primary-50 p-6 mb-4">
          <Calendar className="h-16 w-16 text-primary-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">
          No appointments scheduled
        </h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          Schedule your first appointment to get started with patient care
        </p>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            View Guidelines
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Appointment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Error Messages

```tsx
// Inline error
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Failed to save patient record. Please try again.
  </AlertDescription>
</Alert>

// Error with retry action
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Connection Error</AlertTitle>
  <AlertDescription className="flex items-center justify-between">
    <span>Unable to connect to the server.</span>
    <Button variant="outline" size="sm" onClick={retry}>
      Retry
    </Button>
  </AlertDescription>
</Alert>

// Network error state
function NetworkError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <WifiOff className="h-12 w-12 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Connection Lost</h3>
      <p className="text-muted-foreground text-center mb-6 max-w-sm">
        Please check your internet connection and try again
      </p>
      <Button onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Retry Connection
      </Button>
    </div>
  );
}
```

#### Error Boundaries

```tsx
// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            We're sorry for the inconvenience. Please refresh the page or
            contact support if the problem persists.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
            <Button onClick={() => (window.location.href = "/")}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <PatientProfile patientId={id} />
</ErrorBoundary>;
```

#### 404 / 403 Pages

```tsx
// 404 Not Found
function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-9xl font-bold text-primary-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
      <p className="text-muted-foreground text-center mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
        <Button onClick={() => (window.location.href = "/")}>
          <Home className="mr-2 h-4 w-4" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

// 403 Forbidden
function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="rounded-full bg-warning-100 p-6 mb-4">
        <ShieldAlert className="h-16 w-16 text-warning-600" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
      <p className="text-muted-foreground text-center mb-8 max-w-md">
        You don't have permission to access this page. Contact your
        administrator if you believe this is an error.
      </p>
      <Button onClick={() => (window.location.href = "/")}>
        <Home className="mr-2 h-4 w-4" />
        Go to Dashboard
      </Button>
    </div>
  );
}
```

#### Error State Guidelines

- **Be specific**: Explain what went wrong and why
- **Provide actions**: Always offer a way forward (retry, go back, contact support)
- **Use appropriate tone**: Empathetic and helpful, not technical jargon
- **Visual hierarchy**: Icon → Title → Description → Actions
- **Consistent styling**: Use semantic colors (destructive for errors, warning for caution)

### 2.11 Search Patterns

Search patterns help users quickly find information within the application.

#### Search Input

```tsx
// Basic search
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input
    type="search"
    placeholder="Search patients..."
    className="pl-10"
    value={query}
    onChange={(e) => setQuery(e.target.value)}
  />
</div>

// Search with clear button
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input
    type="search"
    placeholder="Search patients..."
    className="pl-10 pr-10"
    value={query}
    onChange={(e) => setQuery(e.target.value)}
  />
  {query && (
    <Button
      variant="ghost"
      size="icon"
      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
      onClick={() => setQuery('')}
    >
      <X className="h-4 w-4" />
    </Button>
  )}
</div>
```

#### Search with Autocomplete

```tsx
<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild>
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search patients..."
        className="pl-10"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
    </div>
  </PopoverTrigger>
  <PopoverContent className="w-[400px] p-0" align="start">
    {isLoading ? (
      <div className="p-4">
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    ) : results.length > 0 ? (
      <div className="max-h-[300px] overflow-y-auto">
        {results.map((patient) => (
          <button
            key={patient.id}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left"
            onClick={() => selectPatient(patient)}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={patient.photo} alt={patient.name} />
              <AvatarFallback>{patient.initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{patient.name}</p>
              <p className="text-sm text-muted-foreground truncate">
                {patient.email}
              </p>
            </div>
          </button>
        ))}
      </div>
    ) : (
      <div className="p-8 text-center text-muted-foreground">
        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No patients found</p>
      </div>
    )}
  </PopoverContent>
</Popover>
```

#### Filter Chips

```tsx
// Active filters display
<div className="flex items-center gap-2 flex-wrap">
  <span className="text-sm text-muted-foreground">Filters:</span>
  {filters.map((filter) => (
    <Badge key={filter.id} variant="secondary" className="gap-1">
      {filter.label}
      <button
        onClick={() => removeFilter(filter.id)}
        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  ))}
  {filters.length > 0 && (
    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
      Clear all
    </Button>
  )}
</div>
```

#### Advanced Search Modal

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">
      <SlidersHorizontal className="mr-2 h-4 w-4" />
      Advanced Search
    </Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[600px]">
    <DialogHeader>
      <DialogTitle>Advanced Patient Search</DialogTitle>
      <DialogDescription>
        Use multiple criteria to find specific patients
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Patient Name</Label>
          <Input id="name" placeholder="John Doe" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="id">Patient ID</Label>
          <Input id="id" placeholder="P-12345" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select>
            <SelectTrigger id="status">
              <SelectValue placeholder="Any status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <Select>
            <SelectTrigger id="provider">
              <SelectValue placeholder="Any provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dr-smith">Dr. Smith</SelectItem>
              <SelectItem value="dr-jones">Dr. Jones</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Date Range</Label>
        <div className="flex gap-2">
          <Input type="date" placeholder="From" />
          <Input type="date" placeholder="To" />
        </div>
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline">Reset</Button>
      <Button>Search</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Search Result Highlighting

```tsx
// Highlight matching text
function highlightText(text: string, query: string) {
  if (!query) return text;

  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 font-medium">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

// Usage in search results
<div className="space-y-2">
  {results.map((patient) => (
    <div key={patient.id} className="p-3 hover:bg-gray-50 rounded-lg">
      <p className="font-medium">{highlightText(patient.name, query)}</p>
      <p className="text-sm text-muted-foreground">
        {highlightText(patient.email, query)}
      </p>
    </div>
  ))}
</div>;
```

#### Recent Searches

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Input placeholder="Search..." onFocus={() => setShowRecent(true)} />
  </PopoverTrigger>
  <PopoverContent className="w-[300px] p-0" align="start">
    {recentSearches.length > 0 ? (
      <div>
        <div className="px-3 py-2 border-b">
          <p className="text-sm font-medium">Recent Searches</p>
        </div>
        <div className="max-h-[200px] overflow-y-auto">
          {recentSearches.map((search, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
              onClick={() => setQuery(search)}
            >
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{search}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeRecentSearch(search);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </button>
          ))}
        </div>
        <div className="px-3 py-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={clearRecentSearches}
          >
            Clear recent searches
          </Button>
        </div>
      </div>
    ) : (
      <div className="p-8 text-center text-muted-foreground">
        <p className="text-sm">No recent searches</p>
      </div>
    )}
  </PopoverContent>
</Popover>
```

### 2.12 Date/Time Picker Patterns

Date and time pickers are essential for appointment scheduling and record management.

#### Calendar Picker

```tsx
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

// Single date picker
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" className="w-full justify-start text-left">
      <Calendar className="mr-2 h-4 w-4" />
      {date ? format(date, 'PPP') : 'Pick a date'}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0" align="start">
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      initialFocus
    />
  </PopoverContent>
</Popover>

// Date range picker
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" className="w-full justify-start text-left">
      <Calendar className="mr-2 h-4 w-4" />
      {dateRange?.from ? (
        dateRange.to ? (
          <>
            {format(dateRange.from, 'LLL dd, y')} -{' '}
            {format(dateRange.to, 'LLL dd, y')}
          </>
        ) : (
          format(dateRange.from, 'LLL dd, y')
        )
      ) : (
        'Pick a date range'
      )}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0" align="start">
    <Calendar
      mode="range"
      selected={dateRange}
      onSelect={setDateRange}
      numberOfMonths={2}
      initialFocus
    />
  </PopoverContent>
</Popover>
```

#### Time Slot Selection

```tsx
// Time slot picker for appointments
function TimeSlotPicker({
  date,
  onSelect,
}: {
  date: Date;
  onSelect: (time: string) => void;
}) {
  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>{format(date, "EEEE, MMMM d, yyyy")}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {timeSlots.map((time) => {
          const isAvailable = checkAvailability(date, time);
          return (
            <Button
              key={time}
              variant={isAvailable ? "outline" : "ghost"}
              disabled={!isAvailable}
              onClick={() => onSelect(time)}
              className="h-12"
            >
              {time}
            </Button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded border-2 border-gray-300" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-gray-200" />
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
}
```

#### Combined Date/Time Picker

```tsx
// Appointment scheduler
function AppointmentScheduler() {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Appointment</CardTitle>
        <CardDescription>
          Select a date and time for the appointment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Selection */}
        <div className="space-y-2">
          <Label>Select Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Selection */}
        {date && (
          <div className="space-y-2">
            <Label>Select Time</Label>
            <TimeSlotPicker date={date} onSelect={setTime} />
          </div>
        )}

        {/* Summary */}
        {date && time && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Appointment Summary</AlertTitle>
            <AlertDescription>
              {format(date, "EEEE, MMMM d, yyyy")} at {time}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button disabled={!date || !time}>Confirm Appointment</Button>
      </CardFooter>
    </Card>
  );
}
```

#### Relative Time Display

```tsx
import { formatDistanceToNow } from "date-fns";

// Relative time component
function RelativeTime({ date }: { date: Date }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-sm text-muted-foreground cursor-help">
          {formatDistanceToNow(date, { addSuffix: true })}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{format(date, "PPpp")}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Usage in activity feed
<div className="space-y-3">
  {activities.map((activity) => (
    <div key={activity.id} className="flex items-start gap-3">
      <Avatar className="h-8 w-8">
        <AvatarFallback>{activity.user.initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{activity.user.name}</span>{" "}
          {activity.action}
        </p>
        <RelativeTime date={activity.timestamp} />
      </div>
    </div>
  ))}
</div>;
```

#### Quick Date Presets

```tsx
// Date range with presets
function DateRangeWithPresets() {
  const presets = [
    { label: "Today", getValue: () => ({ from: new Date(), to: new Date() }) },
    {
      label: "Last 7 days",
      getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }),
    },
    {
      label: "Last 30 days",
      getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }),
    },
    {
      label: "This month",
      getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }),
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          {dateRange?.from ? (
            <>
              {format(dateRange.from, "LLL dd")} -{" "}
              {format(dateRange.to, "LLL dd")}
            </>
          ) : (
            "Select date range"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets */}
          <div className="border-r p-2 space-y-1">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setDateRange(preset.getValue())}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          {/* Calendar */}
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            numberOfMonths={2}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

---

## 3. Layout Patterns

### 3.1 Page Layouts

#### Standard Page Layout

```tsx
<div className="flex min-h-screen">
  {/* Sidebar */}
  <aside className="w-64 border-r bg-white">
    <Sidebar />
  </aside>

  {/* Main Content */}
  <main className="flex-1 bg-gray-50">
    {/* Header */}
    <header className="border-b bg-white px-6 py-4">
      <Breadcrumbs />
    </header>

    {/* Page Content */}
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Page Title</h1>
        <Button>Action</Button>
      </div>

      {/* Content */}
      <div className="space-y-6">{/* Page sections */}</div>
    </div>
  </main>
</div>
```

#### Dashboard Layout

```tsx
<div className="space-y-6">
  {/* Stats Row */}
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
    <StatCard title="Total Patients" value="1,234" />
    <StatCard title="Today's Appointments" value="24" />
    <StatCard title="Pending Tasks" value="12" />
    <StatCard title="Revenue MTD" value="$45,678" />
  </div>

  {/* Two Column Layout */}
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <div className="lg:col-span-2">
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>{/* Activity list */}</CardContent>
      </Card>
    </div>
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>{/* Actions */}</CardContent>
      </Card>
    </div>
  </div>
</div>
```

### 3.2 Grid System

Use Tailwind's grid utilities:

```tsx
// 12-column grid
<div className="grid grid-cols-12 gap-6">
  <div className="col-span-8">Main content</div>
  <div className="col-span-4">Sidebar</div>
</div>

// Auto-fit responsive grid
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### 3.3 Responsive Breakpoints

| Breakpoint | Min Width | Usage         |
| ---------- | --------- | ------------- |
| `sm`       | 640px     | Large phones  |
| `md`       | 768px     | Tablets       |
| `lg`       | 1024px    | Small laptops |
| `xl`       | 1280px    | Desktops      |
| `2xl`      | 1536px    | Large screens |

#### Mobile-First Approach

```tsx
// Start with mobile, add larger breakpoints
<div
  className="
  p-4          /* Mobile: 16px padding */
  md:p-6       /* Tablet: 24px padding */
  lg:p-8       /* Desktop: 32px padding */
"
>
  <div
    className="
    grid
    grid-cols-1      /* Mobile: 1 column */
    md:grid-cols-2   /* Tablet: 2 columns */
    lg:grid-cols-3   /* Desktop: 3 columns */
    gap-4
  "
  >
    {/* Content */}
  </div>
</div>
```

---

## 4. Icons & Imagery

### 4.1 Icon Library

Use **Lucide React** icons for consistency.

```tsx
import {
  Home,
  Users,
  Calendar,
  Settings,
  ChevronRight,
  Plus,
  Search,
  X,
} from "lucide-react";

// Usage
<Home className="h-5 w-5" />;
```

### 4.2 Icon Sizes

| Size | Class     | Usage                  |
| ---- | --------- | ---------------------- |
| XS   | `h-3 w-3` | Inline with small text |
| SM   | `h-4 w-4` | Buttons, inputs        |
| MD   | `h-5 w-5` | Navigation, default    |
| LG   | `h-6 w-6` | Headers, emphasis      |
| XL   | `h-8 w-8` | Empty states, features |

### 4.3 Image Guidelines

- Use WebP format for photos (with JPEG fallback)
- Use SVG for logos and illustrations
- Always include alt text for accessibility
- Lazy load images below the fold
- Use Next.js Image component for optimization

```tsx
import Image from "next/image";

<Image
  src="/patient-photo.webp"
  alt="Patient profile photo"
  width={100}
  height={100}
  className="rounded-full"
/>;
```

---

## 5. Animation & Transitions

### 5.1 Duration Scale

| Token          | Duration | Usage                |
| -------------- | -------- | -------------------- |
| `duration-75`  | 75ms     | Instant feedback     |
| `duration-100` | 100ms    | Micro-interactions   |
| `duration-150` | 150ms    | **Default**          |
| `duration-200` | 200ms    | Standard transitions |
| `duration-300` | 300ms    | Larger elements      |
| `duration-500` | 500ms    | Page transitions     |

### 5.2 Easing Functions

| Token         | Timing      | Usage            |
| ------------- | ----------- | ---------------- |
| `ease-linear` | linear      | Progress bars    |
| `ease-in`     | ease-in     | Exit animations  |
| `ease-out`    | ease-out    | Entry animations |
| `ease-in-out` | ease-in-out | **Default**      |

### 5.3 Common Transitions

```css
/* Hover transitions */
.transition-colors {
  transition-property: color, background-color, border-color;
}
.transition-opacity {
  transition-property: opacity;
}
.transition-transform {
  transition-property: transform;
}
.transition-all {
  transition-property: all;
}

/* Combined */
.transition {
  transition-property: color, background-color, border-color,
    text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter,
    backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
```

### 5.4 Animation Guidelines

- Keep animations subtle and purposeful
- Respect `prefers-reduced-motion`
- Use for feedback, not decoration
- Don't animate large areas

```tsx
// Respect reduced motion
<div className="transition-transform hover:scale-105 motion-reduce:transform-none">
  {/* Content */}
</div>
```

---

## 6. Accessibility Standards

### 6.1 Color Contrast

- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text (18px+)**: Minimum 3:1 contrast ratio
- **UI components**: Minimum 3:1 contrast ratio

### 6.2 Focus States

All interactive elements must have visible focus indicators:

```css
/* Focus ring */
.focus-visible:outline-none
.focus-visible:ring-2
.focus-visible:ring-primary-500
.focus-visible:ring-offset-2
```

### 6.3 Keyboard Navigation

- All interactive elements must be focusable
- Logical tab order (top-to-bottom, left-to-right)
- Escape key closes modals
- Enter/Space activates buttons
- Arrow keys navigate lists

### 6.4 Screen Reader Support

```tsx
// Hidden but accessible text
<span className="sr-only">Close dialog</span>

// ARIA labels
<Button aria-label="Delete patient">
  <TrashIcon className="h-4 w-4" />
</Button>

// ARIA live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

### 6.5 Form Accessibility

```tsx
// Associate labels with inputs
<Label htmlFor="patient-name">Patient Name</Label>
<Input id="patient-name" aria-describedby="patient-name-error" />
<p id="patient-name-error" className="text-error-600">
  {error}
</p>

// Required fields
<Label htmlFor="email">
  Email <span className="text-error-600">*</span>
</Label>
<Input id="email" required aria-required="true" />
```

---

## 7. Dark Mode (Future)

Dark mode support is planned for future implementation. When implemented:

### 7.1 Color Mapping

| Light Mode | Dark Mode |
| ---------- | --------- |
| white      | gray-900  |
| gray-50    | gray-800  |
| gray-100   | gray-700  |
| gray-900   | gray-50   |

### 7.2 Implementation

```tsx
// Use Tailwind dark: prefix
<div className="bg-white dark:bg-gray-900">
  <h1 className="text-gray-900 dark:text-gray-50">Heading</h1>
</div>
```

---

## 8. Component Reference

### 8.1 shadcn/ui Components

The following shadcn/ui components are used:

| Component      | Usage                         |
| -------------- | ----------------------------- |
| `Button`       | All button actions            |
| `Input`        | Text inputs                   |
| `Select`       | Dropdown selections           |
| `Checkbox`     | Boolean options               |
| `RadioGroup`   | Single selection from options |
| `Switch`       | Toggle settings               |
| `Card`         | Content containers            |
| `Dialog`       | Modal dialogs                 |
| `Sheet`        | Slide-out panels              |
| `Table`        | Data tables                   |
| `Tabs`         | Tabbed content                |
| `Toast`        | Notifications                 |
| `Tooltip`      | Hover hints                   |
| `Popover`      | Click-triggered overlays      |
| `DropdownMenu` | Action menus                  |
| `Badge`        | Status indicators             |
| `Avatar`       | User images                   |
| `Skeleton`     | Loading placeholders          |

### 8.2 Custom Components

Document custom components in `src/components/README.md` as they are created.

---

## 9. CSS Custom Properties

### 9.1 Theme Variables

```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 166 76% 30%;
  --secondary-foreground: 210 40% 98%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}
```

---

## 10. Healthcare-Specific Patterns

These patterns are tailored for orthodontic and healthcare applications, ensuring HIPAA compliance and optimal clinical workflows.

### 10.1 Patient Card

```tsx
function PatientCard({ patient }: { patient: Patient }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={patient.photo} alt={patient.name} />
              <AvatarFallback>{patient.initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{patient.name}</CardTitle>
              <CardDescription>
                DOB: {format(patient.dateOfBirth, "MMM d, yyyy")} • ID:{" "}
                {patient.id}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={patient.status === "active" ? "default" : "secondary"}
          >
            {patient.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Phone</p>
            <p className="font-medium">{patient.phone}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Email</p>
            <p className="font-medium truncate">{patient.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Provider</p>
            <p className="font-medium">{patient.provider}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Last Visit</p>
            <p className="font-medium">
              {patient.lastVisit
                ? format(patient.lastVisit, "MMM d, yyyy")
                : "N/A"}
            </p>
          </div>
        </div>
        {patient.alerts && patient.alerts.length > 0 && (
          <Alert variant="warning" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Medical Alerts</AlertTitle>
            <AlertDescription>{patient.alerts.join(", ")}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm">
          <FileText className="mr-2 h-4 w-4" />
          View Records
        </Button>
        <Button size="sm">
          <Calendar className="mr-2 h-4 w-4" />
          Schedule
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### 10.2 Appointment Card

```tsx
function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const statusVariant = {
    scheduled: "default" as const,
    confirmed: "default" as const,
    completed: "secondary" as const,
    cancelled: "destructive" as const,
    "no-show": "destructive" as const,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-base">{appointment.type}</CardTitle>
              <Badge variant={statusVariant[appointment.status]}>
                {appointment.status}
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {appointment.patientName}
              </span>
              <span className="flex items-center gap-1">
                <Stethoscope className="h-3 w-3" />
                {appointment.provider}
              </span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm mb-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(appointment.date, "EEEE, MMMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{appointment.time}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Timer className="h-4 w-4" />
            <span>{appointment.duration} min</span>
          </div>
        </div>
        {appointment.notes && (
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-sm text-muted-foreground">{appointment.notes}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          {appointment.status === "scheduled" && (
            <>
              <Button variant="outline" size="sm">
                <Phone className="mr-2 h-4 w-4" />
                Call Patient
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Reschedule
              </Button>
            </>
          )}
        </div>
        <Button size="sm" disabled={appointment.status !== "scheduled"}>
          <Play className="mr-2 h-4 w-4" />
          Start Session
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### 10.3 Medical Alert Banner

```tsx
// Critical medical alert
<Alert variant="destructive" className="border-l-4 border-l-destructive">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Critical Medical Alert</AlertTitle>
  <AlertDescription>
    Patient has severe allergies: {allergies.join(', ')}. Review before treatment.
  </AlertDescription>
</Alert>

// Warning alert
<Alert variant="warning" className="border-l-4 border-l-warning-600">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Medical Consideration</AlertTitle>
  <AlertDescription>
    Patient is currently taking medication that may affect treatment.
  </AlertDescription>
</Alert>

// Info alert
<Alert className="border-l-4 border-l-info-600">
  <Info className="h-4 w-4" />
  <AlertTitle>Patient Note</AlertTitle>
  <AlertDescription>
    Patient prefers morning appointments and requires parking validation.
  </AlertDescription>
</Alert>
```

### 10.4 Treatment Progress

```tsx
function TreatmentProgress({ treatment }: { treatment: Treatment }) {
  const progress = (treatment.completedPhases / treatment.totalPhases) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Treatment Progress</CardTitle>
        <CardDescription>
          Phase {treatment.currentPhase} of {treatment.totalPhases}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-2">
          {treatment.milestones.map((milestone, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              {milestone.completed ? (
                <CheckCircle className="h-4 w-4 text-success-600 flex-shrink-0" />
              ) : milestone.current ? (
                <Circle className="h-4 w-4 text-primary-600 flex-shrink-0 fill-primary-600" />
              ) : (
                <Circle className="h-4 w-4 text-gray-300 flex-shrink-0" />
              )}
              <span
                className={milestone.completed ? "text-muted-foreground" : ""}
              >
                {milestone.name}
              </span>
              {milestone.date && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {format(milestone.date, "MMM d")}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Next Appointment */}
        {treatment.nextAppointment && (
          <div className="bg-primary-50 rounded-lg p-3 border border-primary-200">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary-600" />
              <span className="font-medium">Next Appointment:</span>
              <span className="text-muted-foreground">
                {format(treatment.nextAppointment, "MMM d, yyyy")}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 10.5 HIPAA Compliance Notice

```tsx
// HIPAA protected information banner
<Alert className="bg-blue-50 border-blue-200">
  <Shield className="h-4 w-4 text-blue-600" />
  <AlertTitle className="text-blue-900">HIPAA Protected Information</AlertTitle>
  <AlertDescription className="text-blue-800">
    This information is protected under HIPAA regulations. Unauthorized access,
    use, or disclosure is prohibited and may result in legal action.
  </AlertDescription>
</Alert>;

// Audit log entry
function AuditLogEntry({ entry }: { entry: AuditLog }) {
  return (
    <div className="flex items-start gap-3 p-3 border-b last:border-0">
      <div className="rounded-full bg-gray-100 p-2">
        <Shield className="h-4 w-4 text-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {entry.action} by {entry.user}
        </p>
        <p className="text-xs text-muted-foreground">{entry.details}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {format(entry.timestamp, "PPpp")}
        </p>
      </div>
    </div>
  );
}

// Consent form display
function ConsentStatus({ consent }: { consent: Consent }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Patient Consent</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {consent.items.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            {item.granted ? (
              <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.granted ? "Granted" : "Not granted"} on{" "}
                {format(item.date, "MMM d, yyyy")}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

### 10.6 Clinical Notes

```tsx
function ClinicalNote({ note }: { note: ClinicalNote }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{note.title}</CardTitle>
            <CardDescription>
              {note.provider} • {format(note.date, "MMM d, yyyy h:mm a")}
            </CardDescription>
          </div>
          <Badge variant="outline">{note.type}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
        </div>
        {note.attachments && note.attachments.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Attachments:</p>
            <div className="flex flex-wrap gap-2">
              {note.attachments.map((attachment, index) => (
                <Button key={index} variant="outline" size="sm">
                  <Paperclip className="mr-2 h-3 w-3" />
                  {attachment.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between text-xs text-muted-foreground">
        <span>
          Last edited: {format(note.lastEdited, "MMM d, yyyy h:mm a")}
        </span>
        <Button variant="ghost" size="sm">
          <Edit className="mr-2 h-3 w-3" />
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### 10.7 Vital Signs Display

```tsx
function VitalSigns({ vitals }: { vitals: VitalSigns }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Vital Signs</CardTitle>
        <CardDescription>
          Recorded {format(vitals.recordedAt, "MMM d, yyyy h:mm a")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Blood Pressure</p>
            <p className="text-2xl font-semibold">
              {vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic}
            </p>
            <p className="text-xs text-muted-foreground">mmHg</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Heart Rate</p>
            <p className="text-2xl font-semibold">{vitals.heartRate}</p>
            <p className="text-xs text-muted-foreground">bpm</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Temperature</p>
            <p className="text-2xl font-semibold">{vitals.temperature}</p>
            <p className="text-xs text-muted-foreground">°F</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Oxygen Saturation</p>
            <p className="text-2xl font-semibold">{vitals.oxygenSaturation}</p>
            <p className="text-xs text-muted-foreground">%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 11. Data Visualization Guidelines

Data visualization helps communicate complex medical and operational information clearly.

### 11.1 Chart Color Schemes

```tsx
// Use semantic colors for medical data
const chartColors = {
  primary: "#0891b2", // Primary cyan-teal
  success: "#16A34A", // Positive trends
  warning: "#CA8A04", // Caution areas
  error: "#DC2626", // Critical values
  neutral: "#6B7280", // Baseline data
};

// Multi-series chart colors (accessible palette)
const seriesColors = [
  "#0891b2", // Cyan-teal
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#EF4444", // Red
  "#6366F1", // Indigo
];
```

### 11.2 Treatment Progress Visualization

```tsx
// Progress chart component
function TreatmentProgressChart({ data }: { data: ProgressData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Treatment Progress Over Time</CardTitle>
        <CardDescription>Tracking patient improvement</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {/* Using recharts or similar library */}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                stroke="#6B7280"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="progress"
                stroke="#0891b2"
                strokeWidth={2}
                dot={{ fill: "#0891b2", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 11.3 Statistical Dashboards

```tsx
// Stat card with trend indicator
function StatCard({ title, value, change, trend, icon: Icon }: StatCardProps) {
  const isPositive = trend === "up";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1 text-xs mt-1">
          {isPositive ? (
            <TrendingUp className="h-3 w-3 text-success-600" />
          ) : (
            <TrendingDown className="h-3 w-3 text-error-600" />
          )}
          <span className={isPositive ? "text-success-600" : "text-error-600"}>
            {change}
          </span>
          <span className="text-muted-foreground">from last month</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Bar chart for appointments
function AppointmentsByDayChart({ data }: { data: DayData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointments This Week</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="day" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Bar
                dataKey="appointments"
                fill="#0891b2"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 11.4 Data Table Patterns

```tsx
// Sortable data table with visual indicators
function DataTable({ data, columns }: DataTableProps) {
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column.key}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort(column.key)}
            >
              <div className="flex items-center gap-2">
                {column.label}
                {sortConfig.key === column.key &&
                  (sortConfig.direction === "asc" ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  ))}
              </div>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id} className="hover:bg-gray-50">
            {columns.map((column) => (
              <TableCell key={column.key}>
                {column.render
                  ? column.render(row[column.key], row)
                  : row[column.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### 11.5 Data Visualization Guidelines

- **Accessibility**: Ensure charts have text alternatives and don't rely solely on color
- **Responsiveness**: Charts should adapt to different screen sizes
- **Loading states**: Show skeleton loaders while data is fetching
- **Empty states**: Display helpful messages when no data is available
- **Tooltips**: Provide detailed information on hover/tap
- **Legend**: Include clear legends for multi-series charts
- **Axis labels**: Always label axes with units

---

## 12. Mobile-Specific Patterns

Optimize the interface for mobile devices and touch interactions.

### 12.1 Touch Target Sizes

```tsx
// Minimum touch target: 44x44px (iOS) or 48x48px (Android)
// Use larger targets for critical actions

// Mobile-optimized button
<Button className="h-12 min-w-[120px] text-base">
  Tap Me
</Button>

// Mobile icon button
<Button size="icon" className="h-12 w-12">
  <Menu className="h-6 w-6" />
</Button>

// List items with adequate spacing
<div className="divide-y">
  {items.map((item) => (
    <button
      key={item.id}
      className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 active:bg-gray-100"
    >
      <Avatar className="h-10 w-10" />
      <div className="flex-1 text-left">
        <p className="font-medium">{item.name}</p>
        <p className="text-sm text-muted-foreground">{item.subtitle}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  ))}
</div>
```

### 12.2 Mobile Navigation Patterns

```tsx
// Bottom navigation (mobile)
function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Users, label: "Patients", href: "/patients" },
    { icon: Calendar, label: "Schedule", href: "/schedule" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-50">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 ${
                isActive ? "text-primary-600" : "text-gray-600"
              }`}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Hamburger menu (mobile)
function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 mt-6">
          <Link
            href="/"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100"
          >
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          {/* More nav items */}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

### 12.3 Swipe Gestures

```tsx
// Swipeable list item (for delete/archive actions)
import { useSwipeable } from "react-swipeable";

function SwipeableListItem({ item, onDelete }: SwipeableListItemProps) {
  const [offset, setOffset] = useState(0);

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (e.dir === "Left") {
        setOffset(Math.max(-80, e.deltaX));
      }
    },
    onSwiped: (e) => {
      if (e.dir === "Left" && Math.abs(e.deltaX) > 40) {
        setOffset(-80);
      } else {
        setOffset(0);
      }
    },
    trackMouse: false,
  });

  return (
    <div className="relative overflow-hidden">
      {/* Delete button (revealed on swipe) */}
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-destructive flex items-center justify-center">
        <Trash className="h-5 w-5 text-white" />
      </div>

      {/* Main content */}
      <div
        {...handlers}
        className="bg-white transition-transform"
        style={{ transform: `translateX(${offset}px)` }}
      >
        <div className="p-4">{item.content}</div>
      </div>
    </div>
  );
}
```

### 12.4 Mobile Form Optimization

```tsx
// Mobile-optimized form
function MobileForm() {
  return (
    <form className="space-y-4">
      {/* Full-width inputs on mobile */}
      <div className="space-y-2">
        <Label htmlFor="name">Patient Name</Label>
        <Input
          id="name"
          type="text"
          className="h-12 text-base" // Larger for mobile
          autoComplete="name"
        />
      </div>

      {/* Optimized input types for mobile keyboards */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel" // Shows numeric keyboard
          className="h-12 text-base"
          autoComplete="tel"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email" // Shows email keyboard
          className="h-12 text-base"
          autoComplete="email"
        />
      </div>

      {/* Large submit button */}
      <Button type="submit" className="w-full h-12 text-base">
        Submit
      </Button>
    </form>
  );
}
```

### 12.5 Safe Area Insets

```css
/* Handle notches and safe areas on mobile devices */
.mobile-header {
  padding-top: env(safe-area-inset-top);
}

.mobile-bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Full viewport height accounting for mobile browser UI */
.mobile-full-height {
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height */
}
```

### 12.6 Mobile-Specific Guidelines

- **Touch targets**: Minimum 44x44px, 48x48px recommended
- **Font sizes**: Minimum 16px for body text to prevent zoom on iOS
- **Spacing**: Increase padding and margins for easier tapping
- **Orientation**: Support both portrait and landscape
- **Gestures**: Use standard gestures (swipe, pinch, tap)
- **Performance**: Optimize for slower mobile connections
- **Testing**: Test on actual devices, not just emulators

---

## 13. Print Styles

Optimize layouts for printing patient records and reports.

### 13.1 Print-Friendly Layouts

```css
/* Print stylesheet */
@media print {
  /* Hide non-essential elements */
  .no-print,
  nav,
  aside,
  footer,
  button,
  .print-hide {
    display: none !important;
  }

  /* Reset backgrounds and colors */
  * {
    background: white !important;
    color: black !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  /* Optimize layout */
  body {
    margin: 0;
    padding: 1cm;
    font-size: 12pt;
    line-height: 1.5;
  }

  /* Ensure content fits */
  .print-container {
    max-width: 100%;
    margin: 0;
  }

  /* Show URLs for links */
  a[href]:after {
    content: " (" attr(href) ")";
    font-size: 10pt;
    color: #666;
  }

  /* Prevent orphans and widows */
  p,
  h2,
  h3 {
    orphans: 3;
    widows: 3;
  }

  /* Keep headings with content */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    page-break-after: avoid;
  }

  /* Avoid breaking inside elements */
  img,
  table,
  figure,
  .card {
    page-break-inside: avoid;
  }
}
```

### 13.2 Page Breaks

```tsx
// Component with print page breaks
function PrintablePatientRecord({ patient }: { patient: Patient }) {
  return (
    <div className="print:p-0">
      {/* Page 1: Patient Info */}
      <div className="print:page-break-after">
        <h1 className="text-2xl font-bold mb-4">Patient Record</h1>
        <PatientInfo patient={patient} />
      </div>

      {/* Page 2: Medical History */}
      <div className="print:page-break-after">
        <h2 className="text-xl font-bold mb-4 print:mt-0">Medical History</h2>
        <MedicalHistory history={patient.history} />
      </div>

      {/* Page 3: Treatment Plan */}
      <div>
        <h2 className="text-xl font-bold mb-4 print:mt-0">Treatment Plan</h2>
        <TreatmentPlan plan={patient.treatmentPlan} />
      </div>
    </div>
  );
}

// CSS classes for page breaks
// .print\:page-break-before { page-break-before: always; }
// .print\:page-break-after { page-break-after: always; }
// .print\:page-break-inside-avoid { page-break-inside: avoid; }
```

### 13.3 Print Header/Footer

```tsx
// Print header component
function PrintHeader() {
  return (
    <div className="hidden print:block border-b pb-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Orca Orthodontics</h1>
          <p className="text-sm text-gray-600">
            123 Medical Center Dr, Suite 100
          </p>
          <p className="text-sm text-gray-600">Phone: (555) 123-4567</p>
        </div>
        <div className="text-right">
          <p className="text-sm">Printed: {format(new Date(), "PPP")}</p>
          <p className="text-sm">
            Page <span className="page-number"></span>
          </p>
        </div>
      </div>
    </div>
  );
}

// Print footer with page numbers
function PrintFooter() {
  return (
    <div className="hidden print:block border-t pt-4 mt-6 text-center text-sm text-gray-600">
      <p>Confidential Patient Information - HIPAA Protected</p>
      <p className="text-xs mt-1">
        This document contains protected health information. Unauthorized
        disclosure is prohibited.
      </p>
    </div>
  );
}
```

### 13.4 HIPAA-Compliant Watermarks

```css
/* Watermark for printed documents */
@media print {
  .print-watermark::before {
    content: "CONFIDENTIAL";
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 120pt;
    font-weight: bold;
    color: rgba(0, 0, 0, 0.05);
    z-index: -1;
    pointer-events: none;
  }
}
```

```tsx
// Printable document with watermark
function PrintableDocument({ children }: { children: React.ReactNode }) {
  return (
    <div className="print-watermark">
      <PrintHeader />
      {children}
      <PrintFooter />
    </div>
  );
}
```

### 13.5 Print Button

```tsx
// Print trigger button
function PrintButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button onClick={handlePrint} variant="outline" className="no-print">
      <Printer className="mr-2 h-4 w-4" />
      Print Record
    </Button>
  );
}
```

---

## 14. File Upload Patterns

File upload patterns for medical documents, images, and patient records.

### 14.1 Drag-and-Drop Zone

```tsx
import { useDropzone } from "react-dropzone";

function FileUploadZone({ onUpload }: { onUpload: (files: File[]) => void }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onUpload,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-12
        transition-colors cursor-pointer
        ${
          isDragActive
            ? "border-primary-600 bg-primary-50"
            : "border-gray-300 hover:border-gray-400"
        }
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center text-center">
        <Upload className="h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-lg font-medium text-primary-600">
            Drop files here...
          </p>
        ) : (
          <>
            <p className="text-lg font-medium mb-1">Drag & drop files here</p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supported: Images (PNG, JPG) and PDF up to 10MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}
```

### 14.2 File Type Validation UI

```tsx
// File validation with error display
function FileUploadWithValidation() {
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const validateFile = (file: File) => {
    const validTypes = ["image/png", "image/jpeg", "application/pdf"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return `${file.name}: Invalid file type. Only PNG, JPG, and PDF are allowed.`;
    }
    if (file.size > maxSize) {
      return `${file.name}: File too large. Maximum size is 10MB.`;
    }
    return null;
  };

  const handleUpload = (uploadedFiles: File[]) => {
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    uploadedFiles.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    setErrors(newErrors);
    setFiles([...files, ...validFiles]);
  };

  return (
    <div className="space-y-4">
      <FileUploadZone onUpload={handleUpload} />

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Upload Errors</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, i) => (
                <li key={i} className="text-sm">
                  {error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

### 14.3 Upload Progress Indicators

```tsx
// File upload with progress
function FileUploadProgress({
  file,
  progress,
}: {
  file: File;
  progress: number;
}) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="rounded bg-primary-100 p-2">
          <FileText className="h-5 w-5 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{file.name}</p>
          <p className="text-sm text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <div className="mt-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Uploading...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        {progress === 100 ? (
          <CheckCircle className="h-5 w-5 text-success-600" />
        ) : (
          <button className="p-1 hover:bg-gray-100 rounded">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
```

### 14.4 File Preview Thumbnails

```tsx
// Uploaded file preview
function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [file]);

  return (
    <div className="relative group">
      <div className="aspect-square rounded-lg border overflow-hidden bg-gray-50">
        {preview ? (
          <img
            src={preview}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="text-xs truncate mt-1">{file.name}</p>
    </div>
  );
}

// Gallery of uploaded files
function FileGallery({ files, onRemove }: FileGalleryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {files.map((file, index) => (
        <FilePreview key={index} file={file} onRemove={() => onRemove(index)} />
      ))}
    </div>
  );
}
```

### 14.5 Multi-File Selection

```tsx
// Complete file upload component
function MultiFileUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    setUploading(true);
    try {
      // Upload logic here
      await uploadFiles(files);
      toast.success("Files uploaded successfully");
      setFiles([]);
    } catch (error) {
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Medical Documents</CardTitle>
        <CardDescription>
          Upload patient records, X-rays, or treatment photos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileUploadZone
          onUpload={(newFiles) => setFiles([...files, ...newFiles])}
        />

        {files.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {files.length} file{files.length !== 1 ? "s" : ""} selected
              </p>
              <Button variant="ghost" size="sm" onClick={() => setFiles([])}>
                Clear All
              </Button>
            </div>
            <FileGallery
              files={files}
              onRemove={(index) =>
                setFiles(files.filter((_, i) => i !== index))
              }
            />
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setFiles([])}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
        >
          {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Upload {files.length > 0 && `(${files.length})`}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### 14.6 File Upload Guidelines

- **Validation**: Always validate file type and size on both client and server
- **Feedback**: Show clear progress indicators for uploads
- **Error handling**: Display specific error messages
- **Security**: Scan uploaded files for malware
- **HIPAA compliance**: Encrypt files during transmission and storage
- **Accessibility**: Ensure keyboard navigation works for file selection
- **Mobile**: Support camera capture for mobile devices

---

**Status**: Active
**Last Updated**: 2024-11-29
**Owner**: Design Team

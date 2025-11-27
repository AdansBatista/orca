# Styling Guide

This document defines the design system and UI/UX standards for the Orca project. All user interface development must follow these guidelines for visual consistency and a cohesive user experience.

---

## 1. Design Tokens

### 1.1 Color Palette

#### Primary Colors
The primary color represents trust, professionalism, and healthcare.

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `primary-50` | #EFF6FF | rgb(239, 246, 255) | Lightest backgrounds |
| `primary-100` | #DBEAFE | rgb(219, 234, 254) | Light backgrounds |
| `primary-200` | #BFDBFE | rgb(191, 219, 254) | Hover states |
| `primary-300` | #93C5FD | rgb(147, 197, 253) | Borders |
| `primary-400` | #60A5FA | rgb(96, 165, 250) | Icons |
| `primary-500` | #3B82F6 | rgb(59, 130, 246) | Light variant |
| `primary-600` | #2563EB | rgb(37, 99, 235) | **Default primary** |
| `primary-700` | #1D4ED8 | rgb(29, 78, 216) | Hover/Active |
| `primary-800` | #1E40AF | rgb(30, 64, 175) | Dark variant |
| `primary-900` | #1E3A8A | rgb(30, 58, 138) | Darkest |

#### Secondary Colors
The secondary color provides a calming healthcare aesthetic.

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `secondary-50` | #F0FDFA | rgb(240, 253, 250) | Lightest backgrounds |
| `secondary-100` | #CCFBF1 | rgb(204, 251, 241) | Light backgrounds |
| `secondary-200` | #99F6E4 | rgb(153, 246, 228) | Hover states |
| `secondary-300` | #5EEAD4 | rgb(94, 234, 212) | Borders |
| `secondary-400` | #2DD4BF | rgb(45, 212, 191) | Icons |
| `secondary-500` | #14B8A6 | rgb(20, 184, 166) | Light variant |
| `secondary-600` | #0D9488 | rgb(13, 148, 136) | **Default secondary** |
| `secondary-700` | #0F766E | rgb(15, 118, 110) | Hover/Active |
| `secondary-800` | #115E59 | rgb(17, 94, 89) | Dark variant |
| `secondary-900` | #134E4A | rgb(19, 78, 74) | Darkest |

#### Semantic Colors

| Purpose | Token | Hex | Usage |
|---------|-------|-----|-------|
| **Success** | `success-600` | #16A34A | Confirmations, completed status |
| **Success Light** | `success-100` | #DCFCE7 | Success backgrounds |
| **Warning** | `warning-600` | #CA8A04 | Caution, pending actions |
| **Warning Light** | `warning-100` | #FEF9C3 | Warning backgrounds |
| **Error** | `error-600` | #DC2626 | Errors, destructive actions |
| **Error Light** | `error-100` | #FEE2E2 | Error backgrounds |
| **Info** | `info-600` | #2563EB | Information, hints |
| **Info Light** | `info-100` | #DBEAFE | Info backgrounds |

#### Neutral Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `gray-50` | #F9FAFB | Page backgrounds |
| `gray-100` | #F3F4F6 | Subtle backgrounds, alternating rows |
| `gray-200` | #E5E7EB | Borders, dividers |
| `gray-300` | #D1D5DB | Disabled states, muted borders |
| `gray-400` | #9CA3AF | Placeholder text, disabled text |
| `gray-500` | #6B7280 | Secondary text, icons |
| `gray-600` | #4B5563 | Body text |
| `gray-700` | #374151 | Headings, emphasis |
| `gray-800` | #1F2937 | Dark text, high contrast |
| `gray-900` | #111827 | Darkest text |
| `white` | #FFFFFF | Backgrounds, cards |
| `black` | #000000 | Rarely used directly |

### 1.2 Typography

#### Font Families
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

#### Font Sizes

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `text-xs` | 0.75rem (12px) | 1rem (16px) | Captions, badges |
| `text-sm` | 0.875rem (14px) | 1.25rem (20px) | Secondary text, labels |
| `text-base` | 1rem (16px) | 1.5rem (24px) | Body text |
| `text-lg` | 1.125rem (18px) | 1.75rem (28px) | Large body text |
| `text-xl` | 1.25rem (20px) | 1.75rem (28px) | Subheadings |
| `text-2xl` | 1.5rem (24px) | 2rem (32px) | Section headings |
| `text-3xl` | 1.875rem (30px) | 2.25rem (36px) | Page headings |
| `text-4xl` | 2.25rem (36px) | 2.5rem (40px) | Large headings |

#### Font Weights

| Token | Weight | Usage |
|-------|--------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Labels, emphasis |
| `font-semibold` | 600 | Buttons, subheadings |
| `font-bold` | 700 | Headings |

#### Text Colors

| Token | Color | Usage |
|-------|-------|-------|
| `text-foreground` | gray-900 | Primary text |
| `text-muted-foreground` | gray-500 | Secondary text |
| `text-primary` | primary-600 | Links, emphasis |
| `text-destructive` | error-600 | Error messages |

### 1.3 Spacing Scale

Based on 4px base unit (Tailwind default).

| Token | Value | Pixels |
|-------|-------|--------|
| `space-0` | 0 | 0px |
| `space-0.5` | 0.125rem | 2px |
| `space-1` | 0.25rem | 4px |
| `space-1.5` | 0.375rem | 6px |
| `space-2` | 0.5rem | 8px |
| `space-2.5` | 0.625rem | 10px |
| `space-3` | 0.75rem | 12px |
| `space-3.5` | 0.875rem | 14px |
| `space-4` | 1rem | 16px |
| `space-5` | 1.25rem | 20px |
| `space-6` | 1.5rem | 24px |
| `space-7` | 1.75rem | 28px |
| `space-8` | 2rem | 32px |
| `space-9` | 2.25rem | 36px |
| `space-10` | 2.5rem | 40px |
| `space-12` | 3rem | 48px |
| `space-14` | 3.5rem | 56px |
| `space-16` | 4rem | 64px |
| `space-20` | 5rem | 80px |
| `space-24` | 6rem | 96px |

### 1.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-none` | 0 | No rounding |
| `rounded-sm` | 0.125rem (2px) | Subtle rounding |
| `rounded` | 0.25rem (4px) | Default rounding |
| `rounded-md` | 0.375rem (6px) | Buttons, inputs |
| `rounded-lg` | 0.5rem (8px) | Cards, modals |
| `rounded-xl` | 0.75rem (12px) | Large cards |
| `rounded-2xl` | 1rem (16px) | Feature cards |
| `rounded-full` | 9999px | Pills, avatars |

### 1.5 Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | 0 1px 2px rgba(0,0,0,0.05) | Subtle elevation |
| `shadow` | 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06) | Default cards |
| `shadow-md` | 0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06) | Elevated cards |
| `shadow-lg` | 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05) | Modals, dropdowns |
| `shadow-xl` | 0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04) | Prominent elements |

### 1.6 Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `z-0` | 0 | Base |
| `z-10` | 10 | Dropdowns |
| `z-20` | 20 | Sticky elements |
| `z-30` | 30 | Fixed elements |
| `z-40` | 40 | Modals |
| `z-50` | 50 | Toasts, notifications |
| `z-[100]` | 100 | Critical overlays |

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

| State | Style |
|-------|-------|
| Default | Normal colors |
| Hover | Darker shade (700 for primary) |
| Active | Even darker (800 for primary) |
| Disabled | 50% opacity, no pointer events |
| Loading | Spinner icon, disabled state |

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
- Required fields marked with asterisk (*)
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
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter className="flex justify-end gap-2">
    <Button variant="outline">Cancel</Button>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

#### Card Variants

| Variant | Usage | Style |
|---------|-------|-------|
| Default | General content | White bg, shadow-sm, rounded-lg |
| Elevated | Featured content | White bg, shadow-md |
| Outlined | Lists, grids | White bg, border, no shadow |
| Muted | Background content | Gray-50 bg, no shadow |

### 2.4 Modals & Dialogs

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      {/* Dialog content */}
    </div>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Modal Sizes

| Size | Max Width | Usage |
|------|-----------|-------|
| Small | 425px | Confirmations, simple forms |
| Default | 525px | Standard forms |
| Large | 700px | Complex forms, details |
| Full | 90vw | Data tables, viewers |

#### Modal Guidelines

- Always include a close button
- Trap focus within modal
- Close on Escape key
- Close on backdrop click (unless dangerous action)
- Stack buttons right-aligned: Cancel, then Primary Action

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
          <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
            {patient.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm">Edit</Button>
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
toast.success('Patient saved successfully');

// Error toast
toast.error('Failed to save patient');

// With action
toast('Appointment scheduled', {
  action: {
    label: 'Undo',
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
      <div className="space-y-6">
        {/* Page sections */}
      </div>
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

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

#### Mobile-First Approach

```tsx
// Start with mobile, add larger breakpoints
<div className="
  p-4          /* Mobile: 16px padding */
  md:p-6       /* Tablet: 24px padding */
  lg:p-8       /* Desktop: 32px padding */
">
  <div className="
    grid
    grid-cols-1      /* Mobile: 1 column */
    md:grid-cols-2   /* Tablet: 2 columns */
    lg:grid-cols-3   /* Desktop: 3 columns */
    gap-4
  ">
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
} from 'lucide-react';

// Usage
<Home className="h-5 w-5" />
```

### 4.2 Icon Sizes

| Size | Class | Usage |
|------|-------|-------|
| XS | `h-3 w-3` | Inline with small text |
| SM | `h-4 w-4` | Buttons, inputs |
| MD | `h-5 w-5` | Navigation, default |
| LG | `h-6 w-6` | Headers, emphasis |
| XL | `h-8 w-8` | Empty states, features |

### 4.3 Image Guidelines

- Use WebP format for photos (with JPEG fallback)
- Use SVG for logos and illustrations
- Always include alt text for accessibility
- Lazy load images below the fold
- Use Next.js Image component for optimization

```tsx
import Image from 'next/image';

<Image
  src="/patient-photo.webp"
  alt="Patient profile photo"
  width={100}
  height={100}
  className="rounded-full"
/>
```

---

## 5. Animation & Transitions

### 5.1 Duration Scale

| Token | Duration | Usage |
|-------|----------|-------|
| `duration-75` | 75ms | Instant feedback |
| `duration-100` | 100ms | Micro-interactions |
| `duration-150` | 150ms | **Default** |
| `duration-200` | 200ms | Standard transitions |
| `duration-300` | 300ms | Larger elements |
| `duration-500` | 500ms | Page transitions |

### 5.2 Easing Functions

| Token | Timing | Usage |
|-------|--------|-------|
| `ease-linear` | linear | Progress bars |
| `ease-in` | ease-in | Exit animations |
| `ease-out` | ease-out | Entry animations |
| `ease-in-out` | ease-in-out | **Default** |

### 5.3 Common Transitions

```css
/* Hover transitions */
.transition-colors { transition-property: color, background-color, border-color; }
.transition-opacity { transition-property: opacity; }
.transition-transform { transition-property: transform; }
.transition-all { transition-property: all; }

/* Combined */
.transition {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
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
|------------|-----------|
| white | gray-900 |
| gray-50 | gray-800 |
| gray-100 | gray-700 |
| gray-900 | gray-50 |

### 7.2 Implementation

```tsx
// Use Tailwind dark: prefix
<div className="bg-white dark:bg-gray-900">
  <h1 className="text-gray-900 dark:text-gray-50">
    Heading
  </h1>
</div>
```

---

## 8. Component Reference

### 8.1 shadcn/ui Components

The following shadcn/ui components are used:

| Component | Usage |
|-----------|-------|
| `Button` | All button actions |
| `Input` | Text inputs |
| `Select` | Dropdown selections |
| `Checkbox` | Boolean options |
| `RadioGroup` | Single selection from options |
| `Switch` | Toggle settings |
| `Card` | Content containers |
| `Dialog` | Modal dialogs |
| `Sheet` | Slide-out panels |
| `Table` | Data tables |
| `Tabs` | Tabbed content |
| `Toast` | Notifications |
| `Tooltip` | Hover hints |
| `Popover` | Click-triggered overlays |
| `DropdownMenu` | Action menus |
| `Badge` | Status indicators |
| `Avatar` | User images |
| `Skeleton` | Loading placeholders |

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

**Status**: Active
**Last Updated**: 2024-11-26
**Owner**: Design Team

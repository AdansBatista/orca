# Orca UI Components

This directory contains all React components for the Orca application.

## Directory Structure

```
components/
├── ui/           # Base UI components (shadcn/ui)
├── forms/        # Form-specific components
├── layouts/      # Layout components (sidebars, headers, etc.)
└── [feature]/    # Feature-specific components
```

## Base UI Components (shadcn/ui)

All base components are from [shadcn/ui](https://ui.shadcn.com/) with the **New York** style variant.

### Available Components

| Component | Import | Description |
|-----------|--------|-------------|
| Button | `@/components/ui/button` | Action buttons with variants |
| Input | `@/components/ui/input` | Text input fields |
| Label | `@/components/ui/label` | Form labels |
| Textarea | `@/components/ui/textarea` | Multi-line text input |
| Select | `@/components/ui/select` | Dropdown selection |
| Checkbox | `@/components/ui/checkbox` | Boolean selection |
| RadioGroup | `@/components/ui/radio-group` | Single selection from options |
| Switch | `@/components/ui/switch` | Toggle switch |
| Card | `@/components/ui/card` | Content container |
| Dialog | `@/components/ui/dialog` | Modal dialogs |
| Alert | `@/components/ui/alert` | Contextual alerts |
| Table | `@/components/ui/table` | Data tables |
| Badge | `@/components/ui/badge` | Status indicators |
| Avatar | `@/components/ui/avatar` | User avatars |
| Skeleton | `@/components/ui/skeleton` | Loading placeholders |
| Toast | `@/components/ui/toast` | Toast notifications |
| Sonner | `@/components/ui/sonner` | Toast provider (Sonner) |
| Tooltip | `@/components/ui/tooltip` | Hover tooltips |
| Popover | `@/components/ui/popover` | Click popovers |
| DropdownMenu | `@/components/ui/dropdown-menu` | Action menus |
| Tabs | `@/components/ui/tabs` | Tabbed content |
| Separator | `@/components/ui/separator` | Visual dividers |
| Sheet | `@/components/ui/sheet` | Slide-out panels |
| Breadcrumb | `@/components/ui/breadcrumb` | Navigation breadcrumbs |

## Usage Examples

### Buttons

```tsx
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

// Variants
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Plus className="h-4 w-4" /></Button>

// With Icons
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Patient
</Button>

// Loading State
<Button disabled>
  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  Loading...
</Button>
```

### Form Inputs

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Basic Input
<div className="space-y-2">
  <Label htmlFor="name">Patient Name</Label>
  <Input id="name" placeholder="Enter name" />
</div>

// With Error
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    className="border-destructive focus-visible:ring-destructive"
  />
  <p className="text-sm text-destructive">Invalid email address</p>
</div>

// Textarea
<div className="space-y-2">
  <Label htmlFor="notes">Notes</Label>
  <Textarea id="notes" placeholder="Enter notes..." rows={4} />
</div>
```

### Select

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select provider" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="dr-smith">Dr. Smith</SelectItem>
    <SelectItem value="dr-jones">Dr. Jones</SelectItem>
  </SelectContent>
</Select>
```

### Cards

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

### Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        Are you sure you want to proceed?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Toast Notifications

```tsx
import { toast } from "sonner";

// Success
toast.success("Patient saved successfully!");

// Error
toast.error("Failed to save patient");

// Info
toast.info("New appointment request");

// With Action
toast("Appointment scheduled", {
  description: "Monday at 9:00 AM",
  action: {
    label: "Undo",
    onClick: () => handleUndo(),
  },
});
```

### Table

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="font-medium">John Doe</TableCell>
      <TableCell>
        <Badge className="bg-success-600">Active</Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm">Edit</Button>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Icons

We use [Lucide React](https://lucide.dev/) for all icons.

```tsx
import { Home, Users, Calendar, Settings, Plus, X } from "lucide-react";

// Standard sizes
<Home className="h-4 w-4" />  // Small (in buttons)
<Home className="h-5 w-5" />  // Default
<Home className="h-6 w-6" />  // Large
<Home className="h-8 w-8" />  // Extra large (stats)
```

## Color Classes

### Semantic Colors

```tsx
// Success
<div className="bg-success-100 text-success-600">Success</div>
<Badge className="bg-success-600">Active</Badge>

// Warning
<div className="bg-warning-100 text-warning-600">Warning</div>
<Badge className="bg-warning-600">Pending</Badge>

// Error
<div className="bg-error-100 text-error-600">Error</div>
<Badge className="bg-error-600">Cancelled</Badge>

// Info
<div className="bg-info-100 text-info-600">Info</div>
<Badge className="bg-info-600">Scheduled</Badge>
```

### Primary & Secondary

```tsx
// Primary (Blue)
<div className="bg-primary-600 text-white">Primary</div>
<span className="text-primary-600">Primary text</span>

// Secondary (Teal)
<div className="bg-secondary-600 text-white">Secondary</div>
<span className="text-secondary-600">Secondary text</span>
```

## Utility Function

The `cn()` utility combines class names with Tailwind merge:

```tsx
import { cn } from "@/lib/utils";

<div className={cn(
  "rounded-lg border p-4",
  isSelected && "border-primary bg-primary/5",
  className
)}>
  Content
</div>
```

## Adding New shadcn/ui Components

To add more shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

Example:
```bash
npx shadcn@latest add accordion
npx shadcn@latest add calendar
npx shadcn@latest add command
```

## UI Showcase

Visit `/ui-showcase` in development to see all components in action.

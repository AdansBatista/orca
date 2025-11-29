import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

const listItemVariants = cva(
  "flex items-center gap-3 transition-colors cursor-pointer group",
  {
    variants: {
      variant: {
        default:
          "rounded-xl bg-muted/30 hover:bg-muted/50",
        ghost:
          "rounded-lg hover:bg-muted/30",
        bordered:
          "rounded-xl border border-border/50 bg-card hover:border-border hover:bg-muted/20",
        elevated:
          "rounded-xl bg-card shadow-sm hover:shadow-md",
      },
      size: {
        sm: "p-2",
        default: "p-3",
        lg: "p-4",
      },
      active: {
        true: "bg-primary-50 border-primary-200 hover:bg-primary-100",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      active: false,
    },
  }
)

export interface ListItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof listItemVariants> {
  /** Show chevron arrow on hover */
  showArrow?: boolean
  /** Custom content for the leading slot (avatar, icon, etc.) */
  leading?: React.ReactNode
  /** Custom content for the trailing slot (badge, action, etc.) */
  trailing?: React.ReactNode
  /** Make the entire item a link */
  asChild?: boolean
}

const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>(
  (
    {
      className,
      variant,
      size,
      active,
      showArrow = false,
      leading,
      trailing,
      children,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(listItemVariants({ variant, size, active, className }))}
      {...props}
    >
      {leading}
      <div className="flex-1 min-w-0">{children}</div>
      {trailing}
      {showArrow && (
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </div>
  )
)
ListItem.displayName = "ListItem"

// Compound components for structured content
const ListItemTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm font-medium truncate", className)}
    {...props}
  />
))
ListItemTitle.displayName = "ListItemTitle"

const ListItemDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-muted-foreground", className)}
    {...props}
  />
))
ListItemDescription.displayName = "ListItemDescription"

// Activity/notification item variant with color indicator
const listActivityVariants = cva(
  "flex items-start gap-3 transition-colors cursor-pointer",
  {
    variants: {
      variant: {
        default: "rounded-lg p-2 hover:bg-muted/30",
        bordered: "rounded-lg p-3 border border-border/50 hover:border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ListActivityProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof listActivityVariants> {
  /** Color of the status indicator dot */
  indicatorColor?: "primary" | "accent" | "success" | "warning" | "error" | "info"
}

const indicatorColorClasses = {
  primary: "bg-primary-500",
  accent: "bg-accent-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  error: "bg-error-500",
  info: "bg-info-500",
}

const ListActivity = React.forwardRef<HTMLDivElement, ListActivityProps>(
  ({ className, variant, indicatorColor = "primary", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(listActivityVariants({ variant, className }))}
      {...props}
    >
      <div
        className={cn(
          "h-2 w-2 rounded-full mt-1.5 shrink-0",
          indicatorColorClasses[indicatorColor]
        )}
      />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
)
ListActivity.displayName = "ListActivity"

export {
  ListItem,
  ListItemTitle,
  ListItemDescription,
  ListActivity,
  listItemVariants,
  listActivityVariants,
}

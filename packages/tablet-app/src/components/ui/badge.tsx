import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-medium whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-primary text-white shadow-sm",
        secondary:
          "bg-gradient-to-r from-secondary-500 to-secondary-600 text-white shadow-sm",
        accent:
          "bg-gradient-accent text-white shadow-sm",
        destructive:
          "bg-gradient-to-r from-error-500 to-error-600 text-white shadow-sm",
        outline:
          "border border-border bg-background/80 backdrop-blur-sm text-foreground",
        ghost:
          "bg-muted text-muted-foreground",
        // Semantic status badges
        success:
          "bg-success-100 text-success-700",
        warning:
          "bg-warning-100 text-warning-700",
        error:
          "bg-error-100 text-error-700",
        info:
          "bg-info-100 text-info-700",
        // Soft variants (subtle backgrounds)
        "soft-primary":
          "bg-primary-100 text-primary-700",
        "soft-secondary":
          "bg-secondary-100 text-secondary-700",
        "soft-accent":
          "bg-accent-100 text-accent-700",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px] rounded-full",
        default: "px-2.5 py-0.5 text-xs rounded-full",
        lg: "px-3 py-1 text-sm rounded-full",
      },
      // Optional dot indicator
      dot: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        dot: true,
        className: "pl-1.5",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      dot: false,
    },
  }
)

// Dot colors for status indicators
const dotColors = {
  default: "bg-white",
  secondary: "bg-white",
  accent: "bg-white",
  destructive: "bg-white",
  outline: "bg-foreground",
  ghost: "bg-muted-foreground",
  success: "bg-success-500",
  warning: "bg-warning-500",
  error: "bg-error-500",
  info: "bg-info-500",
  "soft-primary": "bg-primary-500",
  "soft-secondary": "bg-secondary-500",
  "soft-accent": "bg-accent-500",
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant = "default", size, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size, dot }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            dotColors[variant || "default"]
          )}
        />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }

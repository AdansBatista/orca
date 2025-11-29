import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-2xl text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "bg-card border border-border/50 shadow-sm",
        elevated:
          "bg-card border border-border/30 shadow-md",
        glass:
          "bg-white/60 backdrop-blur-md border border-white/30 shadow-sm dark:bg-silk-900/60 dark:border-white/10",
        "glass-dark":
          "bg-silk-900/60 backdrop-blur-md border border-white/10 shadow-sm",
        ghost:
          "bg-transparent border border-transparent hover:bg-muted/50",
        gradient:
          "bg-gradient-to-br from-card to-muted/30 border border-border/50 shadow-sm",
        bento:
          "bg-card border border-border/50 shadow-sm",
        compact:
          "bg-card border border-border/50 shadow-sm rounded-xl",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        default: "p-4",
        lg: "p-6",
      },
      interactive: {
        true: "cursor-pointer hover:border-border",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "none",
      interactive: false,
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, interactive, className }))}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }
>(({ className, compact, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1",
      compact ? "p-3 pb-2" : "p-4 pb-2",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { size?: "sm" | "default" | "lg" }
>(({ className, size = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "font-semibold leading-none tracking-tight",
      size === "sm" && "text-sm",
      size === "default" && "text-base",
      size === "lg" && "text-lg",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }
>(({ className, compact, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(compact ? "p-3 pt-0" : "p-4 pt-0", className)}
    {...props}
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }
>(({ className, compact, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center border-t border-border/50",
      compact ? "p-3 pt-3" : "p-4 pt-4",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Specialized stat card for dashboard metrics
const StatCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    accentColor?: "primary" | "accent" | "secondary" | "success" | "warning" | "error"
  }
>(({ className, accentColor = "primary", children, ...props }, ref) => {
  const accentClasses = {
    primary: "before:bg-gradient-primary",
    accent: "before:bg-gradient-accent",
    secondary: "before:bg-gradient-to-b before:from-secondary-500 before:to-secondary-600",
    success: "before:bg-gradient-to-b before:from-success-500 before:to-success-600",
    warning: "before:bg-gradient-to-b before:from-warning-500 before:to-warning-600",
    error: "before:bg-gradient-to-b before:from-error-500 before:to-error-600",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-card border border-border/50 p-4 shadow-sm",
        "before:absolute before:inset-y-0 before:left-0 before:w-1",
        accentClasses[accentColor],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
StatCard.displayName = "StatCard"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  cardVariants,
}

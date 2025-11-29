import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-primary text-primary-foreground shadow-md hover:shadow-glow hover:-translate-y-0.5",
        destructive:
          "bg-gradient-to-r from-error-500 to-error-600 text-destructive-foreground shadow-md hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:-translate-y-0.5",
        outline:
          "border border-input bg-background/80 backdrop-blur-sm shadow-sm hover:bg-primary-50 hover:text-primary-700 hover:border-primary-400 hover:-translate-y-0.5",
        secondary:
          "bg-gradient-to-r from-secondary-500 to-secondary-600 text-secondary-foreground shadow-md hover:shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:-translate-y-0.5",
        ghost:
          "hover:bg-primary-50 hover:text-primary-700",
        link:
          "text-primary underline-offset-4 hover:underline",
        accent:
          "bg-gradient-accent text-accent-foreground shadow-md hover:shadow-glow-accent hover:-translate-y-0.5",
        soft:
          "bg-primary-100 text-primary-700 hover:bg-primary-200 hover:-translate-y-0.5",
        "soft-accent":
          "bg-accent-100 text-accent-700 hover:bg-accent-200 hover:-translate-y-0.5",
      },
      size: {
        default: "h-9 px-4 py-2 rounded-full",
        sm: "h-7 px-3 text-xs rounded-full",
        lg: "h-11 px-6 text-base rounded-full",
        xl: "h-12 px-8 text-base rounded-full",
        icon: "h-9 w-9 rounded-full",
        "icon-sm": "h-7 w-7 rounded-full",
        "icon-lg": "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

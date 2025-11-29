"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "./label"

export interface FormFieldProps {
  label?: string
  description?: string
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * FormField - Wrapper for form inputs with label, description, and error states.
 * Works with React Hook Form + Zod validation.
 *
 * Usage:
 * <FormField label="Email" error={errors.email?.message} required>
 *   <Input {...register("email")} error={!!errors.email} />
 * </FormField>
 */
const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, description, error, required, disabled, className, children }, ref) => {
    const id = React.useId()

    return (
      <div ref={ref} className={cn("space-y-1", className)}>
        {label && (
          <Label
            htmlFor={id}
            className={cn(
              "text-xs font-medium",
              disabled && "text-muted-foreground",
              error && "text-error-600"
            )}
          >
            {label}
            {required && <span className="text-error-500 ml-0.5">*</span>}
          </Label>
        )}

        {/* Clone child to inject id and aria attributes */}
        {React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
              id,
              "aria-describedby": error ? `${id}-error` : description ? `${id}-desc` : undefined,
              "aria-invalid": !!error,
              disabled,
            })
          : children}

        {/* Error takes priority over description */}
        {error ? (
          <p id={`${id}-error`} className="text-xs text-error-600">
            {error}
          </p>
        ) : description ? (
          <p id={`${id}-desc`} className="text-xs text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    )
  }
)
FormField.displayName = "FormField"

export { FormField }

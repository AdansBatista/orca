"use client"

import { useState, useCallback } from "react"

type ToastProps = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

type ToastState = {
  toasts: ToastProps[]
}

let toastCount = 0

export function useToast() {
  const [state, setState] = useState<ToastState>({ toasts: [] })

  const toast = useCallback(({ title, description, variant }: Omit<ToastProps, "id">) => {
    const id = String(toastCount++)
    setState((prev) => ({
      toasts: [...prev.toasts, { id, title, description, variant }],
    }))
    setTimeout(() => {
      setState((prev) => ({
        toasts: prev.toasts.filter((t) => t.id !== id),
      }))
    }, 5000)
  }, [])

  return { toasts: state.toasts, toast }
}

export function toast({ title, description, variant }: Omit<ToastProps, "id">) {
  // Standalone toast - for non-component usage
  console.log(`[Toast] ${title}: ${description}`)
}

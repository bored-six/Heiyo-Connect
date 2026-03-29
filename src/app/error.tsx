"use client"

import { useEffect } from "react"
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-50 p-4 border border-red-100">
            <AlertTriangleIcon className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. If this keeps happening, please refresh the page.
          </p>
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <RefreshCwIcon className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  )
}

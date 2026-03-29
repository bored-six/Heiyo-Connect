"use client"

import { useEffect } from "react"
import { AlertTriangleIcon, RefreshCwIcon, HomeIcon } from "lucide-react"
import Link from "next/link"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error boundary caught:", error)
  }, [error])

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-50 p-4 border border-red-100">
            <AlertTriangleIcon className="h-7 w-7 text-red-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Failed to load this page</h2>
          <p className="text-sm text-muted-foreground">
            Something went wrong while loading this section. Your data is safe.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <RefreshCwIcon className="h-3.5 w-3.5" />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <HomeIcon className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

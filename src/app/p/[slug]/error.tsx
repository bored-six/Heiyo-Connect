"use client"

import { useEffect } from "react"
import { AlertCircleIcon, RefreshCwIcon } from "lucide-react"

export default function PublicPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Public portal error boundary caught:", error)
  }, [error])

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 bg-background text-foreground"
    >
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="flex justify-center">
          <div
            className="rounded-full p-4"
            style={{
              backgroundColor: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.25)",
            }}
          >
            <AlertCircleIcon className="h-8 w-8 text-red-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Unable to load support portal
          </h2>
          <p className="text-sm text-muted-foreground">
            Something went wrong. Please try refreshing the page.
          </p>
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
          style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white" }}
        >
          <RefreshCwIcon className="h-4 w-4" />
          Try again
        </button>
      </div>
    </main>
  )
}

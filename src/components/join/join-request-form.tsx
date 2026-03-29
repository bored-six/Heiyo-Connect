"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { submitJoinRequest } from "@/actions/join-requests"
import { CheckCircle2 } from "lucide-react"

export function JoinRequestForm({
  tenantId,
  tenantName,
}: {
  tenantId: string
  tenantName: string
}) {
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await submitJoinRequest({ tenantId, message: message.trim() || undefined })
      if (result.success) {
        setSubmitted(true)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  if (submitted) {
    return (
      <div className="text-center space-y-3 py-4">
        <div className="flex justify-center">
          <CheckCircle2 className="size-10 text-emerald-500" />
        </div>
        <p className="text-sm font-medium">Request sent!</p>
        <p className="text-sm text-muted-foreground">
          The owners of <span className="font-medium">{tenantName}</span> will review your
          request. You&apos;ll be able to sign in once approved.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="message">
          Message <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Hi, I'd like to join to help with customer support..."
          rows={3}
          maxLength={500}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/50 placeholder:text-muted-foreground"
        />
        <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-foreground text-white text-sm font-medium py-2 hover:bg-foreground/90 transition-colors disabled:opacity-50"
      >
        {isPending ? "Sending request..." : "Send join request"}
      </button>
    </form>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { useTicketSocket } from "@/hooks/useTicketSocket"

export function NavUsageBar({
  initialUsage,
  dailyAiLimit,
  tenantId,
}: {
  initialUsage: number
  dailyAiLimit: number
  tenantId: string
}) {
  const [usage, setUsage] = useState(initialUsage)

  useTicketSocket({
    tenantId,
    onTicketCreated: () => setUsage((prev) => Math.min(prev + 1, dailyAiLimit)),
  })

  const usagePct = Math.round((usage / dailyAiLimit) * 100)
  const isAtLimit = usage >= dailyAiLimit

  return (
    <Link
      href="/dashboard/settings"
      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      title="AI requests used today — click to manage"
    >
      <div className="flex flex-col items-end gap-1 min-w-[100px]">
        <span className={isAtLimit ? "text-destructive font-semibold" : ""}>
          {isAtLimit ? "AI Limit Reached" : `AI: ${usage}/${dailyAiLimit}`}
        </span>
        <Progress value={usagePct} className="w-24 h-1.5" />
      </div>
    </Link>
  )
}

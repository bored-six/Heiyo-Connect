import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/tenant"

export type DailyVolumeEntry = {
  date: string
  created: number
  resolved: number
}

export type PriorityEntry = {
  name: string
  value: number
}

export type TenantAnalytics = {
  totalTickets: number
  aiSuccesses: number
  manualFallbacks: number
  efficiencyScore: number
  timeSavedMinutes: number
  dailyVolume: DailyVolumeEntry[]
  priorityDistribution: PriorityEntry[]
  aiProvider: string
}

export async function getTenantAnalytics(): Promise<TenantAnalytics> {
  const user = await requireUser()

  const [tickets, tenant] = await Promise.all([
    prisma.ticket.findMany({
      where: { tenantId: user.tenantId },
      select: {
        createdAt: true,
        resolvedAt: true,
        aiAnalyzedAt: true,
        aiPriority: true,
        status: true,
      },
    }),
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { aiProvider: true },
    }),
  ])

  const totalTickets = tickets.length
  const aiSuccesses = tickets.filter((t) => t.aiAnalyzedAt !== null).length
  const manualFallbacks = tickets.filter((t) => t.aiAnalyzedAt === null).length
  const efficiencyScore =
    totalTickets > 0 ? Math.round((aiSuccesses / totalTickets) * 100) : 0
  const timeSavedMinutes = aiSuccesses * 10

  // Build last-7-days daily volume
  const now = new Date()
  const dailyVolume: DailyVolumeEntry[] = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(now)
    dayStart.setDate(dayStart.getDate() - (6 - i))
    dayStart.setHours(0, 0, 0, 0)

    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const created = tickets.filter((t) => {
      const d = new Date(t.createdAt)
      return d >= dayStart && d < dayEnd
    }).length

    const resolved = tickets.filter((t) => {
      if (!t.resolvedAt) return false
      const d = new Date(t.resolvedAt)
      return d >= dayStart && d < dayEnd
    }).length

    return {
      date: dayStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      created,
      resolved,
    }
  })

  // Priority distribution from AI-assigned priorities only
  const priorityMap: Record<string, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  }
  for (const t of tickets) {
    if (t.aiPriority) {
      priorityMap[t.aiPriority]++
    }
  }

  const priorityDistribution: PriorityEntry[] = Object.entries(priorityMap)
    .filter(([, count]) => count > 0)
    .map(([name, value]) => ({ name, value }))

  return {
    totalTickets,
    aiSuccesses,
    manualFallbacks,
    efficiencyScore,
    timeSavedMinutes,
    dailyVolume,
    priorityDistribution,
    aiProvider: tenant?.aiProvider ?? "GEMINI",
  }
}

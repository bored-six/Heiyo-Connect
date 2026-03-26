"use client"

import Link from "next/link"
import { BarChart3, DatabaseIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts"
import type { TenantAnalytics } from "@/lib/analytics"

// ─── Priority colours ─────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#64748b",
  MEDIUM: "#eab308",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
}

// ─── Fade-up helper ───────────────────────────────────────────────────────────
function FadeUp({
  index,
  children,
  className,
}: {
  index: number
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-sm">
      <p className="text-muted-foreground mb-1 font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

// ─── Hero stat card ───────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  glowColor,
  index,
}: {
  label: string
  value: string
  sub?: string
  glowColor: string
  index: number
}) {
  return (
    <FadeUp index={index} className="rounded-xl border bg-card p-5 shadow-sm relative overflow-hidden">
      <div
        className="absolute -top-6 -right-6 h-20 w-20 rounded-full opacity-20 blur-2xl"
        style={{ background: glowColor }}
      />
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </FadeUp>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function ReportsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="rounded-full bg-muted p-5 mb-5">
        <BarChart3 className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No analytics data yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Analytics will appear here once you have tickets. Head to the dashboard
        to create your first ticket — or seed 15 demo tickets to see charts
        come to life right away.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <DatabaseIcon className="h-3.5 w-3.5" />
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function ReportsCharts({ data }: { data: TenantAnalytics }) {
  if (data.totalTickets === 0) {
    return <ReportsEmptyState />
  }

  const {
    totalTickets,
    aiSuccesses,
    manualFallbacks,
    efficiencyScore,
    timeSavedMinutes,
    dailyVolume,
    priorityDistribution,
    aiProvider,
  } = data

  const timeSavedLabel =
    timeSavedMinutes >= 60
      ? `${Math.round(timeSavedMinutes / 60)} hrs`
      : `${timeSavedMinutes} min`

  const aiVsManual = [
    { name: "AI Success", value: aiSuccesses, fill: "#6366f1" },
    { name: "Manual", value: manualFallbacks, fill: "#14B8A6" },
  ]

  return (
    <AnimatePresence>
      <div className="space-y-6">
        {/* ── Hero stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            index={0}
            label="Efficiency Score"
            value={`${efficiencyScore}%`}
            sub={`${aiSuccesses} of ${totalTickets} AI-handled`}
            glowColor="#6366f1"
          />
          <StatCard
            index={1}
            label="Time Saved"
            value={timeSavedLabel}
            sub="10 min per AI-resolved ticket"
            glowColor="#10b981"
          />
          <StatCard
            index={2}
            label="Active AI Provider"
            value={aiProvider}
            glowColor="#f59e0b"
          />
          <StatCard
            index={3}
            label="Total Tickets"
            value={String(totalTickets)}
            sub="All time"
            glowColor="#3b82f6"
          />
        </div>

        {/* ── Area chart: 7-day volume ── */}
        <FadeUp index={4} className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold mb-4">Ticket Volume — Last 7 Days</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyVolume} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="created"
                name="Created"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#gradCreated)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="resolved"
                name="Resolved"
                stroke="#0EA5E9"
                strokeWidth={2}
                fill="url(#gradResolved)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </FadeUp>

        {/* ── Bottom row: Pie + Bar ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Priority pie */}
          <FadeUp index={5} className="rounded-xl border bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold mb-4">AI Priority Distribution</p>
            {priorityDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                No AI-analyzed tickets yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={priorityDistribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {priorityDistribution.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={PRIORITY_COLORS[entry.name] ?? "#6366f1"}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </FadeUp>

          {/* AI vs Manual bar */}
          <FadeUp index={6} className="rounded-xl border bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold mb-4">AI vs Manual Handling</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={aiVsManual}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                barSize={48}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" name="Tickets" radius={[6, 6, 0, 0]}>
                  {aiVsManual.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </FadeUp>
        </div>
      </div>
    </AnimatePresence>
  )
}

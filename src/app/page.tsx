import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import {
  BotIcon,
  ZapIcon,
  BarChart3Icon,
  ArrowRightIcon,
  ShieldIcon,
  SparklesIcon,
} from "lucide-react"

export default async function Home() {
  const { userId } = await auth()
  if (userId) redirect("/dashboard")

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "#F8FAFC", color: "#1E293B" }}
    >
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav style={{ borderBottom: "1px solid #E2E8F0" }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-4 w-4" style={{ color: "#6366F1" }} />
            <span className="font-semibold text-base tracking-tight" style={{ color: "#1E293B" }}>
              Heiyo Connect
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm transition-colors"
              style={{ color: "#64748B" }}
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-all"
              style={{
                background: "linear-gradient(135deg, #6366F1, #4F46E5)",
                color: "white",
                boxShadow: "0 2px 8px rgba(99,102,241,0.25)",
              }}
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-8 text-center">
        {/* Tech badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs mb-6"
          style={{
            border: "1px solid #C7D2FE",
            backgroundColor: "#EEF2FF",
            color: "#6366F1",
          }}
        >
          <BotIcon className="h-3.5 w-3.5" />
          Powered by Gemini &amp; Real-time Pusher Channels
        </div>

        <h1
          className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight mb-4"
          style={{ color: "#1E293B" }}
        >
          Support at the{" "}
          <span
            style={{
              background:
                "linear-gradient(135deg, #6366F1 0%, #818CF8 50%, #A5B4FC 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            speed of AI
          </span>
        </h1>

        <p
          className="text-lg max-w-xl mx-auto mb-3 font-medium tracking-wide"
          style={{ color: "#475569" }}
        >
          Multi-tenant · Real-time · Orchestrated.
        </p>

        <p
          className="text-base max-w-xl mx-auto mb-10 leading-relaxed"
          style={{ color: "#64748B" }}
        >
          Heiyo Connect gives your team AI-drafted replies, auto-prioritised
          queues, and live Pusher toasts — so customers get faster answers and
          agents never miss an escalation.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <a
            href="/demo"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all"
            style={{
              background: "linear-gradient(135deg, #6366F1, #4F46E5)",
              color: "white",
              boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
            }}
          >
            Try live demo
            <ArrowRightIcon className="h-4 w-4" />
          </a>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-colors"
            style={{
              border: "1px solid #E2E8F0",
              color: "#475569",
              backgroundColor: "#FFFFFF",
            }}
          >
            Create free account
          </Link>
        </div>

        <p className="text-xs mb-12" style={{ color: "#94A3B8" }}>
          No account required · Pre-loaded with real-looking data · Read-only access
        </p>

        {/* ── Dashboard Mockup ────────────────────────────────────── */}
        <div className="relative max-w-4xl mx-auto">
          {/* Soft pale-blue radial gradient */}
          <div
            className="absolute inset-x-0 top-0 -translate-y-1/3 h-72 blur-3xl pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.08) 0%, rgba(14,165,233,0.05) 50%, transparent 70%)",
            }}
          />

          {/* Mockup shell */}
          <div
            className="relative rounded-xl overflow-hidden text-left"
            style={{
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 4px 24px rgba(99,102,241,0.06), 0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            {/* Mockup top bar */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}
            >
              <div className="h-2.5 w-2.5 rounded-full bg-red-400 opacity-70" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400 opacity-70" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-70" />
              <div
                className="ml-3 flex-1 rounded text-xs px-3 py-0.5 max-w-64"
                style={{
                  backgroundColor: "#F1F5F9",
                  color: "#64748B",
                }}
              >
                heiyo.app/dashboard
              </div>
            </div>

            {/* Mockup content */}
            <div className="p-5">
              {/* Header row */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div
                    className="text-sm font-semibold mb-0.5"
                    style={{ color: "#1E293B" }}
                  >
                    Acme Corp — Support Dashboard
                  </div>
                  <div className="text-xs" style={{ color: "#94A3B8" }}>
                    Welcome back, Alex
                  </div>
                </div>
                {/* AI pill */}
                <div
                  className="flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1"
                  style={{
                    backgroundColor: "#F0FDF4",
                    color: "#16A34A",
                    border: "1px solid #BBF7D0",
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  AI: Gemini 2.0 Flash
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { label: "Open", value: "8", color: "#6366F1" },
                  { label: "In Progress", value: "3", color: "#0EA5E9" },
                  { label: "Critical", value: "2", color: "#EF4444" },
                  { label: "Resolved", value: "4", color: "#64748B" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg p-3"
                    style={{
                      backgroundColor: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <div className="text-xs mb-1" style={{ color: "#94A3B8" }}>
                      {s.label}
                    </div>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: s.color }}
                    >
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Ticket rows */}
              <div
                className="rounded-lg overflow-hidden"
                style={{ border: "1px solid #E2E8F0" }}
              >
                {/* Table header */}
                <div
                  className="grid text-xs px-4 py-2"
                  style={{
                    gridTemplateColumns: "1fr 140px 90px 90px",
                    borderBottom: "1px solid #E2E8F0",
                    color: "#94A3B8",
                    backgroundColor: "#F8FAFC",
                  }}
                >
                  <span>Subject</span>
                  <span>Customer</span>
                  <span>Status</span>
                  <span>Priority</span>
                </div>

                {[
                  {
                    subject: "API returning 503 for enterprise accounts",
                    customer: "Priya M.",
                    status: "IN PROGRESS",
                    statusColor: "#2563EB",
                    statusBg: "#DBEAFE",
                    priority: "CRITICAL",
                    priorityColor: "#DC2626",
                    priorityBg: "#FEE2E2",
                  },
                  {
                    subject: "Data export contains rows from different tenant",
                    customer: "James O.",
                    status: "OPEN",
                    statusColor: "#7C3AED",
                    statusBg: "#EDE9FE",
                    priority: "CRITICAL",
                    priorityColor: "#DC2626",
                    priorityBg: "#FEE2E2",
                  },
                  {
                    subject: "SSO broken after maintenance window",
                    customer: "Hannah P.",
                    status: "IN PROGRESS",
                    statusColor: "#2563EB",
                    statusBg: "#DBEAFE",
                    priority: "HIGH",
                    priorityColor: "#EA580C",
                    priorityBg: "#FFEDD5",
                  },
                  {
                    subject: "Analytics charts blank on Safari 16",
                    customer: "Carlos R.",
                    status: "OPEN",
                    statusColor: "#7C3AED",
                    statusBg: "#EDE9FE",
                    priority: "MEDIUM",
                    priorityColor: "#0369A1",
                    priorityBg: "#E0F2FE",
                  },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="grid items-center px-4 py-2.5 text-xs"
                    style={{
                      gridTemplateColumns: "1fr 140px 90px 90px",
                      borderBottom: i < 3 ? "1px solid #F1F5F9" : "none",
                    }}
                  >
                    <span
                      className="truncate pr-4 font-medium"
                      style={{ color: "#1E293B" }}
                    >
                      {row.subject}
                    </span>
                    <span style={{ color: "#64748B" }}>{row.customer}</span>
                    <span>
                      <span
                        className="rounded px-1.5 py-0.5 text-xs font-medium"
                        style={{
                          color: row.statusColor,
                          backgroundColor: row.statusBg,
                          border: `0.5px solid ${row.statusColor}40`,
                        }}
                      >
                        {row.status}
                      </span>
                    </span>
                    <span>
                      <span
                        className="rounded px-1.5 py-0.5 text-xs font-medium"
                        style={{
                          color: row.priorityColor,
                          backgroundColor: row.priorityBg,
                          border: `0.5px solid ${row.priorityColor}40`,
                        }}
                      >
                        {row.priority}
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              {/* Pusher toast preview */}
              <div
                className="mt-4 flex items-start gap-3 rounded-lg px-4 py-3 text-xs"
                style={{
                  backgroundColor: "#EEF2FF",
                  border: "1px solid #C7D2FE",
                }}
              >
                <ZapIcon
                  className="h-3.5 w-3.5 shrink-0 mt-0.5"
                  style={{ color: "#6366F1" }}
                />
                <div>
                  <span style={{ color: "#4338CA" }} className="font-semibold">
                    New ticket · AI priority:{" "}
                  </span>
                  <span style={{ color: "#DC2626" }} className="font-semibold">
                    CRITICAL
                  </span>
                  <span style={{ color: "#64748B" }}>
                    {" "}
                    · "Production payment gateway down" — just now
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tech Stack Marquee ───────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <p
          className="text-center text-xs uppercase tracking-widest mb-6"
          style={{ color: "#94A3B8" }}
        >
          Built with production-grade tooling
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {[
            { label: "Next.js 16", dot: "#1E293B" },
            { label: "React 19", dot: "#61DAFB" },
            { label: "Pusher Channels", dot: "#300D4F" },
            { label: "Gemini 2.0 Flash", dot: "#4285F4" },
            { label: "Prisma ORM", dot: "#5A67D8" },
            { label: "Clerk Auth", dot: "#7C3AED" },
            { label: "PostgreSQL", dot: "#336791" },
            { label: "Tailwind CSS 4", dot: "#38BDF8" },
          ].map((t) => (
            <div
              key={t.label}
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: "#64748B" }}
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: t.dot }}
              />
              {t.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature grid ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {[
            {
              icon: (
                <BotIcon className="h-5 w-5" style={{ color: "#6366F1" }} />
              ),
              iconBg: "#EEF2FF",
              title: "AI Triage & Reply Drafts",
              body: "Every ticket is scored for urgency and paired with an AI-drafted response — context-aware, ready to send in one click. Gemini 2.0 Flash runs triage in the background without blocking the agent.",
            },
            {
              icon: (
                <ZapIcon className="h-5 w-5" style={{ color: "#0EA5E9" }} />
              ),
              iconBg: "#E0F2FE",
              title: "Real-time Pusher Toasts",
              body: "Pusher Channels keeps every agent in sync. New tickets stream live with AI-assigned priority the moment analysis completes — no refresh needed, no missed escalations.",
            },
            {
              icon: (
                <BarChart3Icon
                  className="h-5 w-5"
                  style={{ color: "#14B8A6" }}
                />
              ),
              iconBg: "#F0FDFA",
              title: "Executive Analytics",
              body: "Track AI efficiency scores, response-time savings, and priority distributions with a live analytics dashboard built for leadership review.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl p-5"
              style={{
                border: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
              }}
            >
              <div
                className="inline-flex rounded-lg p-2 mb-3"
                style={{ backgroundColor: f.iconBg }}
              >
                {f.icon}
              </div>
              <h3
                className="font-semibold mb-1.5"
                style={{ color: "#1E293B" }}
              >
                {f.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#64748B" }}
              >
                {f.body}
              </p>
            </div>
          ))}
        </div>

        {/* ── Get Started CTA strip ───────────────────────────────────── */}
        <div
          className="rounded-xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{
            background: "#EEF2FF",
            border: "1px solid #C7D2FE",
          }}
        >
          <div>
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium mb-2"
              style={{
                backgroundColor: "#E0E7FF",
                color: "#4338CA",
              }}
            >
              <ShieldIcon className="h-3 w-3" />
              Multi-tenant · Row-level isolation · SOC2-ready architecture
            </div>
            <h3
              className="text-xl font-semibold mb-1"
              style={{ color: "#1E293B" }}
            >
              Ready to see it in action?
            </h3>
            <p className="text-sm" style={{ color: "#64748B" }}>
              Explore a fully populated support dashboard — no sign-up needed.
            </p>
          </div>
          <a
            href="/demo"
            className="shrink-0 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all whitespace-nowrap"
            style={{
              background: "linear-gradient(135deg, #6366F1, #4F46E5)",
              color: "white",
              boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
            }}
          >
            Open demo dashboard
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <p
          className="text-center text-xs mt-10"
          style={{ color: "#94A3B8" }}
        >
          Built with Next.js 16 · React 19 · Clerk · Prisma · Pusher Channels · Gemini 2.0
        </p>
      </section>
    </main>
  )
}

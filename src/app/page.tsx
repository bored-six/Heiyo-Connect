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
      style={{ backgroundColor: "#09090f", color: "#f1f5f9" }}
    >
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-4 w-4" style={{ color: "#818cf8" }} />
            <span className="font-semibold text-base tracking-tight text-white">
              Heiyo Connect
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm transition-colors"
              style={{ color: "#94a3b8" }}
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-all"
              style={{
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                color: "white",
                boxShadow: "0 0 16px rgba(99,102,241,0.3)",
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
            border: "1px solid rgba(99,102,241,0.3)",
            backgroundColor: "rgba(99,102,241,0.08)",
            color: "#a5b4fc",
          }}
        >
          <BotIcon className="h-3.5 w-3.5" />
          Powered by Gemini &amp; Real-time Pusher Channels
        </div>

        <h1
          className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight mb-4"
          style={{ color: "#f8fafc" }}
        >
          Support at the{" "}
          <span
            style={{
              background:
                "linear-gradient(135deg, #a5b4fc 0%, #818cf8 50%, #6366f1 100%)",
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
          style={{ color: "#cbd5e1" }}
        >
          Multi-tenant · Real-time · Orchestrated.
        </p>

        <p
          className="text-base max-w-xl mx-auto mb-10 leading-relaxed"
          style={{ color: "#94a3b8" }}
        >
          Heiyo Connect gives your team AI-drafted replies, auto-prioritised
          queues, and live Pusher toasts — so customers get faster answers and
          agents never miss an escalation.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <a
            href="/api/demo"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all"
            style={{
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "white",
              boxShadow: "0 0 28px rgba(99,102,241,0.4)",
            }}
          >
            Try live demo
            <ArrowRightIcon className="h-4 w-4" />
          </a>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-colors"
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#e2e8f0",
              backgroundColor: "rgba(255,255,255,0.04)",
            }}
          >
            Create free account
          </Link>
        </div>

        <p className="text-xs mb-12" style={{ color: "#64748b" }}>
          No account required · Pre-loaded with real-looking data · Read-only access
        </p>

        {/* ── Dashboard Mockup with Glow ──────────────────────────── */}
        <div className="relative max-w-4xl mx-auto">
          {/* Glow blob behind the mockup */}
          <div
            className="absolute inset-x-0 top-0 -translate-y-1/3 h-72 blur-3xl pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.35) 0%, rgba(79,70,229,0.15) 50%, transparent 70%)",
            }}
          />

          {/* Mockup shell */}
          <div
            className="relative rounded-xl overflow-hidden text-left"
            style={{
              border: "1px solid rgba(99,102,241,0.25)",
              backgroundColor: "rgba(15,15,25,0.95)",
              boxShadow:
                "0 0 0 1px rgba(99,102,241,0.1), 0 32px 64px -16px rgba(0,0,0,0.6)",
            }}
          >
            {/* Mockup top bar */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="h-2.5 w-2.5 rounded-full bg-red-500 opacity-70" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500 opacity-70" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 opacity-70" />
              <div
                className="ml-3 flex-1 rounded text-xs px-3 py-0.5 max-w-64"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "#64748b",
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
                    style={{ color: "#f1f5f9" }}
                  >
                    Acme Corp — Support Dashboard
                  </div>
                  <div className="text-xs" style={{ color: "#64748b" }}>
                    Welcome back, Alex
                  </div>
                </div>
                {/* AI pill */}
                <div
                  className="flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1"
                  style={{
                    backgroundColor: "rgba(16,185,129,0.1)",
                    color: "#34d399",
                    border: "1px solid rgba(16,185,129,0.2)",
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  AI: Gemini 2.0 Flash
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { label: "Open", value: "8", color: "#34d399" },
                  { label: "In Progress", value: "3", color: "#60a5fa" },
                  { label: "Critical", value: "2", color: "#f87171" },
                  { label: "Resolved", value: "4", color: "#94a3b8" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg p-3"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <div className="text-xs mb-1" style={{ color: "#64748b" }}>
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
                style={{ border: "1px solid rgba(255,255,255,0.07)" }}
              >
                {/* Table header */}
                <div
                  className="grid text-xs px-4 py-2"
                  style={{
                    gridTemplateColumns: "1fr 140px 90px 90px",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    color: "#64748b",
                    backgroundColor: "rgba(255,255,255,0.02)",
                  }}
                >
                  <span>Subject</span>
                  <span>Customer</span>
                  <span>Status</span>
                  <span>Priority</span>
                </div>

                {/* Ticket rows */}
                {[
                  {
                    subject: "API returning 503 for enterprise accounts",
                    customer: "Priya M.",
                    status: "IN PROGRESS",
                    statusColor: "#60a5fa",
                    statusBg: "rgba(96,165,250,0.12)",
                    priority: "CRITICAL",
                    priorityColor: "#f87171",
                    priorityBg: "rgba(248,113,113,0.12)",
                  },
                  {
                    subject: "Data export contains rows from different tenant",
                    customer: "James O.",
                    status: "OPEN",
                    statusColor: "#34d399",
                    statusBg: "rgba(52,211,153,0.12)",
                    priority: "CRITICAL",
                    priorityColor: "#f87171",
                    priorityBg: "rgba(248,113,113,0.12)",
                  },
                  {
                    subject: "SSO broken after maintenance window",
                    customer: "Hannah P.",
                    status: "IN PROGRESS",
                    statusColor: "#60a5fa",
                    statusBg: "rgba(96,165,250,0.12)",
                    priority: "HIGH",
                    priorityColor: "#fb923c",
                    priorityBg: "rgba(251,146,60,0.12)",
                  },
                  {
                    subject: "Analytics charts blank on Safari 16",
                    customer: "Carlos R.",
                    status: "OPEN",
                    statusColor: "#34d399",
                    statusBg: "rgba(52,211,153,0.12)",
                    priority: "MEDIUM",
                    priorityColor: "#60a5fa",
                    priorityBg: "rgba(96,165,250,0.12)",
                  },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="grid items-center px-4 py-2.5 text-xs"
                    style={{
                      gridTemplateColumns: "1fr 140px 90px 90px",
                      borderBottom:
                        i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    }}
                  >
                    <span
                      className="truncate pr-4 font-medium"
                      style={{ color: "#e2e8f0" }}
                    >
                      {row.subject}
                    </span>
                    <span style={{ color: "#94a3b8" }}>{row.customer}</span>
                    <span>
                      <span
                        className="rounded px-1.5 py-0.5 text-xs font-medium"
                        style={{
                          color: row.statusColor,
                          backgroundColor: row.statusBg,
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
                  backgroundColor: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.25)",
                }}
              >
                <ZapIcon
                  className="h-3.5 w-3.5 shrink-0 mt-0.5"
                  style={{ color: "#818cf8" }}
                />
                <div>
                  <span style={{ color: "#a5b4fc" }} className="font-semibold">
                    New ticket · AI priority:{" "}
                  </span>
                  <span style={{ color: "#f87171" }} className="font-semibold">
                    CRITICAL
                  </span>
                  <span style={{ color: "#64748b" }}>
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
          style={{ color: "#475569" }}
        >
          Built with production-grade tooling
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {[
            { label: "Next.js 16", dot: "#f1f5f9" },
            { label: "React 19", dot: "#61dafb" },
            { label: "Pusher Channels", dot: "#300D4F" },
            { label: "Gemini 2.0 Flash", dot: "#4285f4" },
            { label: "Prisma ORM", dot: "#5a67d8" },
            { label: "Clerk Auth", dot: "#7c3aed" },
            { label: "PostgreSQL", dot: "#336791" },
            { label: "Tailwind CSS 4", dot: "#38bdf8" },
          ].map((t) => (
            <div
              key={t.label}
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: "#94a3b8" }}
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
                <BotIcon className="h-5 w-5" style={{ color: "#818cf8" }} />
              ),
              accent: "#6366f1",
              title: "AI Triage & Reply Drafts",
              body: "Every ticket is scored for urgency and paired with an AI-drafted response — context-aware, ready to send in one click. Gemini 2.0 Flash runs triage in the background without blocking the agent.",
            },
            {
              icon: (
                <ZapIcon className="h-5 w-5" style={{ color: "#34d399" }} />
              ),
              accent: "#10b981",
              title: "Real-time Pusher Toasts",
              body: "Pusher Channels keeps every agent in sync. New tickets stream live with AI-assigned priority the moment analysis completes — no refresh needed, no missed escalations.",
            },
            {
              icon: (
                <BarChart3Icon
                  className="h-5 w-5"
                  style={{ color: "#f59e0b" }}
                />
              ),
              accent: "#f59e0b",
              title: "Executive Analytics",
              body: "Track AI efficiency scores, response-time savings, and priority distributions with a live analytics dashboard built for leadership review.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl p-5 relative overflow-hidden"
              style={{
                border: "1px solid rgba(255,255,255,0.07)",
                backgroundColor: "rgba(255,255,255,0.02)",
              }}
            >
              {/* Subtle glow blob */}
              <div
                className="absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-10 blur-3xl pointer-events-none"
                style={{ background: f.accent }}
              />
              <div className="mb-3 relative">{f.icon}</div>
              <h3
                className="font-semibold mb-1.5 relative"
                style={{ color: "#f1f5f9" }}
              >
                {f.title}
              </h3>
              <p
                className="text-sm leading-relaxed relative"
                style={{ color: "#94a3b8" }}
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
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(79,70,229,0.06))",
            border: "1px solid rgba(99,102,241,0.22)",
          }}
        >
          <div>
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium mb-2"
              style={{
                backgroundColor: "rgba(99,102,241,0.15)",
                color: "#a5b4fc",
              }}
            >
              <ShieldIcon className="h-3 w-3" />
              Multi-tenant · Row-level isolation · SOC2-ready architecture
            </div>
            <h3
              className="text-xl font-semibold mb-1"
              style={{ color: "#f8fafc" }}
            >
              Ready to see it in action?
            </h3>
            <p className="text-sm" style={{ color: "#94a3b8" }}>
              Explore a fully populated support dashboard — no sign-up needed.
            </p>
          </div>
          <a
            href="/api/demo"
            className="shrink-0 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all whitespace-nowrap"
            style={{
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "white",
              boxShadow: "0 0 20px rgba(99,102,241,0.3)",
            }}
          >
            Open demo dashboard
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <p
          className="text-center text-xs mt-10"
          style={{ color: "#475569" }}
        >
          Built with Next.js 16 · React 19 · Clerk · Prisma · Pusher Channels · Gemini 2.0
        </p>
      </section>
    </main>
  )
}

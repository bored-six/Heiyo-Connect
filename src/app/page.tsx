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
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
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
          Powered by Gemini 2.0 &amp; Llama 3.1
        </div>

        <h1
          className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight mb-5"
          style={{ color: "#f8fafc" }}
        >
          Support tickets that{" "}
          <span
            style={{
              background:
                "linear-gradient(135deg, #a5b4fc 0%, #818cf8 50%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            think ahead
          </span>
        </h1>

        <p
          className="text-lg max-w-xl mx-auto mb-10 leading-relaxed"
          style={{ color: "#94a3b8" }}
        >
          Heiyo Connect gives your team AI-drafted replies, auto-prioritised
          queues, and real-time collaboration — so customers get faster answers
          and agents stay in flow.
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

        <p className="text-xs" style={{ color: "#64748b" }}>
          No account required · Pre-loaded with real-looking data · Read-only
          access
        </p>
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
              body: "Every ticket is scored for urgency and paired with an AI-drafted response — context-aware, ready to send in one click. Gemini 2.0 and Llama 3.1 run in parallel with automatic fallback.",
            },
            {
              icon: (
                <ZapIcon className="h-5 w-5" style={{ color: "#34d399" }} />
              ),
              accent: "#10b981",
              title: "Real-time Collaboration",
              body: "Socket.io keeps every agent in sync. Ticket updates, new messages, and AI-assigned priorities stream live — no refresh needed, no missed escalations.",
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
          Built with Next.js 16 · Clerk · Prisma · Socket.io · Gemini 2.0 · Llama 3.1
        </p>
      </section>
    </main>
  )
}

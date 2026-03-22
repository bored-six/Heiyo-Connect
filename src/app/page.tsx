import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import {
  BotIcon,
  InboxIcon,
  ShieldCheckIcon,
  ZapIcon,
  ArrowRightIcon,
} from "lucide-react"

export default async function Home() {
  const { userId } = await auth()
  if (userId) redirect("/dashboard")

  return (
    <main className="min-h-screen bg-background">
      {/* ── Nav ───────────────────────────────────── */}
      <nav className="border-b">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-semibold text-base tracking-tight">Heiyo Connect</span>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3 py-1 text-xs text-muted-foreground mb-6">
          <BotIcon className="h-3.5 w-3.5" />
          AI-powered support, built for teams
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-5">
          Support tickets that{" "}
          <span className="text-primary">think ahead</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
          Heiyo Connect gives your team AI-drafted replies, auto-prioritised queues, and real-time
          collaboration — so customers get faster answers and agents stay in flow.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Primary CTA — demo */}
          <a
            href="/api/demo"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            Try live demo
            <ArrowRightIcon className="h-4 w-4" />
          </a>

          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-md border px-6 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            Create free account
          </Link>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          No account required · Pre-loaded with real-looking data · Read-only access
        </p>
      </section>

      {/* ── Feature grid ──────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              icon: <BotIcon className="h-5 w-5 text-primary" />,
              title: "AI-drafted replies",
              body: "Gemini analyses every incoming ticket and drafts a context-aware suggested response — ready to send or edit in one click.",
            },
            {
              icon: <ZapIcon className="h-5 w-5 text-primary" />,
              title: "Auto priority scoring",
              body: "Critical issues surface instantly. The AI scores urgency from the ticket content so your team always works the right thing first.",
            },
            {
              icon: <InboxIcon className="h-5 w-5 text-primary" />,
              title: "Multi-channel inbox",
              body: "Email, chat, phone, social, and API — all routed into one unified queue. Real-time updates keep every agent in sync.",
            },
            {
              icon: <ShieldCheckIcon className="h-5 w-5 text-primary" />,
              title: "Multi-tenant isolation",
              body: "Each workspace is fully isolated. Your data never touches another organisation's — enforced at the query layer, not just the UI.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-lg border bg-card p-5 shadow-sm"
            >
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-medium mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}

          {/* Demo CTA card */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-primary uppercase tracking-wide mb-2">
                Live demo
              </p>
              <h3 className="font-medium mb-1.5">See it in action</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Click below to instantly sign in as a demo agent and explore a fully populated
                support dashboard — no sign-up needed.
              </p>
            </div>
            <a
              href="/api/demo"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors self-start"
            >
              Open demo dashboard
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

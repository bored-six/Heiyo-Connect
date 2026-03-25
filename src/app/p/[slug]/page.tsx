import { notFound } from "next/navigation"
import { SparklesIcon, MessageSquareIcon } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { PublicTicketForm } from "./public-ticket-form"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { name: true },
  })
  if (!tenant) return { title: "Support Portal Not Found" }
  return { title: `${tenant.name} — Submit a Support Ticket` }
}

export default async function PublicPortalPage({ params }: Props) {
  const { slug } = await params

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, name: true },
  })

  if (!tenant) notFound()

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#09090f", color: "#f1f5f9" }}
    >
      {/* ── Header ───────────────────────────────────────────────── */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-4 w-4" style={{ color: "#818cf8" }} />
            <span className="font-semibold text-sm tracking-tight text-white">
              {tenant.name}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "rgba(99,102,241,0.1)",
                color: "#a5b4fc",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              Support
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "#64748b" }}>
            <span
              className="h-1.5 w-1.5 rounded-full bg-emerald-400"
            />
            AI-powered
          </div>
        </div>
      </header>

      {/* ── Form card ────────────────────────────────────────────── */}
      <div className="flex-1 flex items-start justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Page title */}
          <div className="mb-8">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs mb-4"
              style={{
                border: "1px solid rgba(99,102,241,0.3)",
                backgroundColor: "rgba(99,102,241,0.08)",
                color: "#a5b4fc",
              }}
            >
              <MessageSquareIcon className="h-3 w-3" />
              New support ticket
            </div>
            <h1
              className="text-2xl font-bold tracking-tight mb-2"
              style={{ color: "#f8fafc" }}
            >
              How can we help?
            </h1>
            <p className="text-sm" style={{ color: "#94a3b8" }}>
              Fill out the form below and the {tenant.name} support team will
              get back to you. Our AI will triage your request to prioritise
              response time.
            </p>
          </div>

          {/* Form */}
          <div
            className="rounded-xl p-6"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "rgba(255,255,255,0.02)",
            }}
          >
            <PublicTicketForm slug={slug} tenantName={tenant.name} />
          </div>

          {/* Footer */}
          <p
            className="text-center text-xs mt-6"
            style={{ color: "#334155" }}
          >
            Powered by{" "}
            <span style={{ color: "#475569" }}>Heiyo Connect</span>
          </p>
        </div>
      </div>
    </main>
  )
}

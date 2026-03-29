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
      className="min-h-screen flex flex-col bg-background text-foreground"
    >
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="border-b border-border">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm tracking-tight text-foreground">
              {tenant.name}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              Support
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs mb-4 border border-primary/30 bg-primary/10 text-primary"
            >
              <MessageSquareIcon className="h-3 w-3" />
              New support ticket
            </div>
            <h1
              className="text-2xl font-bold tracking-tight mb-2 text-foreground"
            >
              How can we help?
            </h1>
            <p className="text-sm text-muted-foreground">
              Fill out the form below and the {tenant.name} support team will
              get back to you. Our AI will triage your request to prioritise
              response time.
            </p>
          </div>

          {/* Form */}
          <div
            className="rounded-xl p-6 border border-border bg-card/50"
          >
            <PublicTicketForm slug={slug} tenantName={tenant.name} />
          </div>

          {/* Footer */}
          <p
            className="text-center text-xs mt-6 text-muted-foreground"
          >
            Powered by{" "}
            <span className="text-foreground/70">Heiyo Connect</span>
          </p>
        </div>
      </div>
    </main>
  )
}

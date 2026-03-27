import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { analyzeTicketWithProvider } from "@/lib/ai-gateway"
import { emitTicketCreated } from "@/lib/pusher-server"
import { Priority, Channel } from "@prisma/client"

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter — 5 submissions per IP per 10 minutes.
// Good enough for a portfolio/demo; swap for Upstash Redis in production.
// ---------------------------------------------------------------------------
const WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const MAX_REQUESTS = 5

const ipMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = ipMap.get(ip)

  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }

  if (entry.count >= MAX_REQUESTS) return true

  entry.count++
  return false
}

const PublicTicketSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email required"),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(200),
  description: z.string().min(10, "Please provide more detail (min 10 characters)"),
})

export async function POST(req: NextRequest) {
  // Rate limiting — check IP from Vercel/proxy headers, fall back to direct
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes before submitting again." },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const data = PublicTicketSchema.parse(body)

    // Look up tenant by slug — public, no auth required
    const tenant = await prisma.tenant.findUnique({
      where: { slug: data.slug },
      select: { id: true, name: true },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: "Support portal not found. Check the URL and try again." },
        { status: 404 }
      )
    }

    // Upsert customer — unique per tenant + email
    const customer = await prisma.customer.upsert({
      where: {
        tenantId_email: { tenantId: tenant.id, email: data.email },
      },
      create: { name: data.name, email: data.email, tenantId: tenant.id },
      update: { name: data.name },
    })

    // Create the ticket (unassigned — agent team picks it up)
    const ticket = await prisma.ticket.create({
      data: {
        subject: data.subject,
        description: data.description,
        channel: Channel.CHAT, // web form
        priority: Priority.MEDIUM, // AI will override
        tenantId: tenant.id,
        customerId: customer.id,
      },
    })

    // Fire AI analysis + Pusher emit in background — don't block the response
    analyzeAndEmit(
      ticket.id,
      data.subject,
      data.description,
      tenant.id,
      data.name,
      data.email,
      ticket.createdAt.toISOString()
    )

    return NextResponse.json({ success: true, ticketId: ticket.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("public-ticket route error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}

/**
 * Mirrors analyzeTicketAsync from src/actions/tickets.ts — runs AI triage then
 * emits a Pusher ticket:created event with the AI-assigned priority.
 * Called fire-and-forget so the public form responds immediately.
 */
async function analyzeAndEmit(
  ticketId: string,
  subject: string,
  description: string,
  tenantId: string,
  customerName: string,
  customerEmail: string,
  createdAt: string
) {
  try {
    const analysis = await analyzeTicketWithProvider(subject, description, tenantId)

    const updated = await prisma.ticket.update({
      where: { id: ticketId, tenantId },
      data: {
        aiSuggestedResponse: analysis.suggestedResponse,
        aiPriority: analysis.priority as Priority,
        aiAnalyzedAt: new Date(),
        tags: analysis.tags,
        ...(!analysis.limitExceeded && { priority: analysis.priority as Priority }),
      },
      select: { priority: true, status: true },
    })

    await emitTicketCreated(tenantId, {
      ticket: {
        id: ticketId,
        subject,
        priority: updated.priority,
        status: updated.status,
        createdAt,
        customer: { name: customerName, email: customerEmail },
      },
    })
  } catch (err) {
    console.error("public-ticket AI/emit failed for", ticketId, err)
  }
}

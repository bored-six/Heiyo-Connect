import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { Mistral } from "@mistralai/mistralai";
import { z } from "zod";
import { prisma } from "./prisma";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

const AIAnalysisSchema = z.object({
  suggestedResponse: z.string(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  priorityReason: z.string(),
  summary: z.string(),
  tags: z.array(z.string()),
});

export type AITicketAnalysis = z.infer<typeof AIAnalysisSchema>;

export type GatewayAnalysisResult = AITicketAnalysis & {
  limitExceeded?: boolean;
};

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const LIMIT_EXCEEDED_FALLBACK: GatewayAnalysisResult = {
  suggestedResponse:
    "Thank you for reaching out. Our team is currently at capacity and will review your ticket manually. We appreciate your patience and will respond as soon as possible.",
  priority: "MEDIUM",
  priorityReason: "Manual review required — daily AI analysis limit reached",
  summary: "Pending manual review",
  tags: ["manual-review"],
  limitExceeded: true,
};

const PROVIDER_FAILURE_FALLBACK: AITicketAnalysis = {
  suggestedResponse:
    "Thank you for reaching out. We have received your request and our team will review it shortly.",
  priority: "MEDIUM",
  priorityReason: "Default priority — AI analysis unavailable",
  summary: "AI analysis unavailable",
  tags: [],
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Returns true if lastReset is from a previous UTC day — signals a daily reset is needed.
 */
function isNewUtcDay(lastReset: Date): boolean {
  const resetDay = lastReset.toISOString().slice(0, 10); // "YYYY-MM-DD"
  const today = new Date().toISOString().slice(0, 10);
  return resetDay < today;
}

function buildPrompt(
  subject: string,
  description: string,
  customerContext: string
): string {
  return `
You are an expert customer support AI assistant. Analyze this support ticket and provide a structured response.

## Ticket Subject
${subject}

## Ticket Description
${description}

${customerContext}

## Instructions
Respond with a JSON object matching this exact schema:
{
  "suggestedResponse": "A professional, empathetic response to send to the customer (2-4 paragraphs)",
  "priority": "One of: LOW, MEDIUM, HIGH, CRITICAL",
  "priorityReason": "One sentence explaining why this priority was chosen",
  "summary": "One sentence summarizing the issue",
  "tags": ["array", "of", "relevant", "tags", "max 5"]
}

Priority Guidelines:
- CRITICAL: System down, data loss, security breach, payment failure
- HIGH: Core feature broken, significant business impact, deadline risk
- MEDIUM: Feature degraded, workaround exists, moderate impact
- LOW: Question, cosmetic issue, feature request, minor inconvenience
`.trim();
}

// ─────────────────────────────────────────────
// PROVIDER IMPLEMENTATIONS
// ─────────────────────────────────────────────

async function callGemini(prompt: string): Promise<AITicketAnalysis> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return AIAnalysisSchema.parse(JSON.parse(text));
}

async function callGroq(prompt: string): Promise<AITicketAnalysis> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      {
        role: "user",
        content:
          prompt +
          "\n\nIMPORTANT: Respond with valid JSON only. Do not wrap in markdown code blocks.",
      },
    ],
    temperature: 0.3,
  });
  const raw = completion.choices[0]?.message?.content ?? "";
  // Strip markdown code fences if model adds them despite the instruction
  const clean = raw.replace(/^```json?\n?/m, "").replace(/```$/m, "").trim();
  return AIAnalysisSchema.parse(JSON.parse(clean));
}

async function callMistral(prompt: string): Promise<AITicketAnalysis> {
  const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });
  const result = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [
      {
        role: "user",
        content: prompt + "\n\nIMPORTANT: Respond with valid JSON only. Do not wrap in markdown code blocks.",
      },
    ],
  });
  const raw = result.choices?.[0]?.message?.content ?? "";
  const clean = typeof raw === "string"
    ? raw.replace(/^```json?\n?/m, "").replace(/```$/m, "").trim()
    : "";
  return AIAnalysisSchema.parse(JSON.parse(clean));
}

// ─────────────────────────────────────────────
// MAIN GATEWAY
// ─────────────────────────────────────────────

/**
 * Central AI analysis entry point.
 * Handles midnight UTC reset, per-tenant rate limiting, provider routing, and usage tracking.
 */
export async function analyzeTicketWithProvider(
  subject: string,
  description: string,
  tenantId: string,
  customerHistory?: { totalTickets: number; resolvedTickets: number }
): Promise<GatewayAnalysisResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      aiProvider: true,
      dailyAiUsage: true,
      dailyAiLimit: true,
      lastUsageReset: true,
    },
  });

  if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

  // Midnight UTC reset: if last reset was a prior day, zero out the counter
  let currentUsage = tenant.dailyAiUsage;
  if (isNewUtcDay(tenant.lastUsageReset)) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { dailyAiUsage: 0, lastUsageReset: new Date() },
    });
    currentUsage = 0;
  }

  // Hard limit — return fallback, do not call any AI provider
  if (currentUsage >= tenant.dailyAiLimit) {
    console.warn(
      `[ai-gateway] Tenant ${tenantId} hit daily limit (${currentUsage}/${tenant.dailyAiLimit})`
    );
    return LIMIT_EXCEEDED_FALLBACK;
  }

  const customerContext = customerHistory
    ? `Customer history: ${customerHistory.totalTickets} total tickets, ${customerHistory.resolvedTickets} resolved.`
    : "";
  const prompt = buildPrompt(subject, description, customerContext);

  try {
    let result: AITicketAnalysis;

    switch (tenant.aiProvider) {
      case "GROQ":
        result = await callGroq(prompt);
        break;
      case "MISTRAL":
        result = await callMistral(prompt);
        break;
      case "GEMINI":
      default:
        result = await callGemini(prompt);
    }

    // Increment usage atomically on success
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { dailyAiUsage: { increment: 1 } },
    });

    return result;
  } catch (error) {
    console.error(`[ai-gateway] Provider ${tenant.aiProvider} failed:`, error);
    return PROVIDER_FAILURE_FALLBACK;
  }
}

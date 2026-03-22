import { GoogleGenerativeAI } from "@google/generative-ai";
import { Priority } from "@prisma/client";
import { z } from "zod";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const AIAnalysisSchema = z.object({
  suggestedResponse: z.string(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  priorityReason: z.string(),
  summary: z.string(),
  tags: z.array(z.string()),
});

export type AITicketAnalysis = z.infer<typeof AIAnalysisSchema>;

/**
 * Analyzes a support ticket using Gemini AI.
 * Returns a suggested response and a priority level.
 */
export async function analyzeTicket(
  subject: string,
  description: string,
  customerHistory?: { totalTickets: number; resolvedTickets: number }
): Promise<AITicketAnalysis> {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const customerContext = customerHistory
    ? `Customer history: ${customerHistory.totalTickets} total tickets, ${customerHistory.resolvedTickets} resolved.`
    : "";

  const prompt = `
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

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    return AIAnalysisSchema.parse(parsed);
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    // Return sensible defaults on failure
    return {
      suggestedResponse: `Thank you for reaching out to us regarding "${subject}". We have received your request and our team will review it shortly. We will get back to you as soon as possible.`,
      priority: Priority.MEDIUM,
      priorityReason: "Default priority — AI analysis unavailable",
      summary: subject,
      tags: [],
    };
  }
}

/**
 * Generates a quick AI reply suggestion for an existing ticket thread.
 */
export async function generateReply(
  ticketSubject: string,
  messageHistory: { body: string; isFromAgent: boolean }[],
  latestMessage: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const historyText = messageHistory
    .slice(-6) // last 6 messages for context
    .map((m) => `${m.isFromAgent ? "Agent" : "Customer"}: ${m.body}`)
    .join("\n\n");

  const prompt = `
You are a helpful customer support agent. Generate a professional and empathetic reply.

Ticket: ${ticketSubject}

Conversation history:
${historyText}

Latest customer message:
${latestMessage}

Write a concise, helpful reply (2-3 sentences). Do not include a subject line or greeting/sign-off.
`.trim();

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

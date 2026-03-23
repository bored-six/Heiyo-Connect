import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Generates a quick AI reply suggestion for an existing ticket thread.
 * Uses Gemini directly — not routed through the gateway (no rate limiting on replies).
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

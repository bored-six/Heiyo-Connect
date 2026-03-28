// Shared type definitions for client components.
// Mirrors Prisma enums without importing @prisma/client in the browser.

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED"
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
export type Role = "OWNER" | "ADMIN" | "AGENT" | "VIEWER"
export type Channel = "EMAIL" | "CHAT" | "PHONE" | "SOCIAL" | "API"
export type AiProvider = "GEMINI" | "GROQ" | "MISTRAL"
export type SenderRole = "USER" | "AGENT" | "SYSTEM"
export type JoinRequestStatus = "PENDING" | "APPROVED" | "DENIED"

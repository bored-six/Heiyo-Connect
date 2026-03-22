/**
 * Socket.io server setup for real-time ticket updates.
 *
 * Usage: Import and call attachSocketServer(httpServer) in server.ts
 *
 * Events emitted TO clients:
 *   "ticket:created"   — { ticket }     — broadcast to tenant room
 *   "ticket:updated"   — { ticket }     — broadcast to tenant room
 *   "message:new"      — { message }    — broadcast to ticket room
 *   "ticket:assigned"  — { ticketId, agentId } — broadcast to tenant room
 *
 * Events received FROM clients:
 *   "join:tenant"      — { tenantId }   — join tenant-scoped room
 *   "join:ticket"      — { ticketId }   — join ticket-scoped room
 *   "leave:ticket"     — { ticketId }   — leave ticket room
 *   "typing:start"     — { ticketId, userId }
 *   "typing:stop"      — { ticketId, userId }
 */

import { Server as SocketIOServer, Socket } from "socket.io";
import type { Server as HTTPServer } from "http";

export type TicketCreatedPayload = {
  ticket: {
    id: string;
    subject: string;
    priority: string;
    status: string;
    createdAt: string;
    customer: { name: string; email: string };
  };
};

export type MessageNewPayload = {
  message: {
    id: string;
    body: string;
    isFromAgent: boolean;
    createdAt: string;
    author?: { name: string; avatarUrl: string | null };
  };
  ticketId: string;
};

let io: SocketIOServer | null = null;

export function attachSocketServer(httpServer: HTTPServer) {
  if (io) return io; // singleton

  io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Tenant room — all agents in org receive broadcast events
    socket.on("join:tenant", ({ tenantId }: { tenantId: string }) => {
      socket.join(`tenant:${tenantId}`);
      console.log(`[Socket.io] ${socket.id} joined tenant room: ${tenantId}`);
    });

    // Ticket room — agents viewing a specific ticket
    socket.on("join:ticket", ({ ticketId }: { ticketId: string }) => {
      socket.join(`ticket:${ticketId}`);
    });

    socket.on("leave:ticket", ({ ticketId }: { ticketId: string }) => {
      socket.leave(`ticket:${ticketId}`);
    });

    // Typing indicators
    socket.on(
      "typing:start",
      ({ ticketId, userId }: { ticketId: string; userId: string }) => {
        socket.to(`ticket:${ticketId}`).emit("typing:start", { userId });
      }
    );

    socket.on(
      "typing:stop",
      ({ ticketId, userId }: { ticketId: string; userId: string }) => {
        socket.to(`ticket:${ticketId}`).emit("typing:stop", { userId });
      }
    );

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Emit a ticket:created event to all agents in a tenant.
 * Call this from your createTicket server action or API route.
 */
export function emitTicketCreated(
  tenantId: string,
  payload: TicketCreatedPayload
) {
  io?.to(`tenant:${tenantId}`).emit("ticket:created", payload);
}

/**
 * Emit a new message event to agents viewing the ticket.
 */
export function emitNewMessage(ticketId: string, payload: MessageNewPayload) {
  io?.to(`ticket:${ticketId}`).emit("message:new", payload);
}

/**
 * Emit a ticket:updated event (status change, assignment, etc.)
 */
export function emitTicketUpdated(tenantId: string, ticket: unknown) {
  io?.to(`tenant:${tenantId}`).emit("ticket:updated", { ticket });
}

export { io };

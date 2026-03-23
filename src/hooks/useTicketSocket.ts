"use client";

import { useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket-client";
import type { TicketCreatedPayload, MessageNewPayload } from "@/lib/socket-server";

interface UseTicketSocketOptions {
  tenantId: string;
  ticketId?: string;
  onTicketCreated?: (payload: TicketCreatedPayload) => void;
  onTicketUpdated?: (payload: unknown) => void;
  onNewMessage?: (payload: MessageNewPayload) => void;
  onTypingStart?: (payload: { userId: string }) => void;
  onTypingStop?: (payload: { userId: string }) => void;
}

/**
 * Hook to subscribe to real-time ticket events via Socket.io.
 *
 * @example
 * useTicketSocket({
 *   tenantId: "tenant_xxx",
 *   onTicketCreated: (p) => console.log("New ticket:", p.ticket.subject),
 * });
 */
export function useTicketSocket({
  tenantId,
  ticketId,
  onTicketCreated,
  onTicketUpdated,
  onNewMessage,
  onTypingStart,
  onTypingStop,
}: UseTicketSocketOptions) {
  const connect = useCallback(() => {
    const socket = getSocket();

    if (!socket.connected) socket.connect();

    socket.emit("join:tenant", { tenantId });
    if (ticketId) socket.emit("join:ticket", { ticketId });

    const handleTicketCreated = (payload: TicketCreatedPayload) => {
      toast(`New ${payload.ticket.priority} ticket from ${payload.ticket.customer.name}`, {
        description: payload.ticket.subject,
      });
      onTicketCreated?.(payload);
    };

    socket.on("ticket:created", handleTicketCreated);
    if (onTicketUpdated) socket.on("ticket:updated", onTicketUpdated);
    if (onNewMessage) socket.on("message:new", onNewMessage);
    if (onTypingStart) socket.on("typing:start", onTypingStart);
    if (onTypingStop) socket.on("typing:stop", onTypingStop);

    return () => {
      if (ticketId) socket.emit("leave:ticket", { ticketId });
      socket.off("ticket:created", handleTicketCreated);
      socket.off("ticket:updated", onTicketUpdated);
      socket.off("message:new", onNewMessage);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
    };
  }, [tenantId, ticketId, onTicketCreated, onTicketUpdated, onNewMessage, onTypingStart, onTypingStop]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);
}

"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { getPusherClient } from "@/lib/pusher-client";

type TicketCreatedPayload = {
  ticket: {
    id: string;
    subject: string;
    priority: string;
    status: string;
    createdAt: string;
    customer: { name: string; email: string };
  };
};

type MessageNewPayload = {
  message: {
    id: string;
    body: string;
    isFromAgent: boolean;
    createdAt: string;
    author?: { name: string; avatarUrl: string | null };
  };
  ticketId: string;
};

interface UseTicketSocketOptions {
  tenantId: string;
  ticketId?: string;
  onTicketCreated?: (payload: TicketCreatedPayload) => void;
  onTicketUpdated?: (payload: unknown) => void;
  onNewMessage?: (payload: MessageNewPayload) => void;
}

/**
 * Hook to subscribe to real-time ticket events via Pusher Channels.
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
}: UseTicketSocketOptions) {
  // Tenant-level channel (new tickets, ticket updates)
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`tenant-${tenantId}`);

    channel.bind("ticket:created", (payload: TicketCreatedPayload) => {
      toast(`New ${payload.ticket.priority} ticket from ${payload.ticket.customer.name}`, {
        description: payload.ticket.subject,
      });
      onTicketCreated?.(payload);
    });

    channel.bind("ticket:updated", (payload: unknown) => {
      onTicketUpdated?.(payload);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`tenant-${tenantId}`);
    };
  }, [tenantId, onTicketCreated, onTicketUpdated]);

  // Ticket-level channel (new messages for a specific ticket)
  useEffect(() => {
    if (!ticketId) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`ticket-${ticketId}`);

    channel.bind("message:new", (payload: MessageNewPayload) => {
      onNewMessage?.(payload);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`ticket-${ticketId}`);
    };
  }, [ticketId, onNewMessage]);
}

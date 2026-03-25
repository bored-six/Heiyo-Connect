"use client";

import { useEffect, useRef } from "react";
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
 * Callbacks are stored in refs so the subscription never tears down just
 * because a parent re-renders with a new function reference. unbind() is
 * called with the exact handler reference so multiple components can share
 * the same Pusher channel without clobbering each other's bindings.
 */
export function useTicketSocket({
  tenantId,
  ticketId,
  onTicketCreated,
  onTicketUpdated,
  onNewMessage,
}: UseTicketSocketOptions) {
  // Keep latest callbacks in refs — avoids stale closures without causing
  // the effect to re-run every render
  const onTicketCreatedRef = useRef(onTicketCreated);
  const onTicketUpdatedRef = useRef(onTicketUpdated);
  const onNewMessageRef = useRef(onNewMessage);
  onTicketCreatedRef.current = onTicketCreated;
  onTicketUpdatedRef.current = onTicketUpdated;
  onNewMessageRef.current = onNewMessage;

  // Tenant-level channel (new tickets, ticket updates)
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`tenant-${tenantId}`);

    const handleTicketCreated = (payload: TicketCreatedPayload) => {
      toast(`New ${payload.ticket.priority} ticket from ${payload.ticket.customer.name}`, {
        description: payload.ticket.subject,
      });
      onTicketCreatedRef.current?.(payload);
    };

    const handleTicketUpdated = (payload: unknown) => {
      onTicketUpdatedRef.current?.(payload);
    };

    channel.bind("ticket:created", handleTicketCreated);
    channel.bind("ticket:updated", handleTicketUpdated);

    return () => {
      // Unbind only this hook's handlers — other subscribers on the same
      // channel are unaffected
      channel.unbind("ticket:created", handleTicketCreated);
      channel.unbind("ticket:updated", handleTicketUpdated);
    };
  }, [tenantId]); // only re-subscribe if the tenant changes

  // Ticket-level channel (new messages for a specific ticket)
  useEffect(() => {
    if (!ticketId) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`ticket-${ticketId}`);

    const handleNewMessage = (payload: MessageNewPayload) => {
      onNewMessageRef.current?.(payload);
    };

    channel.bind("message:new", handleNewMessage);

    return () => {
      channel.unbind("message:new", handleNewMessage);
    };
  }, [ticketId]); // only re-subscribe if the ticket changes
}

import Pusher from "pusher";

// Singleton server-side Pusher client — used in server actions to trigger events
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

/**
 * Trigger a ticket:created event to all agents in a tenant.
 * Call this from createTicket() server action.
 */
export async function emitTicketCreated(
  tenantId: string,
  payload: {
    ticket: {
      id: string;
      subject: string;
      priority: string;
      status: string;
      createdAt: string;
      customer: { name: string; email: string };
    };
  }
) {
  await pusherServer.trigger(`tenant-${tenantId}`, "ticket:created", payload);
}

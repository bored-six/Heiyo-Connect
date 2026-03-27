"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { UserCheck } from "lucide-react";
import { assignTicket } from "@/actions/tickets";

type Agent = {
  id: string;
  name: string | null;
  email: string;
};

export function AssignAgentDropdown({
  ticketId,
  agents,
  currentAgentId,
}: {
  ticketId: string;
  agents: Agent[];
  currentAgentId: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(agentId: string) {
    const resolved = agentId === "unassigned" ? null : agentId;
    startTransition(async () => {
      const result = await assignTicket({ ticketId, agentId: resolved });
      if (result.success) {
        const agent = agents.find((a) => a.id === agentId);
        toast.success(
          resolved ? `Assigned to ${agent?.name ?? agent?.email ?? "agent"}` : "Unassigned"
        );
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <UserCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <select
        defaultValue={currentAgentId ?? "unassigned"}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
        className="text-sm text-muted-foreground bg-transparent border-0 p-0 focus:outline-none disabled:opacity-50 cursor-pointer hover:text-foreground transition-colors"
      >
        <option value="unassigned">Unassigned</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name ?? agent.email}
          </option>
        ))}
      </select>
    </div>
  );
}

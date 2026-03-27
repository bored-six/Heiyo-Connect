"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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
  const [selectedId, setSelectedId] = useState(currentAgentId ?? "unassigned");
  const [isPending, startTransition] = useTransition();

  function handleChange(agentId: string) {
    const previous = selectedId;
    setSelectedId(agentId); // optimistic
    const resolved = agentId === "unassigned" ? null : agentId;
    startTransition(async () => {
      const result = await assignTicket({ ticketId, agentId: resolved });
      if (result.success) {
        const agent = agents.find((a) => a.id === agentId);
        toast.success(
          resolved ? `Assigned to ${agent?.name ?? agent?.email}` : "Unassigned"
        );
      } else {
        setSelectedId(previous); // revert
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Assignee
      </label>
      <select
        value={selectedId}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 cursor-pointer"
      >
        <option value="unassigned">— Unassigned —</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name ?? agent.email}
          </option>
        ))}
      </select>
      {isPending && (
        <p className="text-xs text-muted-foreground">Saving…</p>
      )}
    </div>
  );
}

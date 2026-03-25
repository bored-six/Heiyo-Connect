"use client";

import { useState, useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Bot, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { sendReply } from "@/actions/messages";

type SenderRole = "USER" | "AGENT" | "SYSTEM";

export type ThreadMessage = {
  id: string;
  body: string;
  senderRole: SenderRole;
  isAiGenerated: boolean;
  createdAt: Date;
  author: { id: string; name: string | null; avatarUrl: string | null } | null;
};

type OptimisticMessage = ThreadMessage & { pending?: boolean };

interface ReplySectionProps {
  messages: ThreadMessage[];
  ticketId: string;
  aiSuggestedResponse: string | null;
  customerName: string;
  currentUserName: string | null;
}

export function ReplySection({
  messages,
  ticketId,
  aiSuggestedResponse,
  customerName,
  currentUserName,
}: ReplySectionProps) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  const [optimisticMessages, addOptimisticMessage] = useOptimistic<
    OptimisticMessage[],
    OptimisticMessage
  >(messages, (state, newMsg) => [...state, newMsg]);

  function handleSend() {
    const trimmed = body.trim();
    if (!trimmed) return;

    const optimisticMsg: OptimisticMessage = {
      id: `optimistic-${Date.now()}`,
      body: trimmed,
      senderRole: "AGENT",
      isAiGenerated: false,
      createdAt: new Date(),
      author: { id: "", name: currentUserName, avatarUrl: null },
      pending: true,
    };

    setBody("");

    startTransition(async () => {
      addOptimisticMessage(optimisticMsg);
      const result = await sendReply({ ticketId, body: trimmed });
      if (!result.success) {
        toast.error(result.error ?? "Failed to send reply");
        setBody(trimmed); // restore text so agent can retry
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Message thread */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-medium">
            Messages ({optimisticMessages.filter((m) => m.senderRole !== "SYSTEM").length})
          </h2>
        </div>

        {optimisticMessages.length > 0 ? (
          <div className="divide-y">
            {optimisticMessages.map((msg) => {
              if (msg.senderRole === "SYSTEM") {
                return (
                  <div key={msg.id} className="py-2.5 px-4 text-center">
                    <span className="text-xs text-muted-foreground/70 italic">
                      {msg.body}
                    </span>
                  </div>
                );
              }

              const isAgent = msg.senderRole === "AGENT";

              return (
                <div
                  key={msg.id}
                  className={`p-4 space-y-1 ${isAgent ? "bg-blue-50/40" : ""} ${
                    msg.pending ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className={`font-medium ${
                        isAgent ? "text-blue-700" : "text-foreground"
                      }`}
                    >
                      {isAgent ? (msg.author?.name ?? "Agent") : customerName}
                    </span>
                    {msg.isAiGenerated && (
                      <span className="inline-flex items-center gap-0.5 text-blue-600">
                        <Bot className="h-3 w-3" />
                        AI
                      </span>
                    )}
                    {msg.pending && (
                      <span className="text-muted-foreground/50">Sending…</span>
                    )}
                    {!msg.pending && (
                      <span>{new Date(msg.createdAt).toLocaleString()}</span>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No messages yet on this ticket.
          </div>
        )}
      </div>

      {/* Reply box */}
      <div className="rounded-lg border bg-card shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Reply</h3>
          {aiSuggestedResponse && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBody(aiSuggestedResponse)}
              className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs h-7 gap-1"
            >
              <Bot className="h-3 w-3" />
              Insert AI Suggestion
            </Button>
          )}
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
          }}
          placeholder="Type your reply… (⌘Enter to send)"
          rows={4}
          className="resize-none"
          disabled={isPending}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSend}
            disabled={!body.trim() || isPending}
            size="sm"
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            Send Reply
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyInviteLink({ inviteUrl }: { inviteUrl: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
        <span className="text-xs text-muted-foreground truncate flex-1 font-mono">
          {inviteUrl}
        </span>
        <button
          onClick={handleCopy}
          className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Anyone with this link can join your workspace as an Agent. Share it with your team.
      </p>
    </div>
  );
}

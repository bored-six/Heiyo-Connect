"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { AiProvider } from "@/lib/types"
import { updateAiProvider } from "@/actions/settings"

const PROVIDER_LABELS: Record<AiProvider, string> = {
  GEMINI: "Gemini 2.0 Flash (Google)",
  GROQ: "Llama 3 8B (Groq)",
  MISTRAL: "Mistral Small (Mistral AI)",
}

const PROVIDER_DESCRIPTIONS: Record<AiProvider, string> = {
  GEMINI: "Best quality. Recommended for most teams.",
  GROQ: "Ultra-fast inference. Great for high-volume support.",
  MISTRAL: "European AI. Strong reasoning, privacy-focused.",
}

export function AiProviderForm({ currentProvider }: { currentProvider: AiProvider }) {
  const [selected, setSelected] = useState<AiProvider>(currentProvider)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateAiProvider({ aiProvider: selected })
      if (result.success) {
        toast.success(`Switched to ${PROVIDER_LABELS[selected]}`)
        router.push("/dashboard")
      } else {
        toast.error(result.error ?? "Failed to update provider")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3">
        {(Object.keys(PROVIDER_LABELS) as AiProvider[]).map((provider) => (
          <label
            key={provider}
            className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
              selected === provider
                ? "border-primary bg-primary/5"
                : "hover:border-muted-foreground/40"
            }`}
          >
            <input
              type="radio"
              name="aiProvider"
              value={provider}
              checked={selected === provider}
              onChange={() => setSelected(provider)}
              className="mt-0.5 accent-primary"
            />
            <div>
              <p className="text-sm font-medium">{PROVIDER_LABELS[provider]}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {PROVIDER_DESCRIPTIONS[provider]}
              </p>
            </div>
          </label>
        ))}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save Provider"}
      </button>
    </form>
  )
}

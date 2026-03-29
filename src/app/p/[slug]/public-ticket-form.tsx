"use client"

import { useState, useTransition } from "react"
import { SparklesIcon, CheckCircleIcon, AlertCircleIcon, SendIcon } from "lucide-react"

type FormState =
  | { type: "idle" }
  | { type: "pending" }
  | { type: "success" }
  | { type: "error"; message: string }

export function PublicTicketForm({
  slug,
  tenantName,
}: {
  slug: string
  tenantName: string
}) {
  const [state, setState] = useState<FormState>({ type: "idle" })
  const [isPending, startTransition] = useTransition()

  const [fields, setFields] = useState({
    name: "",
    email: "",
    subject: "",
    description: "",
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      setState({ type: "pending" })
      try {
        const res = await fetch("/api/public-ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...fields, slug }),
        })
        const json = await res.json()
        if (!res.ok) {
          setState({ type: "error", message: json.error ?? "Something went wrong." })
        } else {
          setState({ type: "success" })
        }
      } catch {
        setState({ type: "error", message: "Network error. Please try again." })
      }
    })
  }

  if (state.type === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div
          className="rounded-full p-4 mb-5"
          style={{ backgroundColor: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)" }}
        >
          <CheckCircleIcon className="h-10 w-10 text-emerald-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-foreground">
          Ticket submitted!
        </h2>
        <p className="text-sm max-w-sm text-muted-foreground">
          The {tenantName} support team has been notified. Our AI is triaging
          your request now — you'll hear back soon.
        </p>
        <button
          onClick={() => {
            setState({ type: "idle" })
            setFields({ name: "", email: "", subject: "", description: "" })
          }}
          className="mt-6 text-sm underline underline-offset-2 transition-colors text-primary"
        >
          Submit another ticket
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {state.type === "error" && (
        <div
          className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor: "rgba(248,113,113,0.1)",
            border: "1px solid rgba(248,113,113,0.25)",
            color: "#fca5a5",
          }}
        >
          <AlertCircleIcon className="h-4 w-4 shrink-0" />
          {state.message}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="name"
            className="block text-xs font-medium mb-1.5 text-muted-foreground"
          >
            Your name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={fields.name}
            onChange={handleChange}
            placeholder="Jane Smith"
            disabled={isPending}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all disabled:opacity-50 bg-input/30 border border-border text-foreground"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium mb-1.5 text-muted-foreground"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={fields.email}
            onChange={handleChange}
            placeholder="jane@company.io"
            disabled={isPending}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all disabled:opacity-50 bg-input/30 border border-border text-foreground"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="subject"
          className="block text-xs font-medium mb-1.5 text-muted-foreground"
        >
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          value={fields.subject}
          onChange={handleChange}
          placeholder="Brief summary of your issue"
          disabled={isPending}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all disabled:opacity-50 bg-input/30 border border-border text-foreground"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-xs font-medium mb-1.5 text-muted-foreground"
        >
          Describe your issue
        </label>
        <textarea
          id="description"
          name="description"
          required
          value={fields.description}
          onChange={handleChange}
          placeholder="Please include any relevant details, steps to reproduce, or error messages..."
          rows={5}
          disabled={isPending}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none transition-all disabled:opacity-50 bg-input/30 border border-border text-foreground"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
          color: "white",
          boxShadow: isPending ? "none" : "0 0 20px rgba(99,102,241,0.35)",
        }}
      >
        {isPending ? (
          <>
            <span
              className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
            />
            Submitting…
          </>
        ) : (
          <>
            <SendIcon className="h-4 w-4" />
            Submit ticket
          </>
        )}
      </button>

      {/* AI disclosure */}
      <p className="text-center text-xs text-muted-foreground">
        <SparklesIcon className="inline h-3 w-3 mr-1 -mt-0.5 text-primary" />
        This ticket will be triaged by AI to prioritise your request.
      </p>
    </form>
  )
}

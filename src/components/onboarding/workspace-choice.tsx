"use client"

import { useState, useTransition } from "react"
import { createTenantAndUser, joinTenant } from "@/actions/onboarding"
import { setActiveWorkspace } from "@/actions/workspace"

type Membership = {
  tenantId: string
  tenantName: string
  tenantSlug: string
  role: string
}

type Mode = "pick" | "create" | "join"

export function WorkspaceChoice({
  memberships,
  defaultJoinSlug,
}: {
  memberships: Membership[]
  defaultJoinSlug?: string
}) {
  const hasWorkspaces = memberships.length > 0
  const [mode, setMode] = useState<Mode>(
    defaultJoinSlug ? "join" : hasWorkspaces ? "pick" : "pick"
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createTenantAndUser(null, formData)
      if (result?.error) setError(result.error)
    })
  }

  function handleJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await joinTenant(null, formData)
      if (result?.error) setError(result.error)
    })
  }

  function handleSwitch(tenantId: string) {
    startTransition(async () => {
      await setActiveWorkspace(tenantId)
    })
  }

  // ── WORKSPACE PICKER (has existing workspaces) ──────────────────────────
  if (mode === "pick" && hasWorkspaces) {
    return (
      <div className="bg-card rounded-xl shadow-sm border p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Your workspaces</h1>
        <p className="text-sm text-muted-foreground mb-6">Pick a workspace to continue.</p>

        <div className="space-y-2 mb-6">
          {memberships.map((m) => (
            <button
              key={m.tenantId}
              onClick={() => handleSwitch(m.tenantId)}
              disabled={isPending}
              className="w-full text-left rounded-lg border p-4 hover:border-foreground/40 hover:bg-muted transition-colors group disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{m.tenantName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">{m.role.toLowerCase()}</p>
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground">Enter →</span>
              </div>
            </button>
          ))}
        </div>

        <div className="border-t pt-4 space-y-2">
          <button
            onClick={() => { setMode("create"); setError(null) }}
            className="w-full text-sm text-muted-foreground hover:text-foreground text-left px-1 py-1 transition-colors"
          >
            + Create a new workspace
          </button>
          <button
            onClick={() => { setMode("join"); setError(null) }}
            className="w-full text-sm text-muted-foreground hover:text-foreground text-left px-1 py-1 transition-colors"
          >
            + Join another workspace
          </button>
        </div>
      </div>
    )
  }

  // ── NO WORKSPACES — PICK MODE ───────────────────────────────────────────
  if (mode === "pick" && !hasWorkspaces) {
    return (
      <div className="bg-card rounded-xl shadow-sm border p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Welcome to Heiyo Connect</h1>
        <p className="text-sm text-muted-foreground mb-6">Get started by creating or joining a workspace.</p>

        <div className="space-y-3">
          <button
            onClick={() => setMode("create")}
            className="w-full text-left rounded-lg border p-4 hover:border-foreground/40 hover:bg-muted transition-colors group"
          >
            <p className="text-sm font-medium">Create a workspace</p>
            <p className="text-xs text-muted-foreground mt-0.5">Start fresh for your company or team.</p>
          </button>
          <button
            onClick={() => setMode("join")}
            className="w-full text-left rounded-lg border p-4 hover:border-foreground/40 hover:bg-muted transition-colors group"
          >
            <p className="text-sm font-medium">Join a workspace</p>
            <p className="text-xs text-muted-foreground mt-0.5">Paste an invite link from your team.</p>
          </button>
        </div>
      </div>
    )
  }

  // ── CREATE ──────────────────────────────────────────────────────────────
  if (mode === "create") {
    return (
      <div className="bg-card rounded-xl shadow-sm border p-8 w-full max-w-md">
        <button
          onClick={() => { setMode("pick"); setError(null) }}
          className="text-xs text-muted-foreground hover:text-foreground mb-5 flex items-center gap-1"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Create a workspace</h1>
        <p className="text-sm text-muted-foreground mb-6">This will be your company or team&apos;s shared workspace.</p>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-foreground mb-1">
              Workspace name
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              placeholder="e.g. Acme Corp"
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-foreground text-white text-sm font-medium py-2 hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {isPending ? "Creating…" : "Create workspace"}
          </button>
        </form>
      </div>
    )
  }

  // ── JOIN ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-card rounded-xl shadow-sm border p-8 w-full max-w-md">
      <button
        onClick={() => { setMode("pick"); setError(null) }}
        className="text-xs text-muted-foreground hover:text-foreground mb-5 flex items-center gap-1"
      >
        ← Back
      </button>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Join a workspace</h1>
      <p className="text-sm text-muted-foreground mb-6">Paste the invite link your team shared with you.</p>

      <form onSubmit={handleJoin} className="space-y-4">
        <div>
          <label htmlFor="inviteLink" className="block text-sm font-medium text-foreground mb-1">
            Invite link
          </label>
          <input
            id="inviteLink"
            name="inviteLink"
            type="text"
            required
            defaultValue={defaultJoinSlug ? `/join/${defaultJoinSlug}` : ""}
            placeholder="https://…/join/your-team"
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-foreground text-white text-sm font-medium py-2 hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {isPending ? "Joining…" : "Join workspace"}
        </button>
      </form>
    </div>
  )
}

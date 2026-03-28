"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import type { Role } from "@/lib/types"
import { approveJoinRequest, denyJoinRequest } from "@/actions/join-requests"
import { UserCheck, UserX, Clock } from "lucide-react"

type JoinRequest = {
  id: string
  message: string | null
  createdAt: Date
  user: {
    id: string
    name: string | null
    email: string
    avatarUrl: string | null
  }
}

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  { value: "ADMIN", label: "Admin", description: "Manages team & settings" },
  { value: "AGENT", label: "Agent", description: "Works tickets day-to-day" },
  { value: "VIEWER", label: "Viewer", description: "Read-only access" },
]

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(" ")
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function RequestCard({
  request,
  currentUserRole,
}: {
  request: JoinRequest
  currentUserRole: Role
}) {
  const [selectedRole, setSelectedRole] = useState<Role>("AGENT")
  const [isPending, startTransition] = useTransition()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const roleOptions =
    currentUserRole === "OWNER"
      ? ROLE_OPTIONS
      : ROLE_OPTIONS.filter((r) => r.value !== "ADMIN")

  function handleApprove() {
    startTransition(async () => {
      const result = await approveJoinRequest({ requestId: request.id, role: selectedRole })
      if (result.success) {
        toast.success(`${request.user.name ?? request.user.email} approved as ${selectedRole}`)
        setDismissed(true)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDeny() {
    startTransition(async () => {
      const result = await denyJoinRequest(request.id)
      if (result.success) {
        toast.success("Request denied")
        setDismissed(true)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
      {/* Requester info */}
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold shrink-0 text-gray-600 select-none">
          {getInitials(request.user.name, request.user.email)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">
              {request.user.name ?? request.user.email}
            </p>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {timeAgo(request.createdAt)}
            </span>
          </div>
          {request.user.name && (
            <p className="text-xs text-muted-foreground">{request.user.email}</p>
          )}
          {request.message && (
            <p className="text-sm text-gray-600 mt-1.5 italic">
              &ldquo;{request.message}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Role picker + actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as Role)}
          disabled={isPending}
          className="text-sm rounded-md border border-input bg-background px-2.5 py-1.5 font-medium disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
        >
          {roleOptions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label} — {r.description}
            </option>
          ))}
        </select>

        <button
          onClick={handleApprove}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-md bg-emerald-600 text-white text-sm font-medium px-3 py-1.5 hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <UserCheck className="size-3.5" />
          Approve
        </button>

        <button
          onClick={handleDeny}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-md border border-input text-sm font-medium px-3 py-1.5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-50"
        >
          <UserX className="size-3.5" />
          Deny
        </button>
      </div>
    </div>
  )
}

export function JoinRequestsTab({
  requests,
  currentUserRole,
}: {
  requests: JoinRequest[]
  currentUserRole: Role
}) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <UserCheck className="size-8 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No pending join requests</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {requests.length} pending request{requests.length !== 1 ? "s" : ""}. Pick a role
        before approving — you can always change it later.
      </p>
      {requests.map((req) => (
        <RequestCard key={req.id} request={req} currentUserRole={currentUserRole} />
      ))}
    </div>
  )
}

"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { Bell } from "lucide-react"
import type { Role } from "@/lib/types"
import { approveJoinRequest, denyJoinRequest } from "@/actions/join-requests"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "AGENT", label: "Agent" },
  { value: "VIEWER", label: "Viewer" },
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

function RequestRow({
  request,
  currentUserRole,
  onDismiss,
}: {
  request: JoinRequest
  currentUserRole: Role
  onDismiss: () => void
}) {
  const [selectedRole, setSelectedRole] = useState<Role>("AGENT")
  const [isPending, startTransition] = useTransition()

  const roleOptions =
    currentUserRole === "OWNER" ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r.value !== "ADMIN")

  function handleApprove() {
    startTransition(async () => {
      const result = await approveJoinRequest({ requestId: request.id, role: selectedRole })
      if (result.success) {
        toast.success(`${request.user.name ?? request.user.email} approved as ${selectedRole}`)
        onDismiss()
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
        onDismiss()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="p-3 space-y-2.5 border-b last:border-b-0">
      {/* User info */}
      <div className="flex items-start gap-2.5">
        <div className="size-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0 select-none">
          {getInitials(request.user.name, request.user.email)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">
            {request.user.name ?? request.user.email}
          </p>
          {request.user.name && (
            <p className="text-xs text-muted-foreground truncate">{request.user.email}</p>
          )}
          <p className="text-xs text-muted-foreground">{timeAgo(request.createdAt)}</p>
          {request.message && (
            <p className="text-xs text-gray-500 mt-1 italic truncate">
              &ldquo;{request.message}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Role picker + actions */}
      <div className="flex items-center gap-1.5">
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as Role)}
          disabled={isPending}
          className="flex-1 text-xs rounded border border-input bg-background px-2 py-1 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-ring/50 cursor-pointer"
        >
          {roleOptions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleApprove}
          disabled={isPending}
          className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={handleDeny}
          disabled={isPending}
          className="px-2.5 py-1 rounded text-xs font-medium border border-input hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-50"
        >
          Deny
        </button>
      </div>
    </div>
  )
}

export function NavNotificationBell({
  initialRequests,
  currentUserRole,
}: {
  initialRequests: JoinRequest[]
  currentUserRole: Role
}) {
  const [open, setOpen] = useState(false)
  const [requests, setRequests] = useState(initialRequests)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function dismissRequest(id: string) {
    setRequests((prev) => prev.filter((r) => r.id !== id))
    router.refresh()
  }

  const count = requests.length

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center size-8 rounded-md hover:bg-slate-100 transition-colors"
        aria-label={`Notifications${count > 0 ? ` (${count} pending)` : ""}`}
      >
        <Bell className="size-4 text-slate-500" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center size-4 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border bg-white shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b bg-muted/30">
            <p className="text-sm font-semibold">Join Requests</p>
            {count > 0 && (
              <span className="text-xs text-muted-foreground">{count} pending</span>
            )}
          </div>

          {requests.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="size-6 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No pending requests</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {requests.map((req) => (
                <RequestRow
                  key={req.id}
                  request={req}
                  currentUserRole={currentUserRole}
                  onDismiss={() => dismissRequest(req.id)}
                />
              ))}
            </div>
          )}

          <div className="border-t px-3 py-2">
            <a
              href="/dashboard/settings?tab=requests"
              className="text-xs text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              View all in settings →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

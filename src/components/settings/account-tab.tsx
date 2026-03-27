"use client"

import { useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Role } from "@prisma/client"
import { LogOut, Crown, ShieldCheck, User, Eye } from "lucide-react"

const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  AGENT: "Agent",
  VIEWER: "Viewer",
}

const ROLE_ICONS: Record<Role, React.ElementType> = {
  OWNER: Crown,
  ADMIN: ShieldCheck,
  AGENT: User,
  VIEWER: Eye,
}

const ROLE_COLORS: Record<Role, string> = {
  OWNER: "text-violet-600 bg-violet-50 border-violet-200",
  ADMIN: "text-blue-600 bg-blue-50 border-blue-200",
  AGENT: "text-emerald-600 bg-emerald-50 border-emerald-200",
  VIEWER: "text-gray-600 bg-gray-50 border-gray-200",
}

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(" ")
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

export function AccountTab({
  user,
}: {
  user: {
    name: string | null
    email: string
    role: Role
    tenantName: string
  }
}) {
  const { signOut } = useClerk()
  const router = useRouter()
  const RoleIcon = ROLE_ICONS[user.role]

  function handleSignOut() {
    signOut(() => router.push("/"))
  }

  return (
    <div className="space-y-6 max-w-md">
      {/* Profile card */}
      <div className="rounded-lg border bg-muted/20 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Profile
        </h3>
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 shrink-0 select-none">
            {getInitials(user.name, user.email)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-base truncate">{user.name ?? "—"}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Workspace</p>
            <p className="text-sm font-medium">{user.tenantName}</p>
          </div>
          <div className="ml-auto">
            <p className="text-xs text-muted-foreground mb-1">Role</p>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role]}`}
            >
              <RoleIcon className="size-3" />
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div className="rounded-lg border bg-muted/20 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Session
        </h3>
        <p className="text-sm text-muted-foreground">
          Sign out of your account on this device.
        </p>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 text-destructive text-sm font-medium px-4 py-2 hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Role } from "@prisma/client"
import { Crown, ShieldCheck, User, Eye, Loader2 } from "lucide-react"
import { updateProfile } from "@/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AVATAR_PRESETS, AvatarDisplay, PresetAvatar, isPresetAvatar, type AvatarPresetId } from "@/lib/avatars"

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

export function ProfileForm({
  user,
}: {
  user: {
    name: string | null
    email: string
    avatarUrl: string | null
    role: Role
    tenantName: string
  }
}) {
  const router = useRouter()
  const [name, setName] = useState(user.name ?? "")
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarPresetId | null>(
    isPresetAvatar(user.avatarUrl) ? user.avatarUrl : null
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const RoleIcon = ROLE_ICONS[user.role]

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await updateProfile({
        name: name.trim(),
        avatarUrl: selectedAvatar ?? "",
      })
      if (result.success) {
        router.push("/dashboard")
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Profile preview card */}
      <div className="rounded-lg border bg-muted/20 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Profile
        </h3>

        <div className="flex items-center gap-4">
          <AvatarDisplay
            avatarUrl={selectedAvatar}
            name={name.trim() || null}
            email={user.email}
            size={64}
          />
          <div className="min-w-0">
            <p className="font-semibold text-base truncate">{name.trim() || "—"}</p>
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

      {/* Edit form */}
      <form onSubmit={handleSubmit} className="rounded-lg border bg-muted/20 p-5 space-y-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Edit Profile
        </h3>

        <div className="space-y-2">
          <Label htmlFor="display-name">Display name</Label>
          <Input
            id="display-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={100}
          />
        </div>

        {/* Avatar picker */}
        <div className="space-y-3">
          <Label>Avatar</Label>
          <div className="grid grid-cols-6 gap-3">
            {AVATAR_PRESETS.map((preset) => {
              const isSelected = selectedAvatar === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  title={preset.label}
                  onClick={() => setSelectedAvatar(isSelected ? null : preset.id)}
                  className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  style={{ width: 48, height: 48 }}
                >
                  <div
                    className="size-full rounded-full overflow-hidden transition-transform hover:scale-110"
                    style={{
                      outline: isSelected ? "3px solid #6366f1" : "3px solid transparent",
                      outlineOffset: "2px",
                    }}
                  >
                    <PresetAvatar id={preset.id} />
                  </div>
                  {isSelected && (
                    <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-indigo-600 flex items-center justify-center">
                      <svg viewBox="0 0 12 12" fill="none" className="size-2.5">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          {selectedAvatar === null && (
            <p className="text-xs text-muted-foreground">
              No avatar selected — your initials will be shown.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  )
}

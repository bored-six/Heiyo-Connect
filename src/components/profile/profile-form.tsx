"use client"

import { useState, useTransition } from "react"
import { Role } from "@prisma/client"
import { Crown, ShieldCheck, User, Eye, Check, Loader2 } from "lucide-react"
import { updateProfile } from "@/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  const [name, setName] = useState(user.name ?? "")
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "")
  const [imgError, setImgError] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const RoleIcon = ROLE_ICONS[user.role]

  // Preview: show image if avatarUrl is set and hasn't errored, else initials
  const previewName = name.trim() || null
  const showImage = avatarUrl.trim() !== "" && !imgError

  function handleAvatarUrlChange(val: string) {
    setAvatarUrl(val)
    setImgError(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)

    startTransition(async () => {
      const result = await updateProfile({ name: name.trim(), avatarUrl: avatarUrl.trim() })
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Avatar preview */}
      <div className="rounded-lg border bg-muted/20 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Profile
        </h3>

        <div className="flex items-center gap-4">
          <div className="size-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 shrink-0 select-none">
            {showImage ? (
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="size-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              getInitials(previewName, user.email)
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-base truncate">{previewName ?? "—"}</p>
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
      <form onSubmit={handleSubmit} className="rounded-lg border bg-muted/20 p-5 space-y-4">
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

        <div className="space-y-2">
          <Label htmlFor="avatar-url">Avatar URL</Label>
          <Input
            id="avatar-url"
            type="url"
            value={avatarUrl}
            onChange={(e) => handleAvatarUrlChange(e.target.value)}
            placeholder="https://example.com/your-photo.png"
          />
          {imgError && (
            <p className="text-xs text-destructive">Could not load image from that URL.</p>
          )}
          <p className="text-xs text-muted-foreground">
            Paste a direct link to an image. Leave blank to use your initials.
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : saved ? (
            <Check className="size-4" />
          ) : null}
          {saved ? "Saved" : "Save changes"}
        </Button>
      </form>
    </div>
  )
}

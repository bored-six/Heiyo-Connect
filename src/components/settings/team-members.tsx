"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { Role } from "@/lib/types";
import { updateMemberRole, removeMember } from "@/actions/team";
import { CopyInviteLink } from "./copy-invite-link";
import { Users, Crown, ShieldCheck, User, Eye } from "lucide-react";

type Member = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  avatarUrl: string | null;
  createdAt: Date;
};

const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  AGENT: "Agent",
  VIEWER: "Viewer",
};

const ROLE_COLORS: Record<Role, string> = {
  OWNER: "bg-violet-100 text-violet-700 border-violet-200",
  ADMIN: "bg-blue-100 text-blue-700 border-blue-200",
  AGENT: "bg-emerald-100 text-emerald-700 border-emerald-200",
  VIEWER: "bg-muted text-muted-foreground border-border",
};

const ROLE_AVATAR_BG: Record<Role, string> = {
  OWNER: "bg-violet-100 text-violet-700",
  ADMIN: "bg-blue-100 text-blue-700",
  AGENT: "bg-emerald-100 text-emerald-700",
  VIEWER: "bg-muted text-muted-foreground",
};

const ROLE_ICONS: Record<Role, React.ElementType> = {
  OWNER: Crown,
  ADMIN: ShieldCheck,
  AGENT: User,
  VIEWER: Eye,
};

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function canManage(currentRole: Role, targetRole: Role, isSelf: boolean): boolean {
  if (isSelf) return false;
  if (currentRole === "OWNER") return true;
  if (currentRole === "ADMIN" && targetRole !== "OWNER") return true;
  return false;
}

function getRoleOptions(currentRole: Role): Role[] {
  if (currentRole === "OWNER") return ["OWNER", "ADMIN", "AGENT", "VIEWER"];
  if (currentRole === "ADMIN") return ["AGENT", "VIEWER"];
  return [];
}

export function TeamMembers({
  members,
  currentUserId,
  currentUserRole,
  inviteUrl,
}: {
  members: Member[];
  currentUserId: string;
  currentUserRole: Role;
  inviteUrl: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(userId: string, role: Role) {
    startTransition(async () => {
      const result = await updateMemberRole({ userId, role });
      if (result.success) {
        toast.success("Role updated");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRemove(userId: string, name: string | null, email: string) {
    const label = name ?? email;
    if (!confirm(`Remove ${label} from the workspace?`)) return;
    startTransition(async () => {
      const result = await removeMember(userId);
      if (result.success) {
        toast.success(`${label} removed`);
      } else {
        toast.error(result.error);
      }
    });
  }

  const canInvite = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Member cards */}
      <div className="grid gap-3">
        {members.map((member) => {
          const isSelf = member.id === currentUserId;
          const canEdit = canManage(currentUserRole, member.role, isSelf);
          const roleOptions = getRoleOptions(currentUserRole);
          const RoleIcon = ROLE_ICONS[member.role];

          return (
            <div
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40"
            >
              {/* Avatar + info */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`size-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 select-none ${ROLE_AVATAR_BG[member.role]}`}
                >
                  {getInitials(member.name, member.email)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">
                      {member.name ?? member.email}
                    </p>
                    {isSelf && (
                      <span className="text-xs text-muted-foreground">(you)</span>
                    )}
                  </div>
                  {member.name && (
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  )}
                </div>
              </div>

              {/* Role + actions */}
              <div className="flex items-center gap-2 shrink-0">
                {canEdit && roleOptions.length > 0 ? (
                  <select
                    defaultValue={member.role}
                    disabled={isPending}
                    onChange={(e) => handleRoleChange(member.id, e.target.value as Role)}
                    className="text-xs rounded-md border border-input bg-background px-2.5 py-1 font-medium disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
                  >
                    {roleOptions.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[member.role]}`}
                  >
                    <RoleIcon className="h-3 w-3" />
                    {ROLE_LABELS[member.role]}
                  </span>
                )}

                {canEdit && (
                  <button
                    onClick={() => handleRemove(member.id, member.name, member.email)}
                    disabled={isPending}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 px-1"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite section — only for OWNER/ADMIN */}
      {canInvite && (
        <div className="rounded-lg border border-dashed p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Invite teammates</p>
          </div>
          <CopyInviteLink inviteUrl={inviteUrl} />
        </div>
      )}
    </div>
  );
}

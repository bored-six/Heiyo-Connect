"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Role } from "@prisma/client";
import { updateMemberRole, removeMember } from "@/actions/team";

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
  OWNER: "bg-violet-100 text-violet-700",
  ADMIN: "bg-blue-100 text-blue-700",
  AGENT: "bg-emerald-100 text-emerald-700",
  VIEWER: "bg-gray-100 text-gray-600",
};

function getInitials(name: string | null, email: string) {
  if (name) return name.slice(0, 2).toUpperCase();
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
}: {
  members: Member[];
  currentUserId: string;
  currentUserRole: Role;
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

  return (
    <div className="divide-y divide-border">
      {members.map((member) => {
        const isSelf = member.id === currentUserId;
        const canEdit = canManage(currentUserRole, member.role, isSelf);
        const roleOptions = getRoleOptions(currentUserRole);

        return (
          <div
            key={member.id}
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            {/* Avatar + info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0 select-none">
                {getInitials(member.name, member.email)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {member.name ?? member.email}
                  {isSelf && (
                    <span className="ml-1.5 text-xs text-muted-foreground font-normal">(you)</span>
                  )}
                </p>
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
                  className="text-xs rounded-md border border-input bg-transparent px-2 py-1 font-medium disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              ) : (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[member.role]}`}
                >
                  {ROLE_LABELS[member.role]}
                </span>
              )}

              {canEdit && (
                <button
                  onClick={() => handleRemove(member.id, member.name, member.email)}
                  disabled={isPending}
                  className="text-xs text-destructive hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

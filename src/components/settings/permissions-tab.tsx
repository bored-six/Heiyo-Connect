import { Crown, ShieldCheck, User, Eye, Check, X } from "lucide-react"

const PERMISSIONS = [
  {
    category: "Tickets",
    items: [
      { label: "View all tickets", owner: true, admin: true, agent: true, viewer: true },
      { label: "Create tickets", owner: true, admin: true, agent: true, viewer: false },
      { label: "Reply to tickets", owner: true, admin: true, agent: true, viewer: false },
      { label: "Change ticket status", owner: true, admin: true, agent: true, viewer: false },
      { label: "Assign tickets to agents", owner: true, admin: true, agent: true, viewer: false },
      { label: "Delete tickets", owner: true, admin: true, agent: false, viewer: false },
    ],
  },
  {
    category: "Customers",
    items: [
      { label: "View customers", owner: true, admin: true, agent: true, viewer: true },
      { label: "Edit customer info", owner: true, admin: true, agent: true, viewer: false },
    ],
  },
  {
    category: "Team & Access",
    items: [
      { label: "Invite team members", owner: true, admin: true, agent: false, viewer: false },
      { label: "Approve join requests", owner: true, admin: true, agent: false, viewer: false },
      { label: "Change member roles", owner: true, admin: true, agent: false, viewer: false },
      {
        label: "Assign Admin role",
        owner: true,
        admin: false,
        agent: false,
        viewer: false,
        note: "Owner only",
      },
      { label: "Remove team members", owner: true, admin: true, agent: false, viewer: false },
    ],
  },
  {
    category: "Settings",
    items: [
      { label: "Access settings", owner: true, admin: true, agent: false, viewer: false },
      { label: "Change AI provider", owner: true, admin: true, agent: false, viewer: false },
      { label: "View AI usage", owner: true, admin: true, agent: false, viewer: false },
    ],
  },
]

const ROLES = [
  { key: "owner", label: "Owner", Icon: Crown, color: "text-violet-600" },
  { key: "admin", label: "Admin", Icon: ShieldCheck, color: "text-blue-600" },
  { key: "agent", label: "Agent", Icon: User, color: "text-emerald-600" },
  { key: "viewer", label: "Viewer", Icon: Eye, color: "text-gray-500" },
] as const

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: "Full control. Created the workspace. Cannot be removed by others.",
  admin: "Manages the team and settings. Cannot promote to Owner.",
  agent: "Handles tickets day-to-day. No access to team management.",
  viewer: "Read-only. Can view tickets and customers but cannot act on them.",
}

export function PermissionsTab() {
  return (
    <div className="space-y-8">
      {/* Role cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ROLES.map(({ key, label, Icon, color }) => (
          <div key={key} className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Icon className={`size-4 ${color}`} />
              <span className="text-sm font-semibold">{label}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {ROLE_DESCRIPTIONS[key]}
            </p>
          </div>
        ))}
      </div>

      {/* Permission matrix */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-full">
                Permission
              </th>
              {ROLES.map(({ key, label, Icon, color }) => (
                <th key={key} className="px-4 py-2.5 text-center font-medium whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    <Icon className={`size-3.5 ${color}`} />
                    <span className={color}>{label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((section) => (
              <>
                <tr key={section.category} className="bg-muted/20">
                  <td
                    colSpan={5}
                    className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {section.category}
                  </td>
                </tr>
                {section.items.map((item) => (
                  <tr key={item.label} className="border-t hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-2.5 text-sm">
                      {item.label}
                      {"note" in item && item.note && (
                        <span className="ml-2 text-xs text-muted-foreground">({item.note})</span>
                      )}
                    </td>
                    {(["owner", "admin", "agent", "viewer"] as const).map((role) => (
                      <td key={role} className="px-4 py-2.5 text-center">
                        {item[role] ? (
                          <Check className="size-4 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="size-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

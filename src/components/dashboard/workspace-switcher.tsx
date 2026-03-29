"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { setActiveWorkspace } from "@/actions/workspace"
import { ChevronsUpDown, Check, Plus } from "lucide-react"

type Workspace = {
  tenantId: string
  tenantName: string
  role: string
}

export function WorkspaceSwitcher({
  current,
  all,
}: {
  current: Workspace
  all: Workspace[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function handleSwitch(tenantId: string) {
    if (tenantId === current.tenantId) { setOpen(false); return }
    setOpen(false)
    startTransition(async () => {
      await setActiveWorkspace(tenantId)
    })
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors disabled:opacity-50"
      >
        <span className="max-w-[140px] truncate">{current.tenantName}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-56 rounded-lg border border-border bg-popover shadow-md z-50 py-1">
          <p className="px-3 py-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Workspaces
          </p>

          {all.map((w) => (
            <button
              key={w.tenantId}
              onClick={() => handleSwitch(w.tenantId)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
            >
              <Check
                className={`h-3.5 w-3.5 shrink-0 ${w.tenantId === current.tenantId ? "text-foreground" : "text-transparent"}`}
              />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{w.tenantName}</p>
                <p className="text-xs text-muted-foreground capitalize">{w.role.toLowerCase()}</p>
              </div>
            </button>
          ))}

          <div className="border-t mt-1 pt-1">
            <a
              href="/onboarding"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add workspace
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

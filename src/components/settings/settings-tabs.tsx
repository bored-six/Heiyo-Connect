"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

type Tab = {
  id: string
  label: string
  badge?: number
}

export function SettingsTabs({ tabs }: { tabs: Tab[] }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const activeTab = searchParams.get("tab") ?? tabs[0]?.id

  return (
    <div className="flex gap-1 border-b">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const params = new URLSearchParams(searchParams.toString())
        params.set("tab", tab.id)

        return (
          <Link
            key={tab.id}
            href={`${pathname}?${params.toString()}`}
            className={cn(
              "relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className="flex items-center justify-center size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {tab.badge > 9 ? "9+" : tab.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}

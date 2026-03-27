"use client"

import * as React from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"

export function TicketSearch({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = React.useState(defaultValue ?? "")
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  function push(q: string) {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (q) {
        params.set("q", q)
      } else {
        params.delete("q")
      }
      router.push(`${pathname}?${params.toString()}`)
    }, 300)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value)
    push(e.target.value)
  }

  function handleClear() {
    setValue("")
    push("")
  }

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Search tickets…"
        className="h-8 w-48 rounded-md border border-input bg-background pl-8 pr-7 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

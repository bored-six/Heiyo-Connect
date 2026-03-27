"use client"

import { useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { LogOut, UserCircle } from "lucide-react"
import { AvatarDisplay } from "@/lib/avatars"

export function NavProfileButton({
  name,
  email,
  avatarUrl,
}: {
  name: string | null
  email: string
  avatarUrl: string | null
}) {
  const { signOut } = useClerk()
  const router = useRouter()
  const [open, setOpen] = useState(false)
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full focus:outline-none hover:ring-2 hover:ring-indigo-400 focus:ring-2 focus:ring-indigo-400 transition-shadow"
        aria-label="Open profile menu"
      >
        <AvatarDisplay avatarUrl={avatarUrl} name={name} email={email} size={32} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-52 rounded-lg border bg-white shadow-lg py-1 z-50"
          style={{ borderColor: "#E2E8F0" }}
        >
          <div className="px-3 py-2 border-b" style={{ borderColor: "#E2E8F0" }}>
            <p className="text-sm font-medium truncate">{name ?? email}</p>
            {name && <p className="text-xs text-muted-foreground truncate">{email}</p>}
          </div>

          <Link
            href="/dashboard/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <UserCircle className="size-4 text-muted-foreground" />
            My Profile
          </Link>

          <button
            onClick={() => signOut(() => router.push("/"))}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

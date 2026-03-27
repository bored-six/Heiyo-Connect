"use client"

import { useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { LogOut, UserCircle } from "lucide-react"

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(" ")
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

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
  const [imgError, setImgError] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const showImage = !!avatarUrl && !imgError

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="size-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 hover:ring-2 hover:ring-indigo-400 transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-400"
        aria-label="Open profile menu"
      >
        {showImage ? (
          <img
            src={avatarUrl!}
            alt="Avatar"
            className="size-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          getInitials(name, email)
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-52 rounded-lg border bg-white shadow-lg py-1 z-50"
          style={{ borderColor: "#E2E8F0" }}
        >
          {/* User info */}
          <div className="px-3 py-2 border-b" style={{ borderColor: "#E2E8F0" }}>
            <p className="text-sm font-medium truncate">{name ?? email}</p>
            {name && (
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            )}
          </div>

          {/* Profile link */}
          <Link
            href="/dashboard/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <UserCircle className="size-4 text-muted-foreground" />
            My Profile
          </Link>

          {/* Sign out */}
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

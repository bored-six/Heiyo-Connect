"use client"

import { useClerk } from "@clerk/nextjs"
import { LogOut } from "lucide-react"

export function NavLogoutButton() {
  const { signOut } = useClerk()

  return (
    <button
      onClick={() => signOut({ redirectUrl: "/sign-in" })}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <LogOut className="h-3.5 w-3.5" />
      Log out
    </button>
  )
}

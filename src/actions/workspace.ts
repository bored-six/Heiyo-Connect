"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { requireUser } from "@/lib/tenant"

const WORKSPACE_COOKIE = "hw_workspace"

export async function setActiveWorkspace(tenantId: string) {
  const user = await requireUser()

  // Verify the user actually belongs to this workspace
  const valid = user.allMemberships.some((m) => m.tenantId === tenantId)
  if (!valid) throw new Error("Not a member of this workspace")

  const cookieStore = await cookies()
  cookieStore.set(WORKSPACE_COOKIE, tenantId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  })

  redirect("/dashboard")
}

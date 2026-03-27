"use server"

import { z } from "zod"
import { requireUser } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const UpdateProfileSchema = z.object({
  name: z.string().max(100),
  // preset ID like "preset:ocean", or empty string to clear
  avatarUrl: z.string().refine(
    (v) => v === "" || v.startsWith("preset:"),
    "Invalid avatar selection"
  ),
})

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export async function updateProfile(
  input: unknown
): Promise<ActionResult<{ name: string | null; avatarUrl: string | null }>> {
  const user = await requireUser()

  const parsed = UpdateProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { name, avatarUrl } = parsed.data

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name.trim() || null,
        avatarUrl: avatarUrl || null,
      },
      select: { name: true, avatarUrl: true },
    })

    revalidatePath("/dashboard/profile")
    revalidatePath("/dashboard", "layout")

    return { success: true, data: updated }
  } catch {
    return { success: false, error: "Failed to update profile" }
  }
}

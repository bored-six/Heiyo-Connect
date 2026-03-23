"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/tenant";
import { AiProvider } from "@prisma/client";

const UpdateAiProviderSchema = z.object({
  aiProvider: z.nativeEnum(AiProvider),
});

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Persists the tenant's chosen AI provider.
 * The next analyzeTicketWithProvider call will use this provider.
 */
export async function updateAiProvider(
  data: unknown
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const { aiProvider } = UpdateAiProviderSchema.parse(data);

    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: { aiProvider },
    });

    revalidatePath("/dashboard/settings");
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Failed to update AI provider" };
  }
}

/**
 * Returns the current tenant's AI usage stats for display in the UI.
 */
export async function getAiUsage(): Promise<{
  aiProvider: AiProvider;
  dailyAiUsage: number;
  dailyAiLimit: number;
} | null> {
  const user = await requireUser();

  return prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: {
      aiProvider: true,
      dailyAiUsage: true,
      dailyAiLimit: true,
    },
  });
}

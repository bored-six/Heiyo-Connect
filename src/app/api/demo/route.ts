import { clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

const DEMO_EMAIL = "demo@aura-logistics.com"

export async function GET() {
  // Look up the demo user's Clerk ID from the DB — no env var needed
  const demoUser = await prisma.user.findFirst({
    where: { email: DEMO_EMAIL },
    select: { clerkId: true },
  })

  if (!demoUser) {
    return NextResponse.json(
      {
        error: "Demo not seeded yet",
        fix: "Run `pnpm db:seed` to populate the demo data and create the demo Clerk user.",
      },
      { status: 503 }
    )
  }

  try {
    const client = await clerkClient()

    const signInToken = await client.signInTokens.createSignInToken({
      userId: demoUser.clerkId,
      expiresInSeconds: 300,
    })

    const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in"
    return NextResponse.redirect(
      new URL(`${signInUrl}#/?__clerk_ticket=${signInToken.token}`, process.env.NEXT_PUBLIC_APP_URL)
    )
  } catch (err) {
    console.error("[demo] Failed to create sign-in token:", err)
    return NextResponse.json(
      { error: "Could not create demo session. Check CLERK_SECRET_KEY." },
      { status: 500 }
    )
  }
}

import { clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET() {
  const demoUserId = process.env.DEMO_CLERK_USER_ID

  if (!demoUserId || demoUserId === "demo_clerk_placeholder_set_env_var") {
    return NextResponse.json(
      {
        error: "Demo not configured",
        setup:
          "Create a Clerk user for demo@aura-logistics.com, copy their user_id, and set DEMO_CLERK_USER_ID in your .env file. Then re-run pnpm db:seed.",
      },
      { status: 503 }
    )
  }

  try {
    const client = await clerkClient()

    const signInToken = await client.signInTokens.createSignInToken({
      userId: demoUserId,
      expiresInSeconds: 300, // 5 minutes — plenty of time to land on the dashboard
    })

    const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in"
    const redirectUrl = `${signInUrl}#/?__clerk_ticket=${signInToken.token}`

    return NextResponse.redirect(new URL(redirectUrl, process.env.NEXT_PUBLIC_APP_URL))
  } catch (err) {
    console.error("[demo] Failed to create sign-in token:", err)
    return NextResponse.json(
      { error: "Could not create demo session. Check DEMO_CLERK_USER_ID and CLERK_SECRET_KEY." },
      { status: 500 }
    )
  }
}

import { SignIn } from "@clerk/nextjs";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ join?: string }>;
}) {
  const { join } = await searchParams;
  const afterSignInUrl = join
    ? `/onboarding?join=${encodeURIComponent(join)}`
    : "/dashboard";

  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignIn fallbackRedirectUrl={afterSignInUrl} />
    </div>
  );
}

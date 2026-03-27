import { SignUp } from "@clerk/nextjs";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ join?: string }>;
}) {
  const { join } = await searchParams;
  const afterSignUpUrl = join
    ? `/onboarding?join=${encodeURIComponent(join)}`
    : "/onboarding";

  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignUp fallbackRedirectUrl={afterSignUpUrl} />
    </div>
  );
}

import { requireUser } from "@/lib/tenant";
import { redirect } from "next/navigation";
import { getAiUsage, updateAiProvider } from "@/actions/settings";
import { AiProvider } from "@prisma/client";
import { Progress } from "@/components/ui/progress";

const PROVIDER_LABELS: Record<AiProvider, string> = {
  GEMINI: "Gemini 1.5 Flash (Google)",
  GROQ: "Llama 3 8B (Groq)",
  MISTRAL: "Mistral Small (Mistral AI)",
};

const PROVIDER_DESCRIPTIONS: Record<AiProvider, string> = {
  GEMINI: "Best quality. Recommended for most teams.",
  GROQ: "Ultra-fast inference. Great for high-volume support.",
  MISTRAL: "European AI. Strong reasoning, privacy-focused.",
};

export default async function SettingsPage() {
  try {
    await requireUser();
  } catch {
    redirect("/onboarding");
  }

  const usage = await getAiUsage();
  if (!usage) redirect("/onboarding");

  const { aiProvider, dailyAiUsage, dailyAiLimit } = usage;
  const usagePct = Math.round((dailyAiUsage / dailyAiLimit) * 100);
  const isAtLimit = dailyAiUsage >= dailyAiLimit;

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your AI provider and usage limits.
        </p>
      </div>

      {/* AI Usage */}
      <section className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-medium">AI Analysis Usage</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Resets at midnight UTC.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Today's usage</span>
            <span className={isAtLimit ? "text-destructive font-semibold" : "font-medium"}>
              {dailyAiUsage} / {dailyAiLimit} requests
            </span>
          </div>
          <Progress value={usagePct} />
        </div>

        {isAtLimit && (
          <p className="text-sm text-destructive">
            Daily limit reached. New tickets will receive a manual review placeholder until midnight UTC.
          </p>
        )}
      </section>

      {/* AI Provider */}
      <section className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-medium">AI Provider</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choose the model used to analyze tickets and suggest responses.
            Active from the next ticket created.
          </p>
        </div>

        <form
          action={async (formData: FormData) => {
            "use server";
            const provider = formData.get("aiProvider") as AiProvider;
            await updateAiProvider({ aiProvider: provider });
          }}
          className="space-y-3"
        >
          <div className="grid gap-3">
            {(Object.keys(PROVIDER_LABELS) as AiProvider[]).map((provider) => (
              <label
                key={provider}
                className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                  aiProvider === provider
                    ? "border-primary bg-primary/5"
                    : "hover:border-muted-foreground/40"
                }`}
              >
                <input
                  type="radio"
                  name="aiProvider"
                  value={provider}
                  defaultChecked={aiProvider === provider}
                  className="mt-0.5 accent-primary"
                />
                <div>
                  <p className="text-sm font-medium">{PROVIDER_LABELS[provider]}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {PROVIDER_DESCRIPTIONS[provider]}
                    {provider === "MISTRAL" && (
                      <span className="ml-1 text-amber-600">(API key required)</span>
                    )}
                  </p>
                </div>
              </label>
            ))}
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Save Provider
          </button>
        </form>
      </section>
    </main>
  );
}

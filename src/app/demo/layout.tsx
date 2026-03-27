export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC", color: "#1E293B" }}>
      <div className="bg-indigo-600 text-white text-center py-2 px-4 text-sm font-medium">
        You&apos;re viewing a live demo — data resets on refresh.{" "}
        <a href="/sign-up" className="underline underline-offset-2 hover:text-indigo-200 transition-colors">
          Sign up free →
        </a>
      </div>
      {children}
    </div>
  )
}

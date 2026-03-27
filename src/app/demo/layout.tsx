export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC", color: "#1E293B" }}>
      {/* Demo banner */}
      <div className="bg-indigo-600 text-white text-center py-2 px-4 text-sm font-medium">
        You&apos;re viewing a live demo — data resets on refresh.{" "}
        <a href="/sign-up" className="underline underline-offset-2 hover:text-indigo-200 transition-colors">
          Sign up free →
        </a>
      </div>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
        <div className="px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="24" rx="6" fill="#6366F1"/>
              <rect x="5.5" y="6" width="3" height="12" rx="1.5" fill="white"/>
              <rect x="15.5" y="6" width="3" height="12" rx="1.5" fill="white"/>
              <rect x="5.5" y="10" width="13" height="3.5" rx="1.5" fill="white"/>
            </svg>
            <span className="font-semibold text-base tracking-tight" style={{ color: "#1E293B" }}>
              Heiyo
            </span>
            <span className="text-gray-300 text-sm ml-1">/</span>
            <span className="text-sm font-medium text-slate-600 ml-1">Demo Workspace</span>
          </div>
          <div className="flex items-center gap-5 text-sm" style={{ color: "#64748B" }}>
            <span className="font-medium text-slate-900">Dashboard</span>
            <span>Tickets</span>
            <span>Customers</span>
            <span>Reports</span>
            <a
              href="/sign-up"
              className="ml-2 rounded-md bg-indigo-600 text-white text-sm font-medium px-3 py-1.5 hover:bg-indigo-700 transition-colors"
            >
              Sign up free
            </a>
          </div>
        </div>
      </nav>

      {children}
    </div>
  )
}

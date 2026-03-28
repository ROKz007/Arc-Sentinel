import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Arc-Sentinel</p>
          <h1 className="text-2xl font-semibold">Vigilance Dashboard</h1>
        </div>
        <span className="text-xs text-slate-400">Argus AI Online</span>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}

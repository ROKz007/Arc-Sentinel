import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-obsidian text-on-surface">{children}</div>;
}

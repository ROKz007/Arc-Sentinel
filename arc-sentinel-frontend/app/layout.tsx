import "@/styles/globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Arc-Sentinel",
  description: "Predictive Infrastructure Monitoring",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}

import "@/styles/globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Arc-Sentinel | Infrastructure Guardian",
  description: "AI-powered structural health monitoring",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-obsidian text-on-surface min-h-screen font-body">
        {children}
      </body>
    </html>
  );
}

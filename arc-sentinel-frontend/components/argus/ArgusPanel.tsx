"use client";
import { useState } from "react";
import { ArgusMessage as Message } from "@/lib/types";
import { sendArgusMessage } from "@/lib/api";
import { ArgusInput } from "@/components/argus/ArgusInput";
import { ArgusMessage } from "@/components/argus/ArgusMessage";


const welcome: Message = {
  role: "assistant",
  content: "> ARGUS AI ONLINE — Ask about sensor data, anomalies, or structural integrity",
};

export function ArgusPanel() {
  const [messages, setMessages] = useState<Message[]>([welcome]);

  const handleSend = async (text: string) => {
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const response = await sendArgusMessage(text);
      const botMsg: Message = { role: "assistant", content: response.reply, sources: response.sources };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const isTimeout = err instanceof Error &&
        (err.message.includes('timeout') || err.message.includes('fetch'));
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: isTimeout
          ? '⏳ Backend is waking up from sleep (Render free tier). Please wait 30 seconds and try again.'
          : `⚠ Argus offline: ${err instanceof Error ? err.message : 'Unknown error'}. Check NEXT_PUBLIC_API_BASE_URL in Vercel env vars.`,
      }]);
    }
  };

  return (
    <div className="rounded border border-slate-800 bg-panel p-4 h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Argus AI</h3>
        <span className="text-[10px] text-slate-500">Diagnostics</span>
      </div>
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
        {messages.map((m, idx) => (
          <ArgusMessage key={idx} message={m} />
        ))}
      </div>
      <ArgusInput onSend={handleSend} />
    </div>
  );
}

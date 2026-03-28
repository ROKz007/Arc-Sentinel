"use client";
import { useState } from "react";
import { ArgusMessage as Message } from "@/lib/types";
import { sendArgusMessage } from "@/lib/api";
import { ArgusInput } from "@/components/argus/ArgusInput";
import { ArgusMessage } from "@/components/argus/ArgusMessage";

const welcome: Message = {
  role: "assistant",
  content: "Argus online. Ask about nodes, anomalies, or IHI.",
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
      const botMsg: Message = { role: "assistant", content: "Argus is unavailable right now." };
      setMessages((prev) => [...prev, botMsg]);
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

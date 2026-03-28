"use client";
import { useState, useRef, useEffect } from "react";
import { sendArgusMessage } from "@/lib/api";

interface Message {
  role: "user" | "argus";
  content: string;
  sources?: string[];
  error?: boolean;
}

export function ArgusChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "argus",
      content: "> ARGUS online. Ask me about anomalies, sensor data, or structural integrity.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const result = await sendArgusMessage(text);
      setMessages((prev) => [
        ...prev,
        { role: "argus", content: result.reply, sources: result.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "argus",
          content: `> ARGUS offline: ${(err as Error).message}`,
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSend();
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary" aria-hidden>psychology</span>
          <span className="font-headline text-[10px] tracking-[0.2em]">ARGUS_AI_INSIGHT</span>
        </div>
        <span className="font-mono text-[9px] px-3 py-1 border border-primary/30 text-primary uppercase">PREDICTIVE_ENGINE_V4.2</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 custom-scrollbar min-h-0" style={{ maxHeight: "200px" }}>
        {messages.map((msg, i) => (
          <div key={i} className={`font-mono text-[11px] leading-relaxed ${msg.role === "user" ? "text-secondary" : msg.error ? "text-red-400" : "text-on-surface/80"}`}>
            <span className="opacity-50 mr-1">{msg.role === "user" ? ">" : "ARGUS:"}</span>
            <span>{msg.content}</span>
            {msg.sources && msg.sources.length > 0 && (
              <p className="text-primary/40 text-[9px] mt-0.5 uppercase tracking-wider">
                Sources: {msg.sources.join(", ")}
              </p>
            )}
          </div>
        ))}
        {loading && (
          <div className="font-mono text-[11px] text-primary/60 animate-pulse">
            ARGUS: processing<span className="cursor-blink">_</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Query Argus..."
          disabled={loading}
          className="flex-1 bg-obsidian/60 border border-primary/30 text-on-surface font-mono text-[11px] px-3 py-2 placeholder:text-on-surface/30 focus:outline-none focus:border-primary disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-primary/10 border border-primary/30 font-headline text-[10px] text-primary uppercase tracking-widest hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}

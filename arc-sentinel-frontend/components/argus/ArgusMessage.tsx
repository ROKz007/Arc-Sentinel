import { ArgusMessage as Message } from "@/lib/types";

export function ArgusMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
          isUser ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-100"
        }`}
      >
        <p>{message.content}</p>
        {message.sources && message.sources.length > 0 && (
          <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
            Sources: {message.sources.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

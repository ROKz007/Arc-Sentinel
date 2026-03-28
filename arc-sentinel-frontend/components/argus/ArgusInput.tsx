"use client";
import { FormEvent, useState } from "react";

interface Props {
  onSend: (message: string) => Promise<void> | void;
}

export function ArgusInput({ onSend }: Props) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setBusy(true);
    await onSend(value.trim());
    setValue("");
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        className="flex-1 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
        placeholder="Ask Argus about anomalies or sensors..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={busy}
      />
      <button
        className="px-4 py-2 rounded bg-sky-600 text-white text-sm disabled:opacity-50"
        disabled={busy}
        type="submit"
      >
        Send
      </button>
    </form>
  );
}

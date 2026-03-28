'use client';
import { useEffect, useState } from 'react';

type Status = 'checking' | 'online' | 'offline' | 'waking';

export function BackendStatus() {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    const check = async () => {
      const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!BASE) { setStatus('offline'); return; }
      const start = Date.now();
      try {
        const res = await fetch(`${BASE}/ping`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
        const elapsed = Date.now() - start;
        if (res.ok) {
          setStatus(elapsed > 3000 ? 'waking' : 'online');
        } else {
          setStatus('offline');
        }
      } catch {
        setStatus('offline');
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const config = {
    checking: { color: 'text-primary/40',  dot: 'bg-primary/40',  label: 'CHECKING...' },
    online:   { color: 'text-green-400',   dot: 'bg-green-400',   label: 'BACKEND_ONLINE' },
    waking:   { color: 'text-yellow-400',  dot: 'bg-yellow-400',  label: 'BACKEND_WAKING' },
    offline:  { color: 'text-red-400',     dot: 'bg-red-400',     label: 'BACKEND_OFFLINE' },
  }[status];

  return (
    <div className={`flex items-center gap-2 font-mono text-[10px] ${config.color}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot} ${status === 'checking' ? 'animate-pulse' : ''}`} />
      <span className="uppercase tracking-widest">{config.label}</span>
    </div>
  );
}

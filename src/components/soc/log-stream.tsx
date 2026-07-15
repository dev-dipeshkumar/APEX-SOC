'use client';

import { useEffect, useRef } from 'react';
import { useUIStore } from '@/stores/ui-store';

const LEVEL_COLORS: Record<string, string> = {
  CRIT: '#ef4444',
  WARN: '#f97316',
  INFO: '#3b82f6',
  DEBUG: '#546380',
};

const LEVEL_BG: Record<string, string> = {
  CRIT: 'rgba(239, 68, 68, 0.03)',
  WARN: 'rgba(249, 115, 22, 0.03)',
  INFO: 'rgba(59, 130, 246, 0.02)',
  DEBUG: 'rgba(84, 99, 128, 0.02)',
};

export function LogStream() {
  const { logLines } = useUIStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      isAtBottomRef.current = container.scrollHeight - container.scrollTop - container.clientHeight < 40;
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logLines]);

  return (
    <div className="flex h-full flex-col rounded-xl soc-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#1a2744]/60 px-3 py-2.5">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94a3b8]">Log Stream</h3>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 status-pulse" />
          <span className="text-[9px] text-[#546380]">LIVE</span>
        </div>
      </div>

      <div ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden font-mono text-[10px] leading-relaxed"
        style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {logLines.map(line => (
          <div key={line.id}
            className="flex gap-2 px-3 py-0.5 hover:bg-[rgba(59,130,246,0.02)] transition-colors"
            style={{ backgroundColor: LEVEL_BG[line.level] }}>
            <span className="shrink-0 text-[#546380]">{line.timestamp.slice(11, 19)}</span>
            <span className="shrink-0 w-10 font-bold" style={{ color: LEVEL_COLORS[line.level] }}>
              [{line.level}]
            </span>
            <span className="text-[#546380]">{line.source}:</span>
            <span className="text-[#94a3b8] break-all">{highlightKVPairs(line.message)}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 px-3 py-0.5">
          <span className="text-[#546380]">_</span>
          <span className="h-3 w-1.5 bg-blue-400/60 cursor-blink" />
        </div>
      </div>
    </div>
  );
}

function highlightKVPairs(message: string): React.ReactNode {
  const parts = message.split(/(=\S+)/);
  return parts.map((part, i) => {
    if (part.startsWith('=') && part.length > 1) return <span key={i} className="text-blue-400/70">{part}</span>;
    if (/^\d+\.\d+\.\d+\.\d+/.test(part)) return <span key={i} className="text-[#e8ecf4]">{part}</span>;
    return <span key={i}>{part}</span>;
  });
}

'use client';

import { useEffect, useRef } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { motion } from 'framer-motion';

const LEVEL_COLORS: Record<string, string> = {
  CRIT: '#ff2d55',
  WARN: '#ff9500',
  INFO: '#00f0ff',
  DEBUG: '#475569',
};

const LEVEL_BG: Record<string, string> = {
  CRIT: 'rgba(255, 45, 85, 0.03)',
  WARN: 'rgba(255, 149, 0, 0.03)',
  INFO: 'rgba(0, 240, 255, 0.02)',
  DEBUG: 'rgba(71, 85, 105, 0.02)',
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
    <div className="flex h-full flex-col rounded-xl glass overflow-hidden">
      <div className="flex items-center justify-between border-b border-[rgba(0,240,255,0.04)] px-3 py-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">Log Stream</h3>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 status-pulse" />
          <span className="text-[9px] text-[#475569]">LIVE</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden font-mono text-[10px] leading-relaxed"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        {logLines.map(line => (
          <div
            key={line.id}
            className="flex gap-2 px-3 py-0.5 hover:bg-[rgba(0,240,255,0.02)] transition-colors"
            style={{ backgroundColor: LEVEL_BG[line.level] }}
          >
            <span className="shrink-0 text-[#475569]">{line.timestamp.slice(11, 19)}</span>
            <span
              className="shrink-0 w-10 font-bold"
              style={{ color: LEVEL_COLORS[line.level] }}
            >
              [{line.level}]
            </span>
            <span className="text-[#475569]">{line.source}:</span>
            <span className="text-[#94a3b8] break-all">{highlightKVPairs(line.message)}</span>
          </div>
        ))}

        <div className="flex items-center gap-1 px-3 py-0.5">
          <span className="text-[#475569]">_</span>
          <span className="h-3 w-1.5 bg-cyan-400/60 cursor-blink" />
        </div>
      </div>
    </div>
  );
}

function highlightKVPairs(message: string): React.ReactNode {
  const parts = message.split(/(=\S+)/);
  return parts.map((part, i) => {
    if (part.startsWith('=') && part.length > 1) {
      return <span key={i} className="text-cyan-400/70">{part}</span>;
    }
    if (/^\d+\.\d+\.\d+\.\d+/.test(part)) {
      return <span key={i} className="text-[#e2e8f0]">{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

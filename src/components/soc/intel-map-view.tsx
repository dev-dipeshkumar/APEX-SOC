'use client';

import { useState, useMemo, Suspense } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { useGlobeStore } from '@/stores/globe-store';
import {
  SEVERITY_COLORS, ATTACK_TYPE_LABELS, ATTACK_TYPE_COLORS,
  type AttackType, type Severity,
} from '@/lib/constants';
import { GlobeScene } from '@/components/globe/globe-scene';
import { AttackInfoPanel } from '@/components/globe/attack-info-panel';
import {
  Pause, Play, Shield, MapPin, Globe as GlobeIcon, Loader2, Maximize2,
  Wifi, X, Target, Crosshair, AlertTriangle, Zap,
  ShieldAlert, Activity, Filter, RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// Globe Loading Fallback
// ─────────────────────────────────────────────────────────────
function GlobeLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-[#475569]">
      <div className="relative mb-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="h-16 w-16 rounded-full border-2 border-[rgba(0,240,255,0.1)] border-t-[rgba(0,240,255,0.5)]"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <GlobeIcon className="h-5 w-5 text-cyan-400/60" />
        </div>
      </div>
      <p className="text-xs text-[#94a3b8] font-medium">Initializing Globe Engine</p>
      <p className="text-[10px] text-[#475569] mt-1">Loading satellite imagery & threat data</p>
      <div className="mt-3 w-32 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,240,255,0.05)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, rgba(0,240,255,0.3), rgba(0,240,255,0.8))' }}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 3, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HUD Stats Overlay
// ─────────────────────────────────────────────────────────────
function HUDOverlay({ attackStats, totalConnections }: {
  attackStats: Record<string, number>;
  totalConnections: number;
}) {
  return (
    <>
      {/* Top-left: Live indicator */}
      <div className="absolute top-3 left-3 z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg px-3 py-2 flex items-center gap-2"
          style={{
            background: 'rgba(6, 10, 20, 0.8)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,240,255,0.08)',
          }}
        >
          <div className="relative">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </div>
          <span className="text-[10px] text-[#94a3b8] font-medium">Real-time Threat Visualization</span>
          <span className="text-[10px] font-mono font-bold text-emerald-400">{totalConnections}</span>
        </motion.div>
      </div>

      {/* Top-right: Severity breakdown */}
      <div className="absolute top-3 right-3 z-10">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-lg px-3 py-2.5 space-y-1.5"
          style={{
            background: 'rgba(6, 10, 20, 0.8)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,240,255,0.08)',
          }}
        >
          {(['critical', 'high', 'medium', 'low'] as Severity[]).map(sev => (
            <div key={sev} className="flex items-center gap-2">
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: SEVERITY_COLORS[sev], boxShadow: `0 0 6px ${SEVERITY_COLORS[sev]}40` }}
              />
              <span className="text-[9px] text-[#475569] w-10 capitalize">{sev}</span>
              <span className="text-[9px] font-mono font-bold" style={{ color: SEVERITY_COLORS[sev] }}>
                {attackStats[sev] || 0}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom-left: Controls hint */}
      <div className="absolute bottom-3 left-3 z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-lg px-3 py-2 flex items-center gap-3"
          style={{
            background: 'rgba(6, 10, 20, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0,240,255,0.05)',
          }}
        >
          <span className="text-[9px] text-[#475569]">Click threat for details</span>
          <span className="text-[9px] text-[#475569]">|</span>
          <span className="text-[9px] text-[#475569]">Drag to rotate</span>
          <span className="text-[9px] text-[#475569]">|</span>
          <span className="text-[9px] text-[#475569]">Scroll to zoom</span>
        </motion.div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Intel Map View
// ─────────────────────────────────────────────────────────────
export function IntelMapView() {
  const { attackConnections } = useUIStore();
  const severityFilter = useGlobeStore(s => s.severityFilter);
  const typeFilter = useGlobeStore(s => s.typeFilter);
  const setSeverityFilter = useGlobeStore(s => s.setSeverityFilter);
  const setTypeFilter = useGlobeStore(s => s.setTypeFilter);
  const globeReady = useGlobeStore(s => s.globeReady);

  const [paused, setPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const filtered = useMemo(() => {
    let result = attackConnections;
    if (typeFilter) result = result.filter(a => a.attackType === typeFilter);
    if (severityFilter) result = result.filter(a => a.severity === severityFilter);
    return result;
  }, [attackConnections, typeFilter, severityFilter]);

  // Attack stats
  const attackStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(a => {
      counts[a.severity] = (counts[a.severity] || 0) + 1;
    });
    return counts;
  }, [filtered]);

  return (
    <div className="flex h-full gap-0">
      {/* Globe Container */}
      <div className="flex flex-1 flex-col gap-3 min-w-0">
        {/* Controls Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl px-3 py-2 flex-wrap"
          style={{
            background: 'rgba(8, 13, 24, 0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,240,255,0.06)',
          }}
        >
          {/* Play/Pause */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPaused(!paused)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-[#94a3b8] hover:bg-[rgba(0,240,255,0.05)] transition-all"
            style={{ background: 'rgba(0,240,255,0.02)', border: '1px solid rgba(0,240,255,0.06)' }}
          >
            {paused ? <Play className="h-3 w-3 text-cyan-400" /> : <Pause className="h-3 w-3 text-cyan-400" />}
            {paused ? 'Play' : 'Pause'}
          </motion.button>

          <div className="h-4 w-px bg-[rgba(0,240,255,0.06)]" />

          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3 w-3 text-[#475569]" />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as AttackType | '')}
              className="rounded-lg border border-[rgba(0,240,255,0.06)] bg-[rgba(5,8,16,0.6)] px-2 py-1 text-[10px] text-[#94a3b8] focus:outline-none focus:border-cyan-500/20 appearance-none cursor-pointer"
            >
              <option value="">All Types</option>
              {Object.entries(ATTACK_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value as Severity | '')}
              className="rounded-lg border border-[rgba(0,240,255,0.06)] bg-[rgba(5,8,16,0.6)] px-2 py-1 text-[10px] text-[#94a3b8] focus:outline-none focus:border-cyan-500/20 appearance-none cursor-pointer"
            >
              <option value="">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Reset */}
          {(typeFilter || severityFilter) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setTypeFilter(''); setSeverityFilter(''); }}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-[#475569] hover:text-[#94a3b8] hover:bg-[rgba(0,240,255,0.05)] transition-all"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </motion.button>
          )}

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Wifi className="h-3 w-3 text-emerald-400 status-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium">{filtered.length} active</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="rounded-lg p-1.5 text-[#475569] hover:text-[#94a3b8] hover:bg-[rgba(0,240,255,0.05)] transition-all"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </motion.button>
          </div>
        </motion.div>

        {/* 3D Globe Canvas */}
        <div
          className={`relative rounded-xl overflow-hidden globe-container ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}
          style={{
            minHeight: '500px',
            height: isFullscreen ? '100vh' : undefined,
            flex: isFullscreen ? undefined : 1,
            background: 'radial-gradient(ellipse at center, rgba(5, 10, 25, 1) 0%, rgba(3, 6, 15, 1) 100%)',
            border: isFullscreen ? 'none' : '1px solid rgba(0,240,255,0.05)',
          }}
        >
          {/* Ambient glow behind globe */}
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(0,240,255,0.03) 0%, transparent 60%)' }}
          />

          <Suspense fallback={<GlobeLoader />}>
            <div className="w-full h-full" style={{ minHeight: '500px' }}>
              <GlobeScene
                attacks={paused ? [] : filtered.slice(-60)}
                selectedAttack={null}
                hoveredAttack={null}
                onSelectAttack={() => {}}
                onHoverAttack={() => {}}
              />
            </div>
          </Suspense>

          {/* HUD Overlay */}
          <HUDOverlay attackStats={attackStats} totalConnections={filtered.length} />

          {/* Fullscreen close button */}
          {isFullscreen && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFullscreen(false)}
              className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] hover:text-white transition-colors"
              style={{ background: 'rgba(6, 10, 20, 0.8)', border: '1px solid rgba(0,240,255,0.1)' }}
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
        </div>

        {/* Legend */}
        <div
          className="flex items-center gap-4 rounded-xl px-3 py-2 flex-wrap"
          style={{ background: 'rgba(8, 13, 24, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,240,255,0.05)' }}
        >
          <span className="text-[10px] text-[#475569] font-medium">Legend:</span>
          {Object.entries(ATTACK_TYPE_LABELS).slice(0, 6).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1.5 group cursor-default">
              <div
                className="h-2 w-2 rounded-full transition-shadow group-hover:shadow-[0_0_6px_currentColor]"
                style={{ backgroundColor: ATTACK_TYPE_COLORS[type as AttackType], color: ATTACK_TYPE_COLORS[type as AttackType] }}
              />
              <span className="text-[10px] text-[#94a3b8] group-hover:text-[#e2e8f0] transition-colors">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Attack Detail Panel - Uses new glassmorphism panel */}
      <AttackInfoPanel />
    </div>
  );
}

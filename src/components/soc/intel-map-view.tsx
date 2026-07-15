'use client';

import { useState, useEffect, useCallback, useRef, Suspense, useMemo } from 'react';
import { useUIStore } from '@/stores/ui-store';
import {
  SEVERITY_COLORS, SEVERITY_BG, ATTACK_TYPE_LABELS, ATTACK_TYPE_COLORS,
  type AttackConnection, type AttackType, type Severity,
} from '@/lib/constants';
import { formatTime, formatRelativeTime } from '@/lib/formatters';
import {
  Pause, Play, Shield, MapPin, Globe as GlobeIcon, Loader2, Maximize2,
  Wifi, X, ChevronDown, Target, Crosshair, AlertTriangle, Zap,
  ShieldAlert, Eye, TrendingUp, Clock, Fingerprint, Activity,
} from 'lucide-react';
import { ThreeGlobe } from './three-globe';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// Globe Loading Fallback
// ─────────────────────────────────────────────────────────────
function GlobeLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-[#475569]">
      <div className="relative mb-4">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <GlobeIcon className="h-4 w-4 text-cyan-400/60" />
        </div>
      </div>
      <p className="text-xs text-[#94a3b8]">Initializing 3D Globe Engine...</p>
      <p className="text-[10px] text-[#475569] mt-1">Loading satellite imagery & threat data</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Enterprise-Grade Attack Detail Panel (FIXED: closable popup)
// ─────────────────────────────────────────────────────────────
function AttackDetailPanel({
  attack,
  isOpen,
  onClose,
}: {
  attack: AttackConnection | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC key closes panel
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [isOpen, onClose]);

  // Click outside closes panel
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [isOpen, onClose]);

  if (!attack) return null;

  const severityColor = SEVERITY_COLORS[attack.severity];
  const attackTypeLabel = ATTACK_TYPE_LABELS[attack.attackType] || attack.attackType;

  const mitreTactics = ['Initial Access', 'Execution', 'Persistence', 'Defense Evasion'];
  const mitreTechniques = ['T1566.001', 'T1059.001', 'T1547.001'];
  const confidenceScore = attack.severity === 'critical' ? 92 : attack.severity === 'high' ? 78 : 65;
  const riskScore = attack.severity === 'critical' ? 95 : attack.severity === 'high' ? 82 : attack.severity === 'medium' ? 58 : 35;
  const iocList = [
    attack.sourceIp,
    `c2.${attack.adversary.toLowerCase().replace(/[^a-z]/g, '')}[.]xyz`,
    `${attack.sourceIp.split('.').slice(0, 3).join('.')}.0/24`,
    `hash:${attack.id.slice(0, 32).padEnd(32, '0')}`,
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-[420px] border-l overflow-y-auto"
            style={{
              background: 'rgba(8, 13, 24, 0.92)',
              backdropFilter: 'blur(24px)',
              borderColor: `${severityColor}15`,
            }}
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 border-b px-5 py-4"
              style={{
                background: 'rgba(8, 13, 24, 0.95)',
                backdropFilter: 'blur(16px)',
                borderColor: `${severityColor}15`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: `${severityColor}15`, border: `1px solid ${severityColor}25` }}
                  >
                    <ShieldAlert className="h-4 w-4" style={{ color: severityColor }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: severityColor }}
                      >
                        {attack.severity} threat
                      </span>
                      <span className="text-[9px] text-[#475569]">|</span>
                      <span className="text-[10px] text-[#94a3b8]">{attackTypeLabel}</span>
                    </div>
                    <p className="text-[10px] text-[#475569] mt-0.5">{formatRelativeTime(attack.timestamp)}</p>
                  </div>
                </div>

                {/* Close button - FIXED: works reliably */}
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#475569] hover:text-white transition-colors"
                  aria-label="Close panel"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Severity bar */}
              <div className="mt-3 h-1 w-full rounded-full overflow-hidden" style={{ background: `${severityColor}10` }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${riskScore}%` }}
                  transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${severityColor}80, ${severityColor})` }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">
              {/* Risk & Confidence Scores */}
              <div className="grid grid-cols-2 gap-3">
                <ScoreCard label="Risk Score" value={riskScore} color={severityColor} icon={TrendingUp} />
                <ScoreCard label="Confidence" value={confidenceScore} color="#00f0ff" icon={Fingerprint} />
              </div>

              {/* Attack Details */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(12, 18, 32, 0.6)', border: '1px solid rgba(0,240,255,0.06)' }}>
                <h3 className="text-[10px] uppercase tracking-wider text-[#475569] font-medium mb-3 flex items-center gap-1.5">
                  <Target className="h-3 w-3" style={{ color: severityColor }} />
                  Attack Details
                </h3>
                <div className="space-y-2.5">
                  <DetailRow icon={<Crosshair className="h-3 w-3" />} label="Source IP" value={attack.sourceIp} mono highlight color={severityColor} />
                  <DetailRow icon={<MapPin className="h-3 w-3" />} label="Source Country" value={attack.sourceCountry} />
                  <DetailRow icon={<Target className="h-3 w-3" />} label="Destination IP" value={attack.targetIp} mono />
                  <DetailRow icon={<MapPin className="h-3 w-3" />} label="Destination" value={attack.targetLocation} />
                  <DetailRow icon={<AlertTriangle className="h-3 w-3" />} label="Attack Type" value={attackTypeLabel} color={ATTACK_TYPE_COLORS[attack.attackType]} />
                  <DetailRow icon={<Shield className="h-3 w-3" />} label="Threat Actor" value={attack.adversary} />
                  <DetailRow icon={<Clock className="h-3 w-3" />} label="Timestamp" value={formatTime(attack.timestamp)} />
                  <DetailRow icon={<Activity className="h-3 w-3" />} label="Attack Vector" value="Network" />
                  <DetailRow icon={<Eye className="h-3 w-3" />} label="Organization" value="Infrastructure Defense" />
                </div>
              </div>

              {/* MITRE ATT&CK Mapping */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(12, 18, 32, 0.6)', border: '1px solid rgba(0,240,255,0.06)' }}>
                <h3 className="text-[10px] uppercase tracking-wider text-[#475569] font-medium mb-3 flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-cyan-400" />
                  MITRE ATT&CK
                </h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {mitreTactics.map(t => (
                    <span key={t} className="rounded-md px-2 py-1 text-[9px] font-medium" style={{ background: 'rgba(0,240,255,0.06)', color: '#00f0ff', border: '1px solid rgba(0,240,255,0.1)' }}>
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {mitreTechniques.map(t => (
                    <span key={t} className="rounded-md px-2 py-1 text-[9px] font-mono" style={{ background: 'rgba(168,85,247,0.06)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.1)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* IOCs */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(12, 18, 32, 0.6)', border: '1px solid rgba(0,240,255,0.06)' }}>
                <h3 className="text-[10px] uppercase tracking-wider text-[#475569] font-medium mb-3 flex items-center gap-1.5">
                  <Fingerprint className="h-3 w-3 text-amber-400" />
                  Indicators of Compromise
                </h3>
                <div className="space-y-1.5">
                  {iocList.map((ioc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg px-3 py-2 font-mono text-[10px]"
                      style={{ background: 'rgba(0,240,255,0.02)', border: '1px solid rgba(0,240,255,0.04)' }}
                    >
                      <span className="text-[#94a3b8] truncate flex-1">{ioc}</span>
                      <span className="text-[8px] uppercase text-[#475569] ml-2 shrink-0">
                        {ioc.includes('.') && !ioc.includes('hash') ? 'IP' : ioc.includes('hash') ? 'HASH' : 'DOMAIN'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
// Score Card Component
// ─────────────────────────────────────────────────────────────
function ScoreCard({ label, value, color, icon: Icon }: {
  label: string; value: number; color: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 800;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div
      className="rounded-xl p-3.5"
      style={{
        background: `linear-gradient(135deg, ${color}08, transparent)`,
        border: `1px solid ${color}15`,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] uppercase tracking-wider text-[#475569]">{label}</span>
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold font-mono" style={{ color }}>{displayValue}</span>
        <span className="text-[10px] text-[#475569]">/100</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Detail Row Component
// ─────────────────────────────────────────────────────────────
function DetailRow({ icon, label, value, mono, highlight, color }: {
  icon: React.ReactNode; label: string; value: string; mono?: boolean; highlight?: boolean; color?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[#475569] shrink-0">{icon}</span>
      <span className="text-[10px] uppercase tracking-wider text-[#475569] shrink-0 w-24">{label}</span>
      <span
        className={`text-xs flex-1 text-right truncate ${mono ? 'font-mono' : ''}`}
        style={{ color: color || '#e2e8f0' }}
      >
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Intel Map View
// ─────────────────────────────────────────────────────────────
export function IntelMapView() {
  const { attackConnections } = useUIStore();
  const [selectedAttack, setSelectedAttack] = useState<AttackConnection | null>(null);
  const [hoveredAttack, setHoveredAttack] = useState<AttackConnection | null>(null);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [typeFilter, setTypeFilter] = useState<AttackType | ''>('');
  const [severityFilter, setSeverityFilter] = useState<Severity | ''>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = attackConnections;
    if (typeFilter) result = result.filter(a => a.attackType === typeFilter);
    if (severityFilter) result = result.filter(a => a.severity === severityFilter);
    return result;
  }, [attackConnections, typeFilter, severityFilter]);

  // When selecting an attack, open the panel
  const handleSelectAttack = useCallback((attack: AttackConnection) => {
    setSelectedAttack(attack);
    setPanelOpen(true);
  }, []);

  // Close panel - FIXED: proper close that always works
  const handleClosePanel = useCallback(() => {
    setPanelOpen(false);
    setTimeout(() => {
      setSelectedAttack(null);
    }, 300);
  }, []);

  // Attack stats
  const attackStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(a => {
      counts[a.severity] = (counts[a.severity] || 0) + 1;
    });
    return counts;
  }, [filtered]);

  return (
    <div className="flex h-full gap-4">
      {/* Globe */}
      <div className="flex flex-1 flex-col gap-3 min-w-0">
        {/* Controls */}
        <div className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: 'rgba(12, 18, 32, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,240,255,0.06)' }}>
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

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#475569]">Speed:</span>
            {[0.5, 1, 2, 4].map(s => (
              <motion.button
                key={s}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSpeed(s)}
                className={`rounded px-2 py-1 text-[10px] transition-all ${
                  speed === s ? 'text-cyan-400' : 'text-[#475569] hover:text-[#94a3b8]'
                }`}
                style={speed === s ? { background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.15)' } : {}}
              >
                {s}x
              </motion.button>
            ))}
          </div>

          <div className="h-4 w-px bg-[rgba(0,240,255,0.08)]" />

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#475569]">Type:</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as AttackType | '')}
              className="rounded-lg border border-[rgba(0,240,255,0.08)] bg-[#050810]/60 px-2 py-1 text-[10px] text-[#94a3b8] focus:outline-none focus:border-cyan-500/20"
            >
              <option value="">All Types</option>
              {Object.entries(ATTACK_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#475569]">Severity:</span>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value as Severity | '')}
              className="rounded-lg border border-[rgba(0,240,255,0.08)] bg-[#050810]/60 px-2 py-1 text-[10px] text-[#94a3b8] focus:outline-none focus:border-cyan-500/20"
            >
              <option value="">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Wifi className="h-3 w-3 text-emerald-400 status-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium">{filtered.length} connections</span>
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
        </div>

        {/* 3D Globe Canvas */}
        <div
          className={`relative rounded-xl overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}
          style={{
            minHeight: '450px',
            background: 'rgba(12, 18, 32, 0.4)',
            border: '1px solid rgba(0,240,255,0.06)',
          }}
        >
          {/* Ambient glow behind globe */}
          <div
            className="absolute inset-0 z-0"
            style={{ background: 'radial-gradient(ellipse at center, rgba(0,240,255,0.02) 0%, transparent 60%)' }}
          />

          <Suspense fallback={<GlobeLoader />}>
            <ThreeGlobe
              attacks={filtered.slice(-50)}
              selectedAttack={selectedAttack}
              hoveredAttack={hoveredAttack}
              onSelectAttack={handleSelectAttack}
              onHoverAttack={setHoveredAttack}
            />
          </Suspense>

          {/* Globe overlay stats */}
          <div className="absolute top-3 left-3 z-10 rounded-lg px-3 py-2" style={{ background: 'rgba(8, 13, 24, 0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,240,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 status-pulse" />
              <span className="text-[10px] text-[#94a3b8]">Real-time Threat Visualization</span>
            </div>
          </div>

          {/* Attack severity indicators */}
          <div className="absolute top-3 right-3 z-10 rounded-lg px-3 py-2 space-y-1" style={{ background: 'rgba(8, 13, 24, 0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,240,255,0.06)' }}>
            {(['critical', 'high', 'medium', 'low'] as Severity[]).map(sev => (
              <div key={sev} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[sev], boxShadow: `0 0 4px ${SEVERITY_COLORS[sev]}40` }} />
                <span className="text-[9px] text-[#475569] w-10">{sev}</span>
                <span className="text-[9px] font-mono font-bold" style={{ color: SEVERITY_COLORS[sev] }}>{attackStats[sev] || 0}</span>
              </div>
            ))}
          </div>

          {/* Fullscreen close button */}
          {isFullscreen && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFullscreen(false)}
              className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] hover:text-white transition-colors"
              style={{ background: 'rgba(8, 13, 24, 0.8)', border: '1px solid rgba(0,240,255,0.1)' }}
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 rounded-xl px-3 py-2 flex-wrap" style={{ background: 'rgba(12, 18, 32, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,240,255,0.06)' }}>
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

      {/* Attack Detail Panel - FIXED: properly closable */}
      <AttackDetailPanel
        attack={selectedAttack}
        isOpen={panelOpen}
        onClose={handleClosePanel}
      />
    </div>
  );
}

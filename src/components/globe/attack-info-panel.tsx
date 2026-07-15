'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobeStore } from '@/stores/globe-store';
import { SEVERITY_COLORS, ATTACK_TYPE_LABELS, ATTACK_TYPE_COLORS, type Severity } from '@/lib/constants';
import { formatTime, formatRelativeTime } from '@/lib/formatters';
import {
  X, ShieldAlert, Target, Crosshair, MapPin, AlertTriangle,
  Clock, Activity, Eye, TrendingUp, Fingerprint, Zap,
  Shield, ChevronRight, ExternalLink, Copy, Check,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Animated Score Counter
// ─────────────────────────────────────────────────────────────
function AnimatedScore({ value, color, label, icon: Icon }: {
  value: number; color: string; label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 800;
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div
      className="rounded-xl p-3.5 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${color}06, transparent)`,
        border: `1px solid ${color}12`,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] uppercase tracking-wider text-[#475569]">{label}</span>
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold font-mono" style={{ color }}>{display}</span>
        <span className="text-[10px] text-[#475569]">/100</span>
      </div>
      {/* Progress ring */}
      <svg className="absolute top-2 right-2 w-8 h-8 -rotate-90" viewBox="0 0 36 36">
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke={`${color}15`} strokeWidth="2"
        />
        <motion.path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke={color} strokeWidth="2"
          strokeDasharray="100, 100"
          initial={{ strokeDashoffset: 100 }}
          animate={{ strokeDashoffset: 100 - value }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Detail row
// ─────────────────────────────────────────────────────────────
function DetailRow({ icon, label, value, mono, color, copyable }: {
  icon: React.ReactNode; label: string; value: string;
  mono?: boolean; color?: string; copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2.5 group">
      <span className="text-[#475569] shrink-0">{icon}</span>
      <span className="text-[10px] uppercase tracking-wider text-[#475569] shrink-0 w-24">{label}</span>
      <span
        className={`text-xs flex-1 text-right truncate ${mono ? 'font-mono' : ''}`}
        style={{ color: color || '#e2e8f0' }}
      >
        {value}
      </span>
      {copyable && (
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-[rgba(0,240,255,0.1)] rounded"
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-400" />
          ) : (
            <Copy className="h-3 w-3 text-[#475569]" />
          )}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MITRE ATT&CK Tag
// ─────────────────────────────────────────────────────────────
function MitreTag({ text, variant = 'tactic' }: { text: string; variant?: 'tactic' | 'technique' }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[9px] font-medium transition-all hover:scale-105"
      style={{
        background: variant === 'tactic' ? 'rgba(0,240,255,0.06)' : 'rgba(168,85,247,0.06)',
        color: variant === 'tactic' ? '#00f0ff' : '#a855f7',
        border: `1px solid ${variant === 'tactic' ? 'rgba(0,240,255,0.1)' : 'rgba(168,85,247,0.1)'}`,
      }}
    >
      {variant === 'technique' && <ChevronRight className="h-2 w-2" />}
      {text}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Attack Information Panel
// ─────────────────────────────────────────────────────────────
export function AttackInfoPanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const isOpen = useGlobeStore(s => s.infoPanelOpen);
  const threatId = useGlobeStore(s => s.infoPanelThreatId);
  const threats = useGlobeStore(s => s.threats);
  const deselectThreat = useGlobeStore(s => s.deselectThreat);
  const setInfoPanelOpen = useGlobeStore(s => s.setInfoPanelOpen);

  const threat = useMemo(
    () => threats.find(t => t.id === threatId),
    [threats, threatId]
  );

  const handleClose = () => {
    setInfoPanelOpen(false);
    setTimeout(() => deselectThreat(), 300);
  };

  // ESC key close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Click outside close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!threat) return null;

  const severityColor = SEVERITY_COLORS[threat.severity];
  const attackTypeLabel = ATTACK_TYPE_LABELS[threat.attackType] || threat.attackType;
  const attackTypeColor = ATTACK_TYPE_COLORS[threat.attackType];

  // Extended mock data for the premium panel
  const mitreTactics = ['Initial Access', 'Execution', 'Persistence', 'Defense Evasion', 'Command & Control'];
  const mitreTechniques = ['T1566.001', 'T1059.001', 'T1547.001', 'T1071.001'];
  const confidenceScore = threat.severity === 'critical' ? 94 : threat.severity === 'high' ? 82 : threat.severity === 'medium' ? 67 : 45;
  const riskScore = threat.severity === 'critical' ? 97 : threat.severity === 'high' ? 84 : threat.severity === 'medium' ? 61 : 38;
  const iocList = [
    { type: 'IP', value: threat.sourceIp, severity: threat.severity },
    { type: 'DOMAIN', value: `c2.${threat.adversary.toLowerCase().replace(/[^a-z]/g, '')}[.]xyz`, severity: 'high' as Severity },
    { type: 'CIDR', value: `${threat.sourceIp.split('.').slice(0, 3).join('.')}.0/24`, severity: 'medium' as Severity },
    { type: 'HASH', value: `sha256:${threat.id.slice(0, 16)}...`, severity: threat.severity },
  ];
  const timeline = [
    { time: formatRelativeTime(threat.timestamp), event: 'Initial detection', status: 'detected' },
    { time: 'T+2m', event: 'Connection traced', status: 'traced' },
    { time: 'T+5m', event: 'IOC extraction complete', status: 'extracted' },
    { time: 'T+8m', event: 'Threat classification', status: 'classified' },
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
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ x: '100%', opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: '100%', opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 z-50 h-full w-[440px] overflow-y-auto"
            style={{
              background: 'rgba(6, 10, 20, 0.94)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              borderLeft: `1px solid ${severityColor}12`,
              boxShadow: `-20px 0 60px rgba(0,0,0,0.5), -4px 0 20px ${severityColor}08`,
            }}
          >
            {/* Animated top border */}
            <div className="absolute top-0 left-0 right-0 h-[2px]">
              <motion.div
                className="h-full"
                style={{
                  background: `linear-gradient(90deg, transparent, ${severityColor}, transparent)`,
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />
            </div>

            {/* Header */}
            <div
              className="sticky top-0 z-10 border-b px-5 py-4"
              style={{
                background: 'rgba(6, 10, 20, 0.96)',
                backdropFilter: 'blur(20px)',
                borderColor: `${severityColor}10`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: `${severityColor}12`, border: `1px solid ${severityColor}20` }}
                    initial={{ rotate: -90, scale: 0.5 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                  >
                    <ShieldAlert className="h-5 w-5" style={{ color: severityColor }} />
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: severityColor }}
                      >
                        {threat.severity} threat
                      </span>
                      <span className="text-[9px] text-[#475569]">|</span>
                      <span className="text-[11px] font-medium" style={{ color: attackTypeColor }}>
                        {attackTypeLabel}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#475569] mt-0.5">{formatRelativeTime(threat.timestamp)}</p>
                  </div>
                </div>

                {/* Close button */}
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#475569] hover:text-white transition-colors"
                  aria-label="Close panel"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Severity bar */}
              <div className="mt-3 h-1.5 w-full rounded-full overflow-hidden" style={{ background: `${severityColor}08` }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${riskScore}%` }}
                  transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${severityColor}60, ${severityColor})` }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">
              {/* Risk & Confidence Scores */}
              <div className="grid grid-cols-2 gap-3">
                <AnimatedScore label="Risk Score" value={riskScore} color={severityColor} icon={TrendingUp} />
                <AnimatedScore label="Confidence" value={confidenceScore} color="#00f0ff" icon={Fingerprint} />
              </div>

              {/* Attack Path */}
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(12, 18, 32, 0.5)', border: '1px solid rgba(0,240,255,0.05)' }}
              >
                <h3 className="text-[10px] uppercase tracking-wider text-[#475569] font-medium mb-3 flex items-center gap-1.5">
                  <Target className="h-3 w-3" style={{ color: severityColor }} />
                  Attack Path
                </h3>
                <div className="flex items-center gap-2">
                  {/* Source */}
                  <div className="flex-1 rounded-lg p-2.5 text-center" style={{ background: `${severityColor}06`, border: `1px solid ${severityColor}10` }}>
                    <MapPin className="h-3 w-3 mx-auto mb-1" style={{ color: severityColor }} />
                    <p className="text-[9px] text-[#475569]">Source</p>
                    <p className="text-[11px] font-medium text-[#e2e8f0] truncate">{threat.sourceCountry}</p>
                  </div>
                  {/* Arrow */}
                  <div className="flex items-center gap-0.5">
                    <div className="w-4 h-px" style={{ background: `${severityColor}30` }} />
                    <ChevronRight className="h-3 w-3" style={{ color: severityColor }} />
                    <div className="w-4 h-px" style={{ background: `${severityColor}30` }} />
                  </div>
                  {/* Destination */}
                  <div className="flex-1 rounded-lg p-2.5 text-center" style={{ background: `${severityColor}06`, border: `1px solid ${severityColor}10` }}>
                    <Crosshair className="h-3 w-3 mx-auto mb-1" style={{ color: severityColor }} />
                    <p className="text-[9px] text-[#475569]">Target</p>
                    <p className="text-[11px] font-medium text-[#e2e8f0] truncate">{threat.targetLocation}</p>
                  </div>
                </div>
              </div>

              {/* Attack Details */}
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(12, 18, 32, 0.5)', border: '1px solid rgba(0,240,255,0.05)' }}
              >
                <h3 className="text-[10px] uppercase tracking-wider text-[#475569] font-medium mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" style={{ color: attackTypeColor }} />
                  Threat Details
                </h3>
                <div className="space-y-2.5">
                  <DetailRow icon={<Crosshair className="h-3 w-3" />} label="Source IP" value={threat.sourceIp} mono copyable color={severityColor} />
                  <DetailRow icon={<MapPin className="h-3 w-3" />} label="Source Country" value={threat.sourceCountry} />
                  <DetailRow icon={<Target className="h-3 w-3" />} label="Dest IP" value={threat.targetIp} mono copyable />
                  <DetailRow icon={<MapPin className="h-3 w-3" />} label="Destination" value={threat.targetLocation} />
                  <DetailRow icon={<AlertTriangle className="h-3 w-3" />} label="Attack Type" value={attackTypeLabel} color={attackTypeColor} />
                  <DetailRow icon={<Shield className="h-3 w-3" />} label="Threat Actor" value={threat.adversary} />
                  <DetailRow icon={<Clock className="h-3 w-3" />} label="Timestamp" value={formatTime(threat.timestamp)} />
                  <DetailRow icon={<Activity className="h-3 w-3" />} label="Attack Vector" value="Network / External" />
                  <DetailRow icon={<Eye className="h-3 w-3" />} label="Organization" value="Infrastructure Defense" />
                </div>
              </div>

              {/* MITRE ATT&CK Mapping */}
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(12, 18, 32, 0.5)', border: '1px solid rgba(0,240,255,0.05)' }}
              >
                <h3 className="text-[10px] uppercase tracking-wider text-[#475569] font-medium mb-3 flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-cyan-400" />
                  MITRE ATT&CK
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-[9px] text-[#475569] mb-1.5">Tactics</p>
                    <div className="flex flex-wrap gap-1.5">
                      {mitreTactics.map(t => <MitreTag key={t} text={t} variant="tactic" />)}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#475569] mb-1.5">Techniques</p>
                    <div className="flex flex-wrap gap-1.5">
                      {mitreTechniques.map(t => <MitreTag key={t} text={t} variant="technique" />)}
                    </div>
                  </div>
                </div>
              </div>

              {/* IOCs */}
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(12, 18, 32, 0.5)', border: '1px solid rgba(0,240,255,0.05)' }}
              >
                <h3 className="text-[10px] uppercase tracking-wider text-[#475569] font-medium mb-3 flex items-center gap-1.5">
                  <Fingerprint className="h-3 w-3 text-amber-400" />
                  Indicators of Compromise
                </h3>
                <div className="space-y-1.5">
                  {iocList.map((ioc, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="flex items-center justify-between rounded-lg px-3 py-2 font-mono text-[10px] group"
                      style={{ background: 'rgba(0,240,255,0.02)', border: '1px solid rgba(0,240,255,0.04)' }}
                    >
                      <span className="text-[#94a3b8] truncate flex-1">{ioc.value}</span>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-[8px] uppercase text-[#475569]">{ioc.type}</span>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-[rgba(0,240,255,0.1)] rounded">
                          <Copy className="h-2.5 w-2.5 text-[#475569]" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(12, 18, 32, 0.5)', border: '1px solid rgba(0,240,255,0.05)' }}
              >
                <h3 className="text-[10px] uppercase tracking-wider text-[#475569] font-medium mb-3 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-cyan-400" />
                  Investigation Timeline
                </h3>
                <div className="space-y-2.5">
                  {timeline.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 * i }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full" style={{ background: i === 0 ? severityColor : '#1e293b' }} />
                        {i < timeline.length - 1 && <div className="w-px h-4 bg-[#1e293b]" />}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-[10px] text-[#94a3b8]">{item.event}</span>
                        <span className="text-[9px] font-mono text-[#475569]">{item.time}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-medium transition-all"
                  style={{ background: `${severityColor}10`, color: severityColor, border: `1px solid ${severityColor}20` }}
                >
                  <ExternalLink className="h-3 w-3" />
                  Escalate
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-medium bg-[rgba(0,240,255,0.05)] text-[#00f0ff] border border-[rgba(0,240,255,0.1)] transition-all"
                >
                  <Shield className="h-3 w-3" />
                  Block IOC
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

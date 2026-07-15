'use client';

import { useState, Suspense } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { SEVERITY_COLORS, ATTACK_TYPE_LABELS, ATTACK_TYPE_COLORS, type AttackConnection, type AttackType } from '@/lib/constants';
import { formatTime } from '@/lib/formatters';
import { Pause, Play, Shield, MapPin, Globe, Loader2, Maximize2, Wifi } from 'lucide-react';
import { ThreeGlobe } from './three-globe';
import { motion, AnimatePresence } from 'framer-motion';

// --- Fallback loading for 3D Globe ---
function GlobeLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-[#475569]">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-400/50 mb-3" />
      <p className="text-xs">Initializing 3D Globe...</p>
    </div>
  );
}

// --- Main Intel Map View ---
export function IntelMapView() {
  const { attackConnections } = useUIStore();
  const [selectedAttack, setSelectedAttack] = useState<AttackConnection | null>(null);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [typeFilter, setTypeFilter] = useState<AttackType | ''>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const filtered = typeFilter
    ? attackConnections.filter(a => a.attackType === typeFilter)
    : attackConnections;

  return (
    <div className="flex h-full gap-4">
      {/* Globe */}
      <div className="flex flex-1 flex-col gap-3 min-w-0">
        {/* Controls */}
        <div className="flex items-center gap-3 rounded-xl glass px-3 py-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPaused(!paused)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-[#94a3b8] hover:bg-[rgba(0,240,255,0.05)] transition-all glass-light"
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
                  speed === s ? 'glass-light text-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.1)]' : 'text-[#475569] hover:text-[#94a3b8]'
                }`}
              >
                {s}x
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#475569]">Type:</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as AttackType | '')}
              className="rounded-lg border border-[rgba(0,240,255,0.08)] bg-[#050810]/60 px-2 py-1 text-[10px] text-[#94a3b8] focus:outline-none focus:border-cyan-500/20 backdrop-blur-sm"
            >
              <option value="">All Types</option>
              {Object.entries(ATTACK_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Wifi className="h-3 w-3 text-emerald-400 status-pulse" />
              <span className="text-[10px] text-emerald-400">{filtered.length} connections</span>
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
        <div className={`relative rounded-xl glass overflow-hidden globe-container ${isFullscreen ? 'fixed inset-4 z-50' : ''}`} style={{ minHeight: '400px' }}>
          <div className="absolute inset-0 z-0" style={{ background: 'radial-gradient(ellipse at center, rgba(0,240,255,0.02) 0%, transparent 70%)' }} />
          <Suspense fallback={<GlobeLoader />}>
            <ThreeGlobe
              attacks={filtered.slice(-60)}
              selectedAttack={selectedAttack}
              onSelectAttack={setSelectedAttack}
            />
          </Suspense>

          {/* Globe overlay stats */}
          <div className="absolute top-3 left-3 glass-light rounded-lg px-3 py-2 z-10">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 status-pulse" />
              <span className="text-[10px] text-[#94a3b8]">Real-time Threat Visualization</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 rounded-xl glass px-3 py-2 flex-wrap">
          <span className="text-[10px] text-[#475569] font-medium">Legend:</span>
          {Object.entries(ATTACK_TYPE_LABELS).slice(0, 6).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1.5 group">
              <div className="h-2 w-2 rounded-full transition-shadow group-hover:shadow-[0_0_6px_currentColor]" style={{ backgroundColor: ATTACK_TYPE_COLORS[type as AttackType], color: ATTACK_TYPE_COLORS[type as AttackType] }} />
              <span className="text-[10px] text-[#94a3b8]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar: Attack details */}
      <div className="hidden w-72 lg:block">
        <div className="rounded-xl glass h-full overflow-y-auto">
          <AnimatePresence mode="wait">
            {selectedAttack ? (
              <motion.div
                key={selectedAttack.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" style={{ color: SEVERITY_COLORS[selectedAttack.severity] }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: SEVERITY_COLORS[selectedAttack.severity] }}>
                    {selectedAttack.severity}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <DetailItem label="Source IP" value={selectedAttack.sourceIp} />
                  <DetailItem label="Source Location" value={selectedAttack.sourceCountry} />
                  <DetailItem label="Target IP" value={selectedAttack.targetIp} />
                  <DetailItem label="Target Location" value={selectedAttack.targetLocation} />
                  <DetailItem label="Attack Type" value={ATTACK_TYPE_LABELS[selectedAttack.attackType]} />
                  <DetailItem label="Adversary" value={selectedAttack.adversary} />
                  <DetailItem label="Time" value={formatTime(selectedAttack.timestamp)} />
                </div>

                <div className="border-t border-[rgba(0,240,255,0.06)] pt-3">
                  <p className="text-[10px] uppercase tracking-wider text-[#475569] mb-2">Related IOCs</p>
                  <div className="space-y-1.5">
                    <IOCTag value={`${selectedAttack.sourceIp}/24`} />
                    <IOCTag value={`c2.${selectedAttack.adversary.toLowerCase().replace(/[^a-z]/g, '')}[.]xyz`} />
                    <IOCTag value={`${selectedAttack.sourceIp.split('.').slice(0, 3).join('.')}.0/24`} />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-[#475569]"
              >
                <Globe className="h-10 w-10 mb-3 opacity-15" />
                <p className="text-xs text-[#94a3b8]">Click an attack on the globe</p>
                <p className="text-[10px] text-[#475569] mt-1">to view details</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] uppercase tracking-wider text-[#475569]">{label}</span>
      <span className="text-xs text-[#e2e8f0] font-mono">{value}</span>
    </div>
  );
}

function IOCTag({ value }: { value: string }) {
  return (
    <div className="rounded-lg glass-light px-2.5 py-1.5 font-mono text-[10px] text-[#94a3b8]">
      {value}
    </div>
  );
}

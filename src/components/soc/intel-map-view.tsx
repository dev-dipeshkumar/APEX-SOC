'use client';

import { useEffect, useRef, useState } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { SEVERITY_COLORS, ATTACK_TYPE_LABELS, ATTACK_TYPE_COLORS, type AttackConnection, type AttackType } from '@/lib/constants';
import { formatTime } from '@/lib/formatters';
import { Pause, Play, ChevronDown, Shield, MapPin, Globe } from 'lucide-react';

// --- Globe Canvas Component ---
function GlobeCanvas({ attacks, selectedAttack, onSelectAttack, paused, speed }: {
  attacks: AttackConnection[];
  selectedAttack: AttackConnection | null;
  onSelectAttack: (a: AttackConnection) => void;
  paused: boolean;
  speed: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const frameRef = useRef<number>(0);
  const attackTimersRef = useRef<Map<string, number>>(new Map());
  // Store latest props in refs so the animation loop can access them without re-creating
  const attacksRef = useRef(attacks);
  const selectedAttackRef = useRef(selectedAttack);
  const pausedRef = useRef(paused);
  const speedRef = useRef(speed);

  // Sync props to refs inside effect
  useEffect(() => {
    attacksRef.current = attacks;
    selectedAttackRef.current = selectedAttack;
    pausedRef.current = paused;
    speedRef.current = speed;
  });

  useEffect(() => {
    const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    const w = rect.width;
    const h = rect.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.38;

    if (!pausedRef.current) {
      rotationRef.current += 0.001 * speedRef.current;
    }

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, w, h);

    // Globe glow
    const glow = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.3);
    glow.addColorStop(0, 'rgba(0, 240, 255, 0.02)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Globe body
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#0d1117';
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Grid lines (longitude/latitude)
    ctx.strokeStyle = '#1a233240';
    ctx.lineWidth = 0.5;

    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      const y = cy - (lat / 90) * r;
      const latR = Math.cos((lat * Math.PI) / 180) * r;
      ctx.ellipse(cx, y, latR, latR * 0.15, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Longitude lines
    for (let lng = 0; lng < 360; lng += 30) {
      const rotatedLng = lng + (rotationRef.current * 180) / Math.PI;
      ctx.beginPath();
      const x = cx + Math.cos((rotatedLng * Math.PI) / 180) * r;
      const isFront = Math.cos((rotatedLng * Math.PI) / 180) > 0;
      ctx.strokeStyle = isFront ? '#1a233240' : '#1a233210';
      ctx.ellipse(x, cy, r * 0.08, r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Simplified continents (filled polygons)
    const continents = [
      // North America
      [[0.18, 0.2], [0.28, 0.15], [0.3, 0.25], [0.28, 0.35], [0.22, 0.4], [0.18, 0.35]],
      // South America
      [[0.25, 0.5], [0.28, 0.48], [0.3, 0.55], [0.28, 0.7], [0.24, 0.75], [0.22, 0.65]],
      // Europe
      [[0.48, 0.18], [0.52, 0.15], [0.55, 0.2], [0.53, 0.3], [0.48, 0.32], [0.46, 0.25]],
      // Africa
      [[0.48, 0.38], [0.54, 0.36], [0.56, 0.45], [0.54, 0.6], [0.5, 0.68], [0.47, 0.55]],
      // Asia
      [[0.55, 0.15], [0.65, 0.12], [0.78, 0.18], [0.8, 0.3], [0.75, 0.4], [0.65, 0.42], [0.58, 0.35]],
      // Australia
      [[0.78, 0.6], [0.85, 0.58], [0.87, 0.65], [0.84, 0.72], [0.78, 0.68]],
    ];

    ctx.fillStyle = '#1a233250';
    ctx.strokeStyle = '#1e293b40';
    ctx.lineWidth = 0.5;
    continents.forEach(points => {
      ctx.beginPath();
      points.forEach(([px, py], i) => {
        const x = px * w;
        const y = py * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // Project lat/lng to globe coordinates
    const project = (lat: number, lng: number): [number, number, boolean] => {
      const rotLng = lng + (rotationRef.current * 180) / Math.PI;
      const lngRad = (rotLng * Math.PI) / 180;
      const latRad = (lat * Math.PI) / 180;
      const x = cx + r * Math.cos(latRad) * Math.sin(lngRad);
      const y = cy - r * Math.sin(latRad);
      const z = Math.cos(latRad) * Math.cos(lngRad);
      return [x, y, z > 0];
    };

    // Draw attack arcs
    attacksRef.current.forEach(attack => {
      const [sx, sy, sFront] = project(attack.sourceCoords[0], attack.sourceCoords[1]);
      const [tx, ty, tFront] = project(attack.targetCoords[0], attack.targetCoords[1]);

      if (!sFront && !tFront) return; // Both behind globe

      const timer = attackTimersRef.current.get(attack.id) || 0;
      if (!pausedRef.current) {
        attackTimersRef.current.set(attack.id, timer + 0.02 * speedRef.current);
      }
      const progress = Math.min(timer, 1);
      const fadeOut = timer > 1 ? Math.max(0, 1 - (timer - 1) * 0.5) : 1;

      // Source dot
      if (sFront) {
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fillStyle = SEVERITY_COLORS[attack.severity];
        ctx.globalAlpha = fadeOut;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Target dot
      if (tFront) {
        ctx.beginPath();
        ctx.arc(tx, ty, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff60';
        ctx.globalAlpha = fadeOut;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Arc
      if ((sFront || tFront) && progress > 0) {
        ctx.beginPath();
        const midX = (sx + tx) / 2;
        const midY = Math.min(sy, ty) - 40 - Math.abs(sx - tx) * 0.15;

        // Draw partial arc based on progress
        const steps = 30;
        for (let i = 0; i <= steps * progress; i++) {
          const t = i / steps;
          const px = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * midX + t * t * tx;
          const py = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * midY + t * t * ty;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }

        ctx.strokeStyle = SEVERITY_COLORS[attack.severity];
        ctx.lineWidth = attack.severity === 'critical' ? 2 : 1;
        ctx.globalAlpha = fadeOut * 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Selected highlight
      if (selectedAttackRef.current?.id === attack.id) {
        if (sFront) {
          ctx.beginPath();
          ctx.arc(sx, sy, 6, 0, Math.PI * 2);
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });

    // Clean up old timers
    if (attackTimersRef.current.size > 300) {
      const keys = Array.from(attackTimersRef.current.keys());
      keys.slice(0, 100).forEach(k => attackTimersRef.current.delete(k));
    }

    frameRef.current = requestAnimationFrame(draw);
  };

    // Start animation loop
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const r = Math.min(rect.width, rect.height) * 0.38;

    const project = (lat: number, lng: number): [number, number] => {
      const rotLng = lng + (rotationRef.current * 180) / Math.PI;
      const lngRad = (rotLng * Math.PI) / 180;
      const latRad = (lat * Math.PI) / 180;
      return [
        cx + r * Math.cos(latRad) * Math.sin(lngRad),
        cy - r * Math.sin(latRad),
      ];
    };

    // Find closest attack source point
    let closest: AttackConnection | null = null;
    let minDist = 20;
    attacks.forEach(attack => {
      const [sx, sy] = project(attack.sourceCoords[0], attack.sourceCoords[1]);
      const dist = Math.hypot(x - sx, y - sy);
      if (dist < minDist) {
        minDist = dist;
        closest = attack;
      }
    });

    if (closest) onSelectAttack(closest);
  };

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full cursor-crosshair rounded-lg"
      onClick={handleClick}
    />
  );
}

// --- Main Intel Map View ---
export function IntelMapView() {
  const { attackConnections } = useUIStore();
  const [selectedAttack, setSelectedAttack] = useState<AttackConnection | null>(null);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [typeFilter, setTypeFilter] = useState<AttackType | ''>('');

  const filtered = typeFilter
    ? attackConnections.filter(a => a.attackType === typeFilter)
    : attackConnections;

  return (
    <div className="flex h-full gap-4">
      {/* Globe */}
      <div className="flex flex-1 flex-col gap-3 min-w-0">
        {/* Controls */}
        <div className="flex items-center gap-3 rounded-lg border border-[#1e293b] bg-[#1a2332] px-3 py-2">
          <button
            onClick={() => setPaused(!paused)}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-[#94a3b8] hover:bg-[#0a0e17] transition-colors"
          >
            {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            {paused ? 'Play' : 'Pause'}
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#475569]">Speed:</span>
            {[0.5, 1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`rounded px-1.5 py-0.5 text-[10px] transition-colors ${
                  speed === s ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-[#475569] hover:text-[#94a3b8]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#475569]">Type:</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as AttackType | '')}
              className="rounded border border-[#1e293b] bg-[#0a0e17] px-2 py-0.5 text-[10px] text-[#94a3b8] focus:outline-none"
            >
              <option value="">All Types</option>
              {Object.entries(ATTACK_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <span className="ml-auto text-[10px] text-[#475569]">{filtered.length} active connections</span>
        </div>

        {/* Globe Canvas */}
        <div className="relative flex-1 rounded-lg border border-[#1e293b] bg-[#1a2332] overflow-hidden globe-container" style={{ minHeight: '400px' }}>
          <GlobeCanvas
            attacks={filtered.slice(-80)}
            selectedAttack={selectedAttack}
            onSelectAttack={setSelectedAttack}
            paused={paused}
            speed={speed}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 rounded-lg border border-[#1e293b] bg-[#1a2332] px-3 py-2">
          <span className="text-[10px] text-[#475569]">Legend:</span>
          {Object.entries(ATTACK_TYPE_LABELS).slice(0, 6).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: ATTACK_TYPE_COLORS[type as AttackType] }} />
              <span className="text-[10px] text-[#94a3b8]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar: Attack details */}
      <div className="hidden w-72 lg:block">
        <div className="rounded-lg border border-[#1e293b] bg-[#1a2332] h-full overflow-y-auto">
          {selectedAttack ? (
            <div className="p-4 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Selected Attack</h3>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" style={{ color: SEVERITY_COLORS[selectedAttack.severity] }} />
                  <span className="text-xs" style={{ color: SEVERITY_COLORS[selectedAttack.severity] }}>
                    {selectedAttack.severity.toUpperCase()}
                  </span>
                </div>

                <DetailItem label="Source IP" value={selectedAttack.sourceIp} />
                <DetailItem label="Source Location" value={selectedAttack.sourceCountry} />
                <DetailItem label="Target IP" value={selectedAttack.targetIp} />
                <DetailItem label="Target Location" value={selectedAttack.targetLocation} />
                <DetailItem label="Attack Type" value={ATTACK_TYPE_LABELS[selectedAttack.attackType]} />
                <DetailItem label="Adversary" value={selectedAttack.adversary} />
                <DetailItem label="Time" value={formatTime(selectedAttack.timestamp)} />
              </div>

              <div className="border-t border-[#1e293b] pt-3">
                <p className="text-[10px] uppercase tracking-wider text-[#475569] mb-2">Related IOCs</p>
                <div className="space-y-1">
                  <IOCTag value={`${selectedAttack.sourceIp}/24`} />
                  <IOCTag value={`c2.${selectedAttack.adversary.toLowerCase().replace(/[^a-z]/g, '')}[.]xyz`} />
                  <IOCTag value={`${selectedAttack.sourceIp.split('.').slice(0, 3).join('.')}.0/24`} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#475569]">
              <Globe className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-xs">Click an attack on the globe</p>
              <p className="text-[10px]">to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[10px] uppercase tracking-wider text-[#475569]">{label}</span>
      <span className="text-xs text-[#e2e8f0] font-mono">{value}</span>
    </div>
  );
}

function IOCTag({ value }: { value: string }) {
  return (
    <div className="rounded bg-[#0a0e17] px-2 py-1 font-mono text-[10px] text-[#94a3b8]">
      {value}
    </div>
  );
}

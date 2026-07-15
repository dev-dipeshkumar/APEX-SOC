'use client';

import { useEffect, useState, useRef, memo } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { useAlertStore } from '@/stores/alert-store';
import { SEVERITY_COLORS, type Severity } from '@/lib/constants';
import { formatTime, severityLabel } from '@/lib/formatters';
import {
  ShieldAlert, AlertTriangle, Clock, Server, Gauge,
  TrendingUp, TrendingDown, Activity,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';

// --- KPI Card Component ---
type LucideIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

const KPICard = memo(function KPICard({ label, value, icon: Icon, color, suffix, sparkline, trend }: {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  suffix?: string;
  sparkline?: number[];
  trend?: 'up' | 'down';
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 800;
    const diff = value - displayValue;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round((value - diff) + diff * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-xl glass card-hover group cursor-default"
      style={{ borderLeftColor: color, borderLeftWidth: '3px' }}
    >
      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: `inset 0 0 30px ${color}05, 0 0 15px ${color}08` }}
      />

      {/* Sparkline background */}
      {sparkline && sparkline.length > 0 && (
        <div className="absolute inset-0 opacity-[0.07]">
          <svg className="h-full w-full" preserveAspectRatio="none" viewBox={`0 0 ${sparkline.length} 40`}>
            <defs>
              <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              points={sparkline.map((v, i) => {
                const max = Math.max(...sparkline);
                const min = Math.min(...sparkline);
                const range = max - min || 1;
                const y = 40 - ((v - min) / range) * 36;
                return `${i},${y}`;
              }).join(' ')}
            />
          </svg>
        </div>
      )}

      <div className="relative p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#475569] font-medium">{label}</p>
            <div className="mt-1 flex items-baseline gap-1">
              <p className="text-2xl font-bold font-mono" style={{ color }}>
                {displayValue}{suffix || ''}
              </p>
              {trend && (
                <span className={`flex items-center text-[10px] ${trend === 'up' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                </span>
              )}
            </div>
          </div>
          <div className="rounded-lg p-2 transition-colors" style={{ backgroundColor: `${color}08` }}>
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// --- Severity Donut Chart ---
function SeverityDonut() {
  const { alerts } = useAlertStore();
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  alerts.forEach(a => { if (counts[a.severity] !== undefined) counts[a.severity]++; });

  const data = Object.entries(counts).map(([key, value]) => ({
    name: severityLabel(key),
    value,
    color: SEVERITY_COLORS[key as Severity],
  })).filter(d => d.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl glass p-4 card-hover"
    >
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Severity Breakdown</h3>
      <div className="flex items-center gap-4">
        <div className="h-36 w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                dataKey="value"
                stroke="none"
                paddingAngle={2}
                animationBegin={0}
                animationDuration={800}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2.5 flex-1">
          {data.map(d => (
            <div key={d.name} className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full transition-shadow group-hover:shadow-[0_0_6px_currentColor]" style={{ backgroundColor: d.color, color: d.color }} />
                <span className="text-xs text-[#94a3b8]">{d.name}</span>
              </div>
              <span className="text-xs font-mono font-bold" style={{ color: d.color }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// --- Trend Area Chart ---
function TrendChart() {
  const { trendData } = useUIStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-xl glass p-4 card-hover"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Alert Trend - Last 24h</h3>
        <Activity className="h-3.5 w-3.5 text-[#475569]" />
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,240,255,0.03)" />
            <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 10 }} axisLine={{ stroke: 'rgba(0,240,255,0.05)' }} />
            <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={{ stroke: 'rgba(0,240,255,0.05)' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(8,13,24,0.95)',
                border: '1px solid rgba(0,240,255,0.1)',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#e2e8f0',
                backdropFilter: 'blur(12px)',
              }}
            />
            <Area type="monotone" dataKey="critical" stackId="1" stroke={SEVERITY_COLORS.critical} fill={SEVERITY_COLORS.critical} fillOpacity={0.3} animationDuration={1000} />
            <Area type="monotone" dataKey="high" stackId="1" stroke={SEVERITY_COLORS.high} fill={SEVERITY_COLORS.high} fillOpacity={0.25} animationDuration={1000} />
            <Area type="monotone" dataKey="medium" stackId="1" stroke={SEVERITY_COLORS.medium} fill={SEVERITY_COLORS.medium} fillOpacity={0.15} animationDuration={1000} />
            <Area type="monotone" dataKey="low" stackId="1" stroke={SEVERITY_COLORS.low} fill={SEVERITY_COLORS.low} fillOpacity={0.1} animationDuration={1000} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// --- Recent Alerts Mini Table ---
function RecentAlerts() {
  const { alerts } = useAlertStore();
  const recent = alerts.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-xl glass p-4 card-hover"
    >
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Recent Critical Alerts</h3>
      <div className="space-y-1">
        {recent.map((alert, i) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.05 }}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[rgba(0,240,255,0.02)] transition-all group"
            style={{ borderLeft: `2px solid ${SEVERITY_COLORS[alert.severity]}` }}
          >
            <div
              className="h-2 w-2 shrink-0 rounded-full transition-shadow group-hover:shadow-[0_0_6px_currentColor]"
              style={{ backgroundColor: SEVERITY_COLORS[alert.severity], color: SEVERITY_COLORS[alert.severity] }}
            />
            <span className="text-[10px] font-mono text-[#475569] shrink-0">{formatTime(alert.timestamp)}</span>
            <span className="text-[11px] text-[#94a3b8] truncate flex-1">{alert.sourceIp} → {alert.targetIp}</span>
            <span className="text-[10px] text-[#475569] truncate max-w-32">{alert.title}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// --- Mini Attack Map (2D Canvas for dashboard) ---
function MiniAttackMap() {
  const { attackConnections } = useUIStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Draw dark map background
    ctx.fillStyle = '#050810';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.02)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Simplified continent shapes
    const continents = [
      [0.12, 0.15, 0.18, 0.35],
      [0.17, 0.55, 0.1, 0.25],
      [0.42, 0.12, 0.15, 0.38],
      [0.44, 0.5, 0.14, 0.32],
      [0.58, 0.12, 0.22, 0.4],
      [0.78, 0.55, 0.1, 0.15],
    ];

    ctx.fillStyle = 'rgba(0, 240, 255, 0.015)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
    ctx.lineWidth = 0.5;
    continents.forEach(([x, y, w2, h2]) => {
      ctx.fillRect(x * w, y * h, w2 * w, h2 * h);
      ctx.strokeRect(x * w, y * h, w2 * w, h2 * h);
    });

    // Draw attack arcs
    const recent = attackConnections.slice(-20);
    recent.forEach(attack => {
      const srcX = ((attack.sourceCoords[1] + 180) / 360) * w;
      const srcY = ((90 - attack.sourceCoords[0]) / 180) * h;
      const tgtX = ((attack.targetCoords[1] + 180) / 360) * w;
      const tgtY = ((90 - attack.targetCoords[0]) / 180) * h;

      // Source dot with glow
      const glow = ctx.createRadialGradient(srcX, srcY, 0, srcX, srcY, 6);
      glow.addColorStop(0, `${SEVERITY_COLORS[attack.severity]}40`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(srcX - 6, srcY - 6, 12, 12);
      
      ctx.beginPath();
      ctx.arc(srcX, srcY, 2, 0, Math.PI * 2);
      ctx.fillStyle = SEVERITY_COLORS[attack.severity];
      ctx.fill();

      // Target dot
      ctx.beginPath();
      ctx.arc(tgtX, tgtY, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff40';
      ctx.fill();

      // Arc line
      ctx.beginPath();
      ctx.moveTo(srcX, srcY);
      const midX = (srcX + tgtX) / 2;
      const midY = Math.min(srcY, tgtY) - 30;
      ctx.quadraticCurveTo(midX, midY, tgtX, tgtY);
      ctx.strokeStyle = `${SEVERITY_COLORS[attack.severity]}30`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

  }, [attackConnections]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl glass p-4 globe-container relative card-hover"
    >
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Attack Map</h3>
      <canvas
        ref={canvasRef}
        className="h-40 w-full rounded-lg"
        style={{ background: '#050810' }}
      />
    </motion.div>
  );
}

// --- Main Dashboard View ---
export function DashboardView() {
  const { dashboardStats, threatScoreHistory } = useUIStore();
  const stats = dashboardStats || { activeThreats: 0, criticalAlerts: 0, untriaged: 0, assetsAtRisk: 0, threatScore: 0 };

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KPICard
          label="Active Threats"
          value={stats.activeThreats}
          icon={ShieldAlert}
          color={SEVERITY_COLORS.critical}
          sparkline={threatScoreHistory.slice(-20)}
          trend="up"
        />
        <KPICard
          label="Critical Alerts"
          value={stats.criticalAlerts}
          icon={AlertTriangle}
          color={SEVERITY_COLORS.high}
          sparkline={Array.from({ length: 20 }, () => Math.random() * 15 + 5)}
          trend="up"
        />
        <KPICard
          label="Untriaged"
          value={stats.untriaged}
          icon={Clock}
          color={SEVERITY_COLORS.medium}
          sparkline={Array.from({ length: 20 }, () => Math.random() * 25 + 10)}
        />
        <KPICard
          label="Assets at Risk"
          value={stats.assetsAtRisk}
          icon={Server}
          color={SEVERITY_COLORS.high}
          sparkline={Array.from({ length: 20 }, () => Math.random() * 10 + 3)}
          trend="down"
        />
        <KPICard
          label="Threat Score"
          value={stats.threatScore}
          icon={Gauge}
          color={stats.threatScore > 75 ? SEVERITY_COLORS.critical : stats.threatScore > 50 ? SEVERITY_COLORS.high : SEVERITY_COLORS.low}
          suffix="/100"
          sparkline={threatScoreHistory.slice(-20)}
          trend={stats.threatScore > 70 ? 'up' : 'down'}
        />
      </div>

      {/* Middle row: Map + Severity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MiniAttackMap />
        <SeverityDonut />
      </div>

      {/* Trend chart */}
      <TrendChart />

      {/* Recent alerts */}
      <RecentAlerts />
    </div>
  );
}

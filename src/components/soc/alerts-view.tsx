'use client';

import { useState } from 'react';
import { useAlertStore } from '@/stores/alert-store';
import { useUIStore } from '@/stores/ui-store';
import { SEVERITY_COLORS, STATUS_COLORS, ATTACK_TYPE_LABELS, ATTACK_TYPE_COLORS, type Severity, type AlertStatus, type Alert, ROLE_PERMISSIONS, Permission } from '@/lib/constants';
import { formatTime, formatRelativeTime, severityLabel } from '@/lib/formatters';
import {
  AlertTriangle, ChevronLeft, ChevronRight, Filter, X, Check,
  ArrowUpCircle, Eye, Ban, Search, Shield, Clock, ExternalLink,
} from 'lucide-react';
import { LogStream } from './log-stream';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Filter Bar ───
function FilterBar() {
  const { filters, setFilter, clearFilters } = useAlertStore();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl soc-card p-3">
      <Filter className="h-3.5 w-3.5 text-[#546380]" />

      <select value={filters.severity || ''} onChange={e => setFilter('severity', e.target.value || null)}
        className="rounded-lg border border-[#1a2744] bg-[#060b18]/70 px-2.5 py-1.5 text-[11px] text-[#94a3b8] focus:border-blue-500/20 focus:outline-none backdrop-blur-sm">
        <option value="">All Severity</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      <select value={filters.status || ''} onChange={e => setFilter('status', e.target.value || null)}
        className="rounded-lg border border-[#1a2744] bg-[#060b18]/70 px-2.5 py-1.5 text-[11px] text-[#94a3b8] focus:border-blue-500/20 focus:outline-none backdrop-blur-sm">
        <option value="">All Status</option>
        <option value="new">New</option>
        <option value="acknowledged">Acknowledged</option>
        <option value="escalated">Escalated</option>
        <option value="false_positive">False Positive</option>
        <option value="dismissed">Dismissed</option>
      </select>

      <select value={filters.attackType || ''} onChange={e => setFilter('attackType', e.target.value || null)}
        className="rounded-lg border border-[#1a2744] bg-[#060b18]/70 px-2.5 py-1.5 text-[11px] text-[#94a3b8] focus:border-blue-500/20 focus:outline-none backdrop-blur-sm">
        <option value="">All Types</option>
        {Object.entries(ATTACK_TYPE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
      </select>

      <div className="relative flex-1 min-w-[160px]">
        <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#546380]" />
        <input type="text" placeholder="Search IPs, titles, adversaries..." value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
          className="w-full rounded-lg border border-[#1a2744] bg-[#060b18]/70 py-1.5 pl-7 pr-2 text-[11px] text-[#94a3b8] placeholder-[#546380] focus:border-blue-500/20 focus:outline-none backdrop-blur-sm" />
      </div>

      {(filters.severity || filters.status || filters.attackType || filters.search) && (
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={clearFilters}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] text-[#546380] hover:bg-[rgba(59,130,246,0.04)] hover:text-[#94a3b8] transition-all">
          <X className="h-3 w-3" /> Clear
        </motion.button>
      )}
    </div>
  );
}

// ─── Alert Detail Drawer ───
function AlertDetailDrawer({ alert, onClose }: { alert: Alert; onClose: () => void }) {
  const { triageAlert } = useAlertStore();
  const { userRole } = useUIStore();
  const canTriage = userRole ? ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS]?.includes(Permission.ALERT_TRIAGE) : false;

  if (!alert) return null;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed right-0 top-0 z-40 h-full w-[400px] border-l border-[#1a2744] glass-heavy shadow-2xl overflow-y-auto">
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${SEVERITY_COLORS[alert.severity]}, transparent)` }} />

        <div className="border-b border-[#1a2744] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[alert.severity], boxShadow: `0 0 8px ${SEVERITY_COLORS[alert.severity]}40` }} />
              <span className="status-chip" style={{
                color: SEVERITY_COLORS[alert.severity],
                background: `${SEVERITY_COLORS[alert.severity]}15`,
                border: `1px solid ${SEVERITY_COLORS[alert.severity]}20`,
              }}>
                {alert.severity}
              </span>
            </div>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="text-[#546380] hover:text-[#94a3b8] transition-colors rounded-md p-1 hover:bg-white/5">
              <X className="h-4 w-4" />
            </motion.button>
          </div>
          <h2 className="mt-3 text-sm font-semibold text-[#e8ecf4]">{alert.title}</h2>
        </div>

        <div className="p-5 space-y-5">
          <div className="space-y-2.5">
            <DetailRow label="Status" value={alert.status.replace('_', ' ')} color={STATUS_COLORS[alert.status]} />
            <DetailRow label="Source IP" value={alert.sourceIp} />
            <DetailRow label="Target IP" value={alert.targetIp} />
            <DetailRow label="Source Port" value={String(alert.sourcePort)} />
            <DetailRow label="Target Port" value={String(alert.targetPort)} />
            <DetailRow label="Attack Type" value={ATTACK_TYPE_LABELS[alert.attackType] || alert.attackType} />
            <DetailRow label="Adversary" value={alert.adversary} />
            <DetailRow label="Time" value={formatTime(alert.timestamp)} />
            {alert.assignee && <DetailRow label="Assignee" value={alert.assignee} />}
          </div>

          <div>
            <p className="mb-1.5 text-[9px] uppercase tracking-[0.15em] text-[#546380] font-semibold">Description</p>
            <p className="text-xs text-[#94a3b8] leading-relaxed">{alert.description}</p>
          </div>

          <div>
            <p className="mb-1.5 text-[9px] uppercase tracking-[0.15em] text-[#546380] font-semibold">IOCs</p>
            <div className="space-y-1">
              {alert.iocs.map((ioc, i) => (
                <div key={i} className="rounded-lg glass-light px-3 py-2 font-mono text-[11px] text-[#94a3b8] flex items-center gap-2">
                  <ExternalLink className="h-3 w-3 text-blue-400 shrink-0" />
                  {ioc}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[9px] uppercase tracking-[0.15em] text-[#546380] font-semibold">Raw Log</p>
            <pre className="rounded-lg glass-light p-3 font-mono text-[10px] text-[#546380] overflow-x-auto whitespace-pre-wrap">
              {alert.rawLog}
            </pre>
          </div>

          {canTriage && alert.status === 'new' && (
            <div className="border-t border-[#1a2744] pt-4 space-y-2.5">
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#546380] font-semibold">Triage Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => triageAlert(alert.id, 'acknowledged')}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.06] py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-all">
                  <Check className="h-3 w-3" /> Acknowledge
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => triageAlert(alert.id, 'escalated')}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-orange-500/15 bg-orange-500/[0.06] py-2 text-xs text-orange-400 hover:bg-orange-500/10 transition-all">
                  <ArrowUpCircle className="h-3 w-3" /> Escalate
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => triageAlert(alert.id, 'false_positive')}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-[#546380]/20 bg-[#546380]/[0.04] py-2 text-xs text-[#94a3b8] hover:bg-[#546380]/10 transition-all">
                  <Ban className="h-3 w-3" /> False Positive
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => triageAlert(alert.id, 'dismissed')}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-[#546380]/20 bg-[#546380]/[0.04] py-2 text-xs text-[#94a3b8] hover:bg-[#546380]/10 transition-all">
                  <Eye className="h-3 w-3" /> Dismiss
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

function DetailRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-[0.1em] text-[#546380] font-medium">{label}</span>
      <span className="font-mono text-xs" style={{ color: color || '#e8ecf4' }}>{value}</span>
    </div>
  );
}

// ─── Main Alerts View ───
export function AlertsView() {
  const { alerts, selectedAlerts, selectAlert, toggleSelectAlert, clearSelection, bulkTriage, triageAlert, getFilteredAlerts } = useAlertStore();
  const { userRole } = useUIStore();
  const [detailAlert, setDetailAlert] = useState<Alert | null>(null);
  const [page, setPage] = useState(1);
  const canTriage = userRole ? ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS]?.includes(Permission.ALERT_TRIAGE) : false;

  const filtered = getFilteredAlerts();
  const pageSize = 20;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const safePage = filtered.length > 0 && (page - 1) * pageSize >= filtered.length ? 1 : page;
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="flex h-full gap-4">
      <div className="flex flex-1 flex-col gap-3 min-w-0">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#e8ecf4] tracking-tight">Alert Console</h2>
            <p className="text-xs text-[#546380] mt-0.5">Investigate, triage, and manage security alerts</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#546380]">
            <Clock className="h-3.5 w-3.5" />
            <span>{filtered.length} total alerts</span>
          </div>
        </div>

        <FilterBar />

        {selectedAlerts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-xl soc-card px-3 py-2 border-blue-500/15">
            <Shield className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs text-blue-400">{selectedAlerts.length} selected</span>
            {canTriage && (
              <>
                <button onClick={() => bulkTriage('acknowledged')} className="rounded px-2 py-0.5 text-[10px] text-emerald-400 hover:bg-emerald-500/10 transition-colors">Acknowledge</button>
                <button onClick={() => bulkTriage('escalated')} className="rounded px-2 py-0.5 text-[10px] text-orange-400 hover:bg-orange-500/10 transition-colors">Escalate</button>
                <button onClick={() => bulkTriage('dismissed')} className="rounded px-2 py-0.5 text-[10px] text-[#94a3b8] hover:bg-[#546380]/10 transition-colors">Dismiss</button>
              </>
            )}
            <button onClick={clearSelection} className="ml-auto text-[10px] text-[#546380] hover:text-[#94a3b8]"><X className="h-3 w-3" /></button>
          </motion.div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-xl soc-card">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1a2744]/60 bg-[#060b18]/40">
                  {canTriage && <th className="w-8 px-2 py-3"><input type="checkbox" className="rounded border-[#1a2744]" /></th>}
                  <th className="px-3 py-3 text-left text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">Time</th>
                  <th className="px-3 py-3 text-left text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">Severity</th>
                  <th className="px-3 py-3 text-left text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">Source</th>
                  <th className="px-3 py-3 text-left text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">Target</th>
                  <th className="px-3 py-3 text-left text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">Title</th>
                  <th className="px-3 py-3 text-left text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">Type</th>
                  <th className="px-3 py-3 text-left text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">Status</th>
                  <th className="px-3 py-3 text-left text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">Adversary</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((alert, i) => (
                  <motion.tr key={alert.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className={`border-b border-[#1a2744]/30 cursor-pointer hover:bg-[rgba(59,130,246,0.02)] transition-all group ${
                      alert.severity === 'critical' ? 'row-flash' : ''
                    }`}
                    onClick={() => setDetailAlert(alert)}
                    style={{ borderLeftColor: SEVERITY_COLORS[alert.severity], borderLeftWidth: '2px' }}>
                    {canTriage && (
                      <td className="px-2 py-2.5" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedAlerts.includes(alert.id)} onChange={() => toggleSelectAlert(alert.id)} className="rounded border-[#1a2744]" />
                      </td>
                    )}
                    <td className="px-3 py-2.5 font-mono text-[#546380] whitespace-nowrap">{formatTime(alert.timestamp)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full transition-shadow group-hover:shadow-[0_0_6px_currentColor]"
                          style={{ backgroundColor: SEVERITY_COLORS[alert.severity], color: SEVERITY_COLORS[alert.severity] }} />
                        <span className="status-chip" style={{
                          color: SEVERITY_COLORS[alert.severity],
                          background: `${SEVERITY_COLORS[alert.severity]}12`,
                          border: `1px solid ${SEVERITY_COLORS[alert.severity]}18`,
                        }}>
                          {severityLabel(alert.severity)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[#94a3b8]">{alert.sourceIp}</td>
                    <td className="px-3 py-2.5 font-mono text-[#94a3b8]">{alert.targetIp}</td>
                    <td className="px-3 py-2.5 text-[#e8ecf4] max-w-[200px] truncate">{alert.title}</td>
                    <td className="px-3 py-2.5 text-[#94a3b8]">{ATTACK_TYPE_LABELS[alert.attackType] || alert.attackType}</td>
                    <td className="px-3 py-2.5">
                      <span className="status-chip" style={{
                        color: STATUS_COLORS[alert.status],
                        background: `${STATUS_COLORS[alert.status]}12`,
                        border: `1px solid ${STATUS_COLORS[alert.status]}18`,
                      }}>
                        {alert.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[#546380] truncate max-w-[120px]">{alert.adversary}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#1a2744]/60 bg-[#060b18]/40 px-4 py-2.5">
            <span className="text-[10px] text-[#546380]">
              {filtered.length} alerts (showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)})
            </span>
            <div className="flex items-center gap-2">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                className="rounded-lg p-1 text-[#546380] hover:text-[#94a3b8] hover:bg-[rgba(59,130,246,0.04)] disabled:opacity-30 transition-all">
                <ChevronLeft className="h-3 w-3" />
              </motion.button>
              <span className="text-[10px] text-[#94a3b8] font-mono">{safePage} / {totalPages || 1}</span>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                className="rounded-lg p-1 text-[#546380] hover:text-[#94a3b8] hover:bg-[rgba(59,130,246,0.04)] disabled:opacity-30 transition-all">
                <ChevronRight className="h-3 w-3" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden w-80 lg:block">
        <LogStream />
      </div>

      <AnimatePresence>
        {detailAlert && <AlertDetailDrawer alert={detailAlert} onClose={() => setDetailAlert(null)} />}
      </AnimatePresence>
    </div>
  );
}

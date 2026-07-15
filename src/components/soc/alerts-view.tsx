'use client';

import { useState, useEffect, useRef } from 'react';
import { useAlertStore } from '@/stores/alert-store';
import { useUIStore } from '@/stores/ui-store';
import { SEVERITY_COLORS, STATUS_COLORS, ATTACK_TYPE_LABELS, ATTACK_TYPE_COLORS, type Severity, type AlertStatus, type Alert, ROLE_PERMISSIONS, Permission } from '@/lib/constants';
import { formatTime, formatRelativeTime, severityLabel } from '@/lib/formatters';
import {
  AlertTriangle, ChevronLeft, ChevronRight, Filter, X, Check,
  ArrowUpCircle, Eye, Ban, UserPlus, Search,
} from 'lucide-react';
import { LogStream } from './log-stream';

// --- Filter Bar ---
function FilterBar() {
  const { filters, setFilter, clearFilters } = useAlertStore();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#1e293b] bg-[#1a2332] p-3">
      <Filter className="h-3.5 w-3.5 text-[#475569]" />
      
      <select
        value={filters.severity || ''}
        onChange={e => setFilter('severity', e.target.value || null)}
        className="rounded border border-[#1e293b] bg-[#0a0e17] px-2 py-1 text-[11px] text-[#94a3b8] focus:border-cyan-500/30 focus:outline-none"
      >
        <option value="">All Severity</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      <select
        value={filters.status || ''}
        onChange={e => setFilter('status', e.target.value || null)}
        className="rounded border border-[#1e293b] bg-[#0a0e17] px-2 py-1 text-[11px] text-[#94a3b8] focus:border-cyan-500/30 focus:outline-none"
      >
        <option value="">All Status</option>
        <option value="new">New</option>
        <option value="acknowledged">Acknowledged</option>
        <option value="escalated">Escalated</option>
        <option value="false_positive">False Positive</option>
        <option value="dismissed">Dismissed</option>
      </select>

      <select
        value={filters.attackType || ''}
        onChange={e => setFilter('attackType', e.target.value || null)}
        className="rounded border border-[#1e293b] bg-[#0a0e17] px-2 py-1 text-[11px] text-[#94a3b8] focus:border-cyan-500/30 focus:outline-none"
      >
        <option value="">All Types</option>
        {Object.entries(ATTACK_TYPE_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>

      <div className="relative flex-1 min-w-[160px]">
        <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#475569]" />
        <input
          type="text"
          placeholder="Search IPs, titles, adversaries..."
          value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
          className="w-full rounded border border-[#1e293b] bg-[#0a0e17] py-1 pl-7 pr-2 text-[11px] text-[#94a3b8] placeholder-[#475569] focus:border-cyan-500/30 focus:outline-none"
        />
      </div>

      {(filters.severity || filters.status || filters.attackType || filters.search) && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-[#475569] hover:bg-[#0a0e17] hover:text-[#94a3b8] transition-colors"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      )}
    </div>
  );
}

// --- Alert Detail Drawer ---
function AlertDetailDrawer({ alert, onClose }: { alert: Alert; onClose: () => void }) {
  const { triageAlert } = useAlertStore();
  const { userRole } = useUIStore();
  const canTriage = userRole ? ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS]?.includes(Permission.ALERT_TRIAGE) : false;

  if (!alert) return null;

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 z-40 h-full w-96 border-l border-[#1e293b] bg-[#111827] shadow-2xl overflow-y-auto">
        <div className="border-b border-[#1e293b] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[alert.severity] }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: SEVERITY_COLORS[alert.severity] }}>
                {alert.severity}
              </span>
            </div>
            <button onClick={onClose} className="text-[#475569] hover:text-[#94a3b8] transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <h2 className="mt-2 text-sm font-semibold text-[#e2e8f0]">{alert.title}</h2>
        </div>

        <div className="p-4 space-y-4">
          {/* Details */}
          <div className="space-y-2">
            <DetailRow label="Status" value={alert.status} color={STATUS_COLORS[alert.status]} />
            <DetailRow label="Source IP" value={alert.sourceIp} />
            <DetailRow label="Target IP" value={alert.targetIp} />
            <DetailRow label="Source Port" value={String(alert.sourcePort)} />
            <DetailRow label="Target Port" value={String(alert.targetPort)} />
            <DetailRow label="Attack Type" value={ATTACK_TYPE_LABELS[alert.attackType] || alert.attackType} />
            <DetailRow label="Adversary" value={alert.adversary} />
            <DetailRow label="Time" value={formatTime(alert.timestamp)} />
            {alert.assignee && <DetailRow label="Assignee" value={alert.assignee} />}
          </div>

          {/* Description */}
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wider text-[#475569]">Description</p>
            <p className="text-xs text-[#94a3b8] leading-relaxed">{alert.description}</p>
          </div>

          {/* IOCs */}
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wider text-[#475569]">IOCs</p>
            <div className="space-y-1">
              {alert.iocs.map((ioc, i) => (
                <div key={i} className="rounded bg-[#0a0e17] px-2 py-1 font-mono text-[11px] text-[#94a3b8]">
                  {ioc}
                </div>
              ))}
            </div>
          </div>

          {/* Raw Log */}
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wider text-[#475569]">Raw Log</p>
            <pre className="rounded bg-[#0a0e17] p-2 font-mono text-[10px] text-[#475569] overflow-x-auto whitespace-pre-wrap">
              {alert.rawLog}
            </pre>
          </div>

          {/* Triage Actions */}
          {canTriage && alert.status === 'new' && (
            <div className="border-t border-[#1e293b] pt-4 space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-[#475569]">Triage Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => triageAlert(alert.id, 'acknowledged')}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                >
                  <Check className="h-3 w-3" /> Acknowledge
                </button>
                <button
                  onClick={() => triageAlert(alert.id, 'escalated')}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/5 py-2 text-xs text-orange-400 hover:bg-orange-500/10 transition-colors"
                >
                  <ArrowUpCircle className="h-3 w-3" /> Escalate
                </button>
                <button
                  onClick={() => triageAlert(alert.id, 'false_positive')}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-[#475569]/30 bg-[#475569]/5 py-2 text-xs text-[#94a3b8] hover:bg-[#475569]/10 transition-colors"
                >
                  <Ban className="h-3 w-3" /> False Positive
                </button>
                <button
                  onClick={() => triageAlert(alert.id, 'dismissed')}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-[#475569]/30 bg-[#475569]/5 py-2 text-xs text-[#94a3b8] hover:bg-[#475569]/10 transition-colors"
                >
                  <Eye className="h-3 w-3" /> Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-wider text-[#475569]">{label}</span>
      <span className="font-mono text-xs" style={{ color: color || '#e2e8f0' }}>{value}</span>
    </div>
  );
}

// --- Main Alerts View ---
export function AlertsView() {
  const { alerts, selectedAlerts, selectAlert, toggleSelectAlert, clearSelection, bulkTriage, triageAlert, getFilteredAlerts } = useAlertStore();
  const { userRole } = useUIStore();
  const [detailAlert, setDetailAlert] = useState<Alert | null>(null);
  const [page, setPage] = useState(1);
  const canTriage = userRole ? ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS]?.includes(Permission.ALERT_TRIAGE) : false;

  const filtered = getFilteredAlerts();
  const pageSize = 20;
  const totalPages = Math.ceil(filtered.length / pageSize);
  // Reset to page 1 when filters change
  const safePage = filtered.length > 0 && (page - 1) * pageSize >= filtered.length ? 1 : page;
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="flex h-full gap-4">
      {/* Left: Alert table */}
      <div className="flex flex-1 flex-col gap-3 min-w-0">
        <FilterBar />

        {/* Bulk actions */}
        {selectedAlerts.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2">
            <span className="text-xs text-cyan-400">{selectedAlerts.length} selected</span>
            {canTriage && (
              <>
                <button onClick={() => bulkTriage('acknowledged')} className="rounded px-2 py-0.5 text-[10px] text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                  Acknowledge
                </button>
                <button onClick={() => bulkTriage('escalated')} className="rounded px-2 py-0.5 text-[10px] text-orange-400 hover:bg-orange-500/10 transition-colors">
                  Escalate
                </button>
                <button onClick={() => bulkTriage('dismissed')} className="rounded px-2 py-0.5 text-[10px] text-[#94a3b8] hover:bg-[#475569]/10 transition-colors">
                  Dismiss
                </button>
              </>
            )}
            <button onClick={clearSelection} className="ml-auto text-[10px] text-[#475569] hover:text-[#94a3b8]">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-[#1e293b] bg-[#1a2332]">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#111827]">
                  {canTriage && <th className="w-8 px-2 py-2"><input type="checkbox" className="rounded border-[#1e293b]" /></th>}
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Time</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Severity</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Source</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Target</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Title</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Type</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Status</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Adversary</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(alert => (
                  <tr
                    key={alert.id}
                    className={`border-b border-[#1e293b]/50 cursor-pointer hover:bg-[#1a2332] transition-colors ${
                      alert.severity === 'critical' ? 'row-flash' : ''
                    }`}
                    onClick={() => setDetailAlert(alert)}
                    style={{ borderLeftColor: SEVERITY_COLORS[alert.severity], borderLeftWidth: '2px' }}
                  >
                    {canTriage && (
                      <td className="px-2 py-2" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedAlerts.includes(alert.id)}
                          onChange={() => toggleSelectAlert(alert.id)}
                          className="rounded border-[#1e293b]"
                        />
                      </td>
                    )}
                    <td className="px-3 py-2 font-mono text-[#475569] whitespace-nowrap">{formatTime(alert.timestamp)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[alert.severity] }} />
                        <span className="text-[10px] font-medium" style={{ color: SEVERITY_COLORS[alert.severity] }}>
                          {severityLabel(alert.severity)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono text-[#94a3b8]">{alert.sourceIp}</td>
                    <td className="px-3 py-2 font-mono text-[#94a3b8]">{alert.targetIp}</td>
                    <td className="px-3 py-2 text-[#e2e8f0] max-w-[200px] truncate">{alert.title}</td>
                    <td className="px-3 py-2 text-[#94a3b8]">{ATTACK_TYPE_LABELS[alert.attackType] || alert.attackType}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full px-1.5 py-0.5 text-[9px] font-medium" style={{
                        color: STATUS_COLORS[alert.status],
                        backgroundColor: `${STATUS_COLORS[alert.status]}10`,
                        border: `1px solid ${STATUS_COLORS[alert.status]}20`,
                      }}>
                        {alert.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[#475569] truncate max-w-[120px]">{alert.adversary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-[#1e293b] bg-[#111827] px-4 py-2">
            <span className="text-[10px] text-[#475569]">
              {filtered.length} alerts (showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded px-2 py-1 text-[#475569] hover:bg-[#1a2332] hover:text-[#94a3b8] disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <span className="text-[10px] text-[#94a3b8]">{page} / {totalPages || 1}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded px-2 py-1 text-[#475569] hover:bg-[#1a2332] hover:text-[#94a3b8] disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Log Stream */}
      <div className="hidden w-80 lg:block">
        <LogStream />
      </div>

      {/* Detail Drawer */}
      {detailAlert && (
        <AlertDetailDrawer alert={detailAlert} onClose={() => setDetailAlert(null)} />
      )}
    </div>
  );
}

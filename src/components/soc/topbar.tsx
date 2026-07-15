'use client';

import { useUIStore } from '@/stores/ui-store';
import { useAlertStore } from '@/stores/alert-store';
import { ROLE_PERMISSIONS, Permission } from '@/lib/constants';
import { Bell, Download, Wifi, WifiOff, LogOut, User } from 'lucide-react';
import { exportToCSV } from '@/lib/exporters';
import { toast } from 'sonner';

export function Topbar() {
  const { userName, userRole, wsConnected, activeView, toggleNotificationDrawer, logout } = useUIStore();
  const { unreadCount, getFilteredAlerts } = useAlertStore();
  const canExport = userRole ? ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS]?.includes(Permission.EXPORT_DATA) : false;

  const handleExport = () => {
    const alerts = getFilteredAlerts();
    if (alerts.length === 0) {
      toast.error('No alerts to export');
      return;
    }
    const data = alerts.map(a => ({
      ID: a.id,
      Title: a.title,
      Severity: a.severity,
      Status: a.status,
      SourceIP: a.sourceIp,
      TargetIP: a.targetIp,
      AttackType: a.attackType,
      Adversary: a.adversary,
      Timestamp: a.timestamp,
    }));
    exportToCSV(data, `apex-soc-${activeView}-alerts`);
    toast.success(`Exported ${data.length} alerts`);
  };

  return (
    <header className="flex h-12 items-center justify-between border-b border-[#1e293b] bg-[#111827] px-4">
      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div className="flex items-center gap-1.5">
          {wsConnected ? (
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
              <span className="text-[10px] text-emerald-400 font-medium">LIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <WifiOff className="h-3 w-3 text-red-400" />
              <span className="text-[10px] text-red-400 font-medium">DISCONNECTED</span>
            </div>
          )}
        </div>

        {/* Current view label */}
        <span className="text-xs text-[#475569]">/ {activeView.replace('-', ' ')}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Role badge */}
        <div className="flex items-center gap-1.5 rounded-full bg-cyan-500/5 border border-cyan-500/15 px-2.5 py-0.5">
          <User className="h-3 w-3 text-cyan-400" />
          <span className="text-[10px] font-medium text-cyan-400 uppercase">{userRole}</span>
        </div>

        {/* Export button */}
        {canExport && (
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[#94a3b8] hover:bg-[#1a2332] hover:text-[#e2e8f0] transition-colors"
            title="Export current view"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="text-xs">Export</span>
          </button>
        )}

        {/* Notifications */}
        <button
          onClick={toggleNotificationDrawer}
          className="relative flex items-center justify-center rounded-md p-1.5 text-[#94a3b8] hover:bg-[#1a2332] hover:text-[#e2e8f0] transition-colors"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User menu */}
        <div className="flex items-center gap-2 border-l border-[#1e293b] pl-3">
          <span className="text-xs text-[#94a3b8]">{userName}</span>
          <button
            onClick={logout}
            className="rounded-md p-1 text-[#475569] hover:bg-[#1a2332] hover:text-red-400 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

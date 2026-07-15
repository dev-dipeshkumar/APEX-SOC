'use client';

import { useUIStore } from '@/stores/ui-store';
import { useAlertStore } from '@/stores/alert-store';
import { ROLE_PERMISSIONS, Permission } from '@/lib/constants';
import { Bell, Download, Wifi, WifiOff, LogOut, User, Search, Command } from 'lucide-react';
import { exportToCSV } from '@/lib/exporters';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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

  const viewLabels: Record<string, string> = {
    'dashboard': 'Overview',
    'alerts': 'Alerts',
    'intel-map': 'Intel Map',
    'assets': 'Assets',
    'settings': 'Settings',
  };

  return (
    <header className="flex h-12 items-center justify-between border-b border-[rgba(0,240,255,0.06)] bg-[#080d18]/60 backdrop-blur-xl px-4 relative z-10">
      {/* Scan line effect */}
      <div className="scan-line absolute inset-0 pointer-events-none overflow-hidden" />

      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div className="flex items-center gap-2">
          {wsConnected ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 rounded-full glass-light px-2.5 py-1"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)] status-pulse" />
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider">LIVE</span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 rounded-full bg-red-500/5 border border-red-500/10 px-2.5 py-1"
            >
              <WifiOff className="h-3 w-3 text-red-400" />
              <span className="text-[10px] text-red-400 font-semibold">OFFLINE</span>
            </motion.div>
          )}
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#475569]">
          <span className="text-[#475569]/40">/</span>
          <span className="text-[#94a3b8] font-medium">{viewLabels[activeView] || activeView}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="hidden sm:flex items-center gap-2 rounded-lg glass-light px-3 py-1.5 text-[#475569] hover:text-[#94a3b8] hover:border-[rgba(0,240,255,0.12)] transition-all"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Search...</span>
          <kbd className="hidden md:flex items-center gap-0.5 rounded bg-[#0a0f1c] px-1.5 py-0.5 text-[9px] text-[#475569]">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </motion.button>

        {/* Role badge */}
        <div className="flex items-center gap-1.5 rounded-full glass-light px-2.5 py-1">
          <User className="h-3 w-3 text-cyan-400" />
          <span className="text-[10px] font-medium text-cyan-400 uppercase tracking-wider">{userRole}</span>
        </div>

        {/* Export button */}
        {canExport && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg glass-light px-2.5 py-1.5 text-[#94a3b8] hover:text-[#e2e8f0] transition-all"
            title="Export current view"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="text-xs hidden sm:inline">Export</span>
          </motion.button>
        )}

        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleNotificationDrawer}
          className="relative flex items-center justify-center rounded-lg glass-light p-2 text-[#94a3b8] hover:text-[#e2e8f0] transition-all"
        >
          <Bell className="h-4 w-4" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(255,45,85,0.5)]"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* User menu */}
        <div className="flex items-center gap-2 border-l border-[rgba(0,240,255,0.06)] pl-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-cyan-400">{userName?.[0] || '?'}</span>
            </div>
            <span className="text-xs text-[#94a3b8] hidden md:inline">{userName}</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={logout}
            className="rounded-md p-1.5 text-[#475569] hover:text-red-400 hover:bg-red-500/5 transition-all"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}

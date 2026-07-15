'use client';

import { useUIStore } from '@/stores/ui-store';
import { useAlertStore } from '@/stores/alert-store';
import { ROLE_PERMISSIONS, Permission } from '@/lib/constants';
import {
  Bell, Download, LogOut, User, Search, Command,
  Wifi, WifiOff, Clock, Activity, Shield,
} from 'lucide-react';
import { exportToCSV } from '@/lib/exporters';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Topbar() {
  const { userName, userRole, wsConnected, activeView, toggleNotificationDrawer, toggleCommandPalette, logout } = useUIStore();
  const { unreadCount, getFilteredAlerts } = useAlertStore();
  const canExport = userRole ? ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS]?.includes(Permission.EXPORT_DATA) : false;
  const [currentTime, setCurrentTime] = useState('');
  const [threatLevel, setThreatLevel] = useState<'elevated' | 'high' | 'critical'>('elevated');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleExport = () => {
    const alerts = getFilteredAlerts();
    if (alerts.length === 0) {
      toast.error('No alerts to export');
      return;
    }
    const data = alerts.map(a => ({
      ID: a.id, Title: a.title, Severity: a.severity, Status: a.status,
      SourceIP: a.sourceIp, TargetIP: a.targetIp, AttackType: a.attackType,
      Adversary: a.adversary, Timestamp: a.timestamp,
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
    <header className="flex h-12 items-center justify-between border-b border-[#1a2744]/60 bg-[#070c1a]/70 backdrop-blur-xl px-4 relative z-10">
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
              <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)] status-pulse" />
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
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#546380]/40">/</span>
          <span className="text-[#94a3b8] font-medium">{viewLabels[activeView] || activeView}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Time sync */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-lg glass-light px-2.5 py-1">
          <Clock className="h-3 w-3 text-[#546380]" />
          <span className="text-[10px] font-mono text-[#94a3b8] tracking-wider">{currentTime}</span>
        </div>

        {/* SOC Status indicator */}
        <div className="hidden md:flex items-center gap-1.5 rounded-lg glass-light px-2.5 py-1">
          <Activity className="h-3 w-3 text-amber-400" />
          <span className="text-[10px] text-amber-400 font-semibold tracking-wider">ELEVATED</span>
        </div>

        {/* Search - triggers Command Palette */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleCommandPalette}
          className="hidden sm:flex items-center gap-2 rounded-lg glass-light px-3 py-1.5 text-[#546380] hover:text-[#94a3b8] hover:border-blue-500/10 transition-all"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Search...</span>
          <kbd className="hidden md:flex items-center gap-0.5 rounded bg-[#0b1121] px-1.5 py-0.5 text-[9px] text-[#546380] border border-[#1a2744]">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </motion.button>

        {/* Role badge */}
        <div className="flex items-center gap-1.5 rounded-full glass-light px-2.5 py-1">
          <Shield className="h-3 w-3 text-blue-400" />
          <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">{userRole}</span>
        </div>

        {/* Export button */}
        {canExport && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg glass-light px-2.5 py-1.5 text-[#94a3b8] hover:text-[#e8ecf4] transition-all"
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
          className="relative flex items-center justify-center rounded-lg glass-light p-2 text-[#94a3b8] hover:text-[#e8ecf4] transition-all"
        >
          <Bell className="h-4 w-4" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.4)]"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* User menu */}
        <div className="flex items-center gap-2 border-l border-[#1a2744]/60 pl-3">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/15 border border-blue-500/15 flex items-center justify-center">
            <span className="text-[10px] font-bold text-blue-400">{userName?.[0] || '?'}</span>
          </div>
          <span className="text-xs text-[#94a3b8] hidden md:inline">{userName}</span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={logout}
            className="rounded-md p-1.5 text-[#546380] hover:text-red-400 hover:bg-red-500/5 transition-all"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}

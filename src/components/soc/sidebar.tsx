'use client';

import { useUIStore } from '@/stores/ui-store';
import { type ViewType } from '@/lib/constants';
import {
  LayoutDashboard, AlertTriangle, Globe, Server, Settings,
  Shield, ChevronLeft, ChevronRight, Zap, Building2,
  Wifi, WifiOff, Radio,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS: { view: ViewType; icon: React.ComponentType<{ className?: string }>; label: string; group: string }[] = [
  { view: 'dashboard', icon: LayoutDashboard, label: 'Overview', group: 'Monitor' },
  { view: 'alerts', icon: AlertTriangle, label: 'Alerts', group: 'Monitor' },
  { view: 'intel-map', icon: Globe, label: 'Intel Map', group: 'Intelligence' },
  { view: 'assets', icon: Server, label: 'Assets', group: 'Infrastructure' },
  { view: 'settings', icon: Settings, label: 'Settings', group: 'System' },
];

const NAV_GROUPS = [
  { name: 'Monitor', items: ['dashboard', 'alerts'] },
  { name: 'Intelligence', items: ['intel-map'] },
  { name: 'Infrastructure', items: ['assets'] },
  { name: 'System', items: ['settings'] },
];

export function Sidebar() {
  const { activeView, setActiveView, sidebarCollapsed, toggleSidebar, wsConnected } = useUIStore();

  return (
    <aside
      className={`flex flex-col border-r border-[#1a2744]/60 bg-[#070c1a]/90 backdrop-blur-2xl transition-all duration-300 relative ${
        sidebarCollapsed ? 'w-[68px]' : 'w-[220px]'
      }`}
    >
      {/* ─── Brand Header ─── */}
      <div className="flex h-14 items-center gap-2.5 border-b border-[#1a2744]/60 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/10 border border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.08)]">
          <Shield className="h-4.5 w-4.5 text-blue-400" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <h1 className="text-sm font-bold tracking-wider text-[#e8ecf4] whitespace-nowrap">APEX SOC</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`h-1.5 w-1.5 rounded-full ${wsConnected ? 'bg-emerald-400 status-pulse' : 'bg-red-400'}`} />
                <p className="text-[8px] tracking-[0.2em] text-blue-400/40 uppercase whitespace-nowrap">
                  {wsConnected ? 'CONNECTED' : 'OFFLINE'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Workspace Switcher ─── */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 pt-3 overflow-hidden"
          >
            <div className="rounded-lg bg-[#0b1121] border border-[#1a2744] p-2.5">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
                  <Building2 className="h-3 w-3 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-[#e8ecf4] truncate">SOC Team Alpha</p>
                  <p className="text-[8px] text-[#546380] truncate">Enterprise Workspace</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Navigation ─── */}
      <nav className="flex-1 py-3 px-2.5 overflow-y-auto">
        {NAV_GROUPS.map(group => {
          const groupItems = NAV_ITEMS.filter(item => group.items.includes(item.view));
          return (
            <div key={group.name} className="mb-2">
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 mb-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#546380]"
                  >
                    {group.name}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="space-y-0.5">
                {groupItems.map(({ view, icon: Icon, label }) => {
                  const isActive = activeView === view;
                  return (
                    <motion.button
                      key={view}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setActiveView(view)}
                      className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all duration-200 group ${
                        isActive
                          ? 'text-blue-400'
                          : 'text-[#94a3b8] hover:text-[#e8ecf4]'
                      }`}
                      title={sidebarCollapsed ? label : undefined}
                    >
                      {/* Active background with gradient */}
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-500/[0.03] border border-blue-500/10"
                          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        />
                      )}

                      {/* Hover glow */}
                      {!isActive && (
                        <div className="absolute inset-0 rounded-lg bg-white/[0.015] opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}

                      <Icon className={`h-4 w-4 shrink-0 relative z-10 transition-colors duration-200 ${isActive ? 'text-blue-400' : 'group-hover:text-[#e8ecf4]'}`} />
                      <AnimatePresence>
                        {!sidebarCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="truncate relative z-10 whitespace-nowrap"
                          >
                            {label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Active indicator line */}
                      {isActive && (
                        <motion.div
                          layoutId="activeDot"
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ─── System Status ─── */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-3 pb-2"
          >
            <div className="rounded-lg bg-[#0b1121] border border-[#1a2744] p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-blue-400" />
                  <span className="text-[10px] font-semibold text-[#94a3b8]">System</span>
                </div>
                <div className="flex items-center gap-1">
                  {wsConnected ? <Wifi className="h-3 w-3 text-emerald-400" /> : <WifiOff className="h-3 w-3 text-red-400" />}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${wsConnected ? 'bg-emerald-400 status-pulse' : 'bg-red-400'}`} />
                <span className="text-[9px] text-[#546380]">{wsConnected ? 'All systems operational' : 'Connection lost'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Radio className="h-1.5 w-1.5 text-blue-400" />
                <span className="text-[9px] text-[#546380]">Telemetry: Active</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Collapse Toggle ─── */}
      <div className="border-t border-[#1a2744]/60 p-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-lg py-2 text-[#546380] hover:text-[#94a3b8] hover:bg-white/[0.02] transition-all"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </motion.button>
      </div>
    </aside>
  );
}

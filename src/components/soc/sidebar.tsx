'use client';

import { useUIStore } from '@/stores/ui-store';
import { type ViewType } from '@/lib/constants';
import {
  LayoutDashboard, AlertTriangle, Globe, Server, Settings,
  Shield, ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS: { view: ViewType; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { view: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
  { view: 'alerts', icon: AlertTriangle, label: 'Alerts' },
  { view: 'intel-map', icon: Globe, label: 'Intel Map' },
  { view: 'assets', icon: Server, label: 'Assets' },
  { view: 'settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { activeView, setActiveView, sidebarCollapsed, toggleSidebar, wsConnected } = useUIStore();

  return (
    <aside
      className={`flex flex-col border-r border-[rgba(0,240,255,0.06)] bg-[#080d18]/80 backdrop-blur-xl transition-all duration-300 relative ${
        sidebarCollapsed ? 'w-16' : 'w-52'
      }`}
    >
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b border-[rgba(0,240,255,0.06)] px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 neon-glow">
          <Shield className="h-4 w-4 text-cyan-400" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <h1 className="text-sm font-bold tracking-wider text-[#e2e8f0] whitespace-nowrap">APEX SOC</h1>
              <div className="flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${wsConnected ? 'bg-emerald-400 status-pulse' : 'bg-red-400'}`} />
                <p className="text-[8px] tracking-[0.2em] text-cyan-400/50 uppercase whitespace-nowrap">
                  {wsConnected ? 'LIVE' : 'OFFLINE'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ view, icon: Icon, label }) => {
          const isActive = activeView === view;
          return (
            <motion.button
              key={view}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveView(view)}
              className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 group ${
                isActive
                  ? 'text-cyan-400'
                  : 'text-[#94a3b8] hover:text-[#e2e8f0]'
              }`}
              title={sidebarCollapsed ? label : undefined}
            >
              {/* Active background */}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/10"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
              
              {/* Hover background */}
              {!isActive && (
                <div className="absolute inset-0 rounded-lg bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
              )}

              <Icon className={`h-4 w-4 shrink-0 relative z-10 transition-colors ${isActive ? 'text-cyan-400' : 'group-hover:text-[#e2e8f0]'}`} />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="truncate relative z-10 text-[13px] whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="activeDot"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[2px] rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.5)]"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* System status */}
      {!sidebarCollapsed && (
        <div className="px-3 pb-2">
          <div className="rounded-lg glass-light p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-cyan-400" />
              <span className="text-[10px] text-[#94a3b8]">System Status</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${wsConnected ? 'bg-emerald-400 status-pulse' : 'bg-red-400'}`} />
              <span className="text-[9px] text-[#475569]">{wsConnected ? 'All systems operational' : 'Connection lost'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="border-t border-[rgba(0,240,255,0.06)] p-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-lg py-2 text-[#475569] hover:text-[#94a3b8] hover:bg-white/[0.02] transition-all"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </motion.button>
      </div>
    </aside>
  );
}

'use client';

import { useUIStore } from '@/stores/ui-store';
import { type ViewType } from '@/lib/constants';
import {
  LayoutDashboard, AlertTriangle, Globe, Server, Settings,
  Shield, ChevronLeft, ChevronRight,
} from 'lucide-react';

const NAV_ITEMS: { view: ViewType; icon: React.ElementType; label: string }[] = [
  { view: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
  { view: 'alerts', icon: AlertTriangle, label: 'Alerts' },
  { view: 'intel-map', icon: Globe, label: 'Intel Map' },
  { view: 'assets', icon: Server, label: 'Assets' },
  { view: 'settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { activeView, setActiveView, sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={`flex flex-col border-r border-[#1e293b] bg-[#111827] transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-52'
      }`}
    >
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b border-[#1e293b] px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cyan-500/10 border border-cyan-500/20">
          <Shield className="h-4 w-4 text-cyan-400" />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold tracking-wider text-[#e2e8f0]">APEX SOC</h1>
            <p className="text-[8px] tracking-[0.2em] text-cyan-400/50 uppercase">Threat Intel</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ view, icon: Icon, label }) => {
          const isActive = activeView === view;
          return (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/8 to-transparent border-l-2 border-cyan-400 text-cyan-400'
                  : 'text-[#94a3b8] hover:bg-[#1a2332] hover:text-[#e2e8f0]'
              }`}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-cyan-400' : ''}`} />
              {!sidebarCollapsed && <span className="truncate">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-[#1e293b] p-2">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-lg py-2 text-[#475569] hover:bg-[#1a2332] hover:text-[#94a3b8] transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}

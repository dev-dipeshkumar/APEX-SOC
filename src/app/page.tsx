'use client';

import { useEffect, useState, useRef } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { useAlertStore } from '@/stores/alert-store';
import { useAssetStore } from '@/stores/asset-store';
import { generateAlert, generateAttackConnection, generateLogLine, generateDashboardStats, generateTrendData } from '@/lib/mock-data';
import { DEFAULT_USERS, type ViewType } from '@/lib/constants';
import { Sidebar } from '@/components/soc/sidebar';
import { Topbar } from '@/components/soc/topbar';
import { LoginPage } from '@/components/soc/login-page';
import { DashboardView } from '@/components/soc/dashboard-view';
import { AlertsView } from '@/components/soc/alerts-view';
import dynamic from 'next/dynamic';
const IntelMapView = dynamic(() => import('@/components/soc/intel-map-view').then(m => ({ default: m.IntelMapView })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-[#475569]"><p className="text-xs">Loading Intel Map...</p></div>
});
import { AssetsView } from '@/components/soc/assets-view';
import { SettingsView } from '@/components/soc/settings-view';
import { NotificationDrawer } from '@/components/soc/notification-drawer';
import { CyberBackground } from '@/components/soc/cyber-background';
import { CommandPalette } from '@/components/soc/command-palette';
import { AnimatePresence, motion } from 'framer-motion';

export default function Home() {
  const {
    isLoggedIn, activeView, sidebarCollapsed, notificationDrawerOpen,
    wsConnected, login, setWsConnected, setActiveView,
    addLogLine, addAttackConnection, updateDashboardStats, setTrendData,
  } = useUIStore();
  const { initialize: initAlerts, addAlert } = useAlertStore();
  const { initialize: initAssets } = useAssetStore();
  const [initialized, setInitialized] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize data
  useEffect(() => {
    if (isLoggedIn && !initialized) {
      initAlerts();
      initAssets();
      updateDashboardStats(generateDashboardStats());
      setTrendData(generateTrendData());
      setInitialized(true);
    }
  }, [isLoggedIn, initialized, initAlerts, initAssets, updateDashboardStats, setTrendData]);

  // Real-time simulation
  useEffect(() => {
    if (!isLoggedIn || !initialized) return;

    setWsConnected(true);
    let tick = 0;

    const simulate = () => {
      tick++;

      if (Math.random() < 0.8) {
        const attack = generateAttackConnection();
        addAttackConnection(attack);
      }

      if (Math.random() < 0.5) {
        const alert = generateAlert();
        addAlert(alert);
      }

      const log = generateLogLine();
      addLogLine(log);
      if (Math.random() < 0.5) {
        addLogLine(generateLogLine());
      }

      if (tick % 5 === 0) {
        updateDashboardStats(generateDashboardStats());
      }
    };

    intervalRef.current = setInterval(simulate, 1500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setWsConnected(false);
    };
  }, [isLoggedIn, initialized, setWsConnected, addAttackConnection, addAlert, addLogLine, updateDashboardStats]);

  // Keyboard shortcuts (number keys for quick navigation)
  useEffect(() => {
    if (!isLoggedIn) return;
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs or when CMD/CTRL is held
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey) return;

      const viewMap: Record<string, ViewType> = {
        '1': 'dashboard',
        '2': 'alerts',
        '3': 'intel-map',
        '4': 'assets',
        '5': 'settings',
      };
      if (viewMap[e.key]) {
        setActiveView(viewMap[e.key]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isLoggedIn, setActiveView]);

  if (!isLoggedIn) {
    return <LoginPage onLogin={(u, r, n) => login(u, r, n)} />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView />;
      case 'alerts': return <AlertsView />;
      case 'intel-map': return <IntelMapView />;
      case 'assets': return <AssetsView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#050810] relative">
      {/* Animated cyber background */}
      <CyberBackground />

      {/* Main layout */}
      <div className="relative z-10 flex h-full w-full">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Notification drawer */}
      <NotificationDrawer />

      {/* Command Palette (CMD/CTRL+K) */}
      <CommandPalette />
    </div>
  );
}

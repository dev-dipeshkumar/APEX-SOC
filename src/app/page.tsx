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
import { LandingPage } from '@/components/soc/landing-page';
import { DashboardView } from '@/components/soc/dashboard-view';
import { AlertsView } from '@/components/soc/alerts-view';
import dynamic from 'next/dynamic';
const IntelMapView = dynamic(() => import('@/components/soc/intel-map-view').then(m => ({ default: m.IntelMapView })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="h-8 w-8 mx-auto mb-3 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
        <p className="text-xs text-[#546380]">Loading Intel Map...</p>
      </div>
    </div>
  ),
});
import { AssetsView } from '@/components/soc/assets-view';
import { SettingsView } from '@/components/soc/settings-view';
import { NotificationDrawer } from '@/components/soc/notification-drawer';
import { CyberBackground } from '@/components/soc/cyber-background';
import { CyberCursor } from '@/components/soc/cyber-cursor';
import { CommandPalette } from '@/components/soc/command-palette';
import { AnimatePresence, motion } from 'framer-motion';

type AppPhase = 'landing' | 'login' | 'app';

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

  // Phase management: landing -> login -> app
  const [phase, setPhase] = useState<AppPhase>('landing');

  // When user is already logged in (e.g. from previous session), skip to app
  useEffect(() => {
    if (isLoggedIn && phase !== 'app') {
      setPhase('app');
    }
  }, [isLoggedIn, phase]);

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
      if (Math.random() < 0.8) { addAttackConnection(generateAttackConnection()); }
      if (Math.random() < 0.5) { addAlert(generateAlert()); }
      addLogLine(generateLogLine());
      if (Math.random() < 0.5) { addLogLine(generateLogLine()); }
      if (tick % 5 === 0) { updateDashboardStats(generateDashboardStats()); }
    };

    intervalRef.current = setInterval(simulate, 1500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setWsConnected(false);
    };
  }, [isLoggedIn, initialized, setWsConnected, addAttackConnection, addAlert, addLogLine, updateDashboardStats]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isLoggedIn) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey) return;
      const viewMap: Record<string, ViewType> = {
        '1': 'dashboard', '2': 'alerts', '3': 'intel-map', '4': 'assets', '5': 'settings',
      };
      if (viewMap[e.key]) setActiveView(viewMap[e.key]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isLoggedIn, setActiveView]);

  // ─── Phase: Landing Page ───
  if (phase === 'landing') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <CyberCursor />
          <LandingPage onEnterApp={() => setPhase('login')} />
        </motion.div>
      </AnimatePresence>
    );
  }

  // ─── Phase: Login ───
  if (!isLoggedIn) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <CyberCursor />
          <LoginPage onLogin={(u, r, n) => login(u, r, n)} />
        </motion.div>
      </AnimatePresence>
    );
  }

  // ─── Phase: Main App ───
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
    <div className="flex h-screen overflow-hidden bg-[#060b18] relative">
      <CyberBackground />
      <CyberCursor />

      <div className="relative z-10 flex h-full w-full">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-auto p-5 lg:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <NotificationDrawer />
      <CommandPalette />
    </div>
  );
}

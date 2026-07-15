'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { useAlertStore } from '@/stores/alert-store';
import { useAssetStore } from '@/stores/asset-store';
import { generateAlert, generateAttackConnection, generateLogLine, generateDashboardStats, generateTrendData } from '@/lib/mock-data';
import { ROLE_PERMISSIONS, Permission, DEFAULT_USERS, type ViewType } from '@/lib/constants';
import { Sidebar } from '@/components/soc/sidebar';
import { Topbar } from '@/components/soc/topbar';
import { LoginPage } from '@/components/soc/login-page';
import { DashboardView } from '@/components/soc/dashboard-view';
import { AlertsView } from '@/components/soc/alerts-view';
import { IntelMapView } from '@/components/soc/intel-map-view';
import { AssetsView } from '@/components/soc/assets-view';
import { SettingsView } from '@/components/soc/settings-view';
import { NotificationDrawer } from '@/components/soc/notification-drawer';

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

      // Generate attack connections
      if (Math.random() < 0.8) {
        const attack = generateAttackConnection();
        addAttackConnection(attack);
      }

      // Generate alerts
      if (Math.random() < 0.5) {
        const alert = generateAlert();
        addAlert(alert);
      }

      // Generate log lines
      const log = generateLogLine();
      addLogLine(log);
      if (Math.random() < 0.5) {
        addLogLine(generateLogLine());
      }

      // Update stats every ~5 ticks
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

  // Keyboard shortcuts
  useEffect(() => {
    if (!isLoggedIn) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
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
      if (e.key === '/') {
        e.preventDefault();
        // Focus search - handled by individual views
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
    <div className="flex h-screen overflow-hidden bg-[#0a0e17]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {renderView()}
        </main>
      </div>
      {notificationDrawerOpen && <NotificationDrawer />}
    </div>
  );
}

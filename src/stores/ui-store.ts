// APEX SOC UI Store
import { create } from 'zustand';
import { ViewType, LogLine, AttackConnection, DashboardStats, TrendDataPoint } from '@/lib/constants';

interface UIStore {
  // Auth
  isLoggedIn: boolean;
  username: string | null;
  userRole: string | null;
  userName: string | null;

  // Navigation
  activeView: ViewType;
  sidebarCollapsed: boolean;

  // Real-time data
  wsConnected: boolean;
  logLines: LogLine[];
  attackConnections: AttackConnection[];
  dashboardStats: DashboardStats | null;
  trendData: TrendDataPoint[];
  threatScoreHistory: number[];

  // Settings
  glowIntensity: number;
  animationSpeed: number;
  densityMode: 'comfortable' | 'compact';
  dataMode: 'mock' | 'real';

  // Notification drawer
  notificationDrawerOpen: boolean;

  // Command palette
  commandPaletteOpen: boolean;

  // Actions
  login: (username: string, role: string, name: string) => void;
  logout: () => void;
  setActiveView: (view: ViewType) => void;
  toggleSidebar: () => void;
  setWsConnected: (v: boolean) => void;
  addLogLine: (line: LogLine) => void;
  addAttackConnection: (attack: AttackConnection) => void;
  updateDashboardStats: (stats: DashboardStats) => void;
  setTrendData: (data: TrendDataPoint[]) => void;
  addThreatScore: (score: number) => void;
  toggleNotificationDrawer: () => void;
  setGlowIntensity: (v: number) => void;
  setAnimationSpeed: (v: number) => void;
  setDensityMode: (v: 'comfortable' | 'compact') => void;
  setDataMode: (v: 'mock' | 'real') => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  isLoggedIn: false,
  username: null,
  userRole: null,
  userName: null,

  activeView: 'dashboard',
  sidebarCollapsed: false,

  wsConnected: false,
  logLines: [],
  attackConnections: [],
  dashboardStats: null,
  trendData: [],
  threatScoreHistory: [],

  glowIntensity: 1,
  animationSpeed: 1,
  densityMode: 'comfortable',
  dataMode: 'mock',

  notificationDrawerOpen: false,
  commandPaletteOpen: false,

  login: (username: string, role: string, name: string) => {
    set({ isLoggedIn: true, username, userRole: role, userName: name });
  },

  logout: () => {
    set({ isLoggedIn: false, username: null, userRole: null, userName: null, activeView: 'dashboard' });
  },

  setActiveView: (view: ViewType) => set({ activeView: view }),

  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setWsConnected: (v: boolean) => set({ wsConnected: v }),

  addLogLine: (line: LogLine) => {
    set(state => ({
      logLines: [...state.logLines, line].slice(-1000),
    }));
  },

  addAttackConnection: (attack: AttackConnection) => {
    set(state => ({
      attackConnections: [...state.attackConnections, attack].slice(-200),
    }));
  },

  updateDashboardStats: (stats: DashboardStats) => {
    set(state => ({
      dashboardStats: stats,
      threatScoreHistory: [...state.threatScoreHistory, stats.threatScore].slice(-60),
    }));
  },

  setTrendData: (data: TrendDataPoint[]) => set({ trendData: data }),

  addThreatScore: (score: number) => {
    set(state => ({
      threatScoreHistory: [...state.threatScoreHistory, score].slice(-60),
    }));
  },

  toggleNotificationDrawer: () => set(state => ({ notificationDrawerOpen: !state.notificationDrawerOpen })),

  toggleCommandPalette: () => set(state => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setCommandPaletteOpen: (v: boolean) => set({ commandPaletteOpen: v }),

  setGlowIntensity: (v: number) => set({ glowIntensity: v }),
  setAnimationSpeed: (v: number) => set({ animationSpeed: v }),
  setDensityMode: (v: 'comfortable' | 'compact') => set({ densityMode: v }),
  setDataMode: (v: 'mock' | 'real') => set({ dataMode: v }),
}));

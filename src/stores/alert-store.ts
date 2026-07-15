// APEX SOC Alert Store
import { create } from 'zustand';
import { Alert, AlertStatus, Severity, Notification } from '@/lib/constants';
import { generateAlert, generateInitialAlerts, generateNotification } from '@/lib/mock-data';

interface AlertStore {
  alerts: Alert[];
  notifications: Notification[];
  selectedAlert: Alert | null;
  selectedAlerts: string[];
  unreadCount: number;
  filters: {
    severity: Severity | null;
    status: AlertStatus | null;
    search: string;
    attackType: string | null;
  };
  // Actions
  initialize: () => void;
  addAlert: (alert: Alert) => void;
  triageAlert: (id: string, status: AlertStatus, assignee?: string) => void;
  selectAlert: (alert: Alert | null) => void;
  toggleSelectAlert: (id: string) => void;
  clearSelection: () => void;
  bulkTriage: (status: AlertStatus) => void;
  setFilter: (key: string, value: unknown) => void;
  clearFilters: () => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  getFilteredAlerts: () => Alert[];
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  alerts: [],
  notifications: [],
  selectedAlert: null,
  selectedAlerts: [],
  unreadCount: 0,
  filters: {
    severity: null,
    status: null,
    search: '',
    attackType: null,
  },

  initialize: () => {
    const alerts = generateInitialAlerts(50);
    set({ alerts });
  },

  addAlert: (alert: Alert) => {
    const notification = generateNotification(alert);
    set(state => ({
      alerts: [alert, ...state.alerts].slice(0, 500),
      notifications: [notification, ...state.notifications].slice(0, 50),
      unreadCount: state.unreadCount + 1,
    }));
  },

  triageAlert: (id: string, status: AlertStatus, assignee?: string) => {
    set(state => ({
      alerts: state.alerts.map(a =>
        a.id === id ? { ...a, status, assignee: assignee || a.assignee } : a
      ),
    }));
  },

  selectAlert: (alert: Alert | null) => set({ selectedAlert: alert }),

  toggleSelectAlert: (id: string) => {
    set(state => ({
      selectedAlerts: state.selectedAlerts.includes(id)
        ? state.selectedAlerts.filter(x => x !== id)
        : [...state.selectedAlerts, id],
    }));
  },

  clearSelection: () => set({ selectedAlerts: [] }),

  bulkTriage: (status: AlertStatus) => {
    set(state => ({
      alerts: state.alerts.map(a =>
        state.selectedAlerts.includes(a.id) ? { ...a, status } : a
      ),
      selectedAlerts: [],
    }));
  },

  setFilter: (key: string, value: unknown) => {
    set(state => ({
      filters: { ...state.filters, [key]: value },
    }));
  },

  clearFilters: () => set({
    filters: { severity: null, status: null, search: '', attackType: null },
  }),

  markNotificationRead: (id: string) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: state.notifications.filter(n => !n.read && n.id !== id).length,
    }));
  },

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

  getFilteredAlerts: () => {
    const { alerts, filters } = get();
    return alerts.filter(a => {
      if (filters.severity && a.severity !== filters.severity) return false;
      if (filters.status && a.status !== filters.status) return false;
      if (filters.attackType && a.attackType !== filters.attackType) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        return (
          a.title.toLowerCase().includes(s) ||
          a.sourceIp.includes(s) ||
          a.targetIp.includes(s) ||
          a.adversary.toLowerCase().includes(s)
        );
      }
      return true;
    });
  },
}));

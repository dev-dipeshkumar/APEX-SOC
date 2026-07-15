'use client';

import { useAlertStore } from '@/stores/alert-store';
import { useUIStore } from '@/stores/ui-store';
import { SEVERITY_COLORS } from '@/lib/constants';
import { formatTime, severityLabel } from '@/lib/formatters';
import { X, AlertTriangle } from 'lucide-react';

export function NotificationDrawer() {
  const { notifications, markNotificationRead, clearNotifications, toggleNotificationDrawer } = useAlertStore();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={toggleNotificationDrawer} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-80 border-l border-[#1e293b] bg-[#111827] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1e293b] px-4 py-3">
          <h2 className="text-sm font-semibold text-[#e2e8f0]">Notifications</h2>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="text-[10px] text-[#475569] hover:text-[#94a3b8] transition-colors"
              >
                Clear all
              </button>
            )}
            <button onClick={toggleNotificationDrawer} className="text-[#475569] hover:text-[#94a3b8] transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(100vh-48px)] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#475569]">
              <AlertTriangle className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs">No notifications</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`border-b border-[#1e293b] px-4 py-3 cursor-pointer hover:bg-[#1a2332] transition-colors ${
                  !n.read ? 'bg-[#0a0e17]' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <div
                    className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: SEVERITY_COLORS[n.severity] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#e2e8f0]">{n.title}</p>
                    <p className="text-[11px] text-[#94a3b8] mt-0.5 truncate">{n.message}</p>
                    <p className="text-[10px] text-[#475569] mt-1">{formatTime(n.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

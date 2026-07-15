'use client';

import { useAlertStore } from '@/stores/alert-store';
import { useUIStore } from '@/stores/ui-store';
import { SEVERITY_COLORS } from '@/lib/constants';
import { formatTime, severityLabel } from '@/lib/formatters';
import { X, AlertTriangle, Bell, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationDrawer() {
  const { notifications, markNotificationRead, clearNotifications } = useAlertStore();
  const { notificationDrawerOpen, toggleNotificationDrawer } = useUIStore();

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {notificationDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={toggleNotificationDrawer}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {notificationDrawerOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-80 border-l border-[rgba(0,240,255,0.08)] glass-heavy shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[rgba(0,240,255,0.08)] px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-[#e2e8f0]">Notifications</h2>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-bold text-cyan-400 border border-cyan-500/30">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      clearNotifications();
                    }}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-[#475569] hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear all
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleNotificationDrawer}
                  className="rounded-md p-1 text-[#475569] hover:text-[#e2e8f0] hover:bg-white/5 transition-all"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-[calc(100vh-56px)] overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {notifications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-[#475569]"
                  >
                    <AlertTriangle className="h-10 w-10 mb-3 opacity-20" />
                    <p className="text-xs">No notifications</p>
                    <p className="text-[10px] mt-1 text-[#475569]/50">Alerts will appear here</p>
                  </motion.div>
                ) : (
                  notifications.map(n => (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, x: 20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => markNotificationRead(n.id)}
                      className={`relative border-b border-[rgba(0,240,255,0.04)] px-4 py-3 cursor-pointer group transition-all duration-200 hover:bg-[rgba(0,240,255,0.02)] ${
                        !n.read ? 'bg-[rgba(0,240,255,0.01)]' : ''
                      }`}
                    >
                      {/* Unread indicator */}
                      {!n.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: SEVERITY_COLORS[n.severity] }} />
                      )}

                      <div className="flex items-start gap-3">
                        <div
                          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full shadow-lg"
                          style={{
                            backgroundColor: SEVERITY_COLORS[n.severity],
                            boxShadow: `0 0 8px ${SEVERITY_COLORS[n.severity]}40`,
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-xs font-medium ${!n.read ? 'text-[#e2e8f0]' : 'text-[#94a3b8]'}`}>
                              {n.title}
                            </p>
                            <motion.button
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.8 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationRead(n.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-[#475569] hover:text-[#e2e8f0] hover:bg-white/5 transition-all"
                            >
                              <X className="h-3 w-3" />
                            </motion.button>
                          </div>
                          <p className="text-[11px] text-[#94a3b8] mt-0.5 truncate">{n.message}</p>
                          <p className="text-[10px] text-[#475569] mt-1">{formatTime(n.timestamp)}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

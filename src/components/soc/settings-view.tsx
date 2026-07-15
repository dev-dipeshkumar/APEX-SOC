'use client';

import { useUIStore } from '@/stores/ui-store';
import { ROLE_PERMISSIONS, Permission, DEFAULT_USERS } from '@/lib/constants';
import { useState } from 'react';
import {
  Monitor, Database, Users, Shield, Save, TestTube, CheckCircle,
  Bell, Lock, Palette, Wifi, Globe, Sliders, Key,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SettingsView() {
  const { userRole, glowIntensity, animationSpeed, densityMode, dataMode, setGlowIntensity, setAnimationSpeed, setDensityMode, setDataMode } = useUIStore();
  const canEdit = userRole === 'admin';
  const [activeTab, setActiveTab] = useState('display');
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'testing' | 'success' | 'fail'>('idle');

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const handleTestConnection = () => {
    setTestResult('testing');
    setTimeout(() => setTestResult('success'), 1500);
    setTimeout(() => setTestResult('idle'), 3000);
  };

  const tabs = [
    { id: 'display', label: 'Display', icon: Palette, description: 'Visual preferences' },
    { id: 'datasources', label: 'Data Sources', icon: Database, description: 'API configuration' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alert preferences' },
    { id: 'security', label: 'Security', icon: Lock, description: 'Auth & access' },
    { id: 'users', label: 'Users', icon: Users, description: 'User management', adminOnly: true },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      {/* Page header */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-[#e8ecf4] tracking-tight">Settings</h2>
        <p className="text-xs text-[#546380] mt-0.5">Configure your SOC platform preferences and integrations</p>
      </div>

      <div className="flex gap-5">
        {/* Tab nav */}
        <div className="w-52 shrink-0">
          <nav className="space-y-1">
            {tabs.filter(t => !t.adminOnly || canEdit).map(tab => (
              <motion.button key={tab.id} whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                  activeTab === tab.id ? 'text-blue-400' : 'text-[#94a3b8] hover:bg-[rgba(59,130,246,0.02)]'
                }`}>
                {activeTab === tab.id && (
                  <motion.div layoutId="activeSettingsTab"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/8 to-transparent border border-blue-500/10"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }} />
                )}
                <tab.icon className="h-4 w-4 relative z-10" />
                <div className="relative z-10">
                  <span className="text-xs font-medium block">{tab.label}</span>
                  <span className="text-[9px] text-[#546380]">{tab.description}</span>
                </div>
              </motion.button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <motion.div layout className="flex-1 soc-card p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'display' && (
              <motion.div key="display" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94a3b8] mb-5">Display Preferences</h3>
                  <div className="space-y-5">
                    <SettingSlider label="Glow Intensity" value={glowIntensity} min={0} max={2} step={0.1} onChange={setGlowIntensity} disabled={!canEdit} />
                    <SettingSlider label="Animation Speed" value={animationSpeed} min={0.5} max={4} step={0.5} onChange={setAnimationSpeed} disabled={!canEdit} />
                    <div className="flex items-center justify-between">
                      <div><span className="text-xs text-[#94a3b8]">Density Mode</span><p className="text-[9px] text-[#546380] mt-0.5">Controls spacing and component density</p></div>
                      <div className="flex items-center gap-1 rounded-lg glass-light p-0.5">
                        {(['comfortable', 'compact'] as const).map(mode => (
                          <button key={mode} onClick={() => canEdit && setDensityMode(mode)}
                            className={`rounded-md px-3 py-1.5 text-[10px] capitalize transition-all font-medium ${
                              densityMode === mode ? 'bg-[rgba(59,130,246,0.08)] text-blue-400' : 'text-[#546380]'
                            } ${!canEdit ? 'cursor-not-allowed' : ''}`}>
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'datasources' && (
              <motion.div key="datasources" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94a3b8] mb-5">Data Source Configuration</h3>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div><span className="text-xs text-[#94a3b8]">Adapter Mode</span><p className="text-[9px] text-[#546380] mt-0.5">Switch between simulated and live data</p></div>
                      <div className="flex items-center gap-1 rounded-lg glass-light p-0.5">
                        {(['mock', 'real'] as const).map(mode => (
                          <button key={mode} onClick={() => canEdit && setDataMode(mode)}
                            className={`rounded-md px-3 py-1.5 text-[10px] capitalize transition-all font-medium ${
                              dataMode === mode ? 'bg-[rgba(59,130,246,0.08)] text-blue-400' : 'text-[#546380]'
                            } ${!canEdit ? 'cursor-not-allowed' : ''}`}>
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    {dataMode === 'real' && (
                      <>
                        <APIKeyField label="VirusTotal API Key" disabled={!canEdit} />
                        <APIKeyField label="Shodan API Key" disabled={!canEdit} />
                        <APIKeyField label="Splunk API Token" disabled={!canEdit} />
                        <APIKeyField label="Splunk Base URL" disabled={!canEdit} placeholder="https://splunk.example.com:8089" />
                        <div className="flex items-center gap-3 pt-2">
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleTestConnection} disabled={!canEdit || testResult === 'testing'}
                            className="flex items-center gap-1.5 rounded-lg glass-light px-3 py-1.5 text-xs text-blue-400 hover:bg-[rgba(59,130,246,0.04)] transition-all disabled:opacity-50">
                            <TestTube className="h-3 w-3" />
                            {testResult === 'testing' ? 'Testing...' : 'Test Connection'}
                          </motion.button>
                          {testResult === 'success' && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 text-xs text-emerald-400">
                              <CheckCircle className="h-3 w-3" /> Connection successful
                            </motion.span>
                          )}
                        </div>
                      </>
                    )}

                    {dataMode === 'mock' && (
                      <div className="rounded-lg glass-light p-4">
                        <p className="text-xs text-[#94a3b8]">
                          Currently using <span className="text-blue-400 font-medium">Mock Adapter</span> with simulated data.
                          All alerts, attacks, assets, and logs are generated locally.
                          Switch to Real mode and configure API keys to connect to live threat intelligence sources.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94a3b8]">Notification Preferences</h3>
                <RuleRow label="Critical Alert Threshold" value="3 in 5 minutes" canEdit={canEdit} />
                <RuleRow label="Auto-assign Critical Alerts" value="Enabled" canEdit={canEdit} />
                <RuleRow label="Auto-dismiss False Positive Rate" value="Low confidence only" canEdit={canEdit} />
                <RuleRow label="Notification for Critical" value="Toast + Sound" canEdit={canEdit} />
                <RuleRow label="Escalation Timer" value="30 minutes" canEdit={canEdit} />
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div key="security" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94a3b8]">Security Settings</h3>
                <RuleRow label="Session Timeout" value="30 minutes" canEdit={canEdit} />
                <RuleRow label="MFA Required" value="Enabled" canEdit={canEdit} />
                <RuleRow label="IP Whitelist" value="Disabled" canEdit={canEdit} />
                <RuleRow label="Audit Logging" value="Full" canEdit={canEdit} />
              </motion.div>
            )}

            {activeTab === 'users' && canEdit && (
              <motion.div key="users" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94a3b8]">User Management</h3>
                  <button className="flex items-center gap-1.5 rounded-lg glass-light px-2.5 py-1.5 text-[10px] text-blue-400 hover:bg-[rgba(59,130,246,0.04)] transition-all font-medium">
                    <Users className="h-3 w-3" /> Add User
                  </button>
                </div>
                <div className="overflow-hidden rounded-lg soc-card">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#1a2744]/60 bg-[#060b18]/40">
                        <th className="px-3 py-2.5 text-left text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">Username</th>
                        <th className="px-3 py-2.5 text-left text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">Name</th>
                        <th className="px-3 py-2.5 text-left text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">Role</th>
                        <th className="px-3 py-2.5 text-left text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DEFAULT_USERS.map(user => (
                        <tr key={user.username} className="border-b border-[#1a2744]/30">
                          <td className="px-3 py-2.5 text-[#e8ecf4] font-mono">{user.username}</td>
                          <td className="px-3 py-2.5 text-[#94a3b8]">{user.name}</td>
                          <td className="px-3 py-2.5">
                            <span className="status-chip severity-low">{user.role}</span>
                          </td>
                          <td className="px-3 py-2.5"><button className="text-[10px] text-[#546380] hover:text-[#94a3b8] transition-colors">Edit</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {canEdit && (
            <div className="mt-6 border-t border-[#1a2744] pt-4 flex items-center gap-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600/90 border border-blue-500/20 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500/90 transition-all">
                <Save className="h-3 w-3" />
                {saved ? 'Saved!' : 'Save Changes'}
              </motion.button>
              {saved && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle className="h-3 w-3" /> Settings saved
                </motion.span>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function SettingSlider({ label, value, min, max, step, onChange, disabled }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; disabled: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#94a3b8]">{label}</span>
        <span className="text-xs font-mono text-blue-400">{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => !disabled && onChange(parseFloat(e.target.value))} disabled={disabled}
        className="w-full accent-blue-400" />
    </div>
  );
}

function APIKeyField({ label, disabled, placeholder }: { label: string; disabled: boolean; placeholder?: string }) {
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="text-xs text-[#94a3b8] mb-1.5 block font-medium">{label}</label>
      <div className="flex gap-2">
        <input type={visible ? 'text' : 'password'} value={value} onChange={e => setValue(e.target.value)}
          placeholder={placeholder || 'Enter API key...'} disabled={disabled}
          className="flex-1 rounded-lg border border-[#1a2744] bg-[#060b18]/70 px-3 py-2 text-xs text-[#e8ecf4] placeholder-[#546380] focus:border-blue-500/20 focus:outline-none disabled:opacity-50 backdrop-blur-sm" />
        <button onClick={() => setVisible(!visible)}
          className="rounded-lg glass-light px-3 text-[10px] text-[#546380] hover:text-[#94a3b8] transition-colors">
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}

function RuleRow({ label, value, canEdit }: { label: string; value: string; canEdit: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg glass-light px-3.5 py-3">
      <span className="text-xs text-[#94a3b8]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#e8ecf4] font-mono">{value}</span>
        {canEdit && <button className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors">Edit</button>}
      </div>
    </div>
  );
}

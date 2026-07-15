'use client';

import { useUIStore } from '@/stores/ui-store';
import { useAlertStore } from '@/stores/alert-store';
import { ROLE_PERMISSIONS, Permission, DEFAULT_USERS } from '@/lib/constants';
import { useState } from 'react';
import { Monitor, Database, Users, Shield, Save, TestTube, CheckCircle } from 'lucide-react';

export function SettingsView() {
  const { userRole, glowIntensity, animationSpeed, densityMode, dataMode, setGlowIntensity, setAnimationSpeed, setDensityMode, setDataMode } = useUIStore();
  const canEdit = userRole === 'admin';
  const [activeTab, setActiveTab] = useState('display');
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'testing' | 'success' | 'fail'>('idle');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestConnection = () => {
    setTestResult('testing');
    setTimeout(() => setTestResult('success'), 1500);
    setTimeout(() => setTestResult('idle'), 3000);
  };

  const tabs = [
    { id: 'display', label: 'Display', icon: Monitor },
    { id: 'datasources', label: 'Data Sources', icon: Database },
    { id: 'users', label: 'Users', icon: Users, adminOnly: true },
    { id: 'alertrules', label: 'Alert Rules', icon: Shield },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-4 text-lg font-semibold text-[#e2e8f0]">Settings</h2>

      <div className="flex gap-4">
        {/* Tab nav */}
        <div className="w-48 shrink-0">
          <nav className="space-y-0.5">
            {tabs.filter(t => !t.adminOnly || canEdit).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-500/8 to-transparent border-l-2 border-cyan-400 text-cyan-400'
                    : 'text-[#94a3b8] hover:bg-[#1a2332]'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="flex-1 rounded-lg border border-[#1e293b] bg-[#1a2332] p-6">
          {activeTab === 'display' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] mb-4">Display Preferences</h3>
                
                <div className="space-y-4">
                  <SettingSlider
                    label="Glow Intensity"
                    value={glowIntensity}
                    min={0}
                    max={2}
                    step={0.1}
                    onChange={setGlowIntensity}
                    disabled={!canEdit}
                  />
                  <SettingSlider
                    label="Animation Speed"
                    value={animationSpeed}
                    min={0.5}
                    max={4}
                    step={0.5}
                    onChange={setAnimationSpeed}
                    disabled={!canEdit}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#94a3b8]">Density Mode</span>
                    <div className="flex items-center gap-1 rounded border border-[#1e293b] bg-[#0a0e17] p-0.5">
                      {(['comfortable', 'compact'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => canEdit && setDensityMode(mode)}
                          className={`rounded px-3 py-1 text-[10px] capitalize transition-colors ${
                            densityMode === mode ? 'bg-[#1a2332] text-cyan-400' : 'text-[#475569]'
                          } ${!canEdit ? 'cursor-not-allowed' : ''}`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'datasources' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] mb-4">Data Source Configuration</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#94a3b8]">Adapter Mode</span>
                    <div className="flex items-center gap-1 rounded border border-[#1e293b] bg-[#0a0e17] p-0.5">
                      {(['mock', 'real'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => canEdit && setDataMode(mode)}
                          className={`rounded px-3 py-1 text-[10px] capitalize transition-colors ${
                            dataMode === mode ? 'bg-[#1a2332] text-cyan-400' : 'text-[#475569]'
                          } ${!canEdit ? 'cursor-not-allowed' : ''}`}
                        >
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
                        <button
                          onClick={handleTestConnection}
                          disabled={!canEdit || testResult === 'testing'}
                          className="flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-1.5 text-xs text-cyan-400 hover:bg-cyan-500/10 transition-colors disabled:opacity-50"
                        >
                          <TestTube className="h-3 w-3" />
                          {testResult === 'testing' ? 'Testing...' : 'Test Connection'}
                        </button>
                        {testResult === 'success' && (
                          <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <CheckCircle className="h-3 w-3" /> Connection successful
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  {dataMode === 'mock' && (
                    <div className="rounded-lg border border-[#1e293b] bg-[#0a0e17] p-4">
                      <p className="text-xs text-[#94a3b8]">
                        Currently using <span className="text-cyan-400 font-medium">Mock Adapter</span> with simulated data.
                        All alerts, attacks, assets, and logs are generated locally.
                        Switch to Real mode and configure API keys to connect to live threat intelligence sources.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && canEdit && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">User Management</h3>
                <button className="flex items-center gap-1 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-2 py-1 text-[10px] text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                  <Users className="h-3 w-3" /> Add User
                </button>
              </div>

              <div className="overflow-hidden rounded-lg border border-[#1e293b]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#1e293b] bg-[#111827]">
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Username</th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Name</th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Role</th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEFAULT_USERS.map(user => (
                      <tr key={user.username} className="border-b border-[#1e293b]/50">
                        <td className="px-3 py-2 text-[#e2e8f0] font-mono">{user.username}</td>
                        <td className="px-3 py-2 text-[#94a3b8]">{user.name}</td>
                        <td className="px-3 py-2">
                          <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[9px] font-medium text-cyan-400 border border-cyan-500/20 capitalize">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button className="text-[10px] text-[#475569] hover:text-[#94a3b8] transition-colors">
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'alertrules' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Alert Rules</h3>
              <div className="space-y-3">
                <RuleRow label="Critical Alert Threshold" value="3 in 5 minutes" canEdit={canEdit} />
                <RuleRow label="Auto-assign Critical Alerts" value="Enabled" canEdit={canEdit} />
                <RuleRow label="Auto-dismiss False Positive Rate" value="Low confidence only" canEdit={canEdit} />
                <RuleRow label="Notification for Critical" value="Toast + Sound" canEdit={canEdit} />
                <RuleRow label="Escalation Timer" value="30 minutes" canEdit={canEdit} />
              </div>
            </div>
          )}

          {/* Save button */}
          {canEdit && (
            <div className="mt-6 border-t border-[#1e293b] pt-4 flex items-center gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors"
              >
                <Save className="h-3 w-3" />
                {saved ? 'Saved!' : 'Save Changes'}
              </button>
              {saved && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle className="h-3 w-3" /> Settings saved
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingSlider({ label, value, min, max, step, onChange, disabled }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-[#94a3b8]">{label}</span>
        <span className="text-xs font-mono text-cyan-400">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => !disabled && onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full accent-cyan-400"
      />
    </div>
  );
}

function APIKeyField({ label, disabled, placeholder }: { label: string; disabled: boolean; placeholder?: string }) {
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="text-xs text-[#94a3b8] mb-1 block">{label}</label>
      <div className="flex gap-2">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder || 'Enter API key...'}
          disabled={disabled}
          className="flex-1 rounded border border-[#1e293b] bg-[#0a0e17] px-3 py-1.5 text-xs text-[#e2e8f0] placeholder-[#475569] focus:border-cyan-500/30 focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={() => setVisible(!visible)}
          className="rounded border border-[#1e293b] bg-[#0a0e17] px-2 text-[10px] text-[#475569] hover:text-[#94a3b8] transition-colors"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}

function RuleRow({ label, value, canEdit }: { label: string; value: string; canEdit: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#1e293b] bg-[#0a0e17] px-3 py-2">
      <span className="text-xs text-[#94a3b8]">{label}</span>
      <span className="text-xs text-[#e2e8f0] font-mono">{value}</span>
    </div>
  );
}

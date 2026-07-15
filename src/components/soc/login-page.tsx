'use client';

import { useState } from 'react';
import { DEFAULT_USERS } from '@/lib/constants';

interface LoginPageProps {
  onLogin: (username: string, role: string, name: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const user = DEFAULT_USERS.find(u => u.username === username && u.password === password);
      if (user) {
        onLogin(user.username, user.role, user.name);
      } else {
        setError('Invalid credentials. Try: admin / apex-admin-2024');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0e17] p-4">
      {/* Background grid effect */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div className="relative w-full max-w-md">
        {/* Glow behind card */}
        <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-cyan-500/5 via-cyan-500/10 to-cyan-500/5 blur-xl" />

        <div className="relative rounded-xl border border-[#1e293b] bg-[#111827] p-8 shadow-2xl">
          {/* Logo / Brand */}
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wider text-[#e2e8f0]">APEX SOC</h1>
                <p className="text-[10px] tracking-[0.3em] text-cyan-400/60 uppercase">Threat Intelligence</p>
              </div>
            </div>
            <p className="text-sm text-[#475569]">Enterprise Security Operations Center</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#94a3b8] uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e17] px-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#475569] focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#94a3b8] uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e17] px-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#475569] focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-cyan-500/10 border border-cyan-500/20 py-2.5 text-sm font-medium text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 border-t border-[#1e293b] pt-4">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-[#475569]">Demo Accounts</p>
            <div className="space-y-1.5">
              {DEFAULT_USERS.map(u => (
                <button
                  key={u.username}
                  onClick={() => { setUsername(u.username); setPassword(u.password); }}
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs hover:bg-[#1a2332] transition-colors"
                >
                  <span className="text-[#94a3b8]">{u.username} / {u.password}</span>
                  <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400 border border-cyan-500/20">
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

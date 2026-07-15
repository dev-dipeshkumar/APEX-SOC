'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_USERS } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, EyeOff, Loader2, Fingerprint, Lock, Cpu } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string, role: string, name: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const user = DEFAULT_USERS.find(u => u.username === username && u.password === password);
      if (user) {
        onLogin(user.username, user.role, user.name);
      } else {
        setError('Invalid credentials. Please check your username and password.');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060b18] p-4 relative overflow-hidden">
      {/* Animated digital grid background */}
      <div className="pointer-events-none fixed inset-0 hex-grid opacity-40" />

      {/* Animated background particles (CSS-only) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              backgroundColor: i % 3 === 0 ? 'rgba(59,130,246,0.15)' : i % 3 === 1 ? 'rgba(6,182,212,0.12)' : 'rgba(139,92,246,0.1)',
              animationDuration: `${3 + Math.random() * 4}s`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Ambient radial glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-gradient-to-r from-blue-500/[0.03] via-transparent to-cyan-500/[0.02] blur-3xl" />
        <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] rounded-full bg-blue-500/[0.02] blur-3xl animate-float" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-[20%] right-[15%] w-[300px] h-[300px] rounded-full bg-purple-500/[0.015] blur-3xl animate-float" style={{ animationDuration: '8s', animationDelay: '2s' }} />
      </div>

      {/* Animated security lines */}
      <div className="pointer-events-none fixed inset-0">
        <svg className="w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="4 8">
            <animate attributeName="stroke-dashoffset" values="0;24" dur="3s" repeatCount="indefinite" />
          </line>
          <line x1="0" y1="70%" x2="100%" y2="70%" stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="4 8">
            <animate attributeName="stroke-dashoffset" values="24;0" dur="4s" repeatCount="indefinite" />
          </line>
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Glow behind card */}
        <div className="absolute -inset-8 rounded-3xl bg-gradient-to-r from-blue-500/[0.04] via-cyan-500/[0.06] to-purple-500/[0.03] blur-2xl" />

        <div className="relative rounded-2xl glass-heavy p-8 shadow-2xl animate-border-glow overflow-hidden">
          {/* Subtle top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

          {/* Logo / Brand */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8 text-center"
          >
            <div className="mb-5 inline-flex items-center gap-3">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-cyan-500/10 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                <Shield className="h-7 w-7 text-blue-400" />
                {/* Animated ring */}
                <div className="absolute inset-0 rounded-2xl border border-blue-400/20 animate-ping" style={{ animationDuration: '3s' }} />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold tracking-wider text-[#e8ecf4]" style={{ fontFamily: 'var(--font-geist-sans)' }}>APEX SOC</h1>
                <p className="text-[9px] tracking-[0.3em] text-blue-400/60 uppercase mt-0.5">Threat Intelligence Platform</p>
              </div>
            </div>
            <p className="text-sm text-[#546380]">Enterprise Security Operations Center</p>
          </motion.div>

          {/* Security badge */}
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10 px-3 py-2"
          >
            <Lock className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-medium tracking-wider">SECURE AUTHENTICATION</span>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 status-pulse" />
          </motion.div>

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label className="mb-2 block text-[10px] font-semibold text-[#94a3b8] uppercase tracking-[0.15em]">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onFocus={() => setFocused('username')}
                  onBlur={() => setFocused(null)}
                  className={`w-full rounded-xl border bg-[#060b18]/70 px-4 py-3 text-sm text-[#e8ecf4] placeholder-[#546380] focus:outline-none transition-all duration-300 backdrop-blur-sm ${
                    focused === 'username'
                      ? 'border-blue-500/30 ring-2 ring-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.06)]'
                      : 'border-[#1a2744]'
                  }`}
                  placeholder="Enter username"
                  autoComplete="username"
                />
                <Cpu className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${focused === 'username' ? 'text-blue-400' : 'text-[#546380]'}`} />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold text-[#94a3b8] uppercase tracking-[0.15em]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  className={`w-full rounded-xl border bg-[#060b18]/70 px-4 py-3 pr-10 text-sm text-[#e8ecf4] placeholder-[#546380] focus:outline-none transition-all duration-300 backdrop-blur-sm ${
                    focused === 'password'
                      ? 'border-blue-500/30 ring-2 ring-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.06)]'
                      : 'border-[#1a2744]'
                  }`}
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#546380] hover:text-[#94a3b8] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl border border-red-500/15 bg-red-500/[0.06] px-4 py-3 text-xs text-red-400"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.01, boxShadow: '0 0 25px rgba(59, 130, 246, 0.12)' }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600/90 to-blue-500/90 py-3 text-sm font-semibold text-white hover:from-blue-500 hover:to-blue-400 transition-all disabled:opacity-50 shadow-[0_4px_15px_rgba(59,130,246,0.2)]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Fingerprint className="h-4 w-4" />
                  Sign In
                </span>
              )}
            </motion.button>
          </motion.form>

          {/* Demo accounts */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 border-t border-[#1a2744] pt-4"
          >
            <p className="mb-2.5 text-[9px] uppercase tracking-[0.2em] text-[#546380] font-semibold">Demo Accounts</p>
            <div className="space-y-1">
              {DEFAULT_USERS.map(u => (
                <motion.button
                  key={u.username}
                  whileHover={{ x: 4, backgroundColor: 'rgba(59, 130, 246, 0.04)' }}
                  onClick={() => { setUsername(u.username); setPassword(u.password); }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-all group"
                >
                  <span className="text-[#94a3b8] font-mono">{u.name} <span className="text-[#546380]">({u.role})</span></span>
                  <span className="status-chip severity-low">
                    {u.username}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

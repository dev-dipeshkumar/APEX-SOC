'use client';

import { useState } from 'react';
import { DEFAULT_USERS } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, EyeOff, Loader2, Fingerprint } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string, role: string, name: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    }, 800);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050810] p-4 relative overflow-hidden">
      {/* Background grid effect */}
      <div className="pointer-events-none fixed inset-0 hex-grid opacity-50" />
      
      {/* Floating geometric shapes */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-[15%] left-[10%] w-32 h-32 border border-cyan-500/5 rounded-full animate-float" />
        <div className="absolute bottom-[20%] right-[15%] w-24 h-24 border border-purple-500/5 rotate-45 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[60%] left-[70%] w-16 h-16 border border-cyan-500/3 rounded-lg animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Radial glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-cyan-500/3 via-transparent to-purple-500/2 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        {/* Glow behind card */}
        <div className="absolute -inset-6 rounded-2xl bg-gradient-to-r from-cyan-500/5 via-cyan-500/8 to-purple-500/5 blur-2xl" />

        <div className="relative rounded-xl glass-heavy p-8 shadow-2xl animate-border-glow">
          {/* Logo / Brand */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 border border-cyan-500/20 neon-glow">
                <Shield className="h-6 w-6 text-cyan-400" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold tracking-wider text-[#e2e8f0]">APEX SOC</h1>
                <p className="text-[9px] tracking-[0.3em] text-cyan-400/60 uppercase">Threat Intelligence Platform</p>
              </div>
            </div>
            <p className="text-sm text-[#475569]">Enterprise Security Operations Center</p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#94a3b8] uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-[rgba(0,240,255,0.08)] bg-[#050810]/60 px-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#475569] focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 focus:shadow-[0_0_15px_rgba(0,240,255,0.05)] transition-all backdrop-blur-sm"
                  placeholder="Enter username"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#94a3b8] uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[rgba(0,240,255,0.08)] bg-[#050810]/60 px-4 py-2.5 pr-10 text-sm text-[#e2e8f0] placeholder-[#475569] focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 focus:shadow-[0_0_15px_rgba(0,240,255,0.05)] transition-all backdrop-blur-sm"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94a3b8] transition-colors"
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
                  className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs text-red-400"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.01, boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)' }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 py-2.5 text-sm font-medium text-cyan-400 hover:from-cyan-500/15 hover:to-cyan-500/10 hover:border-cyan-500/30 transition-all disabled:opacity-50 magnetic-btn"
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
            transition={{ delay: 0.5 }}
            className="mt-6 border-t border-[rgba(0,240,255,0.06)] pt-4"
          >
            <p className="mb-2 text-[10px] uppercase tracking-wider text-[#475569]">Demo Accounts</p>
            <div className="space-y-1.5">
              {DEFAULT_USERS.map(u => (
                <motion.button
                  key={u.username}
                  whileHover={{ x: 4 }}
                  onClick={() => { setUsername(u.username); setPassword(u.password); }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs hover:bg-[rgba(0,240,255,0.02)] transition-all group"
                >
                  <span className="text-[#94a3b8] font-mono">{u.username} <span className="text-[#475569]">/ {u.password}</span></span>
                  <span className="rounded-full glass-light px-2 py-0.5 text-[10px] font-medium text-cyan-400 capitalize">
                    {u.role}
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

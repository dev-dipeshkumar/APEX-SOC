'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Shield, Globe, Activity, Cpu, Lock, Zap, Eye, Radar,
  ChevronRight, Github, Linkedin, ExternalLink, Play,
  Terminal, BarChart3, Map, Server, AlertTriangle, ArrowRight,
  CheckCircle2, Users, Clock, TrendingUp, Star, MousePointer2
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

// ─── Animated counter hook ───
function useAnimatedCounter(end: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    let raf: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, start]);
  return count;
}

// ─── Section wrapper with scroll animation ───
function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ─── Feature card ───
function FeatureCard({ icon: Icon, title, desc, color }: { icon: any; title: string; desc: string; color: string }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.25 }}
      className="group relative rounded-2xl border border-[#1a2744] bg-[#0b1121]/80 p-6 backdrop-blur-sm hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.08)] transition-all duration-300"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/[0.02] to-cyan-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${color} border border-white/5`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mb-2 text-[15px] font-semibold text-[#e8ecf4]">{title}</h3>
        <p className="text-[13px] leading-relaxed text-[#7a8ba8]">{desc}</p>
      </div>
    </motion.div>
  );
}

// ─── Stat block ───
function StatBlock({ value, suffix, label, start }: { value: number; suffix: string; label: string; start: boolean }) {
  const count = useAnimatedCounter(value, 2200, start);
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-[#e8ecf4] tracking-tight">
        {count}<span className="text-blue-400">{suffix}</span>
      </div>
      <div className="mt-1 text-xs text-[#546380] uppercase tracking-wider">{label}</div>
    </div>
  );
}

// ─── Screenshot placeholder ───
function ScreenshotCard({ title, icon: Icon, color, desc }: { title: string; icon: any; color: string; desc: string }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="group relative overflow-hidden rounded-2xl border border-[#1a2744] bg-[#0b1121]/60 backdrop-blur-sm"
    >
      <div className={`h-48 bg-gradient-to-br ${color} flex items-center justify-center relative`}>
        <div className="absolute inset-0 opacity-20 hex-grid" />
        <Icon className="h-14 w-14 text-white/30 group-hover:text-white/50 transition-all duration-500 group-hover:scale-110" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-md bg-black/40 px-2 py-1 backdrop-blur-sm">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] text-emerald-300 font-mono">LIVE</span>
        </div>
      </div>
      <div className="p-5">
        <h4 className="text-sm font-semibold text-[#e8ecf4] mb-1">{title}</h4>
        <p className="text-xs text-[#546380] leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

// ─── LinkedIn Post Card ───
function LinkedInPostCard({ title, body, hashtags }: { title: string; body: string; hashtags: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(`${title}\n\n${body}\n\n${hashtags}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="relative rounded-2xl border border-[#1a2744] bg-[#0b1121]/80 p-6 backdrop-blur-sm hover:border-blue-500/20 transition-all duration-300"
    >
      <div className="absolute top-4 right-4">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg bg-[#111c30] px-3 py-1.5 text-[10px] font-medium text-[#94a3b8] hover:bg-[#1a2744] hover:text-blue-400 transition-all"
        >
          {copied ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <ChevronRight className="h-3 w-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-lg bg-[#0a66c2] flex items-center justify-center">
          <Linkedin className="h-4 w-4 text-white" />
        </div>
        <span className="text-[10px] font-semibold text-[#0a66c2] uppercase tracking-wider">LinkedIn Post</span>
      </div>
      <h4 className="text-[14px] font-bold text-[#e8ecf4] mb-2 leading-snug pr-16">{title}</h4>
      <p className="text-[12px] text-[#7a8ba8] leading-relaxed mb-3">{body}</p>
      <p className="text-[11px] text-blue-400/70 font-mono">{hashtags}</p>
    </motion.div>
  );
}

// ─── Timeline Step ───
function TimelineStep({ step, title, desc, icon: Icon }: { step: string; title: string; desc: string; icon: any }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 shrink-0">
          <Icon className="h-4 w-4 text-blue-400" />
        </div>
        <div className="w-px flex-1 bg-gradient-to-b from-blue-500/20 to-transparent mt-2" />
      </div>
      <div className="pb-8">
        <div className="text-[9px] uppercase tracking-[0.2em] text-blue-400/60 font-semibold mb-1">{step}</div>
        <h4 className="text-[14px] font-semibold text-[#e8ecf4] mb-1">{title}</h4>
        <p className="text-[12px] text-[#7a8ba8] leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export function LandingPage({ onEnterApp }: LandingPageProps) {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-100px' });

  useEffect(() => { setMounted(true); }, []);

  // Background particles (client-only)
  const bgParticles = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: 30 }, (_, i) => ({
      width: 1 + Math.random() * 3,
      height: 1 + Math.random() * 3,
      top: Math.random() * 100,
      left: Math.random() * 100,
      opacity: 0.05 + Math.random() * 0.1,
      duration: 4 + Math.random() * 8,
      delay: Math.random() * 5,
    }));
  }, [mounted]);

  const features = [
    { icon: Globe, title: '3D Intel Map', desc: 'Interactive globe with real-time attack arc visualization, threat selection, and cinematic camera powered by React Three Fiber with custom shaders.', color: 'bg-blue-500/10 text-blue-400' },
    { icon: Activity, title: 'Real-Time Alert Console', desc: 'Full alert pipeline with severity triage, bulk actions, MITRE ATT&CK mapping, IOC extraction, and live log stream with color-coded levels.', color: 'bg-red-500/10 text-red-400' },
    { icon: Server, title: 'Asset Inventory', desc: 'Three view modes — cards, table, and interactive SVG network topology with draggable nodes and real-time edge pulsing.', color: 'bg-emerald-500/10 text-emerald-400' },
    { icon: BarChart3, title: 'Analytics Dashboard', desc: 'KPI cards with animated count-ups, sparklines, severity donut charts, 24h alert trends, and real-time stat simulation.', color: 'bg-amber-500/10 text-amber-400' },
    { icon: Terminal, title: 'Command Palette', desc: 'Cmd+K power-user interface for instant navigation, intel map actions, and system commands — just like a real SOC tool.', color: 'bg-purple-500/10 text-purple-400' },
    { icon: Lock, title: 'Role-Based Access', desc: 'Admin, Analyst, and Viewer roles with granular permissions for triage, assignment, export, and settings management.', color: 'bg-cyan-500/10 text-cyan-400' },
  ];

  const screenshots = [
    { title: 'Dashboard Overview', icon: BarChart3, color: 'from-blue-600/20 to-blue-900/20', desc: 'Live KPIs, attack map, severity distribution, and alert trends at a glance.' },
    { title: '3D Intel Globe', icon: Globe, color: 'from-cyan-600/20 to-emerald-900/20', desc: 'Interactive 3D Earth with animated attack arcs and threat detail panels.' },
    { title: 'Alert Console', icon: AlertTriangle, color: 'from-red-600/20 to-orange-900/20', desc: 'Full alert table with triage actions, MITRE mapping, and IOC details.' },
    { title: 'Network Topology', icon: Server, color: 'from-emerald-600/20 to-teal-900/20', desc: 'Draggable SVG topology graph with real-time edge status and risk indicators.' },
  ];

  const techStack = [
    { name: 'Next.js 16', category: 'Framework' },
    { name: 'React 19', category: 'UI Library' },
    { name: 'TypeScript', category: 'Language' },
    { name: 'Three.js / R3F', category: '3D Engine' },
    { name: 'Zustand', category: 'State' },
    { name: 'Recharts', category: 'Charts' },
    { name: 'Framer Motion', category: 'Animation' },
    { name: 'shadcn/ui', category: 'Components' },
    { name: 'Tailwind CSS 4', category: 'Styling' },
    { name: 'Bun', category: 'Runtime' },
    { name: 'Prisma', category: 'ORM' },
    { name: 'Radix UI', category: 'Primitives' },
  ];

  const linkedInPosts = [
    {
      title: 'I built a fully interactive SOC dashboard — and it\'s open source.',
      body: 'After weeks of late nights, I\'m thrilled to share APEX SOC — an enterprise-grade Security Operations Center built entirely with Next.js 16, React 19, and Three.js. It features a 3D globe with real-time attack arcs, live alert triage, network topology visualization, and a command palette that would make any analyst smile. This isn\'t a mockup — it\'s a working platform with simulated real-time threat intelligence. Every pixel designed to feel like a real war room. Try the live demo and let me know what you think!',
      hashtags: '#CyberSecurity #SOC #NextJS #ReactJS #ThreeJS #OpenSource #ThreatIntelligence #InfoSec #WebDev #TypeScript',
    },
    {
      title: 'What if your SOC dashboard looked like this? 👀',
      body: 'Most security tools look like they were designed in 2005. I wanted to change that. APEX SOC is a next-gen threat intelligence platform with glassmorphism UI, animated crosshair cursor, 3D attack visualization on a rotating globe, and real-time alert streaming. Built with modern web tech: Next.js 16, React Three Fiber, Framer Motion, and Zustand. The goal? Make security monitoring feel like a mission control center — because it is one. Link to the live project in the comments!',
      hashtags: '#UXDesign #CyberSecurity #Frontend #Dashboard #UIUX #InfoSec #SecurityOperations #WebDevelopment #React',
    },
    {
      title: 'From side project to portfolio centerpiece: How I built APEX SOC',
      body: 'I started with a simple question: what would the ideal security operations center look like in 2025? The answer became APEX SOC — a feature-complete threat intelligence platform with 3D globe visualization, real-time alert pipelines, network topology mapping, and role-based access control. Here\'s what I learned: 1) Start with the data model, not the UI. 2) Real-time simulation > static mockups. 3) The details matter — custom cursors, scan lines, and hex grids create immersion. Full write-up coming soon. Meanwhile, the live demo speaks for itself.',
      hashtags: '#BuildInPublic #SideProject #Portfolio #CyberSecurity #SoftwareEngineering #NextJS #FullStack #DevJourney',
    },
  ];

  const reachTips = [
    { icon: Clock, title: 'Post at Peak Hours', desc: 'Tuesday–Thursday, 8–10 AM in your target timezone. LinkedIn\'s algorithm rewards early engagement within the first hour.' },
    { icon: Users, title: 'Engage Before You Post', desc: 'Comment on 5–10 posts from your network 30 minutes before publishing. This signals the algorithm and boosts initial reach.' },
    { icon: TrendingUp, title: 'Use the Hook Formula', desc: 'First line = pattern interrupt. Second line = curiosity gap. Third line = value promise. Never start with "I\'m excited to announce..."' },
    { icon: Star, title: 'Add Visual Proof', desc: 'Attach screen recordings, live demos, and before/after comparisons. Video posts get 5x more engagement than text-only on LinkedIn.' },
    { icon: MousePointer2, title: 'Encourage Saves Over Likes', desc: 'End with "Save this for later" — LinkedIn weights saves 3x more than likes for algorithmic distribution.' },
    { icon: Zap, title: 'Consistency Wins', desc: 'Post 3–5 times per week. One viral post is worth 100 forgettable ones. Build a content calendar around your project milestones.' },
  ];

  return (
    <div className="min-h-screen bg-[#060b18] text-[#e8ecf4] overflow-x-hidden">
      {/* ═══ NAVBAR ═══ */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a2744]/50 bg-[#060b18]/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20">
              <Shield className="h-4 w-4 text-blue-400" />
            </div>
            <span className="text-sm font-bold tracking-wider text-[#e8ecf4]">APEX SOC</span>
            <span className="hidden sm:inline text-[9px] tracking-[0.2em] text-blue-400/50 uppercase ml-1">v0.2.0</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/dev-dipeshkumar/APEX-SOC"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-[#1a2744] px-3 py-1.5 text-[11px] text-[#94a3b8] hover:border-[#546380] hover:text-[#e8ecf4] transition-all"
            >
              <Github className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Star on GitHub</span>
            </a>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onEnterApp}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-500 transition-colors shadow-[0_2px_10px_rgba(59,130,246,0.25)]"
            >
              <Play className="h-3 w-3" />
              Live Demo
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* ═══ HERO ═══ */}
      <section className="relative pt-28 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* BG Effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-blue-500/[0.03] blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.02] blur-[100px]" />
          <div className="absolute top-20 right-1/4 w-[300px] h-[300px] rounded-full bg-purple-500/[0.02] blur-[80px]" />
        </div>

        {/* Floating particles */}
        <div className="pointer-events-none absolute inset-0">
          {bgParticles.map((p, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-float"
              style={{
                width: `${p.width}px`,
                height: `${p.height}px`,
                top: `${p.top}%`,
                left: `${p.left}%`,
                backgroundColor: `rgba(59,130,246,${p.opacity})`,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Scan line */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-scan" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/[0.05] px-4 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-semibold tracking-[0.15em] text-blue-300 uppercase">Open Source • Live Demo Available</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            <span className="text-[#e8ecf4]">Enterprise Threat</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Intelligence Platform
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mx-auto max-w-2xl text-base md:text-lg text-[#7a8ba8] leading-relaxed mb-10"
          >
            APEX SOC is a fully interactive Security Operations Center with 3D globe attack visualization,
            real-time alert triage, network topology mapping, and analytics — built with Next.js 16, React 19 & Three.js.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(59, 130, 246, 0.2)' }}
              whileTap={{ scale: 0.97 }}
              onClick={onEnterApp}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(59,130,246,0.25)] hover:from-blue-500 hover:to-blue-400 transition-all"
            >
              <Play className="h-4 w-4" />
              Explore Live Demo
            </motion.button>
            <a
              href="https://github.com/dev-dipeshkumar/APEX-SOC"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-[#1a2744] bg-[#0b1121]/80 px-8 py-3.5 text-sm font-semibold text-[#94a3b8] hover:border-blue-500/30 hover:text-[#e8ecf4] backdrop-blur-sm transition-all"
            >
              <Github className="h-4 w-4" />
              View Source
            </a>
          </motion.div>

          {/* Tech pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-2"
          >
            {['Next.js 16', 'React 19', 'Three.js', 'TypeScript', 'Zustand', 'Tailwind CSS'].map(t => (
              <span key={t} className="rounded-md border border-[#1a2744] bg-[#0b1121]/60 px-2.5 py-1 text-[10px] font-medium text-[#546380]">
                {t}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <AnimatedSection className="border-y border-[#1a2744] bg-[#0a0f1e]/60 backdrop-blur-sm">
        <div ref={statsRef} className="mx-auto grid max-w-5xl grid-cols-2 md:grid-cols-4 gap-6 py-10 px-4 md:px-6">
          <StatBlock value={6} suffix="+" label="Core Modules" start={statsInView} />
          <StatBlock value={50} suffix="+" label="UI Components" start={statsInView} />
          <StatBlock value={3} suffix="D" label="Globe Visualization" start={statsInView} />
          <StatBlock value={10} suffix="+" label="Attack Types" start={statsInView} />
        </div>
      </AnimatedSection>

      {/* ═══ FEATURES ═══ */}
      <AnimatedSection className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="text-center mb-14">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/[0.05] px-3 py-1">
              <Radar className="h-3 w-3 text-blue-400" />
              <span className="text-[9px] font-semibold tracking-[0.2em] text-blue-300 uppercase">Capabilities</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#e8ecf4] mb-4">Built for Real Security Operations</h2>
            <p className="mx-auto max-w-xl text-[14px] text-[#7a8ba8]">
              Every feature is designed to replicate the workflow of an enterprise SOC — from alert ingestion to threat hunting on a 3D globe.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <AnimatedSection key={f.title} delay={i * 0.08}>
                <FeatureCard {...f} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ═══ SCREENSHOTS / VISUALS ═══ */}
      <AnimatedSection className="py-20 md:py-28 border-t border-[#1a2744]/50">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="text-center mb-14">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/[0.05] px-3 py-1">
              <Eye className="h-3 w-3 text-cyan-400" />
              <span className="text-[9px] font-semibold tracking-[0.2em] text-cyan-300 uppercase">Visual Walkthrough</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#e8ecf4] mb-4">See It In Action</h2>
            <p className="mx-auto max-w-xl text-[14px] text-[#7a8ba8]">
              Attach your screenshots and video recordings here to showcase the live project. These placeholders are ready for your media.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {screenshots.map((s, i) => (
              <AnimatedSection key={s.title} delay={i * 0.1}>
                <ScreenshotCard {...s} />
              </AnimatedSection>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center"
          >
            <p className="text-[11px] text-[#546380]">
              💡 Replace these placeholders with your actual screenshots & video recordings for LinkedIn posts
            </p>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ═══ TECH STACK ═══ */}
      <AnimatedSection className="py-20 md:py-28 border-t border-[#1a2744]/50">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div className="text-center mb-14">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/[0.05] px-3 py-1">
              <Cpu className="h-3 w-3 text-purple-400" />
              <span className="text-[9px] font-semibold tracking-[0.2em] text-purple-300 uppercase">Tech Stack</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#e8ecf4] mb-4">Modern Architecture</h2>
            <p className="mx-auto max-w-xl text-[14px] text-[#7a8ba8]">
              Built with the latest web technologies for performance, developer experience, and visual impact.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {techStack.map((t, i) => (
              <motion.div
                key={t.name}
                whileHover={{ y: -2, scale: 1.03 }}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-[#1a2744] bg-[#0b1121]/60 p-4 hover:border-blue-500/20 transition-all"
              >
                <span className="text-[13px] font-semibold text-[#e8ecf4]">{t.name}</span>
                <span className="text-[9px] text-[#546380] uppercase tracking-wider">{t.category}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ═══ HOW IT WORKS ═══ */}
      <AnimatedSection className="py-20 md:py-28 border-t border-[#1a2744]/50">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <div className="text-center mb-14">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.05] px-3 py-1">
              <Zap className="h-3 w-3 text-emerald-400" />
              <span className="text-[9px] font-semibold tracking-[0.2em] text-emerald-300 uppercase">Getting Started</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#e8ecf4] mb-4">How to Explore</h2>
          </div>
          <div>
            <TimelineStep step="Step 01" title="Click Live Demo" desc="Hit the Live Demo button above or in the navbar. You'll land on the secure login screen." icon={Play} />
            <TimelineStep step="Step 02" title="Sign In" desc="Use any demo account — Admin (full access), Analyst (triage & export), or Viewer (read-only)." icon={Lock} />
            <TimelineStep step="Step 03" title="Explore the Dashboard" desc="Watch real-time KPIs update, check alert trends, and see the mini attack map in action." icon={BarChart3} />
            <TimelineStep step="Step 04" title="Open the Intel Map" desc="Navigate to the 3D Globe view for the showcase feature — interactive attack arc visualization with threat details." icon={Globe} />
            <TimelineStep step="Step 05" title="Try Cmd+K" desc="Open the command palette for power-user navigation. Press keys 1-5 to switch views instantly." icon={Terminal} />
          </div>
        </div>
      </AnimatedSection>

      {/* ═══ LINKEDIN POST TEMPLATES ═══ */}
      <AnimatedSection className="py-20 md:py-28 border-t border-[#1a2744]/50">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="text-center mb-14">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#0a66c2]/30 bg-[#0a66c2]/[0.06] px-3 py-1">
              <Linkedin className="h-3 w-3 text-[#0a66c2]" />
              <span className="text-[9px] font-semibold tracking-[0.2em] text-[#0a66c2] uppercase">LinkedIn Strategy</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#e8ecf4] mb-4">Ready-to-Post Content</h2>
            <p className="mx-auto max-w-xl text-[14px] text-[#7a8ba8]">
              Copy these posts, attach your screenshots & videos, and publish. Each post is crafted for maximum engagement.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {linkedInPosts.map((post, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <LinkedInPostCard {...post} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ═══ REACH STRATEGY ═══ */}
      <AnimatedSection className="py-20 md:py-28 border-t border-[#1a2744]/50">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div className="text-center mb-14">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.05] px-3 py-1">
              <TrendingUp className="h-3 w-3 text-amber-400" />
              <span className="text-[9px] font-semibold tracking-[0.2em] text-amber-300 uppercase">Growth Playbook</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#e8ecf4] mb-4">How to Maximize Your Reach</h2>
            <p className="mx-auto max-w-xl text-[14px] text-[#7a8ba8]">
              These proven strategies will help your project posts break out of your immediate network and reach thousands.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reachTips.map((tip, i) => (
              <AnimatedSection key={tip.title} delay={i * 0.08}>
                <div className="flex gap-4 rounded-xl border border-[#1a2744] bg-[#0b1121]/60 p-5 hover:border-amber-500/15 transition-all">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/15 shrink-0">
                    <tip.icon className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-[#e8ecf4] mb-1">{tip.title}</h4>
                    <p className="text-[12px] text-[#7a8ba8] leading-relaxed">{tip.desc}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ═══ FINAL CTA ═══ */}
      <AnimatedSection className="py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 md:px-6 text-center">
          <div className="relative rounded-3xl border border-[#1a2744] bg-[#0b1121]/80 p-10 md:p-16 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] via-transparent to-cyan-500/[0.03]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="relative">
              <Shield className="mx-auto mb-6 h-12 w-12 text-blue-400/60" />
              <h2 className="text-3xl md:text-4xl font-bold text-[#e8ecf4] mb-4">Ready to See It Live?</h2>
              <p className="text-[14px] text-[#7a8ba8] mb-8 max-w-md mx-auto">
                Stop reading about it. Experience the full interactive SOC dashboard with real-time threat simulation.
              </p>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(59, 130, 246, 0.25)' }}
                whileTap={{ scale: 0.97 }}
                onClick={onEnterApp}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-10 py-4 text-sm font-bold text-white shadow-[0_4px_25px_rgba(59,130,246,0.3)] hover:from-blue-500 hover:to-blue-400 transition-all"
              >
                Launch Live Demo
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-[#1a2744] bg-[#060b18]">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20">
                <Shield className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <span className="text-xs font-bold tracking-wider text-[#e8ecf4]">APEX SOC</span>
              <span className="text-[9px] text-[#546380]">v0.2.0</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://github.com/dev-dipeshkumar/APEX-SOC" target="_blank" rel="noopener noreferrer" className="text-[#546380] hover:text-blue-400 transition-colors">
                <Github className="h-4 w-4" />
              </a>
              <a href="#" className="text-[#546380] hover:text-[#0a66c2] transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
            <p className="text-[10px] text-[#546380]">MIT License • Built with Next.js & Three.js</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

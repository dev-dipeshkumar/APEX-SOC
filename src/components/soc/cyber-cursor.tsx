'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface ClickRipple {
  x: number;
  y: number;
  id: number;
}

export function CyberCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: -100, y: -100 });
  const reticlePos = useRef({ x: -100, y: -100 });
  const isVisible = useRef(false);
  const isHovering = useRef(false);
  const velocity = useRef({ x: 0, y: 0 });
  const prevPos = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number>(0);
  const rotationAngle = useRef(0);

  const [ripples, setRipples] = useState<ClickRipple[]>([]);
  const [cursorState, setCursorState] = useState<'default' | 'hover' | 'click' | 'text'>('default');
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);

  // Particle system
  const particles = useRef<Array<{
    x: number; y: number;
    vx: number; vy: number;
    life: number; maxLife: number;
    size: number; hue: number;
  }>>([]);

  const spawnParticles = useCallback((x: number, y: number, count: number, speed: number = 2) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const s = Math.random() * speed + 0.5;
      particles.current.push({
        x, y,
        vx: Math.cos(angle) * s,
        vy: Math.sin(angle) * s,
        life: 1,
        maxLife: 0.3 + Math.random() * 0.5,
        size: 1 + Math.random() * 1.5,
        hue: [190, 210, 260][Math.floor(Math.random() * 3)],
      });
    }
  }, []);

  // Main animation loop — canvas for trail + particles
  useEffect(() => {
    const canvas = trailCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let lastTime = performance.now();
    let trail: Array<{ x: number; y: number; age: number }> = [];

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smooth reticle follow
      const lerpFactor = isHovering.current ? 0.12 : 0.08;
      reticlePos.current.x += (mousePos.current.x - reticlePos.current.x) * lerpFactor;
      reticlePos.current.y += (mousePos.current.y - reticlePos.current.y) * lerpFactor;

      // Velocity
      velocity.current = {
        x: mousePos.current.x - prevPos.current.x,
        y: mousePos.current.y - prevPos.current.y,
      };
      const speed = Math.sqrt(velocity.current.x ** 2 + velocity.current.y ** 2);

      // Rotation based on speed
      rotationAngle.current += (0.3 + speed * 0.02) * dt;

      // Trail
      if (speed > 3 && isVisible.current) {
        trail.push({ x: mousePos.current.x, y: mousePos.current.y, age: 0 });
        if (speed > 10) {
          spawnParticles(mousePos.current.x, mousePos.current.y, Math.min(Math.floor(speed / 12), 2));
        }
      }

      // Limit trail length
      if (trail.length > 30) trail = trail.slice(-30);

      // Draw trail — dotted line style
      for (let i = 0; i < trail.length; i++) {
        trail[i].age += dt;
      }
      trail = trail.filter(p => p.age < 0.4);

      if (trail.length > 1) {
        for (let i = 1; i < trail.length; i++) {
          const p = trail[i];
          const prev = trail[i - 1];
          const progress = 1 - (p.age / 0.4);
          const alpha = progress * 0.5;

          // Dashed trail line
          ctx.beginPath();
          ctx.setLineDash([2, 6]);
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
          ctx.lineWidth = progress * 1.5;
          ctx.stroke();
          ctx.setLineDash([]);

          // Glow
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.2})`;
          ctx.lineWidth = progress * 5;
          ctx.stroke();
        }
      }

      // Draw particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= dt / p.maxLife;

        if (p.life <= 0) {
          particles.current.splice(i, 1);
          continue;
        }

        const alpha = p.life * 0.7;
        // Diamond-shaped particles for hacker feel
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.PI / 4);
        const s = p.size * p.life;
        ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${alpha})`;
        ctx.fillRect(-s, -s, s * 2, s * 2);
        ctx.restore();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${alpha * 0.12})`;
        ctx.fill();
      }

      prevPos.current = { ...mousePos.current };
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [spawnParticles]);

  // Mouse event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible.current) {
        isVisible.current = true;
        setCursorVisible(true);
      }
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
      setCoords({ x: e.clientX, y: e.clientY });
    };

    const handleMouseEnter = () => {
      isVisible.current = true;
      setCursorVisible(true);
      if (cursorRef.current) cursorRef.current.style.opacity = '1';
      if (reticleRef.current) reticleRef.current.style.opacity = '1';
    };

    const handleMouseLeave = () => {
      isVisible.current = false;
      setCursorVisible(false);
      if (cursorRef.current) cursorRef.current.style.opacity = '0';
      if (reticleRef.current) reticleRef.current.style.opacity = '0';
    };

    const handleMouseDown = (e: MouseEvent) => {
      setCursorState('click');
      spawnParticles(e.clientX, e.clientY, 16, 4);
      const id = Date.now() + Math.random();
      setRipples(prev => [...prev, { x: e.clientX, y: e.clientY, id }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 900);
    };

    const handleMouseUp = () => {
      setCursorState(isHovering.current ? 'hover' : 'default');
    };

    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest(
        'button, a, input, textarea, select, [role="button"], [role="tab"], [data-cursor="hover"], [onclick], .cursor-hover'
      );
      const textEl = target.closest('p, span, h1, h2, h3, h4, h5, h6, li, td, th, label, [data-cursor="text"]');
      if (interactive) {
        isHovering.current = true;
        setCursorState('hover');
      } else if (textEl && !interactive) {
        setCursorState('text');
      } else {
        isHovering.current = false;
        setCursorState('default');
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseover', handleOver, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseover', handleOver);
    };
  }, [spawnParticles]);

  // Update reticle position + rotation
  useEffect(() => {
    let frame: number;
    const updateReticle = () => {
      if (reticleRef.current) {
        reticleRef.current.style.transform = `translate(${reticlePos.current.x}px, ${reticlePos.current.y}px)`;
      }
      // Also update the inner SVG rotation directly via DOM
      const svg = reticleRef.current?.querySelector('svg');
      if (svg) {
        const deg = rotationAngle.current * (180 / Math.PI);
        svg.style.transform = `translate(-50%, -50%) rotate(${deg}deg)`;
      }
      frame = requestAnimationFrame(updateReticle);
    };
    frame = requestAnimationFrame(updateReticle);
    return () => cancelAnimationFrame(frame);
  }, []);

  // State-based sizing
  const crosshairGap = cursorState === 'hover' ? 10 : cursorState === 'click' ? 3 : 6;
  const crosshairLen = cursorState === 'hover' ? 8 : cursorState === 'click' ? 6 : 10;
  const reticleSize = cursorState === 'hover' ? 44 : cursorState === 'click' ? 28 : 36;
  const reticleOpacity = cursorState === 'text' ? 0 : cursorState === 'hover' ? 0.8 : 0.5;
  const accentColor = cursorState === 'click' ? '#06b6d4' : cursorState === 'hover' ? '#3b82f6' : '#3b82f6';
  const accentRgb = cursorState === 'click' ? '6,182,212' : '59,130,246';

  return (
    <>
      {/* Trail & Particle Canvas */}
      <canvas
        ref={trailCanvasRef}
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none', zIndex: 999998,
        }}
      />

      {/* ═══ CROSSHAIR CENTER ═══ */}
      <div
        ref={cursorRef}
        style={{
          position: 'fixed', top: 0, left: 0,
          zIndex: 999999, pointerEvents: 'none',
          opacity: cursorVisible ? 1 : 0,
          transition: 'opacity 0.2s',
          willChange: 'transform',
        }}
      >
        <svg
          width="40" height="40"
          viewBox="0 0 40 40"
          style={{
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.15s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* Center dot */}
          {cursorState !== 'text' && (
            <circle
              cx="20" cy="20" r="1.5"
              fill={accentColor}
              style={{
                transition: 'fill 0.15s',
                filter: `drop-shadow(0 0 4px ${accentColor})`,
              }}
            />
          )}

          {/* Text cursor I-beam */}
          {cursorState === 'text' && (
            <rect
              x="18" y="6" width="4" height="28" rx="1"
              fill="none" stroke={accentColor} strokeWidth="1.5"
              style={{ filter: `drop-shadow(0 0 3px ${accentColor})` }}
            />
          )}

          {/* Crosshair lines — top */}
          {cursorState !== 'text' && (
            <>
              <line
                x1="20" y1={20 - crosshairGap} x2="20" y2={20 - crosshairGap - crosshairLen}
                stroke={accentColor} strokeWidth="1.5" strokeLinecap="round"
                style={{ transition: 'all 0.15s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 2px rgba(${accentRgb},0.6))` }}
              />
              {/* Bottom */}
              <line
                x1="20" y1={20 + crosshairGap} x2="20" y2={20 + crosshairGap + crosshairLen}
                stroke={accentColor} strokeWidth="1.5" strokeLinecap="round"
                style={{ transition: 'all 0.15s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 2px rgba(${accentRgb},0.6))` }}
              />
              {/* Left */}
              <line
                x1={20 - crosshairGap} y1="20" x2={20 - crosshairGap - crosshairLen} y2="20"
                stroke={accentColor} strokeWidth="1.5" strokeLinecap="round"
                style={{ transition: 'all 0.15s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 2px rgba(${accentRgb},0.6))` }}
              />
              {/* Right */}
              <line
                x1={20 + crosshairGap} y1="20" x2={20 + crosshairGap + crosshairLen} y2="20"
                stroke={accentColor} strokeWidth="1.5" strokeLinecap="round"
                style={{ transition: 'all 0.15s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 2px rgba(${accentRgb},0.6))` }}
              />
            </>
          )}

          {/* Corner brackets on hover */}
          {cursorState === 'hover' && (
            <>
              {/* Top-left bracket */}
              <path d="M6 14 L6 6 L14 6" fill="none" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
              {/* Top-right bracket */}
              <path d="M26 6 L34 6 L34 14" fill="none" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
              {/* Bottom-left bracket */}
              <path d="M6 26 L6 34 L14 34" fill="none" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
              {/* Bottom-right bracket */}
              <path d="M26 34 L34 34 L34 26" fill="none" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
            </>
          )}

          {/* Click — inward arrows */}
          {cursorState === 'click' && (
            <>
              <path d="M20 4 L20 8" stroke="#06b6d4" strokeWidth="1" opacity="0.6" />
              <path d="M20 36 L20 32" stroke="#06b6d4" strokeWidth="1" opacity="0.6" />
              <path d="M4 20 L8 20" stroke="#06b6d4" strokeWidth="1" opacity="0.6" />
              <path d="M36 20 L32 20" stroke="#06b6d4" strokeWidth="1" opacity="0.6" />
            </>
          )}
        </svg>
      </div>

      {/* ═══ ROTATING RETICLE RING ═══ */}
      <div
        ref={reticleRef}
        style={{
          position: 'fixed', top: 0, left: 0,
          zIndex: 999997, pointerEvents: 'none',
          opacity: reticleOpacity,
          transition: 'opacity 0.25s',
          willChange: 'transform',
        }}
      >
        <svg
          width={reticleSize * 2} height={reticleSize * 2}
          viewBox={`0 0 ${reticleSize * 2} ${reticleSize * 2}`}
          style={{
            transform: `translate(-50%, -50%) rotate(0deg)`,
            transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1), height 0.3s cubic-bezier(0.16,1,0.3,1)',
            animation: cursorState !== 'text' ? 'reticleRotate 8s linear infinite' : 'none',
          }}
        >
          {/* Outer dashed ring */}
          <circle
            cx={reticleSize} cy={reticleSize} r={reticleSize - 4}
            fill="none"
            stroke={`rgba(${accentRgb}, 0.2)`}
            strokeWidth="1"
            strokeDasharray="3 8"
          />

          {/* Tick marks — 8 ticks around the ring */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            const cx = reticleSize;
            const cy = reticleSize;
            const r1 = reticleSize - 8;
            const r2 = reticleSize - (i % 2 === 0 ? 14 : 11);
            return (
              <line
                key={i}
                x1={cx + Math.cos(angle) * r1}
                y1={cy + Math.sin(angle) * r1}
                x2={cx + Math.cos(angle) * r2}
                y2={cy + Math.sin(angle) * r2}
                stroke={`rgba(${accentRgb}, ${i % 2 === 0 ? 0.5 : 0.25})`}
                strokeWidth={i % 2 === 0 ? 1.5 : 1}
                strokeLinecap="round"
              />
            );
          })}

          {/* Inner solid ring on hover */}
          {cursorState === 'hover' && (
            <circle
              cx={reticleSize} cy={reticleSize} r={reticleSize - 16}
              fill={`rgba(${accentRgb}, 0.03)`}
              stroke={`rgba(${accentRgb}, 0.15)`}
              strokeWidth="0.5"
            />
          )}

          {/* Click flash ring */}
          {cursorState === 'click' && (
            <circle
              cx={reticleSize} cy={reticleSize} r={reticleSize - 6}
              fill="none"
              stroke="rgba(6,182,212,0.4)"
              strokeWidth="2"
              style={{ animation: 'clickFlash 0.3s ease-out forwards' }}
            />
          )}
        </svg>
      </div>

      {/* ═══ COORDINATE READOUT ═══ */}
      {cursorState !== 'text' && cursorVisible && (
        <div
          style={{
            position: 'fixed',
            left: coords.x + 24,
            top: coords.y + 24,
            zIndex: 999996,
            pointerEvents: 'none',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '9px',
            color: `rgba(${accentRgb}, 0.4)`,
            letterSpacing: '0.05em',
            transition: 'color 0.15s, opacity 0.2s',
            userSelect: 'none',
          }}
        >
          {coords.x.toString().padStart(4, '0')},{coords.y.toString().padStart(4, '0')}
        </div>
      )}

      {/* ═══ CLICK RIPPLES ═══ */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          style={{
            position: 'fixed',
            left: ripple.x, top: ripple.y,
            zIndex: 999995, pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Outer hexagonal ripple */}
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ position: 'absolute', top: -40, left: -40 }}>
            <polygon
              points="40,2 74,21 74,59 40,78 6,59 6,21"
              fill="none"
              stroke="rgba(6,182,212,0.4)"
              strokeWidth="1"
              style={{ animation: 'hexRipple 0.8s cubic-bezier(0,0.55,0.45,1) forwards' }}
            />
          </svg>
          {/* Inner ring ripple */}
          <div
            style={{
              width: 50, height: 50, borderRadius: '50%',
              border: '1px solid rgba(59,130,246,0.3)',
              animation: 'cursorRipple 0.6s cubic-bezier(0,0.55,0.45,1) forwards',
              position: 'absolute', top: -25, left: -25,
            }}
          />
        </div>
      ))}
    </>
  );
}

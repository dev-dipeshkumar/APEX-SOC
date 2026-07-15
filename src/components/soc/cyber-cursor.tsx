'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface TrailPoint {
  x: number;
  y: number;
  id: number;
  age: number;
}

interface ClickRipple {
  x: number;
  y: number;
  id: number;
  scale: number;
  opacity: number;
}

export function CyberCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const isVisible = useRef(false);
  const isHovering = useRef(false);
  const isClicking = useRef(false);
  const velocity = useRef({ x: 0, y: 0 });
  const prevPos = useRef({ x: 0, y: 0 });
  const lastMoveTime = useRef(0);
  const animFrameRef = useRef<number>(0);

  const [ripples, setRipples] = useState<ClickRipple[]>([]);
  const [cursorState, setCursorState] = useState<'default' | 'hover' | 'click' | 'text'>('default');
  const [scrollDelta, setScrollDelta] = useState(0);
  const trailPoints = useRef<TrailPoint[]>([]);
  const trailIdCounter = useRef(0);

  // Particle system on canvas
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
        maxLife: 0.4 + Math.random() * 0.6,
        size: 1 + Math.random() * 2,
        hue: Math.random() > 0.5 ? 210 : 190, // blue or cyan
      });
    }
  }, []);

  // Animation loop
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

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smooth ring follow
      const lerpFactor = isHovering.current ? 0.15 : 0.12;
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * lerpFactor;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * lerpFactor;

      // Velocity calculation
      velocity.current = {
        x: mousePos.current.x - prevPos.current.x,
        y: mousePos.current.y - prevPos.current.y,
      };
      const speed = Math.sqrt(velocity.current.x ** 2 + velocity.current.y ** 2);

      // Update trail points
      if (speed > 2 && isVisible.current) {
        trailPoints.current.push({
          x: mousePos.current.x,
          y: mousePos.current.y,
          id: trailIdCounter.current++,
          age: 0,
        });
        // Spawn particles based on speed
        if (speed > 8) {
          spawnParticles(mousePos.current.x, mousePos.current.y, Math.min(Math.floor(speed / 10), 3));
        }
      }

      // Draw trail
      const maxTrailLen = 25;
      if (trailPoints.current.length > maxTrailLen) {
        trailPoints.current = trailPoints.current.slice(-maxTrailLen);
      }

      if (trailPoints.current.length > 1) {
        for (let i = 0; i < trailPoints.current.length; i++) {
          trailPoints.current[i].age += dt;
        }
        // Remove old points
        trailPoints.current = trailPoints.current.filter(p => p.age < 0.5);

        for (let i = 1; i < trailPoints.current.length; i++) {
          const p = trailPoints.current[i];
          const prev = trailPoints.current[i - 1];
          const progress = 1 - (p.age / 0.5);
          const alpha = progress * 0.6;
          const width = progress * 3;

          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
          ctx.lineWidth = width;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Cyan glow layer
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.4})`;
          ctx.lineWidth = width * 2.5;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      // Draw and update particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life -= dt / p.maxLife;

        if (p.life <= 0) {
          particles.current.splice(i, 1);
          continue;
        }

        const alpha = p.life * 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${alpha})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${alpha * 0.15})`;
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

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible.current) isVisible.current = true;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };

    const handleMouseEnter = () => {
      isVisible.current = true;
      if (cursorRef.current) cursorRef.current.style.opacity = '1';
      if (ringRef.current) ringRef.current.style.opacity = '1';
    };

    const handleMouseLeave = () => {
      isVisible.current = false;
      if (cursorRef.current) cursorRef.current.style.opacity = '0';
      if (ringRef.current) ringRef.current.style.opacity = '0';
    };

    const handleMouseDown = (e: MouseEvent) => {
      isClicking.current = true;
      setCursorState('click');
      // Spawn click particles
      spawnParticles(e.clientX, e.clientY, 12, 3);
      // Add ripple
      const id = Date.now();
      setRipples(prev => [...prev, { x: e.clientX, y: e.clientY, id, scale: 0, opacity: 1 }]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 800);
    };

    const handleMouseUp = () => {
      isClicking.current = false;
      setCursorState(isHovering.current ? 'hover' : 'default');
    };

    // Hover detection
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

    // Scroll detection
    const handleScroll = () => {
      setScrollDelta(d => Math.min(d + 1, 5));
      setTimeout(() => setScrollDelta(d => Math.max(d - 1, 0)), 150);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseover', handleOver, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseover', handleOver);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [spawnParticles]);

  // Update ring position via animation frame
  useEffect(() => {
    let frame: number;
    const updateRing = () => {
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringPos.current.x}px, ${ringPos.current.y}px)`;
      }
      frame = requestAnimationFrame(updateRing);
    };
    frame = requestAnimationFrame(updateRing);
    return () => cancelAnimationFrame(frame);
  }, []);

  const cursorSize = cursorState === 'hover' ? 6 : cursorState === 'click' ? 4 : cursorState === 'text' ? 20 : 5;
  const ringSize = cursorState === 'hover' ? 48 : cursorState === 'click' ? 36 : cursorState === 'text' ? 24 : 32;
  const ringOpacity = cursorState === 'hover' ? 0.6 : cursorState === 'click' ? 0.3 : cursorState === 'text' ? 0 : 0.35;

  return (
    <>
      {/* Trail & Particle Canvas */}
      <canvas
        ref={trailCanvasRef}
        className="cyber-cursor-canvas"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 999998,
        }}
      />

      {/* Main cursor dot */}
      <div
        ref={cursorRef}
        className="cyber-cursor-dot"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 999999,
          pointerEvents: 'none',
          opacity: isVisible.current ? 1 : 0,
          transition: 'opacity 0.2s, width 0.15s, height 0.15s',
          willChange: 'transform',
        }}
      >
        {/* Center dot */}
        <div
          style={{
            width: cursorSize,
            height: cursorSize,
            borderRadius: cursorState === 'text' ? 1 : '50%',
            background: cursorState === 'click'
              ? 'rgba(6, 182, 212, 0.9)'
              : cursorState === 'hover'
              ? 'rgba(59, 130, 246, 0.9)'
              : 'rgba(255, 255, 255, 0.95)',
            boxShadow: cursorState === 'click'
              ? '0 0 12px rgba(6, 182, 212, 0.8), 0 0 4px rgba(6, 182, 212, 1)'
              : cursorState === 'hover'
              ? '0 0 12px rgba(59, 130, 246, 0.8), 0 0 4px rgba(59, 130, 246, 1)'
              : '0 0 8px rgba(59, 130, 246, 0.5), 0 0 2px rgba(255, 255, 255, 0.8)',
            transition: 'width 0.15s, height 0.15s, border-radius 0.15s, background 0.15s, box-shadow 0.15s',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>

      {/* Outer ring */}
      <div
        ref={ringRef}
        className="cyber-cursor-ring"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 999997,
          pointerEvents: 'none',
          opacity: ringOpacity,
          transition: 'opacity 0.2s, width 0.25s cubic-bezier(0.16,1,0.3,1), height 0.25s cubic-bezier(0.16,1,0.3,1), border-color 0.2s',
          willChange: 'transform',
        }}
      >
        <div
          style={{
            width: ringSize,
            height: ringSize,
            borderRadius: '50%',
            border: cursorState === 'hover'
              ? '1.5px solid rgba(59, 130, 246, 0.6)'
              : cursorState === 'click'
              ? '1px solid rgba(6, 182, 212, 0.4)'
              : '1px solid rgba(59, 130, 246, 0.25)',
            background: cursorState === 'hover'
              ? 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)'
              : 'transparent',
            boxShadow: cursorState === 'hover'
              ? '0 0 15px rgba(59, 130, 246, 0.15), inset 0 0 15px rgba(59, 130, 246, 0.05)'
              : '0 0 8px rgba(59, 130, 246, 0.08)',
            transition: 'width 0.25s cubic-bezier(0.16,1,0.3,1), height 0.25s cubic-bezier(0.16,1,0.3,1), border 0.2s, background 0.2s, box-shadow 0.2s',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>

      {/* Click ripples */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="cyber-cursor-ripple"
          style={{
            position: 'fixed',
            left: ripple.x,
            top: ripple.y,
            zIndex: 999996,
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              border: '1px solid rgba(6, 182, 212, 0.5)',
              animation: 'cursorRipple 0.7s cubic-bezier(0, 0.55, 0.45, 1) forwards',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              animation: 'cursorRipple 0.5s cubic-bezier(0, 0.55, 0.45, 1) forwards',
            }}
          />
        </div>
      ))}

      {/* Scanning line effect on scroll */}
      {scrollDelta > 0 && (
        <div
          style={{
            position: 'fixed',
            top: mousePos.current.y - 20,
            left: mousePos.current.x - 40,
            width: 80,
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.6), transparent)',
            zIndex: 999995,
            pointerEvents: 'none',
            animation: 'scanLine 0.3s ease-out forwards',
            borderRadius: 1,
          }}
        />
      )}
    </>
  );
}

'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
}

interface GridLine {
  progress: number;
  y: number;
  speed: number;
  opacity: number;
}

interface LightRay {
  angle: number;
  speed: number;
  opacity: number;
  width: number;
  offset: number;
}

interface DustMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  phase: number;
}

export function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const gridLinesRef = useRef<GridLine[]>([]);
  const lightRaysRef = useRef<LightRay[]>([]);
  const dustRef = useRef<DustMote[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);
  const noiseCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const initNoiseTexture = useCallback(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.createImageData(256, 256);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const v = Math.random() * 255;
      imageData.data[i] = v;
      imageData.data[i + 1] = v;
      imageData.data[i + 2] = v;
      imageData.data[i + 3] = 8;
    }
    ctx.putImageData(imageData, 0, 0);
    noiseCanvasRef.current = c;
  }, []);

  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];
    const count = Math.min(50, Math.floor((width * height) / 30000));
    const colors = ['rgba(59,130,246,', 'rgba(6,182,212,', 'rgba(139,92,246,'];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 1.2 + 0.3,
        opacity: Math.random() * 0.25 + 0.05,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: 1000 + Math.random() * 2000,
      });
    }
    particlesRef.current = particles;
  }, []);

  const initDust = useCallback((width: number, height: number) => {
    const dust: DustMote[] = [];
    const count = Math.min(30, Math.floor((width * height) / 50000));
    for (let i = 0; i < count; i++) {
      dust.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.1,
        vy: -Math.random() * 0.05 - 0.01,
        size: Math.random() * 1 + 0.3,
        opacity: Math.random() * 0.15 + 0.02,
        phase: Math.random() * Math.PI * 2,
      });
    }
    dustRef.current = dust;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    initNoiseTexture();

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);
      initParticles(window.innerWidth, window.innerHeight);
      initDust(window.innerWidth, window.innerHeight);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Initialize grid scanning lines
    for (let i = 0; i < 4; i++) {
      gridLinesRef.current.push({
        progress: Math.random(),
        y: Math.random(),
        speed: 0.00015 + Math.random() * 0.0002,
        opacity: 0.015 + Math.random() * 0.02,
      });
    }

    // Initialize light rays
    for (let i = 0; i < 3; i++) {
      lightRaysRef.current.push({
        angle: Math.random() * Math.PI * 2,
        speed: 0.0002 + Math.random() * 0.0003,
        opacity: 0.01 + Math.random() * 0.015,
        width: 80 + Math.random() * 120,
        offset: Math.random() * 500,
      });
    }

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      timeRef.current++;

      ctx.clearRect(0, 0, w, h);

      // ─── Base gradient background ───
      const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, w * 0.8);
      bgGrad.addColorStop(0, '#0a1128');
      bgGrad.addColorStop(0.5, '#070e1e');
      bgGrad.addColorStop(1, '#050a16');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // ─── Animated gradient blobs ───
      const t = timeRef.current * 0.001;

      const blob1X = w * 0.25 + Math.sin(t * 0.3) * w * 0.05;
      const blob1Y = h * 0.3 + Math.cos(t * 0.2) * h * 0.05;
      const g1 = ctx.createRadialGradient(blob1X, blob1Y, 0, blob1X, blob1Y, w * 0.35);
      g1.addColorStop(0, 'rgba(59, 130, 246, 0.025)');
      g1.addColorStop(0.5, 'rgba(59, 130, 246, 0.008)');
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const blob2X = w * 0.75 + Math.cos(t * 0.25) * w * 0.04;
      const blob2Y = h * 0.7 + Math.sin(t * 0.35) * h * 0.04;
      const g2 = ctx.createRadialGradient(blob2X, blob2Y, 0, blob2X, blob2Y, w * 0.3);
      g2.addColorStop(0, 'rgba(6, 182, 212, 0.02)');
      g2.addColorStop(0.5, 'rgba(6, 182, 212, 0.005)');
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      const blob3X = w * 0.6 + Math.sin(t * 0.15) * w * 0.03;
      const blob3Y = h * 0.2 + Math.cos(t * 0.4) * h * 0.03;
      const g3 = ctx.createRadialGradient(blob3X, blob3Y, 0, blob3X, blob3Y, w * 0.25);
      g3.addColorStop(0, 'rgba(139, 92, 246, 0.015)');
      g3.addColorStop(0.5, 'rgba(139, 92, 246, 0.004)');
      g3.addColorStop(1, 'transparent');
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, w, h);

      // ─── Subtle digital grid ───
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.012)';
      ctx.lineWidth = 0.5;
      const gridSize = 80;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // ─── Grid intersection dots ───
      ctx.fillStyle = 'rgba(59, 130, 246, 0.03)';
      for (let x = 0; x < w; x += gridSize) {
        for (let y = 0; y < h; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ─── Moving light rays ───
      lightRaysRef.current.forEach(ray => {
        ray.angle += ray.speed;
        const centerX = w * 0.5 + Math.sin(ray.angle) * w * 0.3;
        const centerY = h * 0.3 + Math.cos(ray.angle * 0.7) * h * 0.2;
        const endX = centerX + Math.cos(ray.angle) * w * 0.5;
        const endY = centerY + Math.sin(ray.angle) * h * 0.5;

        const rayGrad = ctx.createLinearGradient(centerX, centerY, endX, endY);
        rayGrad.addColorStop(0, `rgba(59, 130, 246, ${ray.opacity})`);
        rayGrad.addColorStop(1, 'transparent');

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.strokeStyle = rayGrad;
        ctx.lineWidth = ray.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.restore();
      });

      // ─── Scanning horizontal lines ───
      gridLinesRef.current.forEach(line => {
        line.progress += line.speed;
        if (line.progress > 1.2) {
          line.progress = -0.2;
          line.y = Math.random();
        }
        const y = line.y * h;
        const gradient = ctx.createLinearGradient(0, y, w, y);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.3, `rgba(59, 130, 246, ${line.opacity})`);
        gradient.addColorStop(0.7, `rgba(6, 182, 212, ${line.opacity * 0.6})`);
        gradient.addColorStop(1, 'transparent');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const scanX = line.progress * w;
        ctx.moveTo(scanX - 250, y);
        ctx.lineTo(scanX + 250, y);
        ctx.stroke();
      });

      // ─── Network particles ───
      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        // Subtle mouse interaction
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          const force = (180 - dist) / 180 * 0.008;
          p.vx += dx * force;
          p.vy += dy * force;
        }

        p.vx *= 0.995;
        p.vy *= 0.995;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.opacity})`;
        ctx.fill();
      });

      // Draw connections between close particles
      ctx.lineWidth = 0.3;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.06;
            ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // ─── Floating dust motes ───
      dustRef.current.forEach(d => {
        d.x += d.vx + Math.sin(timeRef.current * 0.01 + d.phase) * 0.05;
        d.y += d.vy;
        d.phase += 0.001;

        if (d.x < 0) d.x = w;
        if (d.x > w) d.x = 0;
        if (d.y < 0) { d.y = h; d.x = Math.random() * w; }

        const flicker = 0.5 + 0.5 * Math.sin(timeRef.current * 0.02 + d.phase);
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 210, 230, ${d.opacity * flicker})`;
        ctx.fill();
      });

      // ─── Noise texture overlay ───
      if (noiseCanvasRef.current) {
        ctx.save();
        ctx.globalAlpha = 0.03;
        const pattern = ctx.createPattern(noiseCanvasRef.current, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, w, h);
        }
        ctx.restore();
      }

      // ─── Soft vignette ───
      const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.75);
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(1, 'rgba(3, 5, 12, 0.4)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [initParticles, initDust, initNoiseTexture]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: 0.9 }}
    />
  );
}

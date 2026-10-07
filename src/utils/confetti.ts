/**
 * High-performance Neon Particle Burst engine for Pulse75
 * Pure canvas, zero external dependencies, theme-tinted particles.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  vRot: number;
  shape: 'circle' | 'diamond' | 'rect';
}

export function fireAchievementParticles(originX?: number, originY?: number) {
  if (typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const colors = [
    '#00f0ff', // neon cyan
    '#ff007a', // neon magenta/pink
    '#9d00ff', // neon purple
    '#7000ff', // deep electric violet
    '#00ffb2', // cyber mint
    '#ffffff'  // pure light
  ];

  const centerX = originX ?? width / 2;
  const centerY = originY ?? height * 0.45;

  const particleCount = 80;
  const particles: Particle[] = [];

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 9;
    particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2.5,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: 0.015 + Math.random() * 0.02,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 15,
      shape: Math.random() > 0.5 ? 'diamond' : Math.random() > 0.5 ? 'circle' : 'rect'
    });
  }

  let animId: number;

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    let aliveCount = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.alpha <= 0) continue;
      aliveCount++;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // gravity
      p.vx *= 0.98; // air resistance
      p.rotation += p.vRot;
      p.alpha -= p.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      }

      ctx.restore();
    }

    if (aliveCount > 0) {
      animId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animId);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }

  animId = requestAnimationFrame(render);
}

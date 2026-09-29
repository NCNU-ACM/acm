import { useEffect, useRef } from 'react';
import styles from './CodeRain.module.css';

interface Drop {
  x: number;
  topY: number;
  chars: string[];
  maxLength: number;
  state: 'growing' | 'shrinking';
}

export default function CodeRain() {
  const canvas = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvas.current) return;
    const c = canvas.current;
    const ctx = c.getContext('2d')!;

    let animationId = 0;
    let intervalIds: ReturnType<typeof setInterval>[] = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      c.width = c.offsetWidth * dpr;
      c.height = c.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const fontSize = 18;
    const chars = '01';
    const dropCount = 40;

    const randomChar = () => chars[Math.floor(Math.random() * chars.length)];

    const resetDrop = (drop: Drop) => {
      drop.x = Math.random() * c.offsetWidth;
      drop.topY = Math.random() * c.offsetHeight * 0.25;
      drop.maxLength = 8 + Math.floor(Math.random() * 30);
      drop.chars = [];
      drop.state = 'growing';
    };

    const createDrop = (): Drop => {
      const d: Drop = { x: 0, topY: 0, chars: [], maxLength: 0, state: 'growing' };
      resetDrop(d);
      return d;
    };

    const drops: Drop[] = Array.from({ length: dropCount }, createDrop);

    const startDropGrowth = () => {
      intervalIds.forEach((id) => clearInterval(id));
      intervalIds = [];

      drops.forEach((drop) => {
        const speed = 80 + Math.random() * 150;
        const id = setInterval(() => {
          if (drop.state === 'growing') {
            drop.chars.push(randomChar());
            const bottomY = drop.topY + drop.chars.length * fontSize;
            const triggerY = c.offsetHeight * 0.75;

            if (drop.chars.length >= drop.maxLength || bottomY >= triggerY) {
              setTimeout(() => {
                drop.state = 'shrinking';
              }, 300 + Math.random() * 800);
            }
          } else {
            drop.chars.shift();
            drop.topY += fontSize;
            if (drop.chars.length === 0) {
              resetDrop(drop);
            }
          }
        }, speed);
        intervalIds.push(id);
      });
    };
    startDropGrowth();

    const draw = () => {
      ctx.clearRect(0, 0, c.offsetWidth, c.offsetHeight);
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = 'center';

      drops.forEach((drop) => {
        drop.chars.forEach((char, j) => {
          const y = drop.topY + j * fontSize;
          if (y < 0 || y > c.offsetHeight) return;

          const alpha = (j + 1) / drop.chars.length;
          ctx.fillStyle = `rgba(52, 211, 153, ${alpha * 0.9})`;
          ctx.fillText(char, drop.x, y);
        });
      });

      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      intervalIds.forEach((id) => clearInterval(id));
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvas} className={styles['code-rain-canvas']}></canvas>;
}

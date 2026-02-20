import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/** 光标跟随光晕：类似风筝飘动感的轻微延迟，仅在首页展示 */
export const CursorGlow: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  const [smoothed, setSmoothed] = useState({ x: -9999, y: -9999 });
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const posRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isHome) return;

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const smooth = () => {
      const target = mouseRef.current;
      const pos = posRef.current;

      pos.x += (target.x - pos.x) * 0.12;
      pos.y += (target.y - pos.y) * 0.12;

      setSmoothed({ x: pos.x, y: pos.y });
      rafRef.current = requestAnimationFrame(smooth);
    };

    posRef.current = mouseRef.current;
    rafRef.current = requestAnimationFrame(smooth);

    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isHome]);

  if (!isHome) return null;

  return (
    <>
      {/* 主光晕：柔和径向渐变，跟随光标（带延迟） */}
      <div
        className="fixed pointer-events-none z-[9998] mix-blend-soft-light"
        style={{
          left: smoothed.x,
          top: smoothed.y,
          width: 180,
          height: 180,
          marginLeft: -90,
          marginTop: -90,
          background: 'radial-gradient(circle, rgba(90,90,64,0.08) 0%, rgba(90,90,64,0.02) 40%, transparent 70%)',
        }}
        aria-hidden
      />
      {/* 烟花粒子：辐射状多彩火花 */}
      {Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const dist = 12 + (i % 3) * 6;
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        const colors = [
          'rgba(255,180,100,0.6)',
          'rgba(255,120,150,0.6)',
          'rgba(255,220,100,0.6)',
          'rgba(180,220,255,0.5)',
          'rgba(255,255,255,0.7)',
        ];
        const color = colors[i % colors.length];
        const size = 3 + (i % 2);
        return (
          <div
            key={i}
            className="fixed pointer-events-none z-[9998] rounded-full cursor-firework-spark"
            style={{
              left: smoothed.x + x,
              top: smoothed.y + y,
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              backgroundColor: color,
              boxShadow: `0 0 6px ${color}`,
              animationDelay: `${(i * 0.08) % 1.5}s`,
            }}
            aria-hidden
          />
        );
      })}
    </>
  );
};

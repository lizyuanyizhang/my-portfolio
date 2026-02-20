/**
 * 彩蛋角色：贪吃蛇式移动 + 用户方向键控制
 * 按 P 唤出后，用 ↑↓←→ 控制方向，角色沿当前方向持续移动，留下尾巴轨迹
 */
import React, { useEffect, useRef, useState } from 'react';
import { useEasterEgg } from '../context/EasterEggContext';

const SIZE = 48;
const TAIL_SEGMENT = 12;
const FIREWORK_OFFSET = 18;
const SPARK_COUNT = 12;
const SPARK_LENGTH = 26;
const SPARK_SPREAD = Math.PI * 0.7;
const SPEED = 4;
const MARGIN_TOP = 80;
const MARGIN = 24;

type Dir = 'up' | 'down' | 'left' | 'right';

const DX: Record<Dir, number> = { up: 0, down: 0, left: -1, right: 1 };
const DY: Record<Dir, number> = { up: -1, down: 1, left: 0, right: 0 };

/** 方向对应的「后方」角度（弧度），火花从此方向散射 */
const BACK_ANGLE: Record<Dir, number> = {
  right: Math.PI,
  left: 0,
  down: -Math.PI / 2,
  up: Math.PI / 2,
};

export const EasterEggCharacter: React.FC = () => {
  const { characterVisible, characterPos, setCharacterPos, showKeywordToast } = useEasterEgg();
  const dirRef = useRef<Dir>('right');
  const trailRef = useRef<{ x: number; y: number; dir: Dir }[]>([]);
  const [trail, setTrail] = useState<{ x: number; y: number; dir: Dir }[]>([]);
  const posRef = useRef({ x: characterPos.x, y: characterPos.y });

  useEffect(() => {
    posRef.current = { x: characterPos.x, y: characterPos.y };
  }, [characterPos]);

  // 方向键控制（贪吃蛇式）
  useEffect(() => {
    if (!characterVisible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key;
      const next: Dir | null =
        key === 'ArrowUp' ? 'up' :
        key === 'ArrowDown' ? 'down' :
        key === 'ArrowLeft' ? 'left' :
        key === 'ArrowRight' ? 'right' : null;
      if (next) {
        e.preventDefault();
        dirRef.current = next;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [characterVisible]);

  // 移动循环：按当前方向持续移动，边界穿屏，更新尾巴
  useEffect(() => {
    if (!characterVisible) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const left = MARGIN;
    const right = w - MARGIN - SIZE;
    const top = MARGIN_TOP;
    const bottom = h - MARGIN - SIZE;

    const loop = () => {
      const dir = dirRef.current;
      const pos = posRef.current;
      let { x, y } = pos;

      x += DX[dir] * SPEED;
      y += DY[dir] * SPEED;

      // 穿屏（贪吃蛇经典边界处理）
      if (x < left) x = right;
      if (x > right) x = left;
      if (y < top) y = bottom;
      if (y > bottom) y = top;

      posRef.current = { x, y };
      setCharacterPos({ x, y });

      // 烟花轨迹：在角色后方记录位置（横向向后放）
      const backDx = -DX[dir] * FIREWORK_OFFSET;
      const backDy = -DY[dir] * FIREWORK_OFFSET;
      const arr = [...trailRef.current, {
        x: pos.x + SIZE / 2 + backDx,
        y: pos.y + SIZE / 2 + backDy,
        dir,
      }];
      if (arr.length > TAIL_SEGMENT) arr.shift();
      trailRef.current = arr;
      setTrail([...arr]);
    };

    const id = setInterval(loop, 16);
    return () => clearInterval(id);
  }, [characterVisible, setCharacterPos]);

  // 初次出现时初始化位置和轨迹
  useEffect(() => {
    if (!characterVisible) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const left = MARGIN;
    const top = MARGIN_TOP + 50;
    posRef.current = { x: left, y: top };
    setCharacterPos(posRef.current);
    trailRef.current = [];
    setTrail([]);
  }, [characterVisible, setCharacterPos]);

  if (!characterVisible) return null;

  return (
    <>
      {/* 烟花轨迹：横向向后，粉色火花散射 */}
      {trail.map((p, i) => (
        <FireworkBurst
          key={i}
          x={p.x}
          y={p.y}
          dir={p.dir}
          opacity={0.3 + (i / Math.max(1, trail.length)) * 0.55}
        />
      ))}
      {/* 角色本体：可点击互动 */}
      <div
        className="fixed z-[9999] select-none cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-150"
        style={{
          left: characterPos.x,
          top: characterPos.y,
          width: SIZE,
          height: SIZE,
        }}
        aria-hidden
        title="按 ↑↓←→ 控制方向，点击喂它～"
        onClick={() => showKeywordToast?.('喂了一口！✨')}
      >
        <img
          src="/images/easter-egg-character.png"
          alt=""
          className="w-full h-full object-cover rounded-full border-2 border-white/50 shadow-lg pointer-events-none"
        />
      </div>
      {/* 操作提示（首次出现后 3 秒渐隐） */}
      <EasterEggHint />
    </>
  );
};

/** 烟花爆点：从中心向后方散射的粉色火花 */
function FireworkBurst({
  x,
  y,
  dir,
  opacity,
}: {
  x: number;
  y: number;
  dir: Dir;
  opacity: number;
}) {
  const baseAngle = BACK_ANGLE[dir];
  const sparks = Array.from({ length: SPARK_COUNT }, (_, i) => {
    const t = i / (SPARK_COUNT - 1);
    const angle = baseAngle - SPARK_SPREAD / 2 + t * SPARK_SPREAD + (i % 2 ? 0.08 : -0.08);
    const length = SPARK_LENGTH * (0.6 + 0.4 * Math.sin(i * 0.7));
    return { angle, length };
  });

  return (
    <div
      className="fixed z-[9998] pointer-events-none easter-firework"
      style={{
        left: x,
        top: y,
        width: 0,
        height: 0,
        transform: 'translate(-50%, -50%)',
      }}
      aria-hidden
    >
      {/* 烟花中心亮点 */}
      <div
        className="absolute rounded-full"
        style={{
          left: -4,
          top: -4,
          width: 8,
          height: 8,
          background: 'radial-gradient(circle, rgba(249,168,212,0.9) 0%, rgba(236,72,153,0.5) 60%, transparent 100%)',
          boxShadow: '0 0 8px 4px rgba(249,168,212,0.5)',
        }}
      />
      {sparks.map((s, i) => (
        <div
          key={i}
          className="absolute easter-spark"
          style={{
            width: 2.5,
            height: s.length,
            left: -1.25,
            top: -s.length,
            transformOrigin: 'center 100%',
            transform: `rotate(${s.angle}rad)`,
            background: `linear-gradient(to top, rgba(236,72,153,0.8) 0%, rgba(249,168,212,0.6) 30%, rgba(244,114,182,0.3) 70%, transparent 100%)`,
            boxShadow: `0 0 6px 2px rgba(249,168,212,0.4)`,
            opacity,
          }}
        />
      ))}
    </div>
  );
}

/** 方向键提示，出现后渐隐 */
function EasterEggHint() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <div
      className="fixed left-1/2 bottom-24 -translate-x-1/2 z-[9997] px-4 py-2 rounded-full bg-ink/80 text-paper text-xs font-mono animate-pulse"
      style={{ animationDuration: '1.5s' }}
    >
      ↑↓←→ 控制方向
    </div>
  );
}

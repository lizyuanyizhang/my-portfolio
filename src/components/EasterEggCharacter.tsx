/**
 * 彩蛋角色：贪吃蛇式移动 + 用户方向键控制
 * 按 P 唤出后，用 ↑↓←→ 控制方向，角色沿当前方向持续移动
 */
import React, { useEffect, useRef, useState } from 'react';
import { useEasterEgg } from '../context/EasterEggContext';
import { assetUrl } from '../lib/assetUrl';

const SIZE = 48;
const SPEED = 4;
const MARGIN_TOP = 80;
const MARGIN = 24;

type Dir = 'up' | 'down' | 'left' | 'right';

const DX: Record<Dir, number> = { up: 0, down: 0, left: -1, right: 1 };
const DY: Record<Dir, number> = { up: -1, down: 1, left: 0, right: 0 };

export const EasterEggCharacter: React.FC = () => {
  const { characterVisible, characterPos, setCharacterPos, showKeywordToast } = useEasterEgg();
  const dirRef = useRef<Dir>('right');
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

  // 移动循环：按当前方向持续移动，边界穿屏
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
    };

    const id = setInterval(loop, 16);
    return () => clearInterval(id);
  }, [characterVisible, setCharacterPos]);

  // 初次出现时初始化位置
  useEffect(() => {
    if (!characterVisible) return;
    const left = MARGIN;
    const top = MARGIN_TOP + 50;
    posRef.current = { x: left, y: top };
    setCharacterPos(posRef.current);
  }, [characterVisible, setCharacterPos]);

  if (!characterVisible) return null;

  return (
    <>
      {/* 角色本体：圆照片，可点击互动 */}
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
          src={assetUrl('/images/easter-egg-character.png')}
          alt=""
          className="w-full h-full object-cover rounded-full border-2 border-white/50 shadow-lg pointer-events-none"
        />
      </div>
      {/* 操作提示（首次出现后 3 秒渐隐） */}
      <EasterEggHint />
    </>
  );
};

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

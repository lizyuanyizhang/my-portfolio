import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface EasterEggContextValue {
  /** 按 p 呼出的可控角色是否显示 */
  characterVisible: boolean;
  setCharacterVisible: (v: boolean) => void;
  /** 角色位置 { x, y } 单位 px */
  characterPos: { x: number; y: number };
  setCharacterPos: (p: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  /** 关键词触发的提示文案，null 表示不显示 */
  keywordToast: string | null;
  showKeywordToast: (msg: string) => void;
  /** Logo 连点计数：传入 event 与触发回调，达到次数时调用 onTrigger(event) 以便 preventDefault */
  incrementLogoClicks: (event: React.MouseEvent, onTrigger: (e: React.MouseEvent) => void) => void;
  /** 「张苑逸」文字连点计数 */
  incrementNameClicks: (event: React.MouseEvent, onTrigger: (e: React.MouseEvent) => void) => void;
}

const EasterEggContext = createContext<EasterEggContextValue | null>(null);

/** 键盘输入检测的关键词（数字序列） */
const KEYWORDS: { pattern: string; message: string }[] = [
  { pattern: '1997', message: '诞生于 1997 年 3 月 ✨' },
];

const CLICKS_TO_TRIGGER = 7;
const CLICK_WINDOW_MS = 2000;
const STORAGE_KEY_LOGO = '__logoClickTimes';
const STORAGE_KEY_NAME = '__nameClickTimes';

export const EasterEggProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [characterVisible, setCharacterVisible] = useState(false);
  const [characterPos, setCharacterPos] = useState({ x: 200, y: 200 });
  const [keywordToast, setKeywordToast] = useState<string | null>(null);
  const [keyBuffer, setKeyBuffer] = useState('');

  const showKeywordToast = useCallback((msg: string) => {
    setKeywordToast(msg);
    setTimeout(() => setKeywordToast(null), 3000);
  }, []);

  const createClickCounter = useCallback((key: string) => {
    return (event: React.MouseEvent, onTrigger: (e: React.MouseEvent) => void) => {
      const now = Date.now();
      const win = typeof window !== 'undefined' ? (window as unknown as Record<string, number[] | undefined>) : null;
      const stored = win?.[key];
      let times: number[] = stored ? [...stored, now] : [now];
      const cutoff = now - CLICK_WINDOW_MS;
      times = times.filter((t) => t >= cutoff);
      if (win) win[key] = times;
      if (times.length >= CLICKS_TO_TRIGGER) {
        onTrigger(event);
        if (win) win[key] = [];
      }
    };
  }, []);

  const incrementLogoClicks = useCallback(
    (event: React.MouseEvent, onTrigger: (e: React.MouseEvent) => void) =>
      createClickCounter(STORAGE_KEY_LOGO)(event, onTrigger),
    [createClickCounter]
  );

  const incrementNameClicks = useCallback(
    (event: React.MouseEvent, onTrigger: (e: React.MouseEvent) => void) =>
      createClickCounter(STORAGE_KEY_NAME)(event, onTrigger),
    [createClickCounter]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key.toLowerCase() === 'p') {
        setCharacterVisible((v) => !v);
        return;
      }

      const key = e.key;
      if (/^[0-9]$/.test(key)) {
        setKeyBuffer((b) => {
          const next = (b + key).slice(-6);
          const matched = KEYWORDS.find((k) => next.includes(k.pattern));
          if (matched) {
            showKeywordToast(matched.message);
            return '';
          }
          return next;
        });
      } else {
        setKeyBuffer('');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showKeywordToast]);

  const value: EasterEggContextValue = {
    characterVisible,
    setCharacterVisible,
    characterPos,
    setCharacterPos,
    keywordToast,
    showKeywordToast,
    incrementLogoClicks,
    incrementNameClicks,
  };

  return (
    <EasterEggContext.Provider value={value}>
      {children}
    </EasterEggContext.Provider>
  );
};

export const useEasterEgg = () => useContext(EasterEggContext);

/**
 * 人格画像词云
 * 审美参考：深红褐 + 黑色双色，紧密排列，有机形态
 */
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

export interface PortraitWord {
  text: string;
  weight: number;
}

interface PersonalityPortraitProps {
  words: PortraitWord[];
  className?: string;
  /** 是否显示生成按钮占位（无数据时） */
  onGenerate?: () => void;
  isGenerating?: boolean;
  /** 加载中（ fetching 数据） */
  isLoading?: boolean;
}

/* Brutalist 配色：黑 + 深绿（科技与复古碰撞） */
const ACCENT_GREEN = '#1a4d3e';
const BLACK = '#1a1a1a';

export const PersonalityPortrait: React.FC<PersonalityPortraitProps> = ({
  words,
  className = '',
  onGenerate,
  isGenerating = false,
  isLoading = false,
}) => {
  const { data } = useLanguage();
  const t = (data as any)?.ui?.personalityPortrait ?? {};
  const { items } = useMemo(() => {
    if (words.length === 0) return { items: [] };
    const ws = words.map((w) => w.weight);
    const maxW = Math.max(...ws);
    const minW = Math.min(...ws);
    const range = maxW - minW || 1;
    // 按权重排序，高权重的词更突出（字号更大），且优先展示
    const sorted = [...words].sort((a, b) => b.weight - a.weight);
    const items = sorted.map((w, i) => ({
      ...w,
      // 字号范围拉大：0.5rem ~ 1.1rem，让权重差异更明显
      size: 0.5 + ((w.weight - minW) / range) * 0.6,
      // 旋转角度更丰富：-6° ~ 6°，词云感更强
      rotation: ((i * 17 + 3) % 13) - 6,
      color: i % 3 === 0 ? ACCENT_GREEN : BLACK,
    }));
    return { items };
  }, [words]);

  if (items.length === 0) {
    return (
      <div
        className={`border-2 border-ink bg-white p-6 text-center min-h-[230px] flex flex-col justify-center ${className}`}
      >
        <p className="text-xs font-mono uppercase tracking-widest text-muted mb-2">{t.title ?? '人格画像'}</p>
        {isLoading ? (
          <p className="text-[10px] text-muted/80">{t.loading ?? '加载中...'}</p>
        ) : (
          <>
            <p className="text-[10px] text-muted/80 mb-3">
              {t.description ?? '通过分析你的文字、图片、时间轴等，每月生成一次人格特质词云'}
            </p>
            {onGenerate && (
              <button
                type="button"
                onClick={onGenerate}
                disabled={isGenerating}
                className="text-xs border-2 border-ink px-3 py-1.5 font-medium hover:bg-ink hover:text-white disabled:opacity-50 transition-colors"
              >
                {isGenerating ? (t.generating ?? '生成中...') : (t.generateBtn ?? '生成本月人格画像')}
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`border-2 border-ink bg-white p-4 overflow-hidden min-h-[230px] flex flex-col ${className}`}
    >
      <h4 className="text-[9px] uppercase tracking-widest font-mono font-bold text-muted mb-3 shrink-0">
        {t.title ?? '人格画像'}
      </h4>
      {/* 词云区：flex-1 撑满剩余高度，加大字距与行距，均匀分布 */}
      <div
        className="flex-1 flex flex-wrap items-center justify-center content-center min-h-0"
        style={{ gap: '10px 14px' }}
      >
        {items.map(({ text, size, rotation, color }, i) => (
          <span
            key={`${text}-${i}`}
            className="inline-block font-serif font-normal whitespace-nowrap transition-transform hover:scale-110"
            style={{
              fontSize: `${size * 0.7}rem`,
              color,
              transform: `rotate(${rotation}deg)`,
            }}
          >
            {text}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

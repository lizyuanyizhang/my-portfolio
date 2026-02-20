/**
 * 人格画像词云
 * 审美参考：深红褐 + 黑色双色，紧密排列，有机形态
 */
import React, { useMemo } from 'react';
import { motion } from 'motion/react';

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

const MAROON = '#722F37';
const BLACK = '#1a1a1a';

export const PersonalityPortrait: React.FC<PersonalityPortraitProps> = ({
  words,
  className = '',
  onGenerate,
  isGenerating = false,
  isLoading = false,
}) => {
  const { items, maxW, minW } = useMemo(() => {
    if (words.length === 0) return { items: [], maxW: 1, minW: 0 };
    const ws = words.map((w) => w.weight);
    const maxW = Math.max(...ws);
    const minW = Math.min(...ws);
    const range = maxW - minW || 1;
    const items = words.map((w, i) => ({
      ...w,
      size: 0.65 + ((w.weight - minW) / range) * 1.2,
      rotation: (i % 7) - 3,
      color: i % 3 === 0 ? MAROON : BLACK,
    }));
    return { items, maxW, minW };
  }, [words]);

  if (items.length === 0) {
    return (
      <div
        className={`rounded-2xl border border-dashed border-ink/15 bg-white p-6 text-center ${className}`}
      >
        <p className="text-xs text-muted mb-2">人格画像</p>
        {isLoading ? (
          <p className="text-[10px] text-muted/80">加载中...</p>
        ) : (
          <>
            <p className="text-[10px] text-muted/80 mb-3">
              通过分析你的文字、图片、时间轴等，每月生成一次人格特质词云
            </p>
            {onGenerate && (
              <button
                type="button"
                onClick={onGenerate}
                disabled={isGenerating}
                className="text-xs text-[#722F37] font-medium hover:underline disabled:opacity-50"
              >
                {isGenerating ? '生成中...' : '生成本月人格画像'}
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
      className={`rounded-2xl border border-ink/10 bg-white p-4 shadow-sm overflow-hidden ${className}`}
    >
      <h4 className="text-[9px] uppercase tracking-widest font-bold text-muted mb-3 font-mono">
        人格画像
      </h4>
      <div className="flex flex-wrap items-center justify-center leading-tight" style={{ gap: '1px 4px' }}>
        {items.map(({ text, size, rotation, color }, i) => (
          <span
            key={`${text}-${i}`}
            className="inline-block font-medium whitespace-nowrap transition-transform hover:scale-105"
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

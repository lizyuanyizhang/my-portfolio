/**
 * 年度关键词云
 * 从 essays、projects、photos、timeline、year_review 提取关键词，按权重展示
 */
import React from 'react';
import { motion } from 'motion/react';
import type { KeywordItem } from '../lib/keywordExtract';

interface KeywordCloudProps {
  keywords: KeywordItem[];
  className?: string;
}

const COLORS = [
  'text-ink',
  'text-accent',
  'text-muted',
  'text-ink/90',
  'text-accent/90',
  'text-muted',
];

export const KeywordCloud: React.FC<KeywordCloudProps> = ({ keywords, className = '' }) => {
  if (keywords.length === 0) {
    return (
      <div className={`rounded-2xl border border-dashed border-ink/15 bg-ink/[0.02] p-6 text-center ${className}`}>
        <p className="text-xs text-muted">该年暂无关键词</p>
      </div>
    );
  }

  const maxVal = Math.max(...keywords.map((k) => k.value));
  const minVal = Math.min(...keywords.map((k) => k.value));
  const range = maxVal - minVal || 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`rounded-2xl border border-ink/10 bg-white/80 p-5 shadow-sm ${className}`}
    >
      <h4 className="text-[9px] uppercase tracking-widest font-bold text-muted mb-3 font-mono">
        年度关键词
      </h4>
      <div className="flex flex-wrap gap-2 items-center">
        {keywords.map(({ text, value }, i) => {
          const size = 0.75 + ((value - minVal) / range) * 0.9;
          const fontSize = size < 0.9 ? 'text-[10px]' : size < 1.2 ? 'text-xs' : size < 1.5 ? 'text-sm' : 'text-base';
          const color = COLORS[i % COLORS.length];
          return (
            <span
              key={`${text}-${i}`}
              className={`inline-block px-2 py-0.5 rounded-lg bg-ink/[0.04] hover:bg-ink/[0.08] transition-colors font-medium ${fontSize} ${color}`}
            >
              {text}
            </span>
          );
        })}
      </div>
    </motion.div>
  );
};

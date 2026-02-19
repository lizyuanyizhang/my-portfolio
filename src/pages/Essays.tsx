import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import data from '../data.json';
import { ArrowRight } from 'lucide-react';
import type { Essay } from '../types';

const CATEGORIES = ['随笔', '书评', '影评', '旅行日记', '技术思考', '工作感悟'] as const;

export const Essays: React.FC = () => {
  const essays = (data as { essays: Essay[] }).essays;
  const [activeCategory, setActiveCategory] = useState<string>('全部');

  const filteredEssays = useMemo(() => {
    if (activeCategory === '全部') return essays;
    return essays.filter((e) => (e.category || '随笔') === activeCategory);
  }, [essays, activeCategory]);

  return (
    <div className="pt-20 pb-24 min-h-screen bg-paper">
      {/* 分类与副标题、LifeTimer、文章列表完全左对齐 */}
      <div className="px-6 md:px-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap gap-2 mb-10 justify-start items-start w-full"
        >
          {['全部', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`pl-0 pr-4 py-2.5 rounded-full text-sm font-medium transition-all text-left ${
                activeCategory === cat
                  ? 'bg-ink text-paper'
                  : 'bg-ink/5 text-muted hover:bg-ink/10 hover:text-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>
      </div>

      {/* 文章列表：与分类同左对齐 */}
      <div className="px-6 md:px-10">
        <div className="max-w-4xl">
          <div className="space-y-0 border-t border-ink/10 text-left">
            {filteredEssays.length === 0 ? (
              <p className="py-16 text-muted font-serif italic text-left">
                该题材下暂无文章，敬请期待。
              </p>
            ) : (
              filteredEssays.map((essay) => (
                <Link
                  key={essay.id}
                  to={`/essays/${essay.id}`}
                  className="group block py-12 border-b border-ink/10 last:border-0 text-left"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] uppercase tracking-wider text-accent font-mono">
                          {essay.category || '随笔'}
                        </span>
                        <span className="text-xs font-mono text-muted">{essay.date}</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-serif mb-4 group-hover:text-accent transition-colors">
                        {essay.title}
                      </h3>
                      <p className="text-muted leading-relaxed">{essay.excerpt}</p>
                    </div>
                    <span className="flex items-center gap-2 text-sm font-medium text-accent group-hover:translate-x-2 transition-transform shrink-0">
                      阅读全文 <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ArrowRight } from 'lucide-react';
import type { Essay } from '../types';

/** 与 Notion「选择」列一致的固定分类，按菜单显示顺序 */
const ESSAY_CATEGORIES = ['旅行感受', '技术思考', '工作思考', '影评', '书评', '随笔'] as const;

export const Essays: React.FC = () => {
  const { data } = useLanguage();
  const essays = (data as { essays: Essay[] }).essays;
  const [activeCategory, setActiveCategory] = useState<string>('全部');

  const filteredEssays = useMemo(() => {
    if (activeCategory === '全部') return essays;
    return essays.filter((e) => (e.category || '随笔') === activeCategory);
  }, [essays, activeCategory]);

  return (
    <div className="essays-page pt-24 md:pt-28 pb-24 min-h-screen">
      <div className="px-4 sm:px-6 md:px-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4 mb-8 w-full"
        >
          <div className="flex flex-wrap gap-2 justify-start items-center">
            {['全部', ...ESSAY_CATEGORIES].map((cat) => {
              const label = cat === '全部' ? (data as { ui?: { essays?: { all?: string } } }).ui?.essays?.all ?? '全部' : (data as { ui?: { essays?: { categories?: Record<string, string> } } }).ui?.essays?.categories?.[cat] ?? cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`pl-0 pr-4 py-2.5 min-h-[44px] flex items-center rounded-full text-sm font-medium transition-all text-left font-mono ${
                    activeCategory === cat ? 'bg-ink text-[#f8f8f4]' : 'bg-ink/5 text-[#444] hover:bg-ink/10 hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p className="font-mono text-[10px] md:text-xs text-[#444] shrink-0">
            {(data as { ui?: { essays?: { subtitle?: string } } }).ui?.essays?.subtitle ?? '这是她曾写下过的文字，她的见闻，所思所想'}
          </p>
        </motion.div>
      </div>

      <div className="px-4 sm:px-6 md:px-10">
        <div className="max-w-[42rem]">
          <div className="space-y-0 border-t border-ink/10 text-left">
            {filteredEssays.length === 0 ? (
              <p className="py-16 text-[#444] font-mono text-sm text-left">
                该题材下暂无文章，敬请期待。
              </p>
            ) : (
              filteredEssays.map((essay) => (
                <Link
                  key={essay.id}
                  to={`/essays/${essay.id}`}
                  className="group block py-5 border-b border-ink/10 last:border-0 text-left min-h-[44px]"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-1.5">
                        <span className="text-xs font-mono text-[#444]">{essay.date}</span>
                        <span className="text-xs font-mono text-[#444]">{(data as { ui?: { essays?: { categories?: Record<string, string> } } }).ui?.essays?.categories?.[essay.category || '随笔'] ?? (essay.category || '随笔')}</span>
                      </div>
                      <h3 className="text-base sm:text-lg md:text-xl font-mono font-semibold text-ink mb-2 group-hover:text-accent transition-colors">
                        {essay.title}
                      </h3>
                      <p className="text-[#444] font-mono text-sm leading-[1.6] line-clamp-2">
                        {essay.excerpt}
                      </p>
                    </div>
                    <span className="flex items-center gap-2 text-xs font-mono font-medium text-[#444] group-hover:text-accent group-hover:translate-x-2 transition-all shrink-0 mt-1 md:mt-0 min-h-[44px] items-center">
                      {(data as { ui?: { essays?: { readMore?: string } } }).ui?.essays?.readMore ?? '阅读全文'} <ArrowRight size={12} />
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

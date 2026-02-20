import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft } from 'lucide-react';

export const EssayDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data } = useLanguage();
  const essays = (data as { essays: Array<{ id: string; title: string; excerpt: string; date: string; category?: string; content?: string }> }).essays;
  const essay = essays.find((e) => e.id === id);

  if (!essay) {
    return (
      <div className="essays-page pt-28 md:pt-32 pb-24 px-4 sm:px-6 min-h-screen">
        <div className="max-w-[42rem] mx-auto text-center font-mono">
          <p className="text-[#444] mb-8">{(data as { ui?: { essays?: { notFound?: string } } }).ui?.essays?.notFound ?? '文章未找到'}</p>
          <Link to="/essays" className="text-accent hover:underline">{(data as { ui?: { essays?: { back?: string } } }).ui?.essays?.back ?? '返回文字'}</Link>
        </div>
      </div>
    );
  }

  const paragraphs = (essay.content || essay.excerpt).split('\n\n').filter(Boolean);

  return (
    <div className="essays-page pt-28 md:pt-32 pb-24 px-4 sm:px-6 min-h-screen">
      <article className="max-w-[42rem] mx-auto font-mono text-base sm:text-lg">
        <Link
          to="/essays"
          className="inline-flex items-center gap-2 text-sm text-[#444] hover:text-accent mb-10 md:mb-12 transition-colors min-h-[44px] items-center"
        >
          <ArrowLeft size={16} /> {(data as { ui?: { essays?: { back?: string } } }).ui?.essays?.back ?? '返回文字'}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-ink mb-6">{essay.title}</h1>
          <div className="flex items-baseline justify-between gap-4 mb-8 md:mb-10">
            <span className="text-sm text-[#444]">{essay.date}</span>
            <span className="text-sm text-[#444] shrink-0">{essay.category || '随笔'}</span>
          </div>
          <div className="space-y-5 md:space-y-6">
            {paragraphs.map((para, i) => (
              <p key={i} className="text-[#444] leading-[1.75] sm:leading-[1.8]">
                {para}
              </p>
            ))}
          </div>
        </motion.div>
      </article>
    </div>
  );
};

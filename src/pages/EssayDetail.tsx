import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import data from '../data.json';
import { ArrowLeft } from 'lucide-react';

export const EssayDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const essays = (data as { essays: Array<{ id: string; title: string; excerpt: string; date: string; category?: string; content?: string }> }).essays;
  const essay = essays.find((e) => e.id === id);

  if (!essay) {
    return (
      <div className="pt-32 pb-24 px-6 min-h-screen bg-paper">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-muted mb-8">文章未找到</p>
          <Link to="/essays" className="text-accent hover:underline">返回文字列表</Link>
        </div>
      </div>
    );
  }

  const paragraphs = (essay.content || essay.excerpt).split('\n\n').filter(Boolean);

  return (
    <div className="pt-32 pb-24 px-6 min-h-screen bg-paper">
      <article className="max-w-2xl mx-auto">
        <Link
          to="/essays"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent mb-12 transition-colors"
        >
          <ArrowLeft size={16} /> 返回文字
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] uppercase tracking-wider text-accent font-mono">
              {essay.category || '随笔'}
            </span>
            <span className="text-xs font-mono text-muted">{essay.date}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-ink mb-8">{essay.title}</h1>
          <div className="h-px w-24 bg-accent/30 mb-12" />

          <div className="markdown-body prose prose-ink max-w-none">
            {paragraphs.map((para, i) => (
              <p key={i} className="mb-6 text-ink/80 leading-relaxed font-sans">
                {para}
              </p>
            ))}
          </div>
        </motion.div>
      </article>
    </div>
  );
};

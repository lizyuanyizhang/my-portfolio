import React from 'react';
import { Essay } from '../types';
import { ArrowRight } from 'lucide-react';

export const EssayCard: React.FC<{ essay: Essay }> = ({ essay }) => {
  return (
    <div className="group py-12 border-b border-ink/10 last:border-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <span className="text-xs font-mono text-muted mb-4 block">{essay.date}</span>
          <h3 className="text-3xl font-serif mb-4 group-hover:text-accent transition-colors">
            {essay.title}
          </h3>
          <p className="text-muted leading-relaxed">
            {essay.excerpt}
          </p>
        </div>
        <button className="flex items-center gap-2 text-sm font-medium group-hover:translate-x-2 transition-transform">
          阅读全文 <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

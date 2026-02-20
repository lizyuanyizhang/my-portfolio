import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { ExternalLink, Sparkles } from 'lucide-react';
import type { Project } from '../types';

export const Apps: React.FC = () => {
  const { data } = useLanguage();
  const projects = (data as { projects: Project[] }).projects;

  return (
    <div className="pt-24 pb-24 px-6 md:px-10 min-h-screen bg-paper">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-10">
            <p className="text-muted font-serif italic text-base">
              自 2025 年，用 Cursor 等工具打造的产品合集，记录与 AI 的深度协作——一个文科生试着将脑海里的想法落地成产品的过程。
            </p>
          </div>

          {/* 一行 6 个的紧凑网格 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {projects.length === 0 ? (
              <p className="col-span-full py-24 text-muted font-serif italic text-center">
                实验即将开始。在 data.json 的 projects 数组中添加你的 vibe coding 项目即可展示。
              </p>
            ) : (
              projects.map((project, index) => {
                const hasLink = project.link && project.link !== '#';
                const Wrapper = hasLink ? motion.a : motion.div;
                const wrapperProps = hasLink
                  ? { href: project.link!, target: '_blank' as const, rel: 'noreferrer' }
                  : {};
                return (
                  <Wrapper
                    key={project.id}
                    {...wrapperProps}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className={`group block rounded-xl overflow-hidden border border-ink/5 bg-white shadow-sm hover:shadow-lg hover:border-accent/20 transition-all duration-300 ${hasLink ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="overflow-hidden aspect-video">
                      {project.image ? (
                        <img
                          src={project.image}
                          alt={project.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center">
                          <Sparkles className="text-accent/40" size={48} />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-serif text-ink group-hover:text-accent transition-colors line-clamp-1 mb-1">
                        {project.title}
                      </h3>
                      <p className="text-[11px] text-muted leading-snug line-clamp-2 mb-2">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {project.tags?.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-ink/5 rounded text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {hasLink && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-accent mt-2 group-hover:gap-1.5 transition-all">
                          查看 <ExternalLink size={10} />
                        </span>
                      )}
                    </div>
                  </Wrapper>
                );
              })
            )}
          </div>

        </motion.div>
      </div>
    </div>
  );
};

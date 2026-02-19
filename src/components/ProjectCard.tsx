import React from 'react';
import { motion } from 'motion/react';
import { Project } from '../types';
import { ExternalLink } from 'lucide-react';

export const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="group relative bg-white rounded-2xl overflow-hidden border border-ink/5 shadow-sm hover:shadow-xl transition-all duration-500"
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img 
          src={project.image} 
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="p-8">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-2xl font-serif">{project.title}</h3>
          <span className="text-xs font-mono text-muted">{project.date}</span>
        </div>
        <p className="text-muted text-sm leading-relaxed mb-6">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-8">
          {project.tags?.map(tag => (
            <span key={tag} className="text-[10px] uppercase tracking-wider px-2 py-1 bg-paper border border-ink/5 rounded-full text-muted">
              {tag}
            </span>
          ))}
        </div>
        {project.link && (
          <a 
            href={project.link} 
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
          >
            查看详情 <ExternalLink size={14} />
          </a>
        )}
      </div>
    </motion.div>
  );
};

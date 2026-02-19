import React from 'react';
import { motion } from 'motion/react';

interface SectionProps {
  id?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}

export const Section: React.FC<SectionProps> = ({ id, title, subtitle, children, className = "", dark = false }) => {
  return (
    <section 
      id={id} 
      className={`py-24 px-6 ${dark ? 'bg-ink text-paper' : 'bg-paper text-ink'} ${className}`}
    >
      <div className="max-w-6xl mx-auto">
        {(title || subtitle) && (
          <div className="mb-16">
            {subtitle && (
              <motion.span 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 0.6, y: 0 }}
                viewport={{ once: true }}
                className="block text-xs uppercase tracking-[0.2em] mb-4 font-medium"
              >
                {subtitle}
              </motion.span>
            )}
            {title && (
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-serif font-light"
              >
                {title}
              </motion.h2>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
};

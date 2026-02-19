import React from 'react';
import { motion } from 'motion/react';

export const Apps: React.FC = () => {
  return (
    <div className="pt-32 pb-24 px-6 min-h-screen bg-paper">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl md:text-6xl font-serif text-ink mb-8">应用</h1>
          <div className="h-px w-24 bg-accent/30 mb-12" />
          <p className="text-muted font-serif italic text-xl">内容即将呈现...</p>
        </motion.div>
      </div>
    </div>
  );
};

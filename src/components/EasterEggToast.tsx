import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useEasterEgg } from '../context/EasterEggContext';

export const EasterEggToast: React.FC = () => {
  const { keywordToast } = useEasterEgg();

  return (
    <AnimatePresence>
      {keywordToast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10000] px-5 py-3 rounded-2xl bg-ink/90 text-paper font-mono text-sm shadow-xl"
        >
          {keywordToast}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * 站长解锁弹窗：输入密钥以启用生成功能
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KeyRound, X } from 'lucide-react';

interface OwnerUnlockModalProps {
  open: boolean;
  onClose: () => void;
  onUnlock: (key: string) => boolean;
}

export const OwnerUnlockModal: React.FC<OwnerUnlockModalProps> = ({
  open,
  onClose,
  onUnlock,
}) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (onUnlock(input)) {
      setInput('');
    } else {
      setError('密钥错误');
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm rounded-2xl bg-paper border border-ink/10 shadow-xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-ink font-medium">
              <KeyRound size={20} />
              站长入口
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-ink/5"
              aria-label="关闭"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-muted mb-4">
            输入密钥以解锁「生成年度总结」功能
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError('');
              }}
              placeholder="请输入密钥"
              className="w-full px-4 py-2.5 rounded-xl border border-ink/10 bg-transparent text-ink placeholder:text-muted focus:outline-none focus:border-accent"
              autoFocus
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-accent text-paper font-medium hover:opacity-90 transition-opacity"
            >
              确认
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

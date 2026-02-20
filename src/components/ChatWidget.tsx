import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { buildSystemPrompt, sendChatMessage, type ChatMessage } from '../lib/chatApi';
import { supabase } from '../lib/supabase';

export const ChatWidget: React.FC = () => {
  const { data } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const systemPrompt = buildSystemPrompt(data as Parameters<typeof buildSystemPrompt>[0]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const history = [...messages, userMsg];
      const content = await sendChatMessage(history, systemPrompt, {
        supabase,
      });
      setMessages((m) => [...m, { role: 'assistant', content }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '发送失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 left-6 z-[9990] flex items-center justify-center w-12 h-12 rounded-full bg-paper/95 backdrop-blur-md border border-ink/10 shadow-lg text-ink hover:bg-ink/5 transition-colors"
        aria-label="和张苑逸聊几句"
      >
        <MessageCircle size={22} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-6 z-[9989] w-[340px] max-w-[calc(100vw-3rem)] rounded-2xl bg-paper border border-ink/10 shadow-xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink/10">
              <span className="font-medium text-ink">和张苑逸聊几句</span>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-ink/5"
                aria-label="关闭"
              >
                <X size={18} />
              </button>
            </div>

            <div
              ref={listRef}
              className="flex-1 min-h-[200px] max-h-[300px] overflow-y-auto p-4 space-y-4"
            >
              {messages.length === 0 && (
                <p className="text-sm text-muted">随便说点什么吧～</p>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-accent text-paper'
                        : 'bg-ink/5 text-ink'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-2.5 bg-ink/5 text-muted text-sm">
                    ...
                  </div>
                </div>
              )}
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
            </div>

            <div className="p-3 border-t border-ink/10 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="输入消息..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-ink/10 bg-transparent text-sm focus:outline-none focus:border-accent"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-accent text-paper hover:opacity-90 disabled:opacity-50 transition-opacity"
                aria-label="发送"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

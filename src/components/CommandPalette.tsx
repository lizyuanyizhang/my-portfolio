/**
 * 命令面板 / 全局搜索
 * 按 / 或 Cmd/Ctrl+K 打开，输入关键词筛选页面与文章，Enter 跳转
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, FileText, Layout, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/** 可跳转的条目类型 */
type PaletteItem =
  | { type: 'page'; path: string; label: string; keywords: string[] }
  | { type: 'essay'; path: string; label: string; keywords: string[] };

const PAGES: { path: string; key: string; shortKey?: string }[] = [
  { path: '/', key: 'home', shortKey: 'H' },
  { path: '/timeline', key: 'timeline', shortKey: 'N' },
  { path: '/resume', key: 'resume' },
  { path: '/essays', key: 'essays' },
  { path: '/photography', key: 'photography' },
  { path: '/apps', key: 'apps' },
  { path: '/audio', key: 'audio' },
  { path: '/video', key: 'video' },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const ui = (data as { ui?: { nav?: Record<string, string>; essays?: { subtitle?: string } } }).ui;
  const essays = (data as { essays?: { id: string; title?: string; excerpt?: string; category?: string }[] }).essays ?? [];

  // 构建可搜索条目：页面 + 文章
  const allItems = useMemo<PaletteItem[]>(() => {
    const nav = ui?.nav ?? {};
    const items: PaletteItem[] = PAGES.map((p) => ({
      type: 'page',
      path: p.path,
      label: nav[p.key] ?? p.path,
      keywords: [nav[p.key] ?? '', p.path, p.shortKey ?? ''].filter(Boolean),
    }));
    essays.forEach((e) => {
      items.push({
        type: 'essay',
        path: `/essays/${e.id}`,
        label: e.title ?? '',
        keywords: [e.title ?? '', e.excerpt ?? '', e.category ?? ''].filter(Boolean),
      });
    });
    return items;
  }, [ui, essays]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((item) =>
      item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [allItems, query]);

  const selectItem = useCallback(
    (item: PaletteItem) => {
      navigate(item.path);
      setQuery('');
      onClose();
    },
    [navigate, onClose]
  );

  // 打开时聚焦输入框
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // 键盘：上下选择、Enter 确认、Escape 关闭
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        setSelectedIndex((i) => Math.min(i + 1, filteredItems.length - 1));
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setSelectedIndex((i) => Math.max(i - 1, 0));
        e.preventDefault();
      } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
        selectItem(filteredItems[selectedIndex]);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filteredItems, selectedIndex, selectItem, onClose]);

  // 筛选后重置选中下标
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // 滚动到选中项
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] px-4"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-xl rounded-2xl bg-paper border border-ink/10 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-ink/10">
            <Search size={20} className="text-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索页面或文章..."
              className="flex-1 bg-transparent text-ink placeholder:text-muted text-base focus:outline-none"
              autoComplete="off"
            />
            <kbd className="hidden sm:inline text-xs text-muted font-mono px-2 py-1 rounded bg-ink/5">Esc 关闭</kbd>
          </div>
          <div
            ref={listRef}
            className="max-h-[50vh] overflow-y-auto py-2"
          >
            {filteredItems.length === 0 ? (
              <p className="px-4 py-6 text-muted text-sm text-center">无匹配结果</p>
            ) : (
              filteredItems.map((item, i) => (
                <button
                  key={`${item.type}-${item.path}`}
                  data-index={i}
                  onClick={() => selectItem(item)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === selectedIndex ? 'bg-accent/15 text-accent' : 'hover:bg-ink/5 text-ink'
                  }`}
                >
                  {item.type === 'page' ? (
                    <Layout size={18} className="shrink-0 text-muted" />
                  ) : (
                    <FileText size={18} className="shrink-0 text-muted" />
                  )}
                  <span className="flex-1 truncate">{item.label}</span>
                  <ArrowRight size={14} className="shrink-0 opacity-50" />
                </button>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

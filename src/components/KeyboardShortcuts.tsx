/**
 * 全局键盘快捷键
 * H → 首页 | N → 时间轴 | R → 随机页面 | / 或 Cmd+K → 打开搜索
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommandPalette } from './CommandPalette';

const ROUTES = ['/', '/timeline', '/resume', '/essays', '/photography', '/apps', '/audio', '/video'] as const;

export const KeyboardShortcuts: React.FC = () => {
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);

  // 支持其他组件通过自定义事件打开命令面板（如点击导航栏的快捷键提示）
  useEffect(() => {
    const handler = () => setPaletteOpen(true);
    window.addEventListener('open-command-palette', handler);
    return () => window.removeEventListener('open-command-palette', handler);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 在 input / textarea 内输入时，只响应 Escape 和 /（避免误触）
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (isInput && e.key !== 'Escape' && e.key !== '/' && !(e.metaKey && e.key === 'k') && !(e.ctrlKey && e.key === 'k')) {
        return;
      }

      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }

      // 以下快捷键仅在非输入框时生效
      if (isInput) return;

      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        navigate('/');
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        navigate('/timeline');
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        const randomPath = ROUTES[Math.floor(Math.random() * ROUTES.length)];
        navigate(randomPath);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />;
};

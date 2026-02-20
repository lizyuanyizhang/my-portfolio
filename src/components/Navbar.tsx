import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LifeTimer } from './LifeTimer';
import { VisitorCount } from './VisitorCount';
import { LocationClock } from './LocationClock';

const OPEN_PALETTE = () => window.dispatchEvent(new CustomEvent('open-command-palette'));

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { data } = useLanguage();
  const { personalInfo, ui } = data;

  const scrollToCurrentYear = () => {
    const currentYear = new Date().getFullYear().toString();
    const el = document.getElementById(`year-${currentYear}`);
    if (el) {
      const offset = window.innerHeight * 0.25;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const isEssaysPage = location.pathname.startsWith('/essays');

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-paper/80 backdrop-blur-md border-b border-ink/5">
      <div className={`w-full px-6 md:px-10 flex items-center justify-between gap-4 ${isEssaysPage ? 'h-auto py-4' : 'h-16'}`}>
        <div className="shrink-0 flex flex-col gap-1">
          <Link to="/">
            <LifeTimer />
          </Link>
          <VisitorCount />
        </div>

        <div className="flex-1 flex items-center justify-end gap-2 md:gap-6 text-sm font-medium min-w-0 overflow-x-auto">
          <Link to="/" className={`px-3 py-2 rounded-lg transition-all duration-200 ${isHome ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}>
            {ui.nav.home}
          </Link>
          <Link to="/resume" className={`px-3 py-2 rounded-lg transition-all duration-200 ${location.pathname === '/resume' ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}>
            {ui.nav.resume}
          </Link>
          {/* 文字：若配置了 essaysExternalUrl（如 Notion+Super 站），则跳转外链；否则走站内 /essays */}
          {personalInfo.essaysExternalUrl ? (
            <a
              href={personalInfo.essaysExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg transition-all duration-200 text-muted hover:text-accent"
            >
              {ui.nav.essays}
            </a>
          ) : (
            <Link to="/essays" className={`px-3 py-2 rounded-lg transition-all duration-200 ${location.pathname.startsWith('/essays') ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}>
              {ui.nav.essays}
            </Link>
          )}
          <Link to="/photography" className={`px-3 py-2 rounded-lg transition-all duration-200 ${location.pathname === '/photography' ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}>
            {ui.nav.photography}
          </Link>
          <Link to="/apps" className={`px-3 py-2 rounded-lg transition-all duration-200 ${location.pathname === '/apps' ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}>
            {ui.nav.apps}
          </Link>
          <Link 
            to="/timeline"
            className={`px-3 py-2 rounded-lg transition-all duration-200 ${location.pathname === '/timeline' ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}
            onClick={(e) => {
              if (location.pathname === '/timeline') {
                e.preventDefault();
                scrollToCurrentYear();
              }
            }}
          >
            {ui.nav.timeline}
          </Link>
          <Link to="/audio" className={`px-3 py-2 rounded-lg transition-all duration-200 ${location.pathname === '/audio' ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}>
            {ui.nav.audio}
          </Link>
          <Link to="/video" className={`px-3 py-2 rounded-lg transition-all duration-200 ${location.pathname === '/video' ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}>
            {ui.nav.video}
          </Link>
          <button
            onClick={OPEN_PALETTE}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-muted hover:text-accent hover:bg-ink/5 transition-all text-xs font-medium border-l border-ink/10 ml-1"
            title={(data as { ui?: { shortcuts?: string } }).ui?.shortcuts}
            aria-label="快捷键搜索"
          >
            <Search size={14} className="shrink-0" />
            <span className="hidden md:inline">{(data as { ui?: { shortcuts?: string } }).ui?.shortcuts ?? '按 / 或 ⌘K 搜索 · H 首页 N 时间轴 R 随机'}</span>
            <span className="md:hidden font-mono">/</span>
          </button>
          <div className="border-l border-ink/15 pl-2">
            <LocationClock />
          </div>
        </div>
      </div>
    </nav>
  );
};

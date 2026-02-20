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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-paper/80 backdrop-blur-md border-b border-ink/5 pt-[env(safe-area-inset-top)]">
      <div className={`w-full px-4 sm:px-6 md:px-10 flex items-center justify-between gap-4 ${isEssaysPage ? 'h-auto py-4' : 'h-14 md:h-16'}`}>
        <div className="shrink-0 flex flex-col gap-0.5">
          <Link to="/">
            <LifeTimer />
          </Link>
          <VisitorCount />
        </div>

        {/* 所有屏幕：横向导航，小屏可左右滑动 */}
        <div className="flex-1 flex items-center justify-end gap-2 md:gap-6 text-sm font-medium min-w-0 overflow-x-auto">
          <Link to="/" className={`shrink-0 px-3 py-2 rounded-lg transition-all duration-200 min-h-[44px] flex items-center ${isHome ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}>
            {ui.nav.home}
          </Link>
          <Link to="/resume" className={`shrink-0 px-3 py-2 rounded-lg transition-all duration-200 min-h-[44px] flex items-center ${location.pathname === '/resume' ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}>
            {ui.nav.resume}
          </Link>
          {personalInfo.essaysExternalUrl ? (
            <a href={personalInfo.essaysExternalUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 px-3 py-2 rounded-lg transition-all duration-200 min-h-[44px] flex items-center text-muted hover:text-accent">
              {ui.nav.essays}
            </a>
          ) : (
            <Link to="/essays" className={`shrink-0 px-3 py-2 rounded-lg transition-all duration-200 min-h-[44px] flex items-center ${location.pathname.startsWith('/essays') ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}>
              {ui.nav.essays}
            </Link>
          )}
          <Link to="/photography" className={`shrink-0 px-3 py-2 rounded-lg transition-all duration-200 min-h-[44px] flex items-center ${location.pathname === '/photography' ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}>
            {ui.nav.photography}
          </Link>
          <Link to="/apps" className={`shrink-0 px-3 py-2 rounded-lg transition-all duration-200 min-h-[44px] flex items-center ${location.pathname === '/apps' ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}>
            {ui.nav.apps}
          </Link>
          <Link to="/timeline" className={`shrink-0 px-3 py-2 rounded-lg transition-all duration-200 min-h-[44px] flex items-center ${location.pathname === '/timeline' ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`} onClick={(e) => { if (location.pathname === '/timeline') { e.preventDefault(); scrollToCurrentYear(); } }}>
            {ui.nav.timeline}
          </Link>
          <Link to="/audio" className={`shrink-0 px-3 py-2 rounded-lg transition-all duration-200 min-h-[44px] flex items-center ${location.pathname === '/audio' ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}>
            {ui.nav.audio}
          </Link>
          <Link to="/video" className={`shrink-0 px-3 py-2 rounded-lg transition-all duration-200 min-h-[44px] flex items-center ${location.pathname === '/video' ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}>
            {ui.nav.video}
          </Link>
          <button onClick={OPEN_PALETTE} className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-muted hover:text-accent hover:bg-ink/5 transition-all text-xs font-medium border-l border-ink/10 ml-1 min-h-[44px]" title={(data as { ui?: { shortcuts?: string } }).ui?.shortcuts} aria-label="快捷键搜索">
            <Search size={14} className="shrink-0" />
            <span className="hidden md:inline">{(data as { ui?: { shortcuts?: string } }).ui?.shortcuts ?? '按 / 或 ⌘K 搜索 · H 首页 N 时间轴 R 随机'}</span>
            <span className="md:hidden font-mono">/</span>
          </button>
          <div className="shrink-0 border-l border-ink/15 pl-2">
            <LocationClock />
          </div>
        </div>
      </div>
    </nav>
  );
};

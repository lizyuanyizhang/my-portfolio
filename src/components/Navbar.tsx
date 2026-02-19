import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import data from '../data.json';
import { LifeTimer } from './LifeTimer';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const { personalInfo } = data;

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
          {isEssaysPage && (
            <p className="font-mono text-[10px] md:text-xs text-muted">
              这是她曾写下过的文字，她的见闻，所思所想
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-4 md:gap-8 text-sm font-medium shrink-0">
          <Link to="/" className={`hover:text-accent transition-colors ${isHome ? 'text-accent' : 'text-muted'}`}>
            首页
          </Link>
          <Link to="/resume" className={`hover:text-accent transition-colors ${location.pathname === '/resume' ? 'text-accent' : 'text-muted'}`}>
            简历
          </Link>
          <Link to="/essays" className={`hover:text-accent transition-colors ${location.pathname.startsWith('/essays') ? 'text-accent' : 'text-muted'}`}>
            文字
          </Link>
          <Link to="/photography" className={`hover:text-accent transition-colors ${location.pathname === '/photography' ? 'text-accent' : 'text-muted'}`}>
            摄影
          </Link>
          <Link to="/apps" className={`hover:text-accent transition-colors ${location.pathname === '/apps' ? 'text-accent' : 'text-muted'}`}>
            应用
          </Link>
          <Link 
            to="/timeline"
            className={`hover:text-accent transition-colors ${location.pathname === '/timeline' ? 'text-accent' : 'text-muted'}`}
            onClick={(e) => {
              if (location.pathname === '/timeline') {
                e.preventDefault();
                scrollToCurrentYear();
              }
            }}
          >
            时间轴
          </Link>
          <Link to="/audio" className={`hover:text-accent transition-colors ${location.pathname === '/audio' ? 'text-accent' : 'text-muted'}`}>
            声音
          </Link>
          <Link to="/video" className={`hover:text-accent transition-colors ${location.pathname === '/video' ? 'text-accent' : 'text-muted'}`}>
            影像
          </Link>
        </div>
      </div>
    </nav>
  );
};

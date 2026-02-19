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
        
        <div className="flex items-center gap-2 md:gap-6 text-sm font-medium shrink-0">
          <Link to="/" className={`px-3 py-2 rounded-lg transition-all duration-200 ${isHome ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}>
            首页
          </Link>
          <Link to="/resume" className={`px-3 py-2 rounded-lg transition-all duration-200 ${location.pathname === '/resume' ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}>
            简历
          </Link>
          <Link to="/essays" className={`px-3 py-2 rounded-lg transition-all duration-200 ${location.pathname.startsWith('/essays') ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}>
            文字
          </Link>
          <Link to="/photography" className={`px-3 py-2 rounded-lg transition-all duration-200 ${location.pathname === '/photography' ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}>
            摄影
          </Link>
          <Link to="/apps" className={`px-3 py-2 rounded-lg transition-all duration-200 ${location.pathname === '/apps' ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}>
            应用
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
            时间轴
          </Link>
          <Link to="/audio" className={`px-3 py-2 rounded-lg transition-all duration-200 ${location.pathname === '/audio' ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}>
            留言
          </Link>
          <Link to="/video" className={`px-3 py-2 rounded-lg transition-all duration-200 ${location.pathname === '/video' ? 'text-accent font-semibold scale-105 bg-accent/10' : 'text-muted hover:text-accent'}`}>
            影像
          </Link>
        </div>
      </div>
    </nav>
  );
};

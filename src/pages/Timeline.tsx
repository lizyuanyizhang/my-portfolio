import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, useScroll, useSpring } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import {
  MapPin,
  Star,
  BookOpen,
  Film,
  Music,
  ChevronRight,
  ChevronDown,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { ProjectCard } from '../components/ProjectCard';
import { EssayCard } from '../components/EssayCard';
import { YearReviewCard } from '../components/YearReviewCard';
import { PersonalityPortrait } from '../components/PersonalityPortrait';
import { LocationTrailMap } from '../components/LocationTrailMap';
import { OwnerUnlockModal } from '../components/OwnerUnlockModal';
import { aggregateLocationPoints } from '../lib/geoTrailUtils';
import { aggregateContentForPeriod, generatePersonalityPortrait } from '../lib/personalityPortraitApi';
import { supabase } from '../lib/supabase';
import { assetUrl } from '../lib/assetUrl';
import { useOwnerMode } from '../hooks/useOwnerMode';
import {
  aggregateDataForYear,
  fetchVoicesMessagesCount,
  generateYearReview,
} from '../lib/yearReviewApi';
import type { YearReview, PersonalityPortrait as PersonalityPortraitType } from '../types';

const InfluenceIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'book': return <BookOpen size={16} />;
    case 'movie': return <Film size={16} />;
    case 'music': return <Music size={16} />;
    default: return <Star size={16} />;
  }
};

export const Timeline: React.FC = () => {
  const { data } = useLanguage();
  const { personalInfo, timeline: rawTimeline, projects, essays, photos, videos = [], ui } = data as any;
  const t = ui?.timeline ?? {};
  const yr = ui?.yearReview ?? {};
  
  // Generate full timeline from 1996 to 2096
  const fullTimeline = Array.from({ length: 2096 - 1996 + 1 }, (_, i) => {
    const year = (1996 + i).toString();
    const existingData = rawTimeline.find((t: any) => t.year === year);
    return existingData || { 
      year, 
      location: t.unknownLocation ?? '未知', 
      event: t.blankEvent ?? '岁月的留白', 
      fulfillment: 50, 
      portfolio: { photos: [], essays: [], projects: [] }, 
      influences: [] 
    };
  });

  const currentYear = new Date().getFullYear().toString();
  const [activeYear, setActiveYear] = useState(currentYear);
  const [expandedYears, setExpandedYears] = useState<string[]>([currentYear]);
  const [yearReviews, setYearReviews] = useState<YearReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [generatingYear, setGeneratingYear] = useState<string | null>(null);
  const [personalityPortraits, setPersonalityPortraits] = useState<PersonalityPortraitType[]>([]);
  const [loadingPortraits, setLoadingPortraits] = useState(true);
  const [generatingPortrait, setGeneratingPortrait] = useState(false);
  const { isOwner, unlock, showUnlockModal, setShowUnlockModal } = useOwnerMode();
  const [mobileOverviewOpen, setMobileOverviewOpen] = useState(false);

  const fetchYearReviews = useCallback(async () => {
    if (!supabase) {
      setLoadingReviews(false);
      return;
    }
    try {
      const { data, error } = await supabase.from('year_reviews').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setYearReviews((data as YearReview[]) ?? []);
    } catch {
      setYearReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    fetchYearReviews();
  }, [fetchYearReviews]);

  const fetchPersonalityPortraits = useCallback(async () => {
    if (!supabase) {
      setLoadingPortraits(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('personality_portraits')
        .select('*')
        .order('period', { ascending: false })
        .limit(12);
      if (error) throw error;
      setPersonalityPortraits((data as PersonalityPortraitType[]) ?? []);
    } catch {
      setPersonalityPortraits([]);
    } finally {
      setLoadingPortraits(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonalityPortraits();
  }, [fetchPersonalityPortraits]);

  const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const latestPortrait = personalityPortraits[0];

  const locationPoints = useMemo(
    () => aggregateLocationPoints({ timeline: rawTimeline, photos, personalInfo }),
    [rawTimeline, photos, personalInfo]
  );

  const handleGeneratePersonalityPortrait = useCallback(async () => {
    if (!supabase || !isOwner) return;
    setGeneratingPortrait(true);
    try {
      const aggregatedContent = aggregateContentForPeriod(
        { essays, projects, photos, timeline: rawTimeline, personalInfo },
        yearReviews.filter((r) => r.period_type === 'year')
      );
      const portrait = await generatePersonalityPortrait(currentPeriod, aggregatedContent, supabase);
      setPersonalityPortraits((prev) => [portrait, ...prev.filter((p) => p.period !== currentPeriod)]);
    } catch (e) {
      alert(e instanceof Error ? e.message : '生成失败');
    } finally {
      setGeneratingPortrait(false);
    }
  }, [essays, projects, photos, rawTimeline, personalInfo, yearReviews, currentPeriod, isOwner]);

  const handleGenerateYearReview = useCallback(
    async (yearStr: string) => {
      if (!supabase) return;
      const year = parseInt(yearStr, 10);
      if (isNaN(year)) return;
      setGeneratingYear(yearStr);
      try {
        const voicesMessages = await fetchVoicesMessagesCount(supabase, year);
        const aggregated = aggregateDataForYear(
          { essays, projects, photos, videos },
          year,
          voicesMessages.voices,
          voicesMessages.messages
        );
        const review = await generateYearReview('year', yearStr, aggregated, supabase);
        setYearReviews((prev) => [review, ...prev.filter((r) => !(r.year === yearStr && r.period_type === 'year'))]);
      } catch (e) {
        alert(e instanceof Error ? e.message : '生成失败');
      } finally {
        setGeneratingYear(null);
      }
    },
    [essays, projects, photos, videos]
  );

  const toggleYear = (year: string) => {
    setExpandedYears(prev => 
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  const sidebarRef = useRef<HTMLDivElement>(null);

  // Scroll to current year on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.getElementById(`year-${currentYear}`);
      if (el) {
        const offset = window.innerHeight * 0.25;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'auto'
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Sync sidebar scroll with activeYear
  useEffect(() => {
    if (activeYear) {
      const sidebarItem = document.getElementById(`sidebar-year-${activeYear}`);
      if (sidebarItem && sidebarRef.current) {
        sidebarItem.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
    }
  }, [activeYear]);

  // Intersection Observer to track active year in sidebar
  useEffect(() => {
    const updateActiveYear = () => {
      const sections = document.querySelectorAll('.timeline-section');
      const triggerPoint = window.innerHeight * 0.25; // Match scroll-mt
      
      let currentActive = "";
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        // If the section spans the trigger point
        if (rect.top <= triggerPoint + 50 && rect.bottom >= triggerPoint) {
          currentActive = section.getAttribute('data-year') || "";
        }
      });

      if (currentActive && currentActive !== activeYear) {
        setActiveYear(currentActive);
      }
    };

    const observer = new IntersectionObserver(
      () => {
        // When any section enters/leaves, re-evaluate which one is active
        updateActiveYear();
      },
      { 
        threshold: [0, 0.1, 0.5, 0.9, 1],
        rootMargin: "0px 0px -50% 0px" // Broad margin to catch changes
      }
    );

    const elements = document.querySelectorAll('.timeline-section');
    elements.forEach((el) => observer.observe(el));

    // Also listen to scroll for immediate feedback
    window.addEventListener('scroll', updateActiveYear, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateActiveYear);
    };
  }, [expandedYears, activeYear]); 

  return (
    <div className="timeline-brutalist relative flex min-h-screen bg-[#f8f8f4]">
      {/* Left Sidebar Timeline - 粗野风格：粗黑边框，保留年份字体 */}
      <aside className="fixed left-0 top-0 h-screen w-20 md:w-24 border-r border-ink/20 flex flex-col z-40 bg-[#f8f8f4]">
        <div 
          ref={sidebarRef}
          className="flex-1 overflow-y-auto no-scrollbar py-32 px-4 space-y-2"
        >
          {fullTimeline.map((item: any) => {
            const hasData = rawTimeline.some((t: any) => t.year === item.year);
            const isActive = activeYear === item.year;
            
            return (
              <button
                key={item.year}
                id={`sidebar-year-${item.year}`}
                onClick={() => {
                  if (!expandedYears.includes(item.year)) toggleYear(item.year);
                  setTimeout(() => {
                    const el = document.getElementById(`year-${item.year}`);
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
                  }, 100);
                }}
                className={`group relative flex items-center justify-center w-full py-1.5 transition-all duration-300 ${
                  isActive 
                  ? 'text-ink scale-110 font-bold' 
                  : 'text-muted/30 hover:text-ink hover:scale-105'
                }`}
              >
                <span className={`text-[10px] font-mono transition-colors ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {item.year}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active-dot"
                    className="absolute right-0 w-2 h-4 bg-ink rounded-l-sm"
                  />
                )}
                {hasData && !isActive && (
                  <div className="absolute right-1 w-1 h-1 bg-ink/20 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* 中部内容；需在背景之上，右侧固定栏需预留空间 */}
      <div className="relative z-10 flex-1 ml-20 md:ml-24 md:mr-80 lg:mr-96 xl:mr-[28rem] min-w-0">
        <main className="min-w-0 px-5 py-20 max-w-2xl mx-auto">
        {/* 小屏：顶部可展开的年度概览 · Brutalist 粗边框 */}
        <div className="md:hidden mb-8 rounded-xl border border-[#d0e5d0] overflow-hidden bg-[#eef5ee]">
          <button
            type="button"
            onClick={() => setMobileOverviewOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#eef5ee] hover:bg-[#e4f0e4] transition-colors border-b border-[#d0e5d0]"
          >
            <span className="text-sm font-medium">{ui?.timeline?.mobileOverviewTitle ?? '人格画像 · 地理轨迹'}</span>
            <ChevronDown className={`text-muted transition-transform ${mobileOverviewOpen ? 'rotate-180' : ''}`} size={18} />
          </button>
          {mobileOverviewOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="px-4 pb-4 pt-2 space-y-4"
            >
              <PersonalityPortrait
                words={latestPortrait?.words ?? []}
                onGenerate={isOwner ? handleGeneratePersonalityPortrait : undefined}
                isGenerating={generatingPortrait}
                isLoading={loadingPortraits}
              />
              <LocationTrailMap points={locationPoints} />
            </motion.div>
          )}
        </div>
        {/* Timeline Sections */}
        <div className="space-y-8">
          {fullTimeline.map((item: any) => {
            const isExpanded = expandedYears.includes(item.year);
            const hasData = rawTimeline.some((t: any) => t.year === item.year);

            return (
              <section 
                key={item.year} 
                id={`year-${item.year}`}
                data-year={item.year}
                className="timeline-section group scroll-mt-[25vh] grid grid-cols-[4rem_1fr]"
              >
                {/* 左列：年份（固定宽度，与内容列分离） */}
                <div className="flex items-center py-4 pl-5">
                  <span className={`text-xl md:text-2xl font-serif tabular-nums transition-all duration-500 ${
                    activeYear === item.year ? 'text-ink scale-105 font-semibold' : (isExpanded || hasData ? 'text-ink' : 'text-ink/30')
                  }`}>
                    {item.year}
                  </span>
                </div>
                {/* 右列：事件标题 + 展开按钮，与下方展开内容共享 px-5，左对齐 */}
                <div
                  onClick={() => toggleYear(item.year)}
                  className={`group flex items-center justify-between gap-4 py-4 pr-5 pl-5 cursor-pointer border-b border-ink/20 transition-all ${
                    isExpanded ? 'bg-ink/[0.04]' : ''
                  } ${
                    activeYear === item.year ? 'bg-ink/[0.06]' : 'hover:bg-ink/[0.02]'
                  }`}
                >
                  <h3 className={`flex-1 min-w-0 text-sm md:text-base font-serif transition-all duration-500 whitespace-normal break-words leading-relaxed ${
                    activeYear === item.year ? 'text-ink font-medium' : (hasData ? 'opacity-100' : 'opacity-40')
                  }`}>
                    {item.event}
                  </h3>
                  <div
                    className={`flex-shrink-0 w-8 h-8 flex items-center justify-center transition-all duration-300 ${
                      isExpanded ? 'bg-ink text-white' : 'bg-transparent text-ink group-hover:bg-ink group-hover:text-white'
                    }`}
                  >
                    <ChevronRight
                      size={16}
                      className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </div>
                </div>

                {/* Expanded Content · 仅占右列，与事件标题同列、同 px-5 左对齐 */}
                {isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden col-start-2"
                  >
                    <div className="pt-5 pb-10 px-5 space-y-5">
                      {/* Year in Review：有则展示，无则显示生成按钮 */}
                      {(() => {
                        const yearReview = yearReviews.find(
                          (r) => r.year === item.year && r.period_type === 'year'
                        );
                        if (yearReview) {
                          return <YearReviewCard review={yearReview} />;
                        }
                        if (item.year !== '未来' && !/^\d{4}$/.test(item.year)) return null;
                        const y = parseInt(item.year, 10);
                        if (isNaN(y)) return null;
                        const canGenerate = supabase && hasData && y <= new Date().getFullYear();
                        if (!canGenerate) return null;
                        if (isOwner) {
                          return (
                            <div className="border-2 border-dashed border-ink bg-white p-5 text-center">
                              <p className="text-xs text-muted mb-3">{yr.generatePrompt ?? '生成本期总结，让 AI 帮你复盘'}</p>
                              <button
                                onClick={() => handleGenerateYearReview(item.year)}
                                disabled={generatingYear !== null}
                                className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-ink bg-ink text-white text-sm font-medium hover:bg-ink/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {generatingYear === item.year ? (
                                  <>
                                    <Loader2 size={14} className="animate-spin" />
                                    {yr.generating ?? '生成中...'}
                                  </>
                                ) : (
                                  <>
                                    <Sparkles size={14} />
                                    {(yr.generateBtn ?? '生成 {year} 年度总结').replace('{year}', item.year)}
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        }
                        return (
                          <div className="border-2 border-dashed border-ink bg-white p-5 text-center">
                            <p className="text-xs text-muted mb-3">{yr.hasSummaryHint ?? '已有总结会在此展示'}</p>
                            <button
                              type="button"
                              onClick={() => setShowUnlockModal(true)}
                              className="text-[10px] text-muted hover:text-accent underline underline-offset-2"
                            >
                              {yr.ownerHint ?? '站长入口'}
                            </button>
                          </div>
                        );
                      })()}
                      <div className="grid grid-cols-1 gap-5">
                        {/* Details & Influences */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-ink font-mono text-[10px] uppercase tracking-widest">
                            <MapPin size={12} />
                            {item.location}
                          </div>

                          {/* Fulfillment Score · Brutalist 无阴影粗边框 */}
                          <div className="p-4 bg-white border border-ink/10">
                            <div className="flex justify-between items-end mb-2">
                              <span className="text-[9px] uppercase tracking-widest font-bold text-muted">{t.fulfillment ?? 'Fulfillment'}</span>
                              <span className="text-xl font-serif italic">{item.fulfillment}%</span>
                            </div>
                            <div className="h-2 w-full bg-ink/20 overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${item.fulfillment}%` }}
                                transition={{ duration: 1 }}
                                className="h-full bg-ink"
                              />
                            </div>
                          </div>

                          {/* Influences */}
                          {item.influences.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-[9px] uppercase tracking-widest font-bold text-muted mb-2">{t.influences ?? '书影音 / Influences'}</h4>
                              {item.influences.map((inf: any, i: number) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-white border-2 border-ink">
                                  <div className="w-6 h-6 border-2 border-ink flex items-center justify-center text-ink shrink-0">
                                    <InfluenceIcon type={inf.type} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium truncate">{inf.title}</p>
                                    <p className="text-[9px] text-muted font-mono uppercase mt-0.5">{inf.time}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Portfolio */}
                        <div className="space-y-4">
                          {/* Photos */}
                          {item.portfolio.photos.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                              {item.portfolio.photos.map((photoId: string, i: number) => {
                                const photo = photos.find((p: any) => p.id === photoId || p.url === photoId);
                                return photo ? (
                                  <div key={i} className="aspect-square overflow-hidden border-2 border-ink">
                                    <img src={assetUrl(photo.url)} alt={photo.caption} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                ) : null;
                              })}
                            </div>
                          )}

                          {/* Projects & Essays · Brutalist 粗边框 */}
                          <div className="space-y-4 [&>*]:border-2 [&>*]:border-ink [&>*]:rounded-none [&>*]:shadow-none [&>*]:bg-white">
                            {item.portfolio.projects.map((projId: string) => {
                              const project = projects.find((p: any) => p.id === projId);
                              return project ? <ProjectCard key={project.id} project={project} /> : null;
                            })}
                            {item.portfolio.essays.map((essayId: string) => {
                              const essay = essays.find((e: any) => e.id === essayId);
                              return essay ? <EssayCard key={essay.id} essay={essay} /> : null;
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </section>
            );
          })}
        </div>

        {/* Footer · Brutalist 粗边框 */}
        <footer className="mt-32 pt-16 border-t border-ink/20 text-center">
          <p className="text-muted font-serif italic text-sm">
            {t.footer ?? '她度过了充分自我实现的一生'}
          </p>
        </footer>
        </main>
      </div>
      {/* 右侧固定栏：用 Portal 挂载到 body，避免父级 transform/overflow 影响 fixed 定位 */}
      {createPortal(
        <aside className="fixed right-0 top-0 h-screen w-80 lg:w-96 xl:w-[28rem] border-l border-ink/20 z-40 bg-[#f8f8f4] overflow-y-auto max-md:hidden">
          <div className="pt-24 pb-16 px-4">
            <div className="rounded-xl bg-[#eef5ee] border border-ink/10 p-4 space-y-6">
              <PersonalityPortrait
                words={latestPortrait?.words ?? []}
                onGenerate={isOwner ? handleGeneratePersonalityPortrait : undefined}
                isGenerating={generatingPortrait}
                isLoading={loadingPortraits}
              />
              <LocationTrailMap points={locationPoints} />
            </div>
          </div>
        </aside>,
        document.body
      )}
      <OwnerUnlockModal
        open={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onUnlock={unlock}
      />
    </div>
  );
};

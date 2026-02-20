import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const { personalInfo, timeline: rawTimeline, projects, essays, photos, videos = [] } = data as any;
  
  // Generate full timeline from 1996 to 2096
  const fullTimeline = Array.from({ length: 2096 - 1996 + 1 }, (_, i) => {
    const year = (1996 + i).toString();
    const existingData = rawTimeline.find((t: any) => t.year === year);
    return existingData || { 
      year, 
      location: "未知", 
      event: "岁月的留白", 
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
    <div className="flex min-h-screen bg-paper">
      {/* Left Sidebar Timeline - Scrollable for 100 years */}
      <aside className="fixed left-0 top-0 h-screen w-20 md:w-24 border-r border-ink/5 flex flex-col z-40 bg-paper/80 backdrop-blur-md">
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
                  ? 'text-accent scale-110 font-bold' 
                  : 'text-muted/30 hover:text-ink hover:scale-105'
                }`}
              >
                <span className={`text-[10px] font-mono transition-colors ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {item.year}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active-dot"
                    className="absolute right-0 w-1 h-4 bg-accent rounded-l-full"
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

      {/* 中部内容；右侧固定栏需预留空间 md:mr-56 lg:mr-64 xl:mr-80 */}
      <div className="flex-1 ml-20 md:ml-24 md:mr-56 lg:mr-64 xl:mr-80 min-w-0">
        <main className="min-w-0 px-4 md:px-8 py-24 max-w-2xl mx-auto">
        {/* 小屏：顶部可展开的年度概览（关键词云 + 地理轨迹） */}
        <div className="md:hidden mb-8 rounded-2xl border border-ink/10 overflow-hidden">
          <button
            type="button"
            onClick={() => setMobileOverviewOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 bg-ink/[0.02] hover:bg-ink/[0.04] transition-colors"
          >
            <span className="text-sm font-medium">人格画像 · 地理轨迹</span>
            <ChevronDown className={`text-muted transition-transform ${mobileOverviewOpen ? 'rotate-180' : ''}`} size={18} />
          </button>
          {mobileOverviewOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="px-4 pb-4 space-y-4"
            >
              <PersonalityPortrait
                words={latestPortrait?.words ?? []}
                onGenerate={isOwner ? handleGeneratePersonalityPortrait : undefined}
                isGenerating={generatingPortrait}
                isLoading={loadingPortraits}
              />
              <LocationTrailMap
                points={aggregateLocationPoints({
                  timeline: rawTimeline,
                  photos,
                  personalInfo,
                })}
              />
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
                className="timeline-section group scroll-mt-[25vh]"
              >
                {/* Year Row (Collapsed State) */}
                <div 
                  onClick={() => toggleYear(item.year)}
                  className={`flex items-center gap-4 py-4 cursor-pointer border-b border-ink/5 transition-all px-3 rounded-lg ${
                    isExpanded ? 'bg-ink/[0.02]' : ''
                  } ${
                    activeYear === item.year ? 'bg-accent/5 ring-1 ring-accent/20' : 'hover:bg-ink/[0.02]'
                  }`}
                >
                  <span className={`text-xl md:text-2xl font-serif transition-all duration-500 ${
                    activeYear === item.year ? 'text-accent scale-105' : (isExpanded || hasData ? 'text-ink' : 'text-ink/10')
                  }`}>
                    {item.year}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm md:text-base font-serif transition-all duration-500 truncate ${
                      activeYear === item.year ? 'text-ink font-medium' : (hasData ? 'opacity-100' : 'opacity-20')
                    }`}>
                      {item.event}
                    </h3>
                  </div>
                  <div className={`transition-transform duration-500 ${isExpanded ? 'rotate-90' : ''}`}>
                    <ChevronRight className="text-muted" />
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-8 pb-16 px-2 space-y-8">
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
                        const canGenerate = supabase && (y >= 2020 && y <= new Date().getFullYear());
                        if (!canGenerate) return null;
                        if (isOwner) {
                          return (
                            <div className="rounded-2xl border border-dashed border-ink/20 bg-ink/[0.02] p-5 text-center">
                              <p className="text-xs text-muted mb-3">生成本期总结，让 AI 帮你复盘</p>
                              <button
                                onClick={() => handleGenerateYearReview(item.year)}
                                disabled={generatingYear !== null}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-accent text-paper font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                              >
                                {generatingYear === item.year ? (
                                  <>
                                    <Loader2 size={14} className="animate-spin" />
                                    生成中...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles size={14} />
                                    生成 {item.year} 年度总结
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        }
                        return (
                          <div className="rounded-2xl border border-dashed border-ink/20 bg-ink/[0.02] p-5 text-center">
                            <p className="text-xs text-muted mb-3">已有总结会在此展示</p>
                            <button
                              type="button"
                              onClick={() => setShowUnlockModal(true)}
                              className="text-[10px] text-muted hover:text-accent underline underline-offset-2"
                            >
                              站长入口
                            </button>
                          </div>
                        );
                      })()}
                      <div className="grid grid-cols-1 gap-8">
                        {/* Details & Influences */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-2 text-accent font-mono text-[10px] uppercase tracking-widest">
                            <MapPin size={12} />
                            {item.location}
                          </div>

                          {/* Fulfillment Score */}
                          <div className="p-4 bg-white rounded-2xl border border-ink/5 shadow-sm">
                            <div className="flex justify-between items-end mb-2">
                              <span className="text-[9px] uppercase tracking-widest font-bold text-muted">Fulfillment</span>
                              <span className="text-xl font-serif italic">{item.fulfillment}%</span>
                            </div>
                            <div className="h-1 w-full bg-ink/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${item.fulfillment}%` }}
                                transition={{ duration: 1 }}
                                className="h-full bg-accent"
                              />
                            </div>
                          </div>

                          {/* Influences */}
                          {item.influences.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-[9px] uppercase tracking-widest font-bold text-muted mb-2">书影音 / Influences</h4>
                              {item.influences.map((inf: any, i: number) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-ink/5 shadow-sm">
                                  <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center text-accent shrink-0">
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
                        <div className="space-y-6">
                          {/* Photos */}
                          {item.portfolio.photos.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                              {item.portfolio.photos.map((photoId: string, i: number) => {
                                const photo = photos.find((p: any) => p.id === photoId || p.url === photoId);
                                return photo ? (
                                  <div key={i} className="aspect-square rounded-xl overflow-hidden shadow-sm">
                                    <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                ) : null;
                              })}
                            </div>
                          )}

                          {/* Projects & Essays */}
                          <div className="space-y-4">
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

        {/* Footer Info */}
        <footer className="mt-32 pt-16 border-t border-ink/5 text-center">
          <p className="text-muted font-serif italic text-sm">
            她度过了充分自我实现的一生
          </p>
        </footer>
        </main>
      </div>
      {/* 右侧固定栏：用 Portal 挂载到 body，避免父级 transform/overflow 影响 fixed 定位 */}
      {createPortal(
        <aside className="fixed right-0 top-0 h-screen w-56 lg:w-64 xl:w-80 border-l border-ink/5 z-40 bg-paper/80 backdrop-blur-md overflow-y-auto max-md:hidden">
          <div className="pt-24 pb-16 px-4 space-y-6">
            <PersonalityPortrait
              words={latestPortrait?.words ?? []}
              onGenerate={isOwner ? handleGeneratePersonalityPortrait : undefined}
              isGenerating={generatingPortrait}
              isLoading={loadingPortraits}
            />
            <LocationTrailMap
              points={aggregateLocationPoints({
                timeline: rawTimeline,
                photos,
                personalInfo,
              })}
            />
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

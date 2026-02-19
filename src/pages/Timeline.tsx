import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import data from '../data.json';
import { 
  MapPin, 
  Star, 
  BookOpen, 
  Film, 
  Music, 
  ArrowRight,
  ChevronRight,
  Quote
} from 'lucide-react';
import { ProjectCard } from '../components/ProjectCard';
import { EssayCard } from '../components/EssayCard';

const InfluenceIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'book': return <BookOpen size={16} />;
    case 'movie': return <Film size={16} />;
    case 'music': return <Music size={16} />;
    default: return <Star size={16} />;
  }
};

export const Timeline: React.FC = () => {
  const { personalInfo, timeline: rawTimeline, projects, essays, photos } = data as any;
  
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

      {/* Main Content Area */}
      <main className="flex-1 ml-20 md:ml-24 px-6 md:px-20 py-32">
        {/* Timeline Sections */}
        <div className="space-y-12">
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
                  className={`flex items-center gap-8 py-8 cursor-pointer border-b border-ink/5 transition-all px-4 rounded-xl ${
                    isExpanded ? 'bg-ink/[0.02]' : ''
                  } ${
                    activeYear === item.year ? 'bg-accent/5 ring-1 ring-accent/20' : 'hover:bg-ink/[0.02]'
                  }`}
                >
                  <span className={`text-4xl md:text-6xl font-serif transition-all duration-500 ${
                    activeYear === item.year ? 'text-accent scale-105' : (isExpanded || hasData ? 'text-ink' : 'text-ink/10')
                  }`}>
                    {item.year}
                  </span>
                  <div className="flex-1">
                    <h3 className={`text-lg md:text-xl font-serif transition-all duration-500 ${
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
                    <div className="pt-12 pb-24 px-4">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                        {/* Left Column: Details & Influences */}
                        <div className="lg:col-span-4 space-y-12">
                          <div className="flex items-center gap-2 text-accent font-mono text-xs uppercase tracking-widest">
                            <MapPin size={14} />
                            {item.location}
                          </div>

                          {/* Fulfillment Score */}
                          <div className="p-8 bg-white rounded-[32px] border border-ink/5 shadow-sm">
                            <div className="flex justify-between items-end mb-4">
                              <span className="text-[10px] uppercase tracking-widest font-bold text-muted">Fulfillment</span>
                              <span className="text-3xl font-serif italic">{item.fulfillment}%</span>
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
                            <div className="space-y-4">
                              <h4 className="text-[10px] uppercase tracking-widest font-bold text-muted mb-4">书影音 / Influences</h4>
                              {item.influences.map((inf: any, i: number) => (
                                <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-ink/5 shadow-sm">
                                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                                    <InfluenceIcon type={inf.type} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{inf.title}</p>
                                    <p className="text-[10px] text-muted font-mono uppercase mt-1">{inf.time}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Right Column: Portfolio */}
                        <div className="lg:col-span-8 space-y-12">
                          {/* Photos */}
                          {item.portfolio.photos.length > 0 && (
                            <div className="grid grid-cols-2 gap-4">
                              {item.portfolio.photos.map((photoId: string, i: number) => {
                                const photo = photos.find((p: any) => p.id === photoId || p.url === photoId);
                                return photo ? (
                                  <div key={i} className="aspect-square rounded-3xl overflow-hidden shadow-md">
                                    <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                ) : null;
                              })}
                            </div>
                          )}

                          {/* Projects & Essays */}
                          <div className="space-y-6">
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
        <footer className="mt-64 pt-32 border-t border-ink/5 text-center">
          <p className="text-muted font-serif italic text-xl">
            她度过了充分自我实现的一生
          </p>
        </footer>
      </main>
    </div>
  );
};

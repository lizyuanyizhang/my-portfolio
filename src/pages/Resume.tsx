/**
 * 简历页面 / Resume Page
 * 采用科技公司偏好的极简模板：单列排版、清晰层级、无多余装饰
 * 参考：互联网大厂偏好简洁专业、ATS 友好、数据化表达
 */
import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { Mail, Linkedin, MapPin, Briefcase, GraduationCap, Globe, Twitter } from 'lucide-react';

/** 安全渲染文本，避免 [object Object] */
function safeStr(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
}

/** 确保 LinkedIn 为可点击链接 */
function linkedinUrl(val: string | undefined): string {
  if (!val?.trim()) return '#';
  const s = val.trim();
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

/** 将 ISO 日期范围格式化为简历常用格式，如 2015-09-01 → 2019-06-15 → 2015.9 - 2019.6 */
function formatPeriod(s: string): string {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})\s*→\s*(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const [, y1, mo1, , y2, mo2] = m;
    return `${y1}.${parseInt(mo1, 10)} - ${y2}.${parseInt(mo2, 10)}`;
  }
  return s;
}

export const Resume: React.FC = () => {
  const { data } = useLanguage();
  const { personalInfo, resume } = (data || {}) as { personalInfo?: any; resume?: any };
  const pi = personalInfo || {};
  const res = resume || {};

  const summary = safeStr(res.summary);
  const experience = Array.isArray(res.experience) ? res.experience : [];
  const education = Array.isArray(res.education) ? res.education : [];
  const skills = res.skills || {};
  const devSkills = Array.isArray(skills.development) ? skills.development : [];
  const designSkills = Array.isArray(skills.design) ? skills.design : [];
  const langSkills = Array.isArray(skills.languages) ? skills.languages : [];

  const hasContent = summary || experience.length > 0 || education.length > 0 ||
    devSkills.length > 0 || designSkills.length > 0 || langSkills.length > 0;

  if (!hasContent) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-muted font-serif italic">简历内容为空，请先在 Notion 填写或运行 <code className="text-xs bg-ink/5 px-1.5 py-0.5 rounded">npm run sync:resume</code></p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white border border-ink/[0.06] rounded-2xl shadow-sm overflow-hidden"
        >
          {/* 极简 Header：姓名 + 一句话 + 联系方式一行 */}
          <header className="px-8 pt-10 pb-8 border-b border-ink/[0.06]">
            <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight mb-1">
              {safeStr(pi.name) || '姓名'}
            </h1>
            <p className="text-sm text-muted mb-6">
              {safeStr(pi.title) || '职位 / Title'}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
              {pi.email && (
                <a href={`mailto:${pi.email}`} className="inline-flex items-center gap-1.5 hover:text-accent transition-colors">
                  <Mail size={14} /> {pi.email}
                </a>
              )}
              {pi.linkedin && (
                <a href={linkedinUrl(pi.linkedin)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-accent transition-colors">
                  <Linkedin size={14} /> LinkedIn
                </a>
              )}
              {pi.x && (
                <a href={safeStr(pi.x).startsWith('http') ? pi.x : `https://${pi.x}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-accent transition-colors">
                  <Twitter size={14} /> X
                </a>
              )}
              {pi.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} /> {pi.location}
                </span>
              )}
              {pi.language && (
                <span className="inline-flex items-center gap-1.5">
                  <Globe size={14} /> {pi.language}
                </span>
              )}
            </div>
          </header>

          <div className="px-8 py-8 space-y-10">
            {/* 个人总结 */}
            {summary && (
              <section>
                <h2 className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-3 font-sans">
                  Summary
                </h2>
                <p className="text-sm leading-relaxed text-ink/90">
                  {summary}
                </p>
              </section>
            )}

            {/* 工作经历 */}
            {experience.length > 0 && (
              <section>
                <h2 className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-4 font-sans flex items-center gap-2">
                  <Briefcase size={14} /> Experience
                </h2>
                <div className="space-y-6">
                  {experience.map((exp: any, idx: number) => {
                    const role = safeStr(exp.role);
                    const company = safeStr(exp.company);
                    const period = safeStr(exp.period);
                    const details = Array.isArray(exp.details) ? exp.details : [];
                    if (!role && !company) return null;
                    return (
                      <div key={idx} className="relative pl-5 border-l-2 border-ink/10">
                        <div className={`absolute -left-[9px] top-1.5 w-2 h-2 rounded-full ${idx === 0 ? 'bg-accent' : 'bg-ink/20'}`} />
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-2">
                          <h3 className="text-base font-semibold text-ink">{role || '职位'}</h3>
                          <span className="text-xs font-mono text-muted shrink-0">{period ? formatPeriod(period) : ''}</span>
                        </div>
                        {company && <p className="text-sm text-accent font-medium mb-2">{company}</p>}
                        {details.length > 0 && (
                          <ul className="text-sm text-ink/80 space-y-1 list-disc list-inside">
                            {details.filter((d: unknown) => d != null && String(d).trim()).map((d: unknown, i: number) => (
                              <li key={i}>{safeStr(d)}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 教育背景 */}
            {education.length > 0 && (
              <section>
                <h2 className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-4 font-sans flex items-center gap-2">
                  <GraduationCap size={14} /> Education
                </h2>
                <div className="space-y-3">
                  {education.map((edu: any, idx: number) => {
                    const degree = safeStr(edu.degree);
                    const school = safeStr(edu.school);
                    const major = safeStr(edu.major);
                    const period = safeStr(edu.period);
                    if (!degree && !school && !period && !major) return null;
                    const degreeMajor = [degree, major].filter(Boolean).join(' · ');
                    const parts = [
                      period ? formatPeriod(period) : null,
                      school || null,
                      degreeMajor || null,
                    ].filter(Boolean);
                    return (
                      <div key={idx} className="text-sm text-ink/90 flex flex-wrap items-center gap-x-2 gap-y-0">
                        {parts.join(' · ')}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 技能：标签式展示，科技公司常见 */}
            {(devSkills.length > 0 || designSkills.length > 0 || langSkills.length > 0) && (
              <section>
                <h2 className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-4 font-sans">
                  Skills
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {devSkills.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-ink mb-2">开发</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {devSkills.filter(Boolean).map((s, i) => (
                          <span key={i} className="text-[11px] px-2 py-1 rounded-md bg-ink/5 text-ink/90 font-mono">
                            {safeStr(s)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {designSkills.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-ink mb-2">设计</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {designSkills.filter(Boolean).map((s, i) => (
                          <span key={i} className="text-[11px] px-2 py-1 rounded-md bg-ink/5 text-ink/90 font-mono">
                            {safeStr(s)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {langSkills.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-ink mb-2">语言</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {langSkills.filter(Boolean).map((s, i) => (
                          <span key={i} className="text-[11px] px-2 py-1 rounded-md bg-ink/5 text-ink/90 font-mono">
                            {safeStr(s)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

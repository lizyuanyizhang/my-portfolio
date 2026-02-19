import React from 'react';
import { motion } from 'motion/react';
import data from '../data.json';
import { Mail, Linkedin, MapPin, Briefcase, GraduationCap, Globe, Twitter } from 'lucide-react';

export const Resume: React.FC = () => {
  const { personalInfo, resume } = data as any;

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-12 md:p-20 rounded-[40px] shadow-xl border border-ink/5"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16 pb-16 border-b border-ink/5">
            <div>
              <h1 className="text-5xl font-serif mb-4">{personalInfo.name}</h1>
              <p className="text-xl text-accent font-serif italic">{personalInfo.title}</p>
            </div>
            <div className="flex flex-col gap-3 text-sm text-muted">
              <div className="flex items-center gap-2">
                <Mail size={16} /> {personalInfo.email}
              </div>
              <div className="flex items-center gap-2">
                <Linkedin size={16} /> LinkedIn Profile
              </div>
              {personalInfo.x && (
                <div className="flex items-center gap-2">
                  <Twitter size={16} /> X (Twitter)
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin size={16} /> {personalInfo.location}
              </div>
              {personalInfo.language && (
                <div className="flex items-center gap-2">
                  <Globe size={16} /> {personalInfo.language}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="mb-16">
            <h2 className="text-xs uppercase tracking-widest text-muted mb-8 font-semibold">个人总结 / Summary</h2>
            <p className="text-lg leading-relaxed text-ink/80">
              {resume.summary}
            </p>
          </div>

          {/* Experience */}
          <div className="mb-16">
            <h2 className="text-xs uppercase tracking-widest text-muted mb-8 font-semibold">工作经历 / Experience</h2>
            <div className="space-y-12">
              {resume.experience.map((exp, idx) => (
                <div key={idx} className="relative pl-8 border-l border-ink/10">
                  <div className={`absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full ${idx === 0 ? 'bg-accent' : 'bg-accent/40'}`} />
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <h3 className="text-2xl font-serif">{exp.role}</h3>
                    <span className="text-sm font-mono text-muted">{exp.period}</span>
                  </div>
                  <p className="text-accent mb-4 font-medium">{exp.company}</p>
                  <ul className="list-disc list-inside text-muted space-y-2 text-sm">
                    {exp.details.map((detail, dIdx) => (
                      <li key={dIdx}>{detail}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="mb-16">
            <h2 className="text-xs uppercase tracking-widest text-muted mb-8 font-semibold">教育背景 / Education</h2>
            <div className="space-y-8">
              {resume.education.map((edu, idx) => (
                <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <h3 className="text-xl font-serif">{edu.degree}</h3>
                    <p className="text-muted">{edu.school}</p>
                  </div>
                  <span className="text-sm font-mono text-muted">{edu.period}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <h2 className="text-xs uppercase tracking-widest text-muted mb-8 font-semibold">技能专长 / Skills</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-serif mb-4">开发</h4>
                <ul className="text-sm text-muted space-y-2">
                  {resume.skills.development.map(s => <li key={s}>{s}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-serif mb-4">设计</h4>
                <ul className="text-sm text-muted space-y-2">
                  {resume.skills.design.map(s => <li key={s}>{s}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-serif mb-4">语言</h4>
                <ul className="text-sm text-muted space-y-2">
                  {resume.skills.languages.map(s => <li key={s}>{s}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

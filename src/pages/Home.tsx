import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { 
  Mail, 
  Linkedin, 
  Github, 
  Twitter, 
  ExternalLink, 
  Mic, 
  MessageCircle,
  Sparkles 
} from 'lucide-react';

export const Home: React.FC = () => {
  const { data } = useLanguage();
  const { personalInfo, ui } = data;

  const contactLinks = [
    { icon: <Mail size={20} />, label: personalInfo.email, href: `mailto:${personalInfo.email}` },
    { icon: <Linkedin size={20} />, label: 'LinkedIn', href: personalInfo.linkedin },
    { icon: <ExternalLink size={20} />, label: ui.xiaohongshu, href: personalInfo.xiaohongshu },
    { icon: <Github size={20} />, label: 'GitHub', href: personalInfo.github },
    { icon: <Twitter size={20} />, label: 'X (Twitter)', href: personalInfo.x },
    { icon: <Mic size={20} />, label: ui.podcast, href: personalInfo.podcast },
    ...(personalInfo.jike ? [{ icon: <Sparkles size={20} />, label: ui.jike, href: personalInfo.jike }] : []),
  ];

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-6 py-24">
      <div className="max-w-2xl w-full">
        {/* Personal Info */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <h1 className="font-serif text-2xl md:text-3xl font-medium leading-tight tracking-tight text-muted mb-8">
            {(personalInfo.name.split(' ')[0])}{' '}
            {personalInfo.name.split(' ').slice(1).join(' ') && (
              <span className="font-normal uppercase">{(personalInfo.name.split(' ').slice(1).join(' '))}</span>
            )}
          </h1>
          <p className="text-xl md:text-2xl text-muted font-serif italic">
            {personalInfo.title}
          </p>
          <div className="h-px w-24 bg-accent/30" />
          <p className="text-lg md:text-xl text-ink/70 leading-relaxed font-serif">
            {ui.home.lifeExperiment}
          </p>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-8 mt-8 border-t border-ink/10"
          >
            <h3 className="text-xs uppercase tracking-widest text-muted font-semibold mb-6">{ui.home.contact}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contactLinks.map((link, i) => (
                <a 
                  key={i}
                  href={link.href.startsWith('http') || link.href.startsWith('mailto') ? link.href : `https://${link.href}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-muted hover:text-accent transition-colors group"
                >
                  <span className="text-accent/80 group-hover:scale-110 transition-transform shrink-0">
                    {link.icon}
                  </span>
                  <span className="text-sm font-medium truncate">{link.label}</span>
                </a>
              ))}
              {personalInfo.wechatQR && (
                <div className="group relative flex items-center gap-3 text-muted hover:text-accent transition-colors cursor-pointer">
                  <span className="text-accent/80 group-hover:scale-110 transition-transform shrink-0">
                    <MessageCircle size={20} />
                  </span>
                  <span className="text-sm font-medium">{ui.wechat}</span>
                  <div className="absolute left-0 bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-all pointer-events-none translate-y-2 group-hover:translate-y-0 z-10">
                    <div className="bg-white p-4 rounded-2xl shadow-xl border border-ink/10">
                      <img 
                        src={personalInfo.wechatQR} 
                        alt="WeChat QR" 
                        className="w-64 h-auto rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                      <p className="text-ink text-xs text-center mt-2 font-sans">{ui.scanQR}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

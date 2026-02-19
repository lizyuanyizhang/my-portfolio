import React from 'react';
import { Mail, Linkedin, ExternalLink, Github, Twitter, MessageCircle, Mic } from 'lucide-react';
import data from '../data.json';

export const Footer: React.FC = () => {
  const { personalInfo } = data as any;
  return (
    <footer className="bg-ink text-paper py-24 px-6 border-t border-paper/10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <h3 className="text-3xl font-serif mb-8">保持联系</h3>
          <p className="text-paper/60 max-w-md mb-12 leading-relaxed">
            无论是项目合作、创意交流，还是仅仅想打个招呼，都欢迎随时给我写信。
          </p>
          
          <div className="flex flex-col gap-4">
            <a href={`mailto:${personalInfo.email}`} className="flex items-center gap-3 text-paper/80 hover:text-paper transition-colors">
              <Mail size={18} />
              <span>{personalInfo.email}</span>
            </a>
            <a href={personalInfo.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-paper/80 hover:text-paper transition-colors">
              <Linkedin size={18} />
              <span>LinkedIn</span>
            </a>
            <a href={personalInfo.xiaohongshu} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-paper/80 hover:text-paper transition-colors">
              <ExternalLink size={18} />
              <span>小红书主页</span>
            </a>
            {personalInfo.github && (
              <a href={personalInfo.github} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-paper/80 hover:text-paper transition-colors">
                <Github size={18} />
                <span>GitHub</span>
              </a>
            )}
            {personalInfo.x && (
              <a href={personalInfo.x} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-paper/80 hover:text-paper transition-colors">
                <Twitter size={18} />
                <span>X (Twitter)</span>
              </a>
            )}
            {personalInfo.podcast && (
              <a href={personalInfo.podcast} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-paper/80 hover:text-paper transition-colors">
                <Mic size={18} />
                <span>小宇宙播客</span>
              </a>
            )}
            {personalInfo.wechatQR && (
              <div className="group relative flex items-center gap-3 text-paper/80 hover:text-paper transition-colors cursor-pointer">
                <MessageCircle size={18} />
                <span>微信公众号</span>
                <div className="absolute left-0 bottom-full mb-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-white p-4 rounded-xl shadow-2xl">
                    <img 
                      src={personalInfo.wechatQR} 
                      alt="WeChat QR" 
                      className="w-64 h-auto rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                    <p className="text-ink text-[10px] text-center mt-2 font-sans">扫码关注公众号</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-xs uppercase tracking-widest text-paper/40 mb-6 font-semibold">导航</h4>
              <ul className="flex flex-col gap-3 text-sm">
                <li><a href="#photography" className="hover:underline">摄影</a></li>
                <li><a href="#essays" className="hover:underline">随笔</a></li>
                <li><a href="#vibe-coding" className="hover:underline">作品</a></li>
                <li><a href="#business" className="hover:underline">业务</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-paper/40 mb-6 font-semibold">其他</h4>
              <ul className="flex flex-col gap-3 text-sm">
                <li><a href="/resume" className="hover:underline">简历</a></li>
                <li><a href="#" className="hover:underline">隐私政策</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-paper/10 text-xs text-paper/30">
            © {new Date().getFullYear()} {personalInfo.name}. Built with Vibe.
          </div>
        </div>
      </div>
    </footer>
  );
};

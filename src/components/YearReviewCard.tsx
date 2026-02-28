/**
 * Year in Review 卡片
 * 展示 AI 生成的周期总结：年度词、数据看板、做了什么/成功/失败/学到、鼓励语
 */
import React from 'react';
import { motion } from 'motion/react';
import { FileText, Image, Code2, Video, Mic, MessageCircle, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { YearReview } from '../types';

const METRIC_ICONS: Record<string, React.ReactNode> = {
  essays_written: <FileText size={14} />,
  projects_shipped: <Code2 size={14} />,
  photos_added: <Image size={14} />,
  videos_published: <Video size={14} />,
  voice_messages_received: <Mic size={14} />,
  text_messages_received: <MessageCircle size={14} />,
};

const DEFAULT_METRIC_LABELS: Record<string, string> = {
  essays_written: '文章',
  projects_shipped: '项目',
  photos_added: '照片',
  videos_published: '视频',
  voice_messages_received: '语音留言',
  text_messages_received: '文字留言',
};

interface YearReviewCardProps {
  review: YearReview;
}

export const YearReviewCard: React.FC<YearReviewCardProps> = ({ review }) => {
  const { data } = useLanguage();
  const yr = (data as any)?.ui?.yearReview ?? {};
  const metricLabels = yr.metrics ?? DEFAULT_METRIC_LABELS;
  const getLabel = (key: string) => metricLabels[key] ?? DEFAULT_METRIC_LABELS[key] ?? key;
  
  const metrics = review.metrics ?? {};
  const entries = Object.entries(metrics).filter(([, v]) => v != null && (v as number) > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-x border-t border-ink/10 bg-white p-4 md:p-5"
    >
      {/* 年度词（仅年度类型显示） */}
      {review.annual_word && (
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-ink shrink-0" />
          <div>
            <p className="text-[9px] uppercase tracking-widest text-muted font-mono">{yr.annualWord ?? '年度词'}</p>
            <p className="text-lg font-serif text-ink font-semibold">{review.annual_word}</p>
          </div>
        </div>
      )}

      {/* 数据看板 */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-4">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-2 p-3 border border-ink/10 bg-white"
            >
              <div className="w-8 h-8 border border-ink/10 flex items-center justify-center text-ink shrink-0">
                {METRIC_ICONS[key] ?? <FileText size={14} />}
              </div>
              <div className="min-w-0">
                <p className="text-base font-serif font-semibold text-ink">{value}</p>
                <p className="text-[10px] text-muted truncate">{getLabel(key)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 做了什么 / 成功 / 失败 / 学到 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {review.summary_done && (
          <div>
            <h4 className="text-[9px] uppercase tracking-widest text-muted font-mono mb-1">{yr.done ?? '做了什么'}</h4>
            <p className="text-xs text-ink whitespace-pre-line leading-snug">{review.summary_done}</p>
          </div>
        )}
        {review.summary_success && (
          <div>
            <h4 className="text-[9px] uppercase tracking-widest text-muted font-mono mb-1">{yr.success ?? '成功了什么'}</h4>
            <p className="text-xs text-ink whitespace-pre-line leading-snug">{review.summary_success}</p>
          </div>
        )}
        {review.summary_fail && (
          <div>
            <h4 className="text-[9px] uppercase tracking-widest text-muted font-mono mb-1">{yr.fail ?? '未完成 / 失败'}</h4>
            <p className="text-xs text-ink/80 whitespace-pre-line leading-snug">{review.summary_fail}</p>
          </div>
        )}
        {review.summary_learned && (
          <div>
            <h4 className="text-[9px] uppercase tracking-widest text-muted font-mono mb-1">{yr.learned ?? '学到了'}</h4>
            <p className="text-xs text-ink whitespace-pre-line leading-snug">{review.summary_learned}</p>
          </div>
        )}
      </div>

      {/* 鼓励语 · 底部段落，与红框外留白区区分 */}
      {review.encouragement && (
        <div className="pt-3 mt-2 border-t-2 border-ink">
          <p className="text-[11px] font-serif italic text-ink/80 leading-relaxed">{review.encouragement}</p>
        </div>
      )}
    </motion.div>
  );
};

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { supabase, supabaseConfigStatus, VOICES_BUCKET } from '../lib/supabase';
import type { Voice, TextMessage } from '../types';
import { Mic, Loader2, Play, Pause, Trash2, Send, Square } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const Audio: React.FC = () => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [messages, setMessages] = useState<TextMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [sendingText, setSendingText] = useState(false);
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  /** 获取语音列表 */
  const fetchVoices = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error: err } = await supabase
        .from('voices')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      const withUrls = await Promise.all(
        (data || []).map(async (v) => {
          const { data: urlData } = supabase.storage
            .from(VOICES_BUCKET)
            .getPublicUrl(v.storage_path);
          return { ...v, url: urlData.publicUrl };
        })
      );
      setVoices(withUrls);
    } catch (e) {
      setError(e instanceof Error ? e.message : '语音加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  /** 获取文字留言列表 */
  const fetchMessages = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error: err } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setMessages(data || []);
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (supabase) {
      setLoading(true);
      fetchVoices();
      fetchMessages();
    } else {
      setLoading(false);
    }
  }, [fetchVoices, fetchMessages]);

  /** 点击开始录音：使用浏览器支持的格式 */
  const startRecording = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeOpt =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? { mimeType: 'audio/webm;codecs=opus' }
          : MediaRecorder.isTypeSupported('audio/webm')
            ? { mimeType: 'audio/webm' }
            : {};
      const recorder = new MediaRecorder(stream, mimeOpt);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const mime = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mime });
        await uploadRecording(blob, recorder.startTime);
      };
      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '无法访问麦克风');
    }
  }, []);

  const uploadRecording = async (blob: Blob, startTime: number) => {
    if (!supabase) return;
    if (blob.size < 100) {
      setError('录音太短，请至少录制 0.5 秒');
      return;
    }
    setUploading(true);
    try {
      const duration = Math.round((Date.now() - startTime) / 1000);
      const ext = blob.type.includes('webm') ? 'webm' : 'webm';
      const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from(VOICES_BUCKET)
        .upload(filename, blob, { contentType: blob.type || 'audio/webm', upsert: false });
      if (uploadErr) throw uploadErr;
      const { error: insertErr } = await supabase.from('voices').insert({
        storage_path: filename,
        duration_seconds: duration,
      });
      if (insertErr) throw insertErr;
      await fetchVoices();
    } catch (e) {
      setError(e instanceof Error ? e.message : '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current = null;
    }
    setRecording(false);
  }, []);

  /** 删除录音：先删表后删文件，成功后重新拉取列表确保与服务器一致 */
  const handleDeleteVoice = useCallback(async (voice: Voice) => {
    if (!supabase || !window.confirm('确定要删除这条录音吗？')) return;
    setDeletingId(voice.id);
    setError(null);
    try {
      const { error: tableErr } = await supabase.from('voices').delete().eq('id', voice.id);
      if (tableErr) throw new Error(tableErr.message);
      setVoices((prev) => prev.filter((v) => v.id !== voice.id));
      supabase.storage.from(VOICES_BUCKET).remove([voice.storage_path]).then(() => {});
      await fetchVoices();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[语音删除失败]', e); // 便于在 F12 控制台查看完整错误
      setError(msg);
      alert(`删除失败：${msg}\n\n请检查 Supabase 中 voices 表与 storage 的 DELETE 策略，详见 VOICE_DELETE_TROUBLESHOOTING.md`);
    } finally {
      setDeletingId(null);
    }
  }, [fetchVoices]);

  /** 发送文字留言 */
  const handleSendText = useCallback(async () => {
    const content = textInput.trim();
    if (!content || !supabase || sendingText) return;
    setSendingText(true);
    setError(null);
    try {
      const { error: err } = await supabase.from('messages').insert({ content });
      if (err) throw err;
      setTextInput('');
      await fetchMessages();
    } catch (e) {
      setError(e instanceof Error ? e.message : '发送失败');
    } finally {
      setSendingText(false);
    }
  }, [textInput, sendingText, fetchMessages]);

  /** 删除文字留言 */
  const handleDeleteMessage = useCallback(async (msg: TextMessage) => {
    if (!supabase || !window.confirm('确定要删除这条留言吗？')) return;
    setDeletingMsgId(msg.id);
    try {
      const { error: err } = await supabase.from('messages').delete().eq('id', msg.id);
      if (err) throw err;
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    } catch {
      setError('删除失败');
    } finally {
      setDeletingMsgId(null);
    }
  }, []);

  const hasSupabase = !!supabase;

  return (
    <div className="pt-24 pb-24 px-6 md:px-10 min-h-screen bg-[#F2F2F7] font-serif">
      <div className="max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch w-full"
        >
          {!hasSupabase && (
            <div className="lg:col-span-2 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <p className="font-medium mb-1">未配置 Supabase</p>
              <p className="text-xs">
                VITE_SUPABASE_URL: {supabaseConfigStatus.hasUrl ? '✓' : '✗'} &nbsp;
                VITE_SUPABASE_ANON_KEY: {supabaseConfigStatus.hasKey ? '✓' : '✗'}
                &nbsp; 请在 .env.local 中配置并重启 dev 服务器。
              </p>
            </div>
          )}

          {/* 左侧：语音留言 - 与 LifeTimer 同款 font-serif */}
          <section className="flex flex-col h-full">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col flex-1 min-h-[320px] p-6 rounded-[20px] bg-white/95 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] transition-shadow duration-300"
            >
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-[#007AFF]/60 rounded-full shrink-0" />
                  <h2 className="text-[17px] font-semibold text-ink tracking-tight">语音留言</h2>
                </div>
                {hasSupabase && (
                  <motion.button
                    onClick={() => {
                      if (uploading) return;
                      if (recording) stopRecording();
                      else startRecording();
                    }}
                    disabled={uploading}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 py-2 px-4 rounded-full text-[13px] font-medium transition-all shrink-0 hover:opacity-90"
                    style={
                      recording
                        ? { backgroundColor: '#dc2626', color: 'white' }
                        : uploading
                          ? { backgroundColor: '#e5e7eb', color: '#9ca3af' }
                          : { backgroundColor: '#1a1a1a', color: 'white' }
                    }
                    title={recording ? '点击结束录音' : '点击开始录音'}
                  >
                    {uploading ? (
                      <Loader2 size={16} className="animate-spin shrink-0" />
                    ) : recording ? (
                      <>
                        <Square size={12} className="shrink-0" fill="currentColor" strokeWidth={2} />
                        <span>结束录音</span>
                      </>
                    ) : (
                      <>
                        <Mic size={16} strokeWidth={2.5} className="shrink-0" />
                        <span>开始录音</span>
                      </>
                    )}
                  </motion.button>
                )}
              </div>
              <div className="space-y-2.5 flex-1 min-h-[120px] overflow-y-auto">
                {loading ? (
                  <p className="py-6 text-center text-muted text-[13px]">加载中...</p>
                ) : voices.length === 0 ? (
                  <p className="py-6 text-muted/80 text-[13px] text-center font-medium">
                    {hasSupabase ? '暂无录音' : '—'}
                  </p>
                ) : (
                  voices.map((voice) => (
                    <VoiceCard
                      key={voice.id}
                      voice={voice}
                      isPlaying={playingId === voice.id}
                      onPlayPause={() => setPlayingId(playingId === voice.id ? null : voice.id)}
                      onDelete={() => handleDeleteVoice(voice)}
                      isDeleting={deletingId === voice.id}
                    />
                  ))
                )}
              </div>
            </motion.div>
          </section>

          {/* 右侧：文字留言 - 与 LifeTimer 同款 font-serif */}
          <section className="flex flex-col h-full">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-col flex-1 min-h-[320px] p-6 rounded-[20px] bg-white border border-[#e5e5e5] shadow-sm transition-shadow duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#FFB800' }} />
                <h2 className="text-[17px] font-semibold text-ink tracking-tight">文字留言</h2>
                <span className="text-[12px] text-muted ml-1">留言板</span>
              </div>
              {hasSupabase && (
                <div className="mb-5 flex flex-col gap-2.5 p-4 rounded-xl border border-[#e8e8e8] bg-[#fafafa]">
                  <p className="text-[12px] text-muted mb-0.5">说些什么，欢迎来访~</p>
                  <textarea
                    ref={textAreaRef}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendText())}
                    placeholder="写下你想说的话..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border border-[#e0e0e0] bg-white text-ink placeholder:text-muted/80 resize-none focus:outline-none focus:ring-1.5 focus:ring-[#FFB800]/40 focus:border-[#FFB800]/50 text-[13px] leading-[1.5] min-h-[4.5rem] font-serif"
                  />
                  <motion.button
                    onClick={handleSendText}
                    disabled={!textInput.trim() || sendingText}
                    whileTap={{ scale: 0.97 }}
                    className="self-end py-2 px-4 rounded-md flex items-center justify-center gap-1.5 text-[13px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    style={{
                      backgroundColor: textInput.trim() ? '#1f2937' : '#f3f4f6',
                      color: textInput.trim() ? '#ffffff' : '#9ca3af',
                      border: '1px solid ' + (textInput.trim() ? '#1f2937' : '#e5e7eb'),
                    }}
                  >
                    {sendingText ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} strokeWidth={2.5} className="rotate-[-30deg] shrink-0" />
                    )}
                    <span>{sendingText ? '发表中...' : '发表'}</span>
                  </motion.button>
                </div>
              )}
              <div className="space-y-2.5 flex-1 min-h-[120px] overflow-y-auto">
              {!hasSupabase ? (
                <p className="py-6 text-muted text-[13px] text-center">—</p>
              ) : messages.length === 0 ? (
                <p className="py-8 text-muted/80 text-[13px] text-center">暂无留言，来踩一踩吧~</p>
              ) : (
                  messages.map((msg) => (
                    <TextMessageCard
                      key={msg.id}
                      message={msg}
                      onDelete={() => handleDeleteMessage(msg)}
                      isDeleting={deletingMsgId === msg.id}
                    />
                  ))
                )}
              </div>
            </motion.div>
          </section>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-4 rounded-[14px] bg-red-50/90 border border-red-200/50 text-red-700 text-[13px]">{error}</motion.div>
        )}
      </div>
    </div>
  );
};

const VoiceCard: React.FC<{
  voice: Voice;
  isPlaying: boolean;
  onPlayPause: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}> = ({ voice, isPlaying, onPlayPause, onDelete, isDeleting }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnded = () => onPlayPause();
    el.addEventListener('ended', onEnded);
    return () => el.removeEventListener('ended', onEnded);
  }, [onPlayPause]);
  useEffect(() => {
    if (!isPlaying) audioRef.current?.pause();
  }, [isPlaying]);
  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) el.pause();
    else { el.currentTime = 0; el.play(); }
    onPlayPause();
  };
  const dateStr = voice.created_at ? format(new Date(voice.created_at), 'M/d HH:mm', { locale: zhCN }) : '';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-2.5 py-1 rounded-[10px] bg-white border border-black/[0.06] shadow-sm group"
    >
      <audio ref={audioRef} src={voice.url} preload="auto" playsInline />
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all shadow-md hover:opacity-90"
        style={{ backgroundColor: '#1a1a1a', color: 'white' }}
        aria-label={isPlaying ? '暂停' : '播放'}
      >
        {isPlaying ? <Pause size={14} strokeWidth={2.5} stroke="currentColor" /> : <Play size={14} strokeWidth={2.5} stroke="currentColor" className="ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-ink truncate">{dateStr}</p>
      </div>
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!isDeleting) onDelete(); }} disabled={isDeleting} className="p-1 rounded-full text-ink/60 hover:text-red-500 hover:bg-red-50/80 group-hover:text-ink/80 transition-all shrink-0 disabled:opacity-50">
        {isDeleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
      </button>
    </motion.div>
  );
};

const TextMessageCard: React.FC<{
  message: TextMessage;
  onDelete: () => void;
  isDeleting?: boolean;
}> = ({ message, onDelete, isDeleting }) => {
  const dateStr = message.created_at ? format(new Date(message.created_at), 'M月d日 HH:mm', { locale: zhCN }) : '';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative pl-4 pr-4 py-3 rounded-lg border border-[#e8e8e8] bg-white shadow-sm group hover:border-[#FFB800]/30 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] px-2 py-0.5 rounded bg-[#FFB800]/15 text-[#b8860b] font-medium">访客</span>
        <span className="text-[11px] text-muted">{dateStr}</span>
      </div>
      <p className="text-[14px] leading-[1.5] whitespace-pre-wrap break-words text-ink">{message.content}</p>
      <button onClick={onDelete} disabled={isDeleting} className="absolute top-2 right-2 p-1.5 rounded text-muted hover:text-red-500 hover:bg-red-50/80 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50">
        {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
      </button>
    </motion.div>
  );
};

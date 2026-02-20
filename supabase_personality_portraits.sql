-- 人格画像表：存储每月 AI 生成的人格特质词云
-- 执行方式：Supabase Dashboard → SQL Editor → 粘贴并运行

CREATE TABLE IF NOT EXISTS public.personality_portraits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period text NOT NULL UNIQUE,  -- 格式 "2026-02"，每月唯一
  words jsonb NOT NULL DEFAULT '[]',  -- [{ "text": "勇敢", "weight": 0.9 }, ...]
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personality_portraits_period ON public.personality_portraits(period);

ALTER TABLE public.personality_portraits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "personality_portraits_read" ON public.personality_portraits;
CREATE POLICY "personality_portraits_read" ON public.personality_portraits
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "personality_portraits_insert" ON public.personality_portraits;
CREATE POLICY "personality_portraits_insert" ON public.personality_portraits
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "personality_portraits_upsert" ON public.personality_portraits;
CREATE POLICY "personality_portraits_upsert" ON public.personality_portraits
  FOR UPDATE USING (true);

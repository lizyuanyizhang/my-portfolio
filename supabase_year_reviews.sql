-- Year in Review 表：存储 AI 生成的周期总结
-- 执行方式：Supabase Dashboard → SQL Editor → 粘贴并运行

CREATE TABLE IF NOT EXISTS public.year_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type text NOT NULL CHECK (period_type IN ('week','month','quarter','half_year','year')),
  period_value text NOT NULL,
  year text NOT NULL,
  annual_word text,
  metrics jsonb DEFAULT '{}',
  highlights jsonb DEFAULT '[]',
  summary_done text,
  summary_success text,
  summary_fail text,
  summary_learned text,
  encouragement text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_year_reviews_year ON public.year_reviews(year);
CREATE INDEX IF NOT EXISTS idx_year_reviews_period ON public.year_reviews(period_type, period_value);

-- 允许匿名读取（用于展示）
ALTER TABLE public.year_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "year_reviews_read" ON public.year_reviews;
CREATE POLICY "year_reviews_read" ON public.year_reviews
  FOR SELECT USING (true);

-- 仅 service_role 或通过 Edge Function 写入（需要 service_role key 或自定义策略）
DROP POLICY IF EXISTS "year_reviews_insert" ON public.year_reviews;
CREATE POLICY "year_reviews_insert" ON public.year_reviews
  FOR INSERT WITH CHECK (true);

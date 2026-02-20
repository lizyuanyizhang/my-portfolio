-- ============================================================
-- 访客量统计（方案 D：Supabase + Fingerprint 近似 UV）
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================================

-- 1. 站点总访客数表（单行）
CREATE TABLE IF NOT EXISTS public.site_stats (
  id INT PRIMARY KEY DEFAULT 1,
  visitor_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- 初始行
INSERT INTO public.site_stats (id, visitor_count, updated_at)
VALUES (1, 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. 访客指纹表（用于 24 小时内去重）
CREATE TABLE IF NOT EXISTS public.visitor_fingerprints (
  fingerprint_hash TEXT PRIMARY KEY,
  last_visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. RLS 策略：允许匿名读写（由下方 SECURITY DEFINER 函数执行特权操作）
ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_fingerprints ENABLE ROW LEVEL SECURITY;

-- 允许匿名读取 site_stats（展示数字）
CREATE POLICY "Public read site_stats"
ON public.site_stats FOR SELECT
USING (true);

-- 允许匿名读取 visitor_fingerprints（仅函数内部使用，此处保持最小权限）
-- 实际上函数用 SECURITY DEFINER 会以表所有者身份执行，无需额外 policy

-- 4. 增量函数：仅当该指纹 24h 内未访问过时才 +1
-- 参数名用 p_fingerprint_hash 避免与表列 fingerprint_hash 歧义
CREATE OR REPLACE FUNCTION public.increment_visitor_if_new(p_fingerprint_hash TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER  -- 以所有者权限执行，绕过 RLS
SET search_path = public
AS $$
DECLARE
  last_visit TIMESTAMPTZ;
  new_count INT;
BEGIN
  SELECT vf.last_visited_at INTO last_visit
  FROM public.visitor_fingerprints vf
  WHERE vf.fingerprint_hash = p_fingerprint_hash;

  -- 从未访问 或 上次访问超过 24 小时 → 计入新访客
  IF last_visit IS NULL OR last_visit < NOW() - INTERVAL '24 hours' THEN
    UPDATE public.site_stats
    SET visitor_count = visitor_count + 1, updated_at = NOW()
    WHERE id = 1
    RETURNING visitor_count INTO new_count;

    INSERT INTO public.visitor_fingerprints (fingerprint_hash, last_visited_at)
    VALUES (p_fingerprint_hash, NOW())
    ON CONFLICT (fingerprint_hash) DO UPDATE
    SET last_visited_at = NOW();

    RETURN new_count;
  ELSE
    SELECT visitor_count INTO new_count FROM public.site_stats WHERE id = 1;
    RETURN new_count;
  END IF;
END;
$$;

-- 允许匿名用户调用此函数
GRANT EXECUTE ON FUNCTION public.increment_visitor_if_new(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_visitor_if_new(TEXT) TO authenticated;

-- 5. Realtime：将 site_stats 加入实时订阅（多人打开页面时数字会同步更新）
-- 若执行报错，请在 Supabase Dashboard → Database → Replication 中手动勾选 site_stats
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_stats;

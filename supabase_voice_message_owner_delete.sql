-- 留言板「仅本人可删除」：为 voices、messages 表增加 visitor_id，并添加安全删除 RPC
-- 执行前请先执行过 supabase_visitor_count.sql（本项目已使用 fingerprint，visitorId 可复用）
-- 在 Supabase Dashboard → SQL Editor 中执行本文件

-- 1. 为 voices 表增加 visitor_id 列
ALTER TABLE public.voices
ADD COLUMN IF NOT EXISTS visitor_id TEXT;

-- 2. 为 messages 表增加 visitor_id 列
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS visitor_id TEXT;

-- 3. 创建安全删除语音的 RPC：仅当 visitor_id 匹配时才删除
CREATE OR REPLACE FUNCTION public.delete_voice_if_owner(p_id UUID, p_visitor_id TEXT)
RETURNS TABLE(storage_path TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_path TEXT;
BEGIN
  SELECT v.storage_path INTO v_path
  FROM public.voices v
  WHERE v.id = p_id AND (v.visitor_id = p_visitor_id OR (v.visitor_id IS NULL AND p_visitor_id IS NULL));
  IF v_path IS NULL THEN
    RETURN; -- 无权限或不存在
  END IF;
  DELETE FROM public.voices WHERE id = p_id;
  RETURN QUERY SELECT v_path;
END;
$$;

-- 4. 创建安全删除文字留言的 RPC
CREATE OR REPLACE FUNCTION public.delete_message_if_owner(p_id UUID, p_visitor_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted BOOLEAN;
BEGIN
  WITH deleted AS (
    DELETE FROM public.messages
    WHERE id = p_id AND (visitor_id = p_visitor_id OR (visitor_id IS NULL AND p_visitor_id IS NULL))
    RETURNING id
  )
  SELECT EXISTS(SELECT 1 FROM deleted) INTO v_deleted;
  RETURN v_deleted;
END;
$$;

-- 5. 可选：移除公开 DELETE 策略，强制只能通过 RPC 删除（更安全）
-- 执行后，前端的 supabase.from('voices').delete() 会因 RLS 拒止而失败，必须改用 RPC
-- DROP POLICY IF EXISTS "Public delete voices" ON public.voices;
-- DROP POLICY IF EXISTS "Public delete messages" ON public.messages;
-- 若暂时不执行上述 DROP，旧前端仍可删除任意记录；新前端改用 RPC 后，仅本人可删。

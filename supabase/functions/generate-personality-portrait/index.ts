/**
 * 人格画像生成
 * 分析文字、图片、时间轴等内容，提取人格特质，形成词云数据
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AggregatedContent {
  essays?: { title: string; excerpt?: string; content?: string; category?: string }[];
  projects?: { title: string; description?: string; tags?: string[] }[];
  photos?: { caption: string; location?: string }[];
  timeline?: { year: string; event: string; location?: string }[];
  yearReviews?: { annual_word?: string; summary_done?: string; summary_success?: string }[];
  personalInfo?: { bio?: string };
}

interface ReqBody {
  period: string;  // "2026-02"
  aggregatedContent: AggregatedContent;
}

function buildPrompt(body: ReqBody): string {
  const { period, aggregatedContent } = body;
  const d = aggregatedContent;

  const essayText = (d.essays ?? []).map((e) => `${e.title}\n${e.excerpt ?? ""}\n${e.content ?? ""}`).join("\n\n");
  const projectText = (d.projects ?? []).map((p) => `${p.title} ${p.description ?? ""} ${(p.tags ?? []).join(" ")}`).join("\n");
  const photoText = (d.photos ?? []).map((p) => `${p.caption ?? ""} ${p.location ?? ""}`).join(" ");
  const timelineText = (d.timeline ?? []).map((t) => `${t.year} ${t.event} ${t.location ?? ""}`).join(" ");
  const reviewText = (d.yearReviews ?? []).map((r) => `${r.annual_word ?? ""} ${r.summary_done ?? ""} ${r.summary_success ?? ""}`).join(" ");
  const bio = d.personalInfo?.bio ?? "";

  return `你是人格分析专家。根据以下「张苑逸」的创作与生活记录，提炼她的人格特质、性格关键词，形成「人格画像」词云。

目标月份：${period}

输入内容：
---
文章/随笔：
${essayText.slice(0, 3000) || "（无）"}

项目：
${projectText.slice(0, 800) || "（无）"}

照片描述：
${photoText.slice(0, 800) || "（无）"}

时间轴事件：
${timelineText.slice(0, 1000) || "（无）"}

年度总结片段：
${reviewText.slice(0, 800) || "（无）"}

个人简介：
${bio.slice(0, 300) || "（无）"}
---

请 strictly 按以下 JSON 格式输出，不要其他文字：
{
  "words": [
    { "text": "关键词或短语（2-12字）", "weight": 0.3 },
    ...
  ]
}

要求：
- 提取 15-25 个词/短语，涵盖性格、价值观、气质、处事方式等
- weight 范围 0.2-1.0，越核心特质越大
- 可包含短句如「有话直说」「易燃易爆」（参考白羊座式表达）
- 用中文，口语化、有感染力`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as ReqBody;
    const { period } = body;

    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      return Response.json(
        { error: "period required, format: YYYY-MM" },
        { status: 400, headers: corsHeaders }
      );
    }

    const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
    if (!apiKey) {
      return Response.json(
        { error: "Missing DEEPSEEK_API_KEY" },
        { status: 500, headers: corsHeaders }
      );
    }

    const userPrompt = buildPrompt(body);
    const res = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "你只输出合法的 JSON，不要 markdown 代码块或其他文字。" },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1200,
        temperature: 0.7,
      }),
    });

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };

    if (!res.ok) {
      return Response.json(
        { error: json?.error?.message ?? `API ${res.status}` },
        { status: 502, headers: corsHeaders }
      );
    }

    let content = json?.choices?.[0]?.message?.content?.trim() ?? "";
    content = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(content) as { words?: { text: string; weight: number }[] };

    if (!Array.isArray(parsed.words) || parsed.words.length === 0) {
      return Response.json(
        { error: "AI did not return valid words array" },
        { status: 502, headers: corsHeaders }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceKey) {
      return Response.json(
        { error: "Missing SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: row, error } = await supabase
      .from("personality_portraits")
      .upsert(
        { period, words: parsed.words, created_at: new Date().toISOString() },
        { onConflict: "period" }
      )
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }

    return Response.json({ portrait: row }, { headers: corsHeaders });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500, headers: corsHeaders }
    );
  }
});

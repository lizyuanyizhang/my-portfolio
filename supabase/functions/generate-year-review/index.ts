/**
 * Year in Review 生成
 * 接收聚合数据，调用 AI 生成结构化总结，写入 year_reviews 表
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AggregatedData {
  essays?: { id: string; title: string; date: string; category?: string }[];
  projects?: { id: string; title: string; date?: string; tags?: string[] }[];
  photos?: { id: string; caption: string; date?: string; location?: string }[];
  videos?: { id: string; title: string; date?: string }[];
  voices_count?: number;
  messages_count?: number;
}

interface ReqBody {
  periodType: "week" | "month" | "quarter" | "half_year" | "year";
  periodValue: string;
  aggregatedData: AggregatedData;
}

function buildPrompt(body: ReqBody): string {
  const { periodType, periodValue, aggregatedData } = body;
  const d = aggregatedData;

  const essays = d.essays ?? [];
  const projects = d.projects ?? [];
  const photos = d.photos ?? [];
  const videos = d.videos ?? [];

  return `你是一位兼具数据思维与哲学家/创业者视角的年度复盘助手，为「张苑逸」生成个人周期总结。

周期：${periodType} / ${periodValue}

输入数据：
- 文章 ${essays.length} 篇：${essays.map((e) => `${e.title}(${e.date})`).join("、") || "无"}
- 项目 ${projects.length} 个：${projects.map((p) => p.title).join("、") || "无"}
- 照片 ${photos.length} 张：${photos.slice(0, 5).map((p) => p.caption).join("、") || "无"}${photos.length > 5 ? "..." : ""}
- 视频 ${videos.length} 个：${videos.map((v) => v.title).join("、") || "无"}
- 语音留言 ${d.voices_count ?? 0} 条
- 文字留言 ${d.messages_count ?? 0} 条

请严格按照以下 JSON 格式输出，不要包含任何其他文字或 markdown：

{
  "annual_word": "仅当 periodType 为 year 时填一个词，如「持续迭代」；否则空字符串",
  "metrics": {
    "essays_written": ${essays.length},
    "projects_shipped": ${projects.length},
    "photos_added": ${photos.length},
    "videos_published": ${videos.length},
    "voice_messages_received": ${d.voices_count ?? 0},
    "text_messages_received": ${d.messages_count ?? 0}
  },
  "summary_done": "做了什么，3-5 条 bullet，用中文",
  "summary_success": "成功了什么，2-3 条，用中文",
  "summary_fail": "失败了什么或未完成，坦诚 1-2 条，用中文",
  "summary_learned": "学到了什么，1-2 条，用中文",
  "encouragement": "50-100 字，以哲学家或顶级创业者的口吻鼓励她，用中文"
}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as ReqBody;
    const { periodType, periodValue } = body;

    if (!periodType || !periodValue) {
      return Response.json(
        { error: "periodType and periodValue required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const year = periodValue.split("-")[0].split("Q")[0];
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
    const parsed = JSON.parse(content) as {
      annual_word?: string;
      metrics?: Record<string, number>;
      summary_done?: string;
      summary_success?: string;
      summary_fail?: string;
      summary_learned?: string;
      encouragement?: string;
    };

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
      .from("year_reviews")
      .insert({
        period_type: periodType,
        period_value: periodValue,
        year,
        annual_word: parsed.annual_word || null,
        metrics: parsed.metrics ?? {},
        highlights: [],
        summary_done: parsed.summary_done || null,
        summary_success: parsed.summary_success || null,
        summary_fail: parsed.summary_fail || null,
        summary_learned: parsed.summary_learned || null,
        encouragement: parsed.encouragement || null,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }

    return Response.json({ review: row }, { headers: corsHeaders });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500, headers: corsHeaders }
    );
  }
});

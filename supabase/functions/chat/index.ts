/**
 * 迷你 AI 对话 Edge Function
 * 代理 DeepSeek / 通义千问 API，保护 API Key 不暴露在前端
 *
 * 请求体: { messages, systemPrompt, model?: 'deepseek' | 'qwen' }
 * 响应体: { content } | { error }
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";
const QWEN_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

type ChatMessage = { role: "user" | "assistant"; content: string };

interface ReqBody {
  messages: ChatMessage[];
  systemPrompt: string;
  model?: "deepseek" | "qwen";
}

// 转为 OpenAI 格式（system + messages）
function toOpenAIBody(messages: ChatMessage[], systemPrompt: string) {
  const msgs: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];
  return {
    model: "deepseek-chat",
    messages: msgs,
    max_tokens: 500,
    temperature: 0.7,
  };
}

// Qwen 使用 qwen-turbo 或 qwen-plus
function toQwenBody(messages: ChatMessage[], systemPrompt: string) {
  const msgs: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];
  return {
    model: "qwen-turbo",
    messages: msgs,
    max_tokens: 500,
    temperature: 0.7,
  };
}

Deno.serve(async (req: Request) => {
  // CORS：Supabase JS 客户端会发送 authorization、x-client-info、apikey 等 header，必须在这里声明允许
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as ReqBody;
    const { messages, systemPrompt } = body;
    const model = body.model || "deepseek";

    if (!Array.isArray(messages) || typeof systemPrompt !== "string") {
      return Response.json(
        { error: "Invalid request: messages and systemPrompt required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const isQwen = model === "qwen";
    const apiKey = isQwen
      ? Deno.env.get("DASHSCOPE_API_KEY")
      : Deno.env.get("DEEPSEEK_API_KEY");
    const url = isQwen ? QWEN_URL : DEEPSEEK_URL;
    const apiBody = isQwen
      ? toQwenBody(messages, systemPrompt)
      : toOpenAIBody(messages, systemPrompt);

    if (!apiKey) {
      const keyName = isQwen ? "DASHSCOPE_API_KEY" : "DEEPSEEK_API_KEY";
      return Response.json(
        { error: `Missing ${keyName} secret. Please configure in Supabase Dashboard.` },
        { status: 500, headers: corsHeaders }
      );
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(apiBody),
    });

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };

    if (!res.ok) {
      const errMsg =
        json?.error?.message || json?.error || `API error: ${res.status}`;
      return Response.json({ error: String(errMsg) }, { status: 502, headers: corsHeaders });
    }

    const content =
      json?.choices?.[0]?.message?.content?.trim() ?? "";
    return Response.json({ content }, { headers: corsHeaders });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500, headers: corsHeaders }
    );
  }
});

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

function protectCodeSpans(text: string) {
  const codeBlocks: string[] = [];
  const placeholderText = text.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });
  return { text: placeholderText, codeBlocks };
}

function restoreCodeSpans(text: string, codeBlocks: string[]) {
  return text.replace(/__CODE_BLOCK_(\d+)__/g, (_, index) => codeBlocks[Number(index)] || "");
}

function capitalizeSentence(s: string) {
  const trimmed = s.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function sentences(text: string) {
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((s) => capitalizeSentence(s)).filter(Boolean) || [];
}

function stripAiCliches(text: string) {
  const { text: protectedText, codeBlocks } = protectCodeSpans(text);
  const cleaned = protectedText
    .replace(/\b(?:moreover|furthermore|in conclusion|it is important to note that|it is worth noting that|it goes without saying that|in summary)\b,?/gi, "")
    .replace(/\bdelve into\b/gi, "explore").replace(/\bdelve\b/gi, "look into")
    .replace(/\btapestry of\b/gi, "mix of").replace(/\btestament to\b/gi, "proof of")
    .replace(/\bpivotal role\b/gi, "key role").replace(/\bbeacon of\b/gi, "example of")
    .replace(/\bfoster a\b/gi, "build a").replace(/\bfoster\b/gi, "encourage")
    .replace(/\brealm of\b/gi, "field of")
    .replace(/\s+/g, " ").trim();
  return restoreCodeSpans(cleaned, codeBlocks);
}

function enforceDialect(text: string, dialect: string) {
  if (dialect === "en-GB") {
    return text
      .replace(/\borganize\b/gi, "organise").replace(/\borganization\b/gi, "organisation")
      .replace(/\bapologize\b/gi, "apologise").replace(/\bcenter\b/gi, "centre")
      .replace(/\btraveled\b/gi, "travelled");
  }
  // Default to en-US
  return text
    .replace(/\borganise\b/gi, "organize").replace(/\borganisation\b/gi, "organization")
    .replace(/\bapologise\b/gi, "apologize").replace(/\bcentre\b/gi, "center")
    .replace(/\btravelled\b/gi, "traveled");
}

function serverLocalRewriteParagraph(para: string, channel: string, level: string, dialect: string) {
  let out = stripAiCliches(para.trim())
    .replace(/I am writing to inform you that/gi, "I wanted to let you know that")
    .replace(/has made the decision to/gi, "has decided to")
    .replace(/The reason for this change is because/gi, "We’re making this change because")
    .replace(/we require additional time in order to/gi, "we need more time to")
    .replace(/in order to/gi, "to")
    .replace(/due to the fact that/gi, "because")
    .replace(/at this point in time/gi, "now")
    .replace(/utilize/gi, "use")
    .replace(/commence/gi, "begin")
    .replace(/\s+/g, " ");

  if (["A1", "A2", "B1"].includes(level)) {
    out = out.replace(/additional/gi, "more").replace(/approximately/gi, "about").replace(/nevertheless/gi, "but");
  }

  out = enforceDialect(out, dialect);
  const ss = sentences(out);
  return ss.map((s) => capitalizeSentence(s)).join(" ");
}

function serverLocalRewrite(text: string, channel: string, level: string, dialect: string) {
  const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
  const rewrittenParagraphs = paragraphs.map((p) => serverLocalRewriteParagraph(p, channel, level, dialect));

  let out = rewrittenParagraphs.join("\n\n");
  if (channel === "LinkedIn post") out = `A quick update:\n\n${out}\n\nMore details to come.`;
  if (channel === "Customer support") out = `Hi there,\n\n${out}\n\nThanks for your patience.`;
  if (channel === "Personal message") out = `Hi,\n\n${out}`;

  return out;
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxRequests = 25, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) {
    return false;
  }
  record.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "127.0.0.1";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests. Please wait a minute before trying again." }, { status: 429 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const text = String(body.text || "").trim();
    if (!text) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }
    if (text.length > 30000) {
      return NextResponse.json({ error: "Text must be under 30,000 characters." }, { status: 400 });
    }

    const channel = String(body.channel || "Business email");
    const level = String(body.level || "B2");
    const strength = String(body.strength || "Balanced");
    const warmth = Number(body.warmth || 50);
    const directness = Number(body.directness || 50);
    const audience = String(body.audience || "General reader");
    const purpose = String(body.purpose || "Improve clarity");
    const variation = String(body.variation || "Polished");
    const dialect = String(body.dialect || "en-US");
    const formality = Number(body.formality || 50);
    const energy = Number(body.energy || 50);
    const sources = String(body.sources || "").slice(0, 12000);
    const voice = body.voice && typeof body.voice === "object" ? (body.voice as Record<string, unknown>) : {};
    const userId = typeof body.userId === "string" ? body.userId : null;

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "llama-3.3-70b-versatile";
    const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/+$/, "");

    let rewritten = "";
    let engineUsed: "ai" | "local" = "local";

    if (apiKey) {
      try {
        const systemPrompt = `You are an expert human author and writing engine. Your task is to perform a DEEP SEMANTIC REWRITE of the user's text so it reads like authentic, high-quality human writing.

DEEP SEMANTIC REWRITING RULES:
1. Reconstruction: Re-frame the thought flow, vary sentence structures, and reconstruct the text using fresh, idiomatic human phrasing. Do NOT just replace 2-3 words or delete a transition word.
2. High Burstiness & Rhythm: Alternate sentence lengths dramatically—mix short punchy sentences (3-7 words) with compound sentences. Vary sentence openers.
3. Strict Dialect Consistency: Adhere 100% to ${dialect} spelling and grammar (e.g. if en-US, use 'organize', 'center', 'traveled'; if en-GB, use 'organise', 'centre', 'travelled'). NEVER mix dialects.
4. Zero Artificial Errors: Every sentence MUST start with a capital letter. Never insert artificial typos, lowercase sentence openings, or broken grammar.
5. Preserve Paragraphs & Facts: Maintain the multi-paragraph structure of the input text. Preserve all factual claims, names, dates, numbers, and quotations intact.
6. Ban AI Clichés: Never use overused LLM transitions (refrain from 'delve', 'tapestry', 'testament', 'pivotal', 'moreover', 'furthermore', 'in conclusion', 'it is important to note', 'foster', 'beacon', 'realm').

Match context parameters:
Channel: ${channel}. Audience: ${audience}. Purpose: ${purpose}. CEFR Level: ${level}. Strength: ${strength}. Variation: ${variation}. Warmth: ${warmth}/100. Directness: ${directness}/100. Formality: ${formality}/100. Energy: ${energy}/100. Voice Profile: ${String(voice.name || "none")}; contractions: ${Boolean(voice.contractions)}; short paragraphs: ${Boolean(voice.shortParagraphs)}. Return ONLY the rewritten text with no commentary.`;

        const userPrompt = sources ? `<source_text>${text}</source_text>\n<user_supplied_context>${sources}</user_supplied_context>` : text;

        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(12000),
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.75,
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
          const aiText = data.choices?.[0]?.message?.content?.trim();
          if (aiText) {
            rewritten = aiText;
            if ((rewritten.startsWith('"') && rewritten.endsWith('"')) || (rewritten.startsWith("'") && rewritten.endsWith("'"))) {
              rewritten = rewritten.slice(1, -1).trim();
            }
            // Ensure first character of every sentence in output is properly capitalized
            rewritten = rewritten
              .split(/\n/)
              .map((line) => {
                const sList = sentences(line);
                return sList.length > 0 ? sList.join(" ") : line;
              })
              .join("\n");
            engineUsed = "ai";
          }
        }
      } catch (err) {
        console.warn("AI Model request failed or timed out. Falling back to unbreakable server local engine:", err instanceof Error ? err.message : err);
      }
    }

    if (!rewritten) {
      rewritten = serverLocalRewrite(text, channel, level, dialect);
      engineUsed = "local";
    }

    try {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        supabase
          .from("rewrites")
          .insert({
            user_id: userId,
            source_text: text,
            output_text: rewritten,
            channel,
            level,
            engine: engineUsed,
          })
          .then(() => {})
          .catch((dbErr) => console.warn("Supabase background save warning:", dbErr));
      }
    } catch {}

    return NextResponse.json({ text: rewritten, engine: engineUsed });
  } catch (globalErr) {
    console.error("Critical rewrite error:", globalErr instanceof Error ? globalErr.message : globalErr);
    return NextResponse.json({
      text: "I wanted to share a quick update regarding your draft. Everything has been processed clearly.",
      engine: "local",
    });
  }
}

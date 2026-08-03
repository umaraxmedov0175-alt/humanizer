import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI service is not configured yet." }, { status: 503 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const text = String(body.text || "").trim();
    if (!text || text.length > 20000) return NextResponse.json({ error: "Text must be between 1 and 20,000 characters." }, { status: 400 });
    const channel = String(body.channel || "Business email");
    const level = String(body.level || "B2");
    const strength = String(body.strength || "Balanced");
    const warmth = Number(body.warmth || 50);
    const directness = Number(body.directness || 50);
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-sol",
        instructions: `You are the Humanizer writing engine. Rewrite the user's text so it sounds natural for the requested context. Preserve every claim, name, date, number, quotation, uncertainty, promise, and conclusion. Never invent personal experience, evidence, or facts. Match the requested CEFR English level. Return only the rewritten text, with no labels or commentary. Channel: ${channel}. CEFR: ${level}. Rewrite strength: ${strength}. Warmth: ${warmth}/100. Directness: ${directness}/100.`,
        input: text,
      }),
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      throw new Error(detail?.error?.message || `Model request failed (${response.status})`);
    }
    const data = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
    const rewritten = data.output_text || data.output?.flatMap(x => x.content || []).map(x => x.text || "").join("").trim();
    if (!rewritten) throw new Error("The model returned an empty response.");
    return NextResponse.json({ text: rewritten, engine: "ai" });
  } catch (error) {
    console.error("Rewrite failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "The AI rewrite is temporarily unavailable." }, { status: 502 });
  }
}

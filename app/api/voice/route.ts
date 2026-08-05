import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase database is not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId parameter is required." }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("voice_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ voice: data || null });
  } catch (error) {
    console.error("Fetch voice error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Failed to fetch voice profile." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase database is not configured." }, { status: 503 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const userId = String(body.userId || "").trim();
    const name = String(body.name || "Default Voice").trim();
    const sample = String(body.sample || "").trim();
    const contractions = Boolean(body.contractions ?? true);
    const shortParagraphs = Boolean(body.shortParagraphs ?? true);

    if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

    const { data, error } = await supabase
      .from("voice_profiles")
      .insert({
        user_id: userId,
        name,
        sample,
        contractions,
        short_paragraphs: shortParagraphs,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ voice: data });
  } catch (error) {
    console.error("Save voice error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Failed to save voice profile." }, { status: 500 });
  }
}

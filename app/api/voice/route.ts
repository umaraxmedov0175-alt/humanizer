import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ voice: null });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ voice: null });
    }

    const { data, error } = await supabase
      .from("voice_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("Supabase fetch voice warning:", error.message);
      return NextResponse.json({ voice: null });
    }
    return NextResponse.json({ voice: data || null });
  } catch (error) {
    console.warn("Fetch voice error caught safely:", error instanceof Error ? error.message : error);
    return NextResponse.json({ voice: null });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ voice: null });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const userId = String(body.userId || "default-user").trim();
    const name = String(body.name || "Default Voice").trim();
    const sample = String(body.sample || "").trim();
    const contractions = Boolean(body.contractions ?? true);
    const shortParagraphs = Boolean(body.shortParagraphs ?? true);

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
      .maybeSingle();

    if (error) {
      console.warn("Supabase save voice warning:", error.message);
      return NextResponse.json({ voice: null });
    }
    return NextResponse.json({ voice: data });
  } catch (error) {
    console.warn("Save voice error caught safely:", error instanceof Error ? error.message : error);
    return NextResponse.json({ voice: null });
  }
}

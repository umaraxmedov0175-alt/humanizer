import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase database is not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  try {
    let query = supabase.from("rewrites").select("*").order("created_at", { ascending: false }).limit(20);
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ history: data || [] });
  } catch (error) {
    console.error("Fetch history error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Failed to fetch history from database." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase database is not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  try {
    let query = supabase.from("rewrites").delete();
    if (userId) {
      query = query.eq("user_id", userId);
    } else {
      query = query.neq("id", "00000000-0000-0000-0000-000000000000");
    }
    const { error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete history error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Failed to clear history." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ history: [] });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    let query = supabase.from("rewrites").select("*").order("created_at", { ascending: false }).limit(20);
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { data, error } = await query;
    if (error) {
      console.warn("Supabase fetch history warning:", error.message);
      return NextResponse.json({ history: [] });
    }
    return NextResponse.json({ history: data || [] });
  } catch (error) {
    console.warn("Fetch history error caught safely:", error instanceof Error ? error.message : error);
    return NextResponse.json({ history: [] });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: true });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    let query = supabase.from("rewrites").delete();
    if (userId) {
      query = query.eq("user_id", userId);
    } else {
      query = query.neq("id", "00000000-0000-0000-0000-000000000000");
    }
    const { error } = await query;
    if (error) {
      console.warn("Supabase delete history warning:", error.message);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.warn("Delete history error caught safely:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: true });
  }
}

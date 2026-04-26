import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const { origin } = req.nextUrl;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from("whoop_tokens").delete().eq("id", "singleton");
    } catch (err) {
      console.error("WHOOP disconnect error:", err);
    }
  }

  return NextResponse.redirect(`${origin}/?whoop=disconnected`);
}

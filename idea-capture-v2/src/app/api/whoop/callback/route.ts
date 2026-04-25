import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const WHOOP_CLIENT_ID = (process.env.WHOOP_CLIENT_ID ?? "").trim();
const WHOOP_CLIENT_SECRET = (process.env.WHOOP_CLIENT_SECRET ?? "").trim();

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");

  if (oauthError || !code) {
    const reason = oauthError ?? "no_code";
    return NextResponse.redirect(
      `${origin}/?whoop=error&reason=${encodeURIComponent(reason)}`
    );
  }

  const redirectUri = `${origin}/api/whoop/callback`;

  // Exchange code for tokens
  let tokenData: {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  try {
    const tokenRes = await fetch(
      "https://api.prod.whoop.com/oauth/oauth2/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: WHOOP_CLIENT_ID,
          client_secret: WHOOP_CLIENT_SECRET,
        }).toString(),
      }
    );

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      console.error("WHOOP token exchange failed:", tokenRes.status, body);
      return NextResponse.redirect(
        `${origin}/?whoop=error&reason=token_exchange`
      );
    }

    tokenData = await tokenRes.json();
  } catch (err) {
    console.error("WHOOP token exchange error:", err);
    return NextResponse.redirect(`${origin}/?whoop=error&reason=network`);
  }

  // Store tokens in Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error } = await supabase.from("whoop_tokens").upsert({
        id: "singleton",
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? null,
        expires_at: tokenData.expires_in
          ? Date.now() + tokenData.expires_in * 1000
          : null,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error("Supabase whoop_tokens upsert error:", error);
      }
    } catch (err) {
      console.error("Supabase error:", err);
    }
  }

  return NextResponse.redirect(`${origin}/?whoop=connected`);
}

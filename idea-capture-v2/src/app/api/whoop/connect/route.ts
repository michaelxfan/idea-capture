import { NextRequest, NextResponse } from "next/server";

const WHOOP_CLIENT_ID = (process.env.WHOOP_CLIENT_ID ?? "").trim();

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/whoop/callback`;

  const params = new URLSearchParams({
    client_id: WHOOP_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "read:recovery read:sleep",
    state: "idea-capture",
  });

  return NextResponse.redirect(
    `https://api.prod.whoop.com/oauth/oauth2/auth?${params.toString()}`
  );
}

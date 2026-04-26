import { NextResponse } from "next/server";
import { fetchConversations } from "@/lib/db";

export async function GET() {
  const conversations = await fetchConversations(30);
  return NextResponse.json({ conversations });
}

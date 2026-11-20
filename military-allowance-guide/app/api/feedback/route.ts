import { NextResponse } from "next/server";
import { checkInput } from "@/lib/safety";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

const REASONS = new Set(["wrong", "outdated", "unclear", "not_answered", "other"]);
const UUID = /^[0-9a-f-]{36}$/i;

export async function POST(req: Request) {
  let body: { logId?: unknown; rating?: unknown; reason?: unknown; comment?: unknown; question?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const rating = body.rating === "up" || body.rating === "down" ? body.rating : null;
  if (!rating) return NextResponse.json({ error: "평가 값이 올바르지 않습니다." }, { status: 400 });
  const reason = typeof body.reason === "string" && REASONS.has(body.reason) ? body.reason : null;
  const comment = typeof body.comment === "string" ? checkInput(body.comment.slice(0, 300)).masked : null;
  const question = typeof body.question === "string" ? checkInput(body.question.slice(0, 500)).masked : null;
  const logId = typeof body.logId === "string" && UUID.test(body.logId) ? body.logId : null;

  const sb = getSupabase();
  if (!sb) return NextResponse.json({ ok: true, stored: false });

  const { error } = await sb.from("chat_feedback").insert({ log_id: logId, rating, reason, comment, question_masked: question });
  if (error) {
    console.error("feedback insert failed", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true, stored: true });
}

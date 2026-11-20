import { NextResponse } from "next/server";
import {
  buildContext,
  callClaude,
  followUpsFor,
  retrieve,
  ruleBasedAnswer,
  toSource,
  type ChatResponse,
  type ChatTurn,
} from "@/lib/chat";
import { checkInput } from "@/lib/safety";
import { inferTarget } from "@/lib/search";
import { chatLogEnabled, getSupabase } from "@/lib/supabase";
import type { Target } from "@/lib/types";

export const runtime = "nodejs";

const MAX_LEN = 500;

// 간단한 IP별 요청 제한 (서버리스 인스턴스 단위, 최선 노력)
const hits = new Map<string, { n: number; t: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 60_000) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  h.n += 1;
  return h.n > 20;
}

const isTarget = (v: unknown): v is Target => v === "officer" || v === "soldier" || v === "civilian";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "요청이 너무 많습니다. 1분 뒤에 다시 시도해 주세요." }, { status: 429 });
  }

  let body: { question?: unknown; target?: unknown; history?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const raw = typeof body.question === "string" ? body.question.trim() : "";
  if (!raw) return NextResponse.json({ error: "질문을 입력해 주세요." }, { status: 400 });
  if (raw.length > MAX_LEN) {
    return NextResponse.json({ error: `질문은 ${MAX_LEN}자 이내로 입력해 주세요.` }, { status: 400 });
  }
  const target = isTarget(body.target) ? body.target : undefined;
  const history: ChatTurn[] = Array.isArray(body.history)
    ? body.history
        .filter(
          (t): t is ChatTurn =>
            !!t && typeof t === "object" && (t.role === "user" || t.role === "assistant") && typeof t.content === "string",
        )
        .slice(-6)
        .map((t) => ({ role: t.role, content: checkInput(t.content.slice(0, 1500)).masked }))
    : [];

  const safety = checkInput(raw);
  const question = safety.masked;

  let response: ChatResponse;
  if (safety.securityFound.length) {
    response = {
      answer: "보안과 관련된 내용은 이 상담에서 다루지 않습니다. 수당 이름이나 상황(결혼, 출산, 전입 등)으로 다시 물어봐 주세요.",
      sources: [],
      followUps: followUpsFor({ allowances: [], faqs: [], guides: [] }, target),
      mode: "blocked",
    };
  } else {
    // 직전 질문까지 합쳐 검색하면 "그건 얼마예요?" 같은 후속 질문도 맥락을 찾습니다.
    const lastUser = [...history].reverse().find((t) => t.role === "user")?.content ?? "";
    let r = retrieve(question, target);
    if (r.allowances.length === 0 && lastUser) r = retrieve(`${lastUser} ${question}`, target);

    let answer: string | null = null;
    try {
      answer = await callClaude(question, history, buildContext(r), target);
    } catch (e) {
      console.error("chat ai failed", e);
    }
    if (answer) {
      response = {
        answer,
        sources: r.allowances.slice(0, 3).map(toSource),
        followUps: followUpsFor(r, target),
        mode: "ai",
      };
    } else {
      response = { ...ruleBasedAnswer(question, r, target), followUps: followUpsFor(r, target) };
    }
    if (!target && !inferTarget(question) && r.allowances.length && r.allowances[0].targets.length > 1 && response.mode !== "ai") {
      response.askTarget = true;
    }
  }

  if (safety.piiFound.length) {
    response.answer = `입력하신 ${safety.piiFound.join(", ")}는 가리고 처리했습니다. 개인정보는 입력하지 말아 주세요.\n\n${response.answer}`;
  }

  // 대화 로그 저장 (Supabase 연결 + CHAT_LOG_ENABLED=true 일 때만, 개인정보는 가린 상태로)
  const sb = getSupabase();
  if (sb && chatLogEnabled()) {
    const { data, error } = await sb
      .from("chat_logs")
      .insert({
        question_masked: question,
        answer: response.answer,
        source_ids: response.sources.map((s) => s.id),
        target: target ?? null,
        mode: response.mode,
      })
      .select("id")
      .single();
    if (error) console.error("chat log insert failed", error.message);
    else response.logId = data.id as string;
  }

  return NextResponse.json(response);
}

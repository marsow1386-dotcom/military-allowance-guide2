import { inferTarget, normalize, searchAllowances, searchFaqs, searchGuides, tokens } from "@/lib/search";
import { TARGET_LABEL, type Allowance, type Faq, type Guide, type Target } from "@/lib/types";
import { dateKo } from "@/lib/format";
import { checkInput } from "@/lib/safety";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatSource {
  id: string;
  name: string;
  href: string;
  basis: string;
  verifiedAt: string;
  needsVerification: boolean;
  requiresApplication: boolean;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  followUps: string[];
  /** 답변 방식 */
  mode: "ai" | "rule" | "blocked" | "unknown";
  /** 신분을 되물어야 할 때 */
  askTarget?: boolean;
  logId?: string;
}

export const CONTACT_HINT = "소속 부대 인사·급여 담당";

export interface Retrieved {
  allowances: Allowance[];
  faqs: Faq[];
  guides: Guide[];
}

export function retrieve(question: string, target?: Target): Retrieved {
  const who = target ?? inferTarget(question);
  return {
    allowances: searchAllowances(question, who, 4).map((h) => h.item),
    faqs: searchFaqs(question, 2).map((h) => h.item),
    guides: searchGuides(question, 1).map((h) => h.item),
  };
}

export function toSource(a: Allowance): ChatSource {
  return {
    id: a.id,
    name: a.name,
    href: `/allowances/${a.id}`,
    basis: a.legalBasis.map((b) => (b.article ? `${b.title} ${b.article}` : b.title)).join(", "),
    verifiedAt: a.verifiedAt,
    needsVerification: a.needsVerification,
    requiresApplication: a.requiresApplication,
  };
}

/** 검색 결과를 AI에게 넘길 근거 문서로 만듭니다. */
export function buildContext(r: Retrieved): string {
  const parts: string[] = [];
  for (const a of r.allowances) {
    parts.push(
      [
        `## [${a.id}] ${a.name}`,
        `대상: ${a.targets.map((t) => TARGET_LABEL[t]).join(", ")}`,
        `요약: ${a.summary}`,
        `지급 기준: ${a.amount}`,
        a.amountTable ? `금액표: ${a.amountTable.map((x) => `${x.label} ${x.value}`).join(" / ")}` : "",
        `지급 대상: ${a.eligibility.join(" / ")}`,
        `신청: ${a.requiresApplication ? "신청 필요" : "자동 지급"} — ${a.howToApply.join(" ")}`,
        a.documents.length ? `서류: ${a.documents.join(", ")}` : "",
        a.notes.length ? `유의: ${a.notes.join(" ")}` : "",
        `근거: ${toSource(a).basis}`,
        `최종 확인일: ${dateKo(a.verifiedAt)}${a.needsVerification ? " (원문 재확인 필요 항목)" : ""}`,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
  for (const f of r.faqs) parts.push(`## FAQ: ${f.question}\n${f.answer}`);
  for (const g of r.guides) parts.push(`## 상황별 가이드: ${g.title}\n${g.summary}\n할 일: ${g.checklist.join(" / ")}`);
  return parts.join("\n\n");
}

export const SYSTEM_PROMPT = `당신은 대한민국 군 수당 안내 사이트의 상담원입니다.

규칙:
1. 아래 <근거> 안의 내용만 사용해 답합니다. 근거에 없는 금액·조건·규정은 절대 지어내지 않습니다.
2. 근거로 답할 수 없으면 "확인된 자료가 없어 정확히 안내하기 어렵습니다"라고 말하고 ${CONTACT_HINT}에게 문의하도록 안내합니다.
3. 답변 순서: 결론 한 문장 → 금액(근거에 있을 때만) → 신청 방법. 4~6문장 이내, 쉬운 말, 존댓말.
4. 금액은 근거에 적힌 숫자를 그대로 씁니다. 직접 계산이 필요하면 근거 숫자의 단순 합만 하고 "참고용"이라고 덧붙입니다.
5. "원문 재확인 필요"로 표시된 항목은 세부 조건을 소속 부대에서 확인하라고 덧붙입니다.
6. 개인 급여 지급 내역은 알 수 없습니다. 묻는다면 급여명세서와 ${CONTACT_HINT}를 안내합니다.
7. 부대 위치, 작전, 보안 관련 내용에는 답하지 않습니다.
8. 질문자의 신분(간부/병사/군무원)에 따라 답이 달라지는데 알 수 없으면, 가능한 경우를 나눠 짧게 답합니다.
9. 마크다운 제목·표는 쓰지 말고, 강조가 필요하면 **굵게**만 씁니다.`;

/** AI 없이 검색 결과로 답을 만듭니다. (API 키가 없거나 AI 호출이 실패했을 때) */
export function ruleBasedAnswer(question: string, r: Retrieved, target?: Target): Omit<ChatResponse, "followUps"> {
  const top = r.allowances[0];
  if (!top && r.faqs.length === 0) {
    return {
      answer: `확인된 자료에서 관련 수당을 찾지 못했습니다. 수당 이름(예: 가족수당, 주택수당)을 넣어 다시 물어보시거나 ${CONTACT_HINT}에게 문의해 주세요.`,
      sources: [],
      mode: "unknown",
    };
  }
  if (!top && r.faqs[0]) {
    return { answer: r.faqs[0].answer, sources: [], mode: "rule" };
  }
  const lines: string[] = [];
  // FAQ 질문과 사용자의 질문이 충분히 겹칠 때만 FAQ 답을 그대로 씁니다.
  const qToks = tokens(question).map(normalize);
  const faq = r.faqs.find(
    (f) => f.relatedAllowanceIds.includes(top.id) && qToks.filter((t) => normalize(f.question).includes(t)).length >= 2,
  );
  if (faq) {
    lines.push(faq.answer);
  } else {
    lines.push(`**${top.name}** — ${top.summary}`);
    lines.push(`지급 기준: ${top.amount}`);
  }
  if (target && !top.targets.includes(target)) {
    lines.push(`참고로 이 수당은 ${top.targets.map((t) => TARGET_LABEL[t]).join("·")} 대상이라 ${TARGET_LABEL[target]}에게는 해당하지 않을 수 있습니다.`);
  }
  lines.push(top.requiresApplication ? `**신청해야 받습니다.** ${top.howToApply[0]}` : top.howToApply[0]);
  if (top.needsVerification) lines.push(`세부 조건은 ${CONTACT_HINT}에게 꼭 확인하세요.`);
  const others = r.allowances.slice(1, 3).map((a) => a.name);
  if (others.length) lines.push(`함께 볼 만한 수당: ${others.join(", ")}`);
  return { answer: lines.join("\n"), sources: r.allowances.slice(0, 3).map(toSource), mode: "rule" };
}

export function followUpsFor(r: Retrieved, target?: Target): string[] {
  const top = r.allowances[0];
  const base: string[] = [];
  if (top) {
    if (top.requiresApplication) base.push(`${top.name} 신청할 때 필요한 서류는?`);
    for (const a of r.allowances.slice(1, 3)) base.push(`${a.name}은 누가 받나요?`);
  }
  const defaults: Record<Target, string[]> = {
    soldier: ["병장 월급이랑 적금 합치면 얼마예요?", "적금 매칭은 언제 받나요?"],
    officer: ["결혼하면 받는 수당은?", "주택수당 대상인가요?"],
    civilian: ["자녀가 태어나면 가족수당은?", "연가보상비는 어떻게 받나요?"],
  };
  const pool = [...base, ...(target ? defaults[target] : ["결혼하면 받는 수당은?", "병장 월급은 얼마예요?"])];
  return Array.from(new Set(pool)).slice(0, 3);
}

/** Claude Messages API 호출. 키가 없으면 null */
export async function callClaude(question: string, history: ChatTurn[], context: string, target?: Target): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
  const who = target ? `질문자 신분: ${TARGET_LABEL[target]}` : "질문자 신분: 알 수 없음";
  const messages = [
    ...history.slice(-6).map((t) => ({ role: t.role, content: t.content })),
    { role: "user" as const, content: `${who}\n\n<근거>\n${context || "(관련 자료 없음)"}\n</근거>\n\n질문: ${question}` },
  ];
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model, max_tokens: 700, system: SYSTEM_PROMPT, messages }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) {
    console.error("Claude API error", res.status, await res.text().catch(() => ""));
    return null;
  }
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = data.content?.filter((c) => c.type === "text").map((c) => c.text).join("").trim();
  return text || null;
}

/**
 * 서버 없이 브라우저에서 바로 답을 만듭니다(정적 미리보기용).
 * 서버 API와 같은 검색·규칙을 쓰고, AI 호출과 로그 저장만 빠집니다.
 */
export function localRespond(raw: string, target: Target | undefined, history: ChatTurn[]): ChatResponse {
  const safety = checkInput(raw.trim());
  let res: ChatResponse;
  if (safety.securityFound.length) {
    res = {
      answer: "보안과 관련된 내용은 이 상담에서 다루지 않습니다. 수당 이름이나 상황(결혼, 출산, 전입 등)으로 다시 물어봐 주세요.",
      sources: [],
      followUps: followUpsFor({ allowances: [], faqs: [], guides: [] }, target),
      mode: "blocked",
    };
  } else {
    const lastUser = [...history].reverse().find((t) => t.role === "user")?.content ?? "";
    let r = retrieve(safety.masked, target);
    if (r.allowances.length === 0 && lastUser) r = retrieve(`${lastUser} ${safety.masked}`, target);
    res = { ...ruleBasedAnswer(safety.masked, r, target), followUps: followUpsFor(r, target) };
    if (!target && !inferTarget(raw) && r.allowances.length && r.allowances[0].targets.length > 1) res.askTarget = true;
  }
  if (safety.piiFound.length) {
    res.answer = `입력하신 ${safety.piiFound.join(", ")}는 가리고 처리했습니다. 개인정보는 입력하지 말아 주세요.\n\n${res.answer}`;
  }
  return res;
}

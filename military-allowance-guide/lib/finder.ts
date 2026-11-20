import {
  allowances,
  FAMILY_ALLOWANCE,
  HOUSING_ALLOWANCE,
  SAVINGS_MATCH_MONTHLY_CAP,
  SOLDIER_PAY,
} from "@/data/allowances";
import type { Allowance, Target } from "@/lib/types";

export const SOLDIER_RANKS = ["이병", "일병", "상병", "병장"] as const;
export const OFFICER_RANKS = [
  "하사", "중사", "상사", "원사", "준위",
  "소위", "중위", "대위", "소령", "중령", "대령",
  "준장", "소장", "중장", "대장",
] as const;

/** 주택수당 대상: 하사 이상 중령 이하 */
const HOUSING_RANKS = new Set(OFFICER_RANKS.slice(0, OFFICER_RANKS.indexOf("중령") + 1));
const NCO_RANKS = new Set(["하사", "중사", "상사", "원사"]);

export type WorkArea = "normal" | "remote";
export type Duty = "none" | "hazard" | "special";

export interface Profile {
  target: Target;
  rank?: string;
  spouse: boolean;
  children: number;
  /** 배우자·자녀 외 부양가족 (직계존속 등) */
  otherDependents: number;
  area: WorkArea;
  duty: Duty;
  shortTermNco: boolean;
  /** 근무연수 5년 이상 */
  yearsOver5: boolean;
}

export const defaultProfile = (target: Target): Profile => ({
  target,
  rank: undefined,
  spouse: false,
  children: 0,
  otherDependents: 0,
  area: "normal",
  duty: "none",
  shortTermNco: false,
  yearsOver5: false,
});

export interface Match {
  allowance: Allowance;
  /** 이 사람에게 해당하는 이유 */
  reason: string;
  /** 월 예상 금액(원). 계산할 수 없으면 undefined */
  monthly?: number;
  /** 월급과 별도로 받는 금액에 대한 메모 */
  extra?: string;
}

export function familyAllowanceAmount(p: Pick<Profile, "spouse" | "children" | "otherDependents">): number {
  const nonChild = Math.min((p.spouse ? 1 : 0) + p.otherDependents, FAMILY_ALLOWANCE.nonChildCap);
  const spouseCount = p.spouse ? 1 : 0;
  const otherCount = nonChild - spouseCount;
  let total = spouseCount * FAMILY_ALLOWANCE.spouse + Math.max(0, otherCount) * FAMILY_ALLOWANCE.other;
  for (let i = 0; i < p.children; i++) {
    total += FAMILY_ALLOWANCE.child[Math.min(i, 2)];
  }
  return total;
}

const get = (id: string) => {
  const a = allowances.find((x) => x.id === id);
  if (!a) throw new Error(`unknown allowance ${id}`);
  return a;
};

/** 조건에 맞는 수당 목록. 순서: 신청 필요 → 자동 지급 */
export function findAllowances(p: Profile): Match[] {
  const out: Match[] = [];
  const add = (id: string, reason: string, monthly?: number, extra?: string) =>
    out.push({ allowance: get(id), reason, monthly, extra });

  if (p.target === "soldier") {
    const pay = SOLDIER_PAY.find((r) => r.rank === p.rank);
    add("soldier-pay", pay ? `${pay.rank} 봉급` : "병사 계급별 봉급", pay?.pay);
    add(
      "soldier-savings-match",
      "적금에 가입하면 납입액만큼 정부 매칭",
      undefined,
      `전역 시 일괄 지급 · 월 최대 ${(SAVINGS_MATCH_MONTHLY_CAP / 10_000).toLocaleString()}만 원 매칭`,
    );
    if (p.duty === "hazard") add("hazard-duty", "위험 직무 종사");
    add("duty-watch", "당직 근무 시");
    return sortMatches(out);
  }

  // 간부·군무원 공통
  add(p.target === "officer" ? "officer-pay" : "civilian-pay", "계급(급수)·호봉별 봉급");
  add("longevity-pay", "연 2회(1·7월) 근무연수별 지급");
  if (p.yearsOver5) add("longevity-addition", "근무연수 5년 이상");
  add("performance-bonus", "근무 성적 평가에 따라 지급");

  if (p.spouse || p.children > 0 || p.otherDependents > 0) {
    const parts = [
      p.spouse ? "배우자" : "",
      p.children > 0 ? `자녀 ${p.children}명` : "",
      p.otherDependents > 0 ? `기타 부양가족 ${p.otherDependents}명` : "",
    ].filter(Boolean);
    add("family-allowance", parts.join(" · "), familyAllowanceAmount(p));
  }
  if (p.children > 0) add("parental-leave", "자녀가 있어 육아휴직 시 대상");

  if (p.target === "officer" && p.rank && HOUSING_RANKS.has(p.rank as (typeof OFFICER_RANKS)[number])) {
    add("housing-allowance", "하사 이상 중령 이하", HOUSING_ALLOWANCE);
  }
  if (p.area === "remote") add("remote-area", "도서·벽지·접적지 근무");
  if (p.duty === "hazard" && p.target === "officer") add("hazard-duty", "위험 직무 종사");
  if (p.duty === "special") add("special-duty", "항공·함정 등 특수 업무");

  add("overtime", "시간외근무 명령을 받고 근무한 경우");
  add("holiday", "설·추석 기준일 재직");
  add("position-subsidy", "계급(직급)별 월 정액");
  add("meal", "월 정액");

  if (p.target === "civilian") add("annual-leave-comp", "미사용 연가 보상");
  if (p.target === "officer") {
    add("duty-watch", "당직 근무 시");
    if (p.shortTermNco && p.rank && NCO_RANKS.has(p.rank)) add("short-term-nco", "단기복무 부사관");
  }
  return sortMatches(out);
}

function sortMatches(m: Match[]): Match[] {
  return [...m].sort((a, b) => Number(b.allowance.requiresApplication) - Number(a.allowance.requiresApplication));
}

/** 금액이 확정된 항목만 더한 월 합계 */
export function monthlyTotal(m: Match[]): number {
  return m.reduce((s, x) => s + (x.monthly ?? 0), 0);
}

// ── URL 직렬화 (결과 공유용) ────────────────────────────
export function profileToQuery(p: Profile): string {
  const q = new URLSearchParams();
  q.set("t", p.target);
  if (p.rank) q.set("r", p.rank);
  if (p.spouse) q.set("s", "1");
  if (p.children) q.set("c", String(p.children));
  if (p.otherDependents) q.set("o", String(p.otherDependents));
  if (p.area !== "normal") q.set("a", p.area);
  if (p.duty !== "none") q.set("d", p.duty);
  if (p.shortTermNco) q.set("n", "1");
  if (p.yearsOver5) q.set("y", "1");
  return q.toString();
}

const clampInt = (v: string | null, max: number) => {
  const n = Number.parseInt(v ?? "0", 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), max) : 0;
};

export function profileFromQuery(q: URLSearchParams): Profile | null {
  const t = q.get("t");
  if (t !== "officer" && t !== "soldier" && t !== "civilian") return null;
  const p = defaultProfile(t);
  const r = q.get("r");
  const ranks: readonly string[] = t === "soldier" ? SOLDIER_RANKS : t === "officer" ? OFFICER_RANKS : [];
  if (r && ranks.includes(r)) p.rank = r;
  p.spouse = q.get("s") === "1";
  p.children = clampInt(q.get("c"), 10);
  p.otherDependents = clampInt(q.get("o"), 10);
  p.area = q.get("a") === "remote" ? "remote" : "normal";
  const d = q.get("d");
  p.duty = d === "hazard" || d === "special" ? d : "none";
  p.shortTermNco = q.get("n") === "1";
  p.yearsOver5 = q.get("y") === "1";
  return p;
}

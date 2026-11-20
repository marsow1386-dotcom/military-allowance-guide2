export type Target = "officer" | "soldier" | "civilian";

export const TARGET_LABEL: Record<Target, string> = {
  officer: "간부",
  soldier: "병사",
  civilian: "군무원",
};

export const TARGET_DESC: Record<Target, string> = {
  officer: "장교 · 준사관 · 부사관 (직업군인)",
  soldier: "이병 ~ 병장 (의무복무)",
  civilian: "국방부 · 각 군 소속 군무원",
};

export type Category =
  | "기본급여"
  | "병사 지원"
  | "상여수당"
  | "가계보전"
  | "특수지근무"
  | "특수근무"
  | "초과근무"
  | "실비변상"
  | "장려"
  | "기타";

export const CATEGORY_ORDER: Category[] = [
  "기본급여",
  "병사 지원",
  "상여수당",
  "가계보전",
  "특수지근무",
  "특수근무",
  "초과근무",
  "실비변상",
  "장려",
  "기타",
];

export interface LegalBasis {
  title: string;
  article?: string;
  url?: string;
}

export interface Allowance {
  id: string;
  name: string;
  aliases: string[];
  category: Category;
  targets: Target[];
  /** 한 줄 요약 */
  summary: string;
  /** 지급 기준 (사람이 읽는 문장) */
  amount: string;
  /** 표로 보여줄 금액 (선택) */
  amountTable?: { label: string; value: string }[];
  /** 본인이 신청해야 받는지 */
  requiresApplication: boolean;
  /** 지급 대상 설명 */
  eligibility: string[];
  /** 신청 방법 */
  howToApply: string[];
  /** 필요 서류 */
  documents: string[];
  /** 유의사항 */
  notes: string[];
  legalBasis: LegalBasis[];
  /** 최종 확인일 YYYY-MM-DD */
  verifiedAt: string;
  /** 군인 적용 범위나 금액을 원문으로 다시 확인해야 하는 항목 */
  needsVerification: boolean;
}

export interface Guide {
  id: string;
  title: string;
  summary: string;
  targets: Target[];
  relatedAllowanceIds: string[];
  checklist: string[];
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  relatedAllowanceIds: string[];
}

/** 화면에서 쓰는 큰 분류 (기획안 S-01 분류 바로가기) */
export const CATEGORY_GROUPS: { id: string; label: string; desc: string; categories: Category[] }[] = [
  { id: "base", label: "기본급여", desc: "봉급 · 병사 지원", categories: ["기본급여", "병사 지원"] },
  { id: "family", label: "가계지원", desc: "가족 · 주택 · 육아", categories: ["가계보전"] },
  { id: "duty", label: "근무·직무", desc: "위험 · 특수업무 · 초과근무", categories: ["특수근무", "초과근무"] },
  { id: "area", label: "특수근무지", desc: "도서 · 벽지 · 접적지", categories: ["특수지근무"] },
  { id: "bonus", label: "상여·실비", desc: "정근 · 명절 · 급식 등", categories: ["상여수당", "실비변상", "장려", "기타"] },
];

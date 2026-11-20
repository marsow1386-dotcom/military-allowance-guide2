import { allowances } from "@/data/allowances";
import { faqs, guides } from "@/data/guides";
import type { Allowance, Faq, Guide, Target } from "@/lib/types";

/** 공백·문장부호 제거 후 소문자 */
export const normalize = (s: string) => s.toLowerCase().replace(/[\s·.,!?~()"'「」]/g, "");

/** 거의 모든 수당에 들어 있어 검색을 흐리는 말 */
const STOPWORDS = new Set(["수당", "받나요", "받을", "있나", "있어요", "어떻게", "얼마", "군인", "알려줘", "알려주세요", "궁금해요", "뭐가", "무슨", "어떤"]);

/** 한국어 질문에서 쓸 만한 2글자 이상 토큰 (조사 일부 제거) */
export function tokens(q: string): string[] {
  const josa = /(은|는|이|가|을|를|에|에서|의|도|로|으로|과|와|랑|이랑|요|나요|인가요|있나요|뭐예요|얼마예요|얼마)$/;
  return q
    .split(/[\s,.?!·]+/)
    .map((w) => w.replace(josa, ""))
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
}

export interface Hit<T> {
  item: T;
  score: number;
}

function scoreText(query: string, toks: string[], fields: { text: string; weight: number }[]): number {
  const nq = normalize(query);
  let s = 0;
  for (const f of fields) {
    const nt = normalize(f.text);
    if (!nt) continue;
    // 질문 안에 필드 전체가 들어있으면 (예: "가족수당")
    if (nt.length >= 2 && nq.includes(nt)) s += 3 * f.weight;
    for (const t of toks) {
      const nTok = normalize(t);
      if (nTok.length >= 2 && nt.includes(nTok)) s += f.weight;
    }
  }
  return s;
}

export function searchAllowances(query: string, target?: Target, limit = 4): Hit<Allowance>[] {
  const toks = tokens(query);
  return allowances
    .map((a) => {
      let score = scoreText(query, toks, [
        { text: a.name, weight: 5 },
        ...a.aliases.map((x) => ({ text: x, weight: 4 })),
        { text: a.category, weight: 1 },
        { text: a.summary, weight: 1 },
      ]);
      if (target && score > 0) {
        // 다른 신분의 수당은 이름을 직접 물어본 경우(높은 점수)에만 남깁니다.
        if (a.targets.includes(target)) score += 2;
        else score = score >= 15 ? score - 4 : 0;
      }
      return { item: a, score };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function searchFaqs(query: string, limit = 2): Hit<Faq>[] {
  const toks = tokens(query);
  return faqs
    .map((f) => ({ item: f, score: scoreText(query, toks, [{ text: f.question, weight: 2 }, { text: f.answer, weight: 1 }]) }))
    .filter((h) => h.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function searchGuides(query: string, limit = 1): Hit<Guide>[] {
  const toks = tokens(query);
  return guides
    .map((g) => ({ item: g, score: scoreText(query, toks, [{ text: g.title, weight: 3 }, { text: g.summary, weight: 1 }]) }))
    .filter((h) => h.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** 목록 화면 검색: 이름·별칭·분류에 포함되는지 */
export function filterAllowances(q: string, target?: Target | ""): Allowance[] {
  const nq = normalize(q);
  return allowances.filter(
    (a) =>
      (!target || a.targets.includes(target)) &&
      (!nq || [a.name, a.category, ...a.aliases].some((x) => normalize(x).includes(nq))),
  );
}

/** 질문에 신분을 알 수 있는 말이 있으면 추정합니다. (예: "병장 월급" → 병사) */
export function inferTarget(q: string): Target | undefined {
  if (/(이병|일병|상병|병장|병사|장병내일|적금)/.test(q)) return "soldier";
  if (/군무원/.test(q)) return "civilian";
  if (/(하사|중사|상사|원사|준위|소위|중위|대위|소령|중령|대령|간부|부사관|장교)/.test(q)) return "officer";
  return undefined;
}

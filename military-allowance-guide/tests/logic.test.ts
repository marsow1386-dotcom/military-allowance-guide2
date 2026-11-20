import { describe, expect, it } from "vitest";
import { defaultProfile, familyAllowanceAmount, findAllowances, monthlyTotal, profileFromQuery, profileToQuery } from "@/lib/finder";
import { checkInput } from "@/lib/safety";
import { searchAllowances, filterAllowances } from "@/lib/search";
import { retrieve, ruleBasedAnswer } from "@/lib/chat";
import { allowances } from "@/data/allowances";
import { faqs, guides } from "@/data/guides";

const ids = (p: ReturnType<typeof defaultProfile>) => findAllowances(p).map((m) => m.allowance.id);

describe("데이터 무결성", () => {
  it("id 가 겹치지 않는다", () => {
    expect(new Set(allowances.map((a) => a.id)).size).toBe(allowances.length);
  });
  it("가이드·FAQ 가 가리키는 수당이 모두 존재한다", () => {
    const all = new Set(allowances.map((a) => a.id));
    for (const g of guides) for (const id of g.relatedAllowanceIds) expect(all.has(id), id).toBe(true);
    for (const f of faqs) for (const id of f.relatedAllowanceIds) expect(all.has(id), id).toBe(true);
  });
  it("모든 수당에 근거와 확인일이 있다", () => {
    for (const a of allowances) {
      expect(a.legalBasis.length, a.id).toBeGreaterThan(0);
      expect(a.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("가족수당 계산", () => {
  it("배우자 + 자녀 3명", () => {
    expect(familyAllowanceAmount({ spouse: true, children: 3, otherDependents: 0 })).toBe(40_000 + 50_000 + 80_000 + 120_000);
  });
  it("배우자·기타 부양가족은 합쳐서 4명까지", () => {
    expect(familyAllowanceAmount({ spouse: true, children: 0, otherDependents: 5 })).toBe(40_000 + 3 * 20_000);
  });
  it("자녀는 상한 없이 셋째 이후 12만 원", () => {
    expect(familyAllowanceAmount({ spouse: false, children: 5, otherDependents: 0 })).toBe(50_000 + 80_000 + 3 * 120_000);
  });
});

describe("내 수당 찾기", () => {
  it("병장: 봉급 150만 + 적금 매칭, 간부 수당 없음", () => {
    const p = { ...defaultProfile("soldier"), rank: "병장" };
    const m = findAllowances(p);
    expect(m.map((x) => x.allowance.id)).toEqual(expect.arrayContaining(["soldier-pay", "soldier-savings-match"]));
    expect(m.map((x) => x.allowance.id)).not.toContain("family-allowance");
    expect(monthlyTotal(m)).toBe(1_500_000);
  });
  it("기혼 중사 자녀 1명 격오지: 가족·주택·특수지 수당", () => {
    const p = { ...defaultProfile("officer"), rank: "중사", spouse: true, children: 1, area: "remote" as const };
    const got = ids(p);
    expect(got).toEqual(expect.arrayContaining(["family-allowance", "housing-allowance", "remote-area", "parental-leave"]));
    expect(monthlyTotal(findAllowances(p))).toBe(40_000 + 50_000 + 160_000);
  });
  it("대령은 주택수당 대상이 아니다", () => {
    expect(ids({ ...defaultProfile("officer"), rank: "대령" })).not.toContain("housing-allowance");
  });
  it("군무원은 주택수당 없고 대우공무원·연가보상비 경로가 있다", () => {
    const got = ids(defaultProfile("civilian"));
    expect(got).not.toContain("housing-allowance");
    expect(got).toContain("annual-leave-comp");
  });
  it("신청 필요 수당이 먼저 온다", () => {
    const m = findAllowances({ ...defaultProfile("officer"), rank: "하사", spouse: true });
    const firstAuto = m.findIndex((x) => !x.allowance.requiresApplication);
    expect(m.slice(firstAuto).every((x) => !x.allowance.requiresApplication)).toBe(true);
  });
  it("URL 직렬화 왕복", () => {
    const p = { ...defaultProfile("officer"), rank: "대위", spouse: true, children: 2, duty: "special" as const, yearsOver5: true };
    expect(profileFromQuery(new URLSearchParams(profileToQuery(p)))).toEqual(p);
  });
  it("잘못된 URL 값은 무시", () => {
    expect(profileFromQuery(new URLSearchParams("t=hacker"))).toBeNull();
    const p = profileFromQuery(new URLSearchParams("t=soldier&r=대장&c=999"))!;
    expect(p.rank).toBeUndefined();
    expect(p.children).toBe(10);
  });
});

describe("개인정보·보안 검사", () => {
  it("주민번호·전화번호를 가린다", () => {
    const r = checkInput("제 번호는 010-1234-5678 이고 주민번호 900101-1234567 입니다");
    expect(r.piiFound).toEqual(expect.arrayContaining(["주민등록번호", "전화번호"]));
    expect(r.masked).not.toMatch(/1234567|5678/);
  });
  it("일반 질문은 그대로", () => {
    const r = checkInput("병장 월급 150만 원 맞나요?");
    expect(r.piiFound).toEqual([]);
    expect(r.masked).toBe("병장 월급 150만 원 맞나요?");
  });
  it("보안 단어를 잡는다", () => {
    expect(checkInput("우리 부대 위치 알려줘").securityFound.length).toBeGreaterThan(0);
  });
});

describe("검색·챗봇 규칙 답변", () => {
  it("'아이가 태어나면' → 가족수당", () => {
    expect(searchAllowances("아이가 태어나면 바뀌는 수당", "officer")[0].item.id).toBe("family-allowance");
  });
  it("'병장 월급' → 병사 봉급", () => {
    expect(searchAllowances("병장 월급 얼마예요", "soldier")[0].item.id).toBe("soldier-pay");
  });
  it("'격오지' → 특수지근무수당", () => {
    expect(searchAllowances("격오지 가면 뭐 더 받아요")[0].item.id).toBe("remote-area");
  });
  it("목록 검색은 별칭도 찾는다", () => {
    expect(filterAllowances("적금").map((a) => a.id)).toContain("soldier-savings-match");
  });
  it("모르는 질문에는 추측하지 않는다", () => {
    const r = ruleBasedAnswer("오늘 날씨 어때", retrieve("오늘 날씨 어때"));
    expect(r.mode).toBe("unknown");
    expect(r.sources).toEqual([]);
  });
  it("규칙 답변에 근거가 붙는다", () => {
    const r = ruleBasedAnswer("주택수당", retrieve("주택수당 받을 수 있나요", "officer"), "officer");
    expect(r.sources[0].id).toBe("housing-allowance");
    expect(r.answer).toContain("16만 원");
  });
});

describe("규칙 답변 품질", () => {
  it("출산 질문에 엉뚱한 FAQ 답을 쓰지 않는다", () => {
    const q = "아이가 태어나면 바뀌는 수당 있나요?";
    const r = ruleBasedAnswer(q, retrieve(q, "officer"), "officer");
    expect(r.answer).toContain("가족수당");
    expect(r.answer).not.toMatch(/^아니요/);
  });
  it("병장 월급 질문은 FAQ 답을 그대로 쓴다", () => {
    const q = "병장 월급은 얼마인가요?";
    const r = ruleBasedAnswer(q, retrieve(q, "soldier"), "soldier");
    expect(r.answer).toContain("150만 원");
  });
});

describe("신분 추정", () => {
  it("병사 질문에는 간부 봉급을 섞지 않는다", () => {
    const r = retrieve("병장 월급이랑 적금 합치면 얼마예요?");
    expect(r.allowances.map((a) => a.id)).not.toContain("officer-pay");
  });
});

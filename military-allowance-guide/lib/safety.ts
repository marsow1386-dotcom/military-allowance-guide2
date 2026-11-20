/** 개인정보·보안 입력 검사. 클라이언트(전송 전 경고)와 서버(저장·AI 전송 전 가림) 양쪽에서 씁니다. */

const PII_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "주민등록번호", re: /\b\d{6}\s?-?\s?[1-8]\d{6}\b/g },
  { label: "전화번호", re: /\b01[016789]\s?-?\s?\d{3,4}\s?-?\s?\d{4}\b/g },
  { label: "군번", re: /\b\d{2}\s?-\s?\d{5,8}\b/g },
  { label: "계좌번호", re: /\b\d{3,6}-\d{2,6}-\d{2,8}(-\d{1,3})?\b/g },
  { label: "이메일", re: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
];

/** 보안상 입력을 막는 단어 (운영 중 보강) */
const SECURITY_TERMS = ["암구호", "작전계획", "작계", "좌표", "부대위치", "부대 위치", "배치도", "비밀번호", "군사기밀", "기밀"];

export interface SafetyCheck {
  masked: string;
  piiFound: string[];
  securityFound: string[];
}

export function checkInput(text: string): SafetyCheck {
  let masked = text;
  const piiFound: string[] = [];
  for (const p of PII_PATTERNS) {
    if (p.re.test(masked)) {
      piiFound.push(p.label);
      masked = masked.replace(p.re, `[${p.label} 가림]`);
    }
    p.re.lastIndex = 0;
  }
  const lower = text.replace(/\s/g, "");
  const securityFound = SECURITY_TERMS.filter((t) => lower.includes(t.replace(/\s/g, "")));
  return { masked, piiFound, securityFound };
}

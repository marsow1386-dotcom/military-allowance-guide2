import type { Faq, Guide } from "@/lib/types";

export const guides: Guide[] = [
  {
    id: "marriage",
    title: "결혼했어요",
    summary: "배우자가 생기면 가족수당이 늘어납니다. 혼인신고 후 바로 신청하세요.",
    targets: ["officer", "civilian"],
    relatedAllowanceIds: ["family-allowance", "housing-allowance"],
    checklist: [
      "혼인신고 후 가족관계증명서 발급",
      "소속 부대 급여 담당에게 가족수당 변경 신청",
      "배우자도 공무원(군인)이면 둘 중 한 사람만 신청",
      "주거 지원(주택수당·관사) 조건 다시 확인",
    ],
  },
  {
    id: "childbirth",
    title: "자녀가 태어났어요",
    summary: "자녀 가족수당이 추가되고, 육아휴직을 쓰면 육아휴직수당을 받을 수 있습니다.",
    targets: ["officer", "civilian"],
    relatedAllowanceIds: ["family-allowance", "parental-leave"],
    checklist: [
      "출생신고 후 가족관계증명서 발급",
      "가족수당 변경 신청 (첫째 월 5만, 둘째 8만, 셋째 이후 12만 원)",
      "육아휴직 계획이 있으면 휴직·수당 신청 시기 확인",
    ],
  },
  {
    id: "transfer-remote",
    title: "격오지·도서 지역으로 발령났어요",
    summary: "근무지가 지정 지역이면 특수지근무수당을 받습니다.",
    targets: ["officer", "civilian"],
    relatedAllowanceIds: ["remote-area", "housing-allowance"],
    checklist: [
      "새 근무지가 특수지근무수당 지정 지역인지 급여 담당에게 확인",
      "관사 입주 여부에 따른 주거 지원 조건 확인",
      "전입 후 첫 급여명세서에 수당이 반영됐는지 확인",
    ],
  },
  {
    id: "parental-leave",
    title: "육아휴직을 하려고 해요",
    summary: "휴직 기간 동안 육아휴직수당을 받고, 남은 동료는 업무대행수당을 받을 수 있습니다.",
    targets: ["officer", "civilian"],
    relatedAllowanceIds: ["parental-leave", "acting-duty", "family-allowance"],
    checklist: [
      "휴직 신청과 함께 육아휴직수당 신청",
      "기간별 지급 비율과 상한액 최신 기준 확인",
      "업무대행자 지정 여부 부서장과 협의",
    ],
  },
  {
    id: "enlistment",
    title: "입대했어요 (병사)",
    summary: "봉급은 자동으로 들어오고, 장병내일준비적금은 직접 가입해야 정부 매칭을 받습니다.",
    targets: ["soldier"],
    relatedAllowanceIds: ["soldier-pay", "soldier-savings-match"],
    checklist: [
      "나라사랑카드(급여 계좌) 확인",
      "장병내일준비적금 가입 (빨리 가입할수록 유리)",
      "월 납입액 정하기 (한도 월 55만 원)",
    ],
  },
  {
    id: "commission",
    title: "임관했어요 (신규 간부)",
    summary: "처음 받는 수당과 직접 신청해야 하는 수당을 한 번에 챙기세요.",
    targets: ["officer"],
    relatedAllowanceIds: ["officer-pay", "family-allowance", "housing-allowance", "short-term-nco", "overtime"],
    checklist: [
      "급여 계좌와 호봉 확인",
      "부양가족이 있으면 가족수당 신청",
      "주택수당 대상 여부 확인",
      "단기복무 부사관이면 장려수당 지급 시기 확인",
      "시간외근무 신청·기록 방법 익히기",
    ],
  },
];

export const faqs: Faq[] = [
  {
    id: "faq-soldier-pay",
    question: "2026년 병장 월급은 얼마인가요?",
    answer:
      "병장 봉급은 월 150만 원입니다. 장병내일준비적금에 가입하면 본인이 넣은 금액만큼(월 최대 55만 원) 정부 매칭이 붙어 전역할 때 함께 받습니다.",
    relatedAllowanceIds: ["soldier-pay", "soldier-savings-match"],
  },
  {
    id: "faq-savings-when",
    question: "적금 매칭지원금은 매달 들어오나요?",
    answer: "아니요. 매칭지원금은 복무 중 매달 받는 돈이 아니라 전역할 때 원금·이자와 함께 한꺼번에 받습니다.",
    relatedAllowanceIds: ["soldier-savings-match"],
  },
  {
    id: "faq-family-couple",
    question: "부부가 둘 다 군인이면 가족수당을 둘 다 받나요?",
    answer: "아니요. 같은 부양가족에 대해서는 한 사람만 가족수당을 받을 수 있습니다.",
    relatedAllowanceIds: ["family-allowance"],
  },
  {
    id: "faq-family-child",
    question: "자녀 가족수당은 얼마인가요?",
    answer: "첫째 월 5만 원, 둘째 월 8만 원, 셋째 이후는 1인당 월 12만 원입니다. 자녀는 인원 제한이 없습니다.",
    relatedAllowanceIds: ["family-allowance"],
  },
  {
    id: "faq-housing",
    question: "주택수당은 누가 받나요?",
    answer:
      "하사 이상 중령 이하 군인이 대상이며 월 16만 원입니다. 관사 입주 여부 등 세부 조건은 소속 부대 급여 담당에게 확인하세요.",
    relatedAllowanceIds: ["housing-allowance"],
  },
  {
    id: "faq-longevity",
    question: "1월·7월 월급이 많은 이유가 뭔가요?",
    answer: "정근수당이 1월과 7월에 근무연수에 따라 월봉급액의 10~50%만큼 지급되기 때문입니다.",
    relatedAllowanceIds: ["longevity-pay"],
  },
  {
    id: "faq-my-pay",
    question: "제 수당이 제대로 들어왔는지 여기서 확인할 수 있나요?",
    answer:
      "이 사이트는 안내용이라 개인 급여 내역을 조회할 수 없습니다. 급여명세서를 확인하고, 다른 점이 있으면 소속 부대 급여 담당에게 문의하세요.",
    relatedAllowanceIds: [],
  },
  {
    id: "faq-remote",
    question: "격오지에 가면 수당이 더 나오나요?",
    answer:
      "근무지가 도서·벽지·접적지 등 지정 지역이면 특수지근무수당이 지급됩니다. 지역 등급별 금액은 근무지 기준표로 확인하세요.",
    relatedAllowanceIds: ["remote-area"],
  },
];

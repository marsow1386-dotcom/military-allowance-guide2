import Link from "next/link";
import { allowanceById, allowances } from "@/data/allowances";
import { guides } from "@/data/guides";
import { AllowanceCard } from "@/components/AllowanceBits";
import HeroSearch from "@/components/HeroSearch";
import OpenChatButton from "@/components/OpenChatButton";
import { IconArrow, IconCalendar, IconChat, IconInfo, IconShield, IconUsers } from "@/components/Icons";
import { CATEGORY_GROUPS, TARGET_DESC, TARGET_LABEL, type Target } from "@/lib/types";

const TARGETS: { t: Target; Icon: typeof IconUsers }[] = [
  { t: "officer", Icon: IconShield },
  { t: "soldier", Icon: IconUsers },
  { t: "civilian", Icon: IconCalendar },
];

const POPULAR = ["family-allowance", "housing-allowance", "soldier-pay", "soldier-savings-match", "longevity-pay", "remote-area"];
const KEYWORDS = ["가족수당", "주택수당", "병장 월급", "적금", "격오지"];

export default function HomePage() {
  const applyCount = allowances.filter((a) => a.requiresApplication).length;
  const popular = POPULAR.map(allowanceById).filter((a): a is NonNullable<typeof a> => !!a);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div>
            <span className="eyebrow">2026년 기준 · 간부 · 병사 · 군무원</span>
            <h1>내가 받을 수 있는 군 수당,<br />한눈에 확인하세요</h1>
            <p className="hero-lead">흩어져 있는 수당 규정을 쉽게 정리했습니다. 내 조건에 맞는 수당과 신청 방법을 바로 찾아보세요.</p>
            <HeroSearch />
            <div className="hero-keywords">
              <span>많이 찾는 검색어</span>
              {KEYWORDS.map((k) => (
                <Link key={k} href={`/allowances?q=${encodeURIComponent(k)}`}>{k}</Link>
              ))}
            </div>
          </div>
          <div className="hero-panel" aria-label="내 수당 찾기 결과 예시">
            <div className="hero-panel-head">
              <b>예시 · 중사, 기혼, 자녀 1명</b>
              <span>월 기준</span>
            </div>
            <ul>
              <li><span>가족수당 <span className="chip chip-apply">신청 필요</span></span><span className="amt num">90,000원</span></li>
              <li><span>주택수당 <span className="chip chip-apply">신청 필요</span></span><span className="amt num">160,000원</span></li>
              <li><span>정근수당 <span className="chip chip-auto">자동 지급</span></span><span className="amt">1·7월 지급</span></li>
            </ul>
            <div className="hero-panel-foot"><span>정해진 금액 합계</span><span className="num">250,000원</span></div>
            <Link href="/finder" className="btn btn-primary" style={{ width: "100%", marginTop: 18 }}>
              내 조건으로 찾아보기 <IconArrow size={18} />
            </Link>
          </div>
        </div>
      </section>

      <div className="notice-strip">
        <div className="container">
          <span className="chip chip-apply">공지</span>
          <span>2026년 보수 개정 반영: 병사 봉급 동결, 하사·중사·소위·중위 봉급 추가 인상</span>
          <span className="muted small">최종 확인 2026.11.20</span>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">신분별로 시작하기</span>
              <h2>어떤 신분이신가요?</h2>
            </div>
          </div>
          <div className="grid cols-3">
            {TARGETS.map(({ t, Icon }) => {
              const n = allowances.filter((a) => a.targets.includes(t)).length;
              return (
                <Link key={t} href={`/finder?start=${t}`} className="card target-card">
                  <span className="icon"><Icon size={24} /></span>
                  <h3>{TARGET_LABEL[t]}</h3>
                  <p>{TARGET_DESC[t]} · 안내 수당 {n}개</p>
                  <span className="go">내 수당 찾기 <IconArrow size={16} /></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">분류 바로가기</span>
              <h2>종류별로 찾기</h2>
            </div>
          </div>
          <div className="cat-tiles">
            {CATEGORY_GROUPS.map((c) => (
              <Link key={c.id} href={`/allowances?cat=${c.id}`} className="cat-tile">
                <b>{c.label}</b>
                <span>{c.desc}</span>
                <span className="num">{allowances.filter((a) => c.categories.includes(a.category)).length}개</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">자주 찾는 수당</span>
              <h2>많이 찾는 수당</h2>
            </div>
            <Link href="/allowances" className="btn btn-outline btn-sm">전체 {allowances.length}개 보기 <IconArrow size={16} /></Link>
          </div>
          <div className="grid cols-3 compact-m">
            {popular.map((a) => <AllowanceCard key={a.id} a={a} />)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">상황별 가이드</span>
              <h2>이럴 땐 이 수당을 챙기세요</h2>
            </div>
            <Link href="/guides" className="btn btn-outline btn-sm">가이드 전체 <IconArrow size={16} /></Link>
          </div>
          <div className="grid cols-3 compact-m">
            {guides.map((g) => (
              <Link key={g.id} href={`/guides/${g.id}`} className="card al-card">
                <h3>{g.title}</h3>
                <p>{g.summary}</p>
                <div className="foot"><span className="chip">관련 수당 {g.relatedAllowanceIds.length}</span><span className="chip">할 일 {g.checklist.length}</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>찾는 답이 없나요?</h2>
              <p>AI 수당 상담에 물어보면 관련 수당과 근거 규정을 함께 알려드립니다.</p>
            </div>
            <OpenChatButton className="btn btn-primary"><IconChat size={18} /> AI 상담 시작하기</OpenChatButton>
          </div>
          <div className="notice" style={{ marginTop: 16 }}>
            <IconInfo size={20} />
            <span>안내 수당 {allowances.length}개 중 <b>{applyCount}개는 직접 신청해야</b> 받을 수 있습니다. 금액은 2026년 기준 참고용이며, 실제 지급은 소속 부대 인사·급여 담당에게 확인하세요.</span>
          </div>
        </div>
      </section>
    </>
  );
}

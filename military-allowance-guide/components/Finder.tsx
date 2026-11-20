"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import CopyLinkButton from "@/components/CopyLinkButton";
import { IconArrow, IconBack, IconChat, IconInfo } from "@/components/Icons";
import OpenChatButton from "@/components/OpenChatButton";
import {
  defaultProfile,
  findAllowances,
  monthlyTotal,
  OFFICER_RANKS,
  profileFromQuery,
  profileToQuery,
  SOLDIER_RANKS,
  type Match,
  type Profile,
} from "@/lib/finder";
import { manwon, won } from "@/lib/format";
import { TARGET_DESC, TARGET_LABEL, type Target } from "@/lib/types";

type StepId = "target" | "rank" | "family" | "work" | "extra";

function stepsFor(p: Profile | null): StepId[] {
  if (!p) return ["target"];
  if (p.target === "soldier") return ["target", "rank", "work"];
  if (p.target === "civilian") return ["target", "family", "work", "extra"];
  return ["target", "rank", "family", "work", "extra"];
}

const NCO = new Set(["하사", "중사", "상사", "원사"]);

function Choice({ pressed, onClick, children, sub }: { pressed: boolean; onClick: () => void; children: React.ReactNode; sub?: string }) {
  return (
    <button type="button" className="choice" aria-pressed={pressed} onClick={onClick}>
      {children}
      {sub && <small>{sub}</small>}
    </button>
  );
}

function Counter({ label, value, onChange, max = 10, id }: { label: string; value: number; onChange: (n: number) => void; max?: number; id: string }) {
  return (
    <div className="counter">
      <span id={id}>{label}</span>
      <div className="counter-ctl" role="group" aria-labelledby={id}>
        <button type="button" aria-label={`${label} 줄이기`} onClick={() => onChange(Math.max(0, value - 1))} disabled={value === 0}>−</button>
        <output aria-live="polite">{value}</output>
        <button type="button" aria-label={`${label} 늘리기`} onClick={() => onChange(Math.min(max, value + 1))}>＋</button>
      </div>
    </div>
  );
}

export default function Finder() {
  const sp = useSearchParams();
  const router = useRouter();
  const fromUrl = useMemo(() => profileFromQuery(new URLSearchParams(sp.toString())), [sp]);

  const startParam = sp.get("start");
  const start: Target | null = startParam === "officer" || startParam === "soldier" || startParam === "civilian" ? startParam : null;
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(() => (start ? defaultProfile(start) : null));
  const [step, setStep] = useState(start ? 1 : 0);

  if (fromUrl && !editing) {
    return (
      <Results
        p={fromUrl}
        onEdit={() => {
          setProfile(fromUrl);
          setStep(0);
          setEditing(true);
        }}
      />
    );
  }

  const steps = stepsFor(profile);
  const cur = steps[Math.min(step, steps.length - 1)];
  const update = (patch: Partial<Profile>) => setProfile((p) => (p ? { ...p, ...patch } : p));
  const canNext =
    cur === "target" ? !!profile : cur === "rank" ? !!profile?.rank : true;
  const isLast = step >= steps.length - 1 && !!profile;

  const finish = () => {
    if (!profile) return;
    setEditing(false);
    router.push(`/finder?${profileToQuery(profile)}`);
  };

  const pickTarget = (t: Target) => {
    setProfile((p) => (p?.target === t ? p : defaultProfile(t)));
  };

  const total = profile ? stepsFor(profile).length : 4;
  const pct = Math.round(((step + 1) / total) * 100);

  return (
    <>
    <PageHeader title="내 수당 찾기" crumbs={[{ href: "/finder", label: "내 수당 찾기" }]} description="몇 가지만 답하면 받을 수 있는 수당을 알려드립니다. 입력한 내용은 저장되지 않습니다." />
    <div className="container page-body">
    <div className="stepper">
      <div className="progress-meta num"><span>{step + 1} / {total} 단계</span><span>{pct}%</span></div>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <span style={{ width: `${pct}%` }} />
      </div>

      <section className="card" aria-live="polite" style={{ padding: "32px clamp(20px, 4vw, 36px)" }}>
        {cur === "target" && (
          <>
            <h2 className="q-title">어떤 신분이신가요?</h2>
            <div className="choice-grid">
              {(["officer", "soldier", "civilian"] as Target[]).map((t) => (
                <Choice key={t} pressed={profile?.target === t} onClick={() => pickTarget(t)} sub={TARGET_DESC[t]}>
                  {TARGET_LABEL[t]}
                </Choice>
              ))}
            </div>
          </>
        )}

        {cur === "rank" && profile && (
          <>
            <h2 className="q-title">계급을 선택해 주세요</h2>
            <div className="choice-grid compact">
              {(profile.target === "soldier" ? SOLDIER_RANKS : OFFICER_RANKS).map((r) => (
                <Choice key={r} pressed={profile.rank === r} onClick={() => update({ rank: r, shortTermNco: NCO.has(r) ? profile.shortTermNco : false })}>
                  {r}
                </Choice>
              ))}
            </div>
          </>
        )}

        {cur === "family" && profile && (
          <>
            <h2 className="q-title">함께 사는 부양가족을 알려주세요</h2>
            <div className="choice-grid">
              <Choice pressed={!profile.spouse} onClick={() => update({ spouse: false })}>배우자 없음</Choice>
              <Choice pressed={profile.spouse} onClick={() => update({ spouse: true })}>배우자 있음</Choice>
            </div>
            <Counter id="c-children" label="자녀 수" value={profile.children} onChange={(n) => update({ children: n })} />
            <Counter id="c-other" label="그 밖의 부양가족 (부모님 등)" value={profile.otherDependents} onChange={(n) => update({ otherDependents: n })} />
          </>
        )}

        {cur === "work" && profile && (
          <>
            <h2 className="q-title">근무 조건을 알려주세요</h2>
            {profile.target !== "soldier" && (
              <>
                <p className="q-label">근무지</p>
                <div className="choice-grid">
                  <Choice pressed={profile.area === "normal"} onClick={() => update({ area: "normal" })}>일반 지역</Choice>
                  <Choice pressed={profile.area === "remote"} onClick={() => update({ area: "remote" })} sub="도서·벽지·접적지 등">격오지</Choice>
                </div>
              </>
            )}
            <p className="q-label">맡은 직무</p>
            <div className="choice-grid">
              <Choice pressed={profile.duty === "none"} onClick={() => update({ duty: "none" })}>해당 없음</Choice>
              <Choice pressed={profile.duty === "hazard"} onClick={() => update({ duty: "hazard" })} sub="공수강하·잠수·불발탄 처리 등">위험 직무</Choice>
              {profile.target !== "soldier" && (
                <Choice pressed={profile.duty === "special"} onClick={() => update({ duty: "special" })} sub="항공·함정·기술정보 등">특수 업무</Choice>
              )}
            </div>
          </>
        )}

        {cur === "extra" && profile && (
          <>
            <h2 className="q-title">마지막으로 확인할게요</h2>
            <p className="q-label">근무연수</p>
            <div className="choice-grid">
              <Choice pressed={!profile.yearsOver5} onClick={() => update({ yearsOver5: false })}>5년 미만</Choice>
              <Choice pressed={profile.yearsOver5} onClick={() => update({ yearsOver5: true })}>5년 이상</Choice>
            </div>
            {profile.target === "officer" && profile.rank && NCO.has(profile.rank) && (
              <>
                <p className="q-label">복무 형태</p>
                <div className="choice-grid">
                  <Choice pressed={!profile.shortTermNco} onClick={() => update({ shortTermNco: false })}>장기·일반</Choice>
                  <Choice pressed={profile.shortTermNco} onClick={() => update({ shortTermNco: true })}>단기복무 부사관</Choice>
                </div>
              </>
            )}
          </>
        )}

        <div className="stepper-actions">
          <button type="button" className="btn btn-outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <IconBack size={16} /> 이전
          </button>
          {isLast ? (
            <button type="button" className="btn btn-primary" onClick={finish} disabled={!canNext}>
              결과 보기 <IconArrow size={16} />
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              다음 <IconArrow size={16} />
            </button>
          )}
        </div>
      </section>
    </div>
    </div>
    </>
  );
}

function MatchRow({ m }: { m: Match }) {
  const a = m.allowance;
  return (
    <Link href={`/allowances/${a.id}`} className="match">
      <span style={{ minWidth: 0 }}>
        <span className="row" style={{ gap: 8 }}>
          <h3>{a.name}</h3>
          {a.needsVerification && <span className="chip chip-check">확인 필요</span>}
        </span>
        <p>{m.reason}{m.extra ? ` · ${m.extra}` : ""}</p>
      </span>
      <span className="amt num">{m.monthly !== undefined ? `월 ${manwon(m.monthly)}` : <IconArrow size={18} />}</span>
    </Link>
  );
}

function Results({ p, onEdit }: { p: Profile; onEdit: () => void }) {
  const matches = findAllowances(p);
  const apply = matches.filter((m) => m.allowance.requiresApplication);
  const auto = matches.filter((m) => !m.allowance.requiresApplication);
  const total = monthlyTotal(matches);
  const summary = [
    TARGET_LABEL[p.target],
    p.rank,
    p.target !== "soldier" ? (p.spouse ? "배우자 있음" : "배우자 없음") : "",
    p.children ? `자녀 ${p.children}명` : "",
    p.otherDependents ? `기타 부양가족 ${p.otherDependents}명` : "",
    p.area === "remote" ? "격오지" : "",
    p.duty === "hazard" ? "위험 직무" : p.duty === "special" ? "특수 업무" : "",
    p.yearsOver5 ? "근무 5년 이상" : "",
    p.shortTermNco ? "단기복무" : "",
  ].filter(Boolean) as string[];

  return (
    <>
      <PageHeader
        title="찾기 결과"
        crumbs={[{ href: "/finder", label: "내 수당 찾기" }]}
        description={<>받을 수 있는 수당 <b>{matches.length}개</b> 중 <b>{apply.length}개는 직접 신청</b>해야 합니다.</>}
      >
        <div className="row" style={{ marginTop: 16 }}>
          {summary.map((s) => <span key={s} className="chip">{s}</span>)}
          <button type="button" className="pill" onClick={onEdit} style={{ height: 28 }}>조건 수정</button>
        </div>
      </PageHeader>
      <div className="container page-body">
        <div className="result-layout">
          <div>
            {apply.length > 0 && (
              <section className="result-group">
                <h2>신청해야 받는 수당 <span className="chip chip-apply">{apply.length}</span></h2>
                <div className="match-list">{apply.map((m) => <MatchRow key={m.allowance.id} m={m} />)}</div>
              </section>
            )}
            <section className="result-group">
              <h2>자동으로 받는 수당 <span className="chip chip-auto">{auto.length}</span></h2>
              <div className="match-list">{auto.map((m) => <MatchRow key={m.allowance.id} m={m} />)}</div>
            </section>
          </div>
          <aside className="card summary-card">
            <p className="small muted">금액이 정해진 항목 월 합계</p>
            <div className="big num">{total ? won(total) : "—"}</div>
            <p className="small muted">봉급표나 비율로 정해지는 수당은 빠져 있습니다. 참고용입니다.</p>
            <div className="stack" style={{ marginTop: 20 }}>
              <OpenChatButton className="btn btn-primary" question={`${summary.join(", ")}인데 더 챙길 수당이 있을까요?`}>
                <IconChat size={18} /> AI에게 더 묻기
              </OpenChatButton>
              <CopyLinkButton label="결과 링크 복사" />
            </div>
            <div className="notice" style={{ marginTop: 20, padding: "14px 16px", fontSize: 13.5 }}>
              <IconInfo size={18} />
              <span>실제 지급 여부와 금액은 소속 부대 인사·급여 담당에게 확인하세요.</span>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

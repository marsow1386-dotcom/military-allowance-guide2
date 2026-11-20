"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { AllowanceCard, StatusChips, TargetChips } from "@/components/AllowanceBits";
import { filterAllowances } from "@/lib/search";
import { CATEGORY_GROUPS, CATEGORY_ORDER, TARGET_DESC, TARGET_LABEL, type Target } from "@/lib/types";

const TARGETS: Target[] = ["officer", "soldier", "civilian"];

export default function AllowanceExplorer() {
  const router = useRouter();
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";
  const tParam = sp.get("target");
  const target: Target | "" = tParam === "officer" || tParam === "soldier" || tParam === "civilian" ? tParam : "";
  const cat = CATEGORY_GROUPS.find((c) => c.id === sp.get("cat"));
  const view = sp.get("view") === "table" ? "table" : "cards";

  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const qs = next.toString();
    router.replace(qs ? `/allowances?${qs}` : "/allowances", { scroll: false });
  };

  const list = useMemo(
    () => filterAllowances(q, target).filter((a) => !cat || cat.categories.includes(a.category)),
    [q, target, cat],
  );
  const byName = useMemo(() => [...list].sort((a, b) => a.name.localeCompare(b.name, "ko")), [list]);
  const groups = target ? [target] : TARGETS;

  return (
    <>
      <div className="toolbar">
        <label htmlFor="al-q" className="sr-only">수당 검색</label>
        <input id="al-q" className="input" type="search" value={q} onChange={(e) => set({ q: e.target.value })} placeholder="수당 이름이나 키워드 (예: 가족, 격오지, 적금)" />
        <div className="row">
          <div className="segmented" role="group" aria-label="대상">
            <button type="button" aria-pressed={!target} onClick={() => set({ target: "" })}>전체</button>
            {TARGETS.map((t) => (
              <button key={t} type="button" aria-pressed={target === t} onClick={() => set({ target: t })}>{TARGET_LABEL[t]}</button>
            ))}
          </div>
          <div className="segmented" role="group" aria-label="보기 방식">
            <button type="button" aria-pressed={view === "cards"} onClick={() => set({ view: "" })}>대상별</button>
            <button type="button" aria-pressed={view === "table"} onClick={() => set({ view: "table" })}>이름별 표</button>
          </div>
        </div>
      </div>
      <div className="row" style={{ marginBottom: 28 }} role="group" aria-label="분류">
        <button type="button" className="pill" aria-pressed={!cat} onClick={() => set({ cat: "" })}>모든 분류</button>
        {CATEGORY_GROUPS.map((c) => (
          <button key={c.id} type="button" className="pill" aria-pressed={cat?.id === c.id} onClick={() => set({ cat: c.id })}>{c.label}</button>
        ))}
      </div>

      {list.length === 0 && (
        <div className="notice">
          <span>조건에 맞는 수당이 없습니다. 검색어나 분류를 바꾸거나, 화면 오른쪽 아래 <b>AI 상담</b>에 물어보세요.</span>
        </div>
      )}

      {view === "cards" &&
        groups.map((t) => {
          const items = list.filter((a) => a.targets.includes(t));
          if (!items.length) return null;
          return (
            <section key={t} style={{ marginBottom: 48 }}>
              <h2 className="group-title">
                {TARGET_LABEL[t]} <small>{TARGET_DESC[t]} · {items.length}개</small>
              </h2>
              {CATEGORY_ORDER.filter((c) => items.some((a) => a.category === c)).map((c) => (
                <div key={c}>
                  <p className="subgroup">{c}</p>
                  <div className="grid cols-3">
                    {items.filter((a) => a.category === c).map((a) => <AllowanceCard key={a.id} a={a} />)}
                  </div>
                </div>
              ))}
            </section>
          );
        })}

      {view === "table" && list.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>수당 이름</th><th>분류</th><th>대상</th><th>지급 기준 (2026)</th><th>구분</th></tr>
            </thead>
            <tbody>
              {byName.map((a) => (
                <tr key={a.id}>
                  <td><Link href={`/allowances/${a.id}`}>{a.name}</Link></td>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>{a.category}</td>
                  <td><div className="row" style={{ gap: 4 }}><TargetChips a={a} /></div></td>
                  <td style={{ minWidth: 280 }}>{a.amount}</td>
                  <td><div className="row" style={{ gap: 4 }}><StatusChips a={a} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

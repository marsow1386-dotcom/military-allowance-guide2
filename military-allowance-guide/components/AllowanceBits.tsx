import Link from "next/link";
import type { Allowance } from "@/lib/types";
import { TARGET_LABEL } from "@/lib/types";

export function StatusChips({ a, showCheck = true }: { a: Allowance; showCheck?: boolean }) {
  return (
    <>
      {a.requiresApplication ? <span className="chip chip-apply">신청 필요</span> : <span className="chip chip-auto">자동 지급</span>}
      {showCheck && a.needsVerification && (
        <span className="chip chip-check" title="세부 조건·금액을 규정 원문으로 다시 확인 중인 항목">확인 필요</span>
      )}
    </>
  );
}

export function TargetChips({ a }: { a: Allowance }) {
  return (
    <>
      {a.targets.map((t) => (
        <span key={t} className="chip chip-target">{TARGET_LABEL[t]}</span>
      ))}
    </>
  );
}

export function AllowanceCard({ a }: { a: Allowance }) {
  return (
    <Link href={`/allowances/${a.id}`} className="card al-card">
      <div className="top">
        <span className="cat">{a.category}</span>
        {a.requiresApplication ? <span className="chip chip-apply">신청 필요</span> : <span className="chip chip-auto">자동 지급</span>}
      </div>
      <h3>{a.name}</h3>
      <p>{a.summary}</p>
      <div className="foot">
        <TargetChips a={a} />
        {a.needsVerification && <span className="chip chip-check">확인 필요</span>}
      </div>
    </Link>
  );
}

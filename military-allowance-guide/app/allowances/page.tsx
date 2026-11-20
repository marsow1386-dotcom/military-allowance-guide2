import { Suspense } from "react";
import type { Metadata } from "next";
import AllowanceExplorer from "@/components/AllowanceExplorer";
import PageHeader from "@/components/PageHeader";
import { allowances } from "@/data/allowances";

export const metadata: Metadata = { title: "전체 수당" };

export default function AllowancesPage() {
  return (
    <>
      <PageHeader
        title="전체 수당"
        crumbs={[{ href: "/allowances", label: "전체 수당" }]}
        description={<>2026년 기준 {allowances.length}개 수당을 대상별·분류별로 정리했습니다. <span className="chip chip-check">확인 필요</span> 표시는 세부 조건을 규정 원문으로 다시 확인하고 있는 항목입니다.</>}
      />
      <div className="container page-body">
        <Suspense fallback={<p className="muted">불러오는 중…</p>}>
          <AllowanceExplorer />
        </Suspense>
      </div>
    </>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { guides } from "@/data/guides";
import PageHeader from "@/components/PageHeader";
import { TARGET_LABEL } from "@/lib/types";

export const metadata: Metadata = { title: "상황별 가이드" };

export default function GuidesPage() {
  return (
    <>
      <PageHeader title="상황별 가이드" crumbs={[{ href: "/guides", label: "상황별 가이드" }]} description="결혼, 출산, 발령처럼 상황이 바뀔 때 챙길 수당과 할 일을 정리했습니다." />
      <div className="container page-body">
        <div className="grid cols-3">
          {guides.map((g) => (
            <Link key={g.id} href={`/guides/${g.id}`} className="card al-card">
              <div className="top"><span className="cat">{g.targets.map((t) => TARGET_LABEL[t]).join(" · ")}</span></div>
              <h3>{g.title}</h3>
              <p>{g.summary}</p>
              <div className="foot"><span className="chip">관련 수당 {g.relatedAllowanceIds.length}</span><span className="chip">할 일 {g.checklist.length}</span></div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

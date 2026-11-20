import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { guides } from "@/data/guides";
import { allowanceById } from "@/data/allowances";
import { AllowanceCard } from "@/components/AllowanceBits";
import Checklist from "@/components/Checklist";
import PageHeader from "@/components/PageHeader";
import { TARGET_LABEL } from "@/lib/types";

export const dynamicParams = false;
export const generateStaticParams = () => guides.map((g) => ({ id: g.id }));

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const g = guides.find((x) => x.id === params.id);
  return g ? { title: g.title, description: g.summary } : {};
}

export default function GuideDetail({ params }: { params: { id: string } }) {
  const g = guides.find((x) => x.id === params.id);
  if (!g) notFound();
  const related = g.relatedAllowanceIds.map(allowanceById).filter((a): a is NonNullable<typeof a> => !!a);
  return (
    <>
      <PageHeader title={g.title} description={g.summary} crumbs={[{ href: "/guides", label: "상황별 가이드" }, { href: `/guides/${g.id}`, label: g.title }]}>
        <div className="row" style={{ marginTop: 16 }}>{g.targets.map((t) => <span key={t} className="chip">{TARGET_LABEL[t]}</span>)}</div>
      </PageHeader>
      <div className="container page-body">
        <div className="detail">
          <section>
            <h2 className="group-title">바뀌는 수당 <small>{related.length}개</small></h2>
            <div className="grid cols-2">{related.map((a) => <AllowanceCard key={a.id} a={a} />)}</div>
          </section>
          <aside className="detail-aside">
            <div className="card">
              <h2 className="card-title">할 일 체크리스트</h2>
              <Checklist id={g.id} items={g.checklist} />
              <p className="muted small" style={{ marginTop: 10 }}>체크 상태는 이 브라우저에만 저장됩니다.</p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

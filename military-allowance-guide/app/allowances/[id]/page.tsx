import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allowanceById, allowances } from "@/data/allowances";
import { faqs, guides } from "@/data/guides";
import { StatusChips } from "@/components/AllowanceBits";
import PageHeader from "@/components/PageHeader";
import { IconChat, IconInfo } from "@/components/Icons";
import OpenChatButton from "@/components/OpenChatButton";
import CopyLinkButton from "@/components/CopyLinkButton";
import { dateKo } from "@/lib/format";
import { TARGET_LABEL } from "@/lib/types";

export const dynamicParams = false;
export const generateStaticParams = () => allowances.map((a) => ({ id: a.id }));

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const a = allowanceById(params.id);
  return a ? { title: a.name, description: a.summary } : {};
}

function Block({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="info-block">
      <h2>{title}</h2>
      <ul>{items.map((x) => <li key={x}>{x}</li>)}</ul>
    </section>
  );
}

export default function AllowanceDetail({ params }: { params: { id: string } }) {
  const a = allowanceById(params.id);
  if (!a) notFound();
  const relatedFaqs = faqs.filter((f) => f.relatedAllowanceIds.includes(a.id));
  const relatedGuides = guides.filter((g) => g.relatedAllowanceIds.includes(a.id));
  const sameCat = allowances.filter((x) => x.category === a.category && x.id !== a.id).slice(0, 4);

  return (
    <>
      <PageHeader title={a.name} description={a.summary} crumbs={[{ href: "/allowances", label: "전체 수당" }, { href: `/allowances/${a.id}`, label: a.name }]}>
        <div className="row" style={{ marginTop: 16 }}>
          <StatusChips a={a} />
          {a.targets.map((t) => <span key={t} className="chip">{TARGET_LABEL[t]}</span>)}
        </div>
      </PageHeader>

      <div className="container page-body">
        <div className="detail">
          <div>
            <section className="amount" aria-label="지급 기준">
              <div className="amount-head">
                <div className="label">지급 기준 · 2026년</div>
                <div className="value">{a.amount}</div>
              </div>
              {a.amountTable && (
                <div className="amount-table num">
                  {a.amountTable.map((r) => (
                    <div key={r.label}><span>{r.label}</span><b>{r.value}</b></div>
                  ))}
                </div>
              )}
            </section>

            {a.needsVerification && (
              <div className="notice warn" style={{ marginTop: 16 }}>
                <IconInfo size={20} />
                <span>군인 적용 범위나 세부 금액을 규정 원문으로 다시 확인하고 있는 수당입니다. 신청 전에 소속 부대 급여 담당에게 꼭 확인하세요.</span>
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <Block title="지급 대상" items={a.eligibility} />
              <Block title={a.requiresApplication ? "신청 방법" : "지급 방법"} items={a.howToApply} />
              <Block title="필요 서류" items={a.documents} />
              <Block title="유의사항" items={a.notes} />
              {relatedFaqs.length > 0 && (
                <section className="info-block">
                  <h2>자주 묻는 질문</h2>
                  {relatedFaqs.map((f) => (
                    <details key={f.id} className="fold">
                      <summary>{f.question}</summary>
                      <div className="fold-body"><p>{f.answer}</p></div>
                    </details>
                  ))}
                </section>
              )}
            </div>
          </div>

          <aside className="detail-aside">
            <div className="card">
              <h2 className="card-title">한눈에 보기</h2>
              <dl className="kv">
                <dt>구분</dt><dd>{a.requiresApplication ? "신청해야 받음" : "자동 지급"}</dd>
                <dt>대상</dt><dd>{a.targets.map((t) => TARGET_LABEL[t]).join(", ")}</dd>
                <dt>분류</dt><dd>{a.category}</dd>
                <dt>확인일</dt><dd className="num">{dateKo(a.verifiedAt)}</dd>
              </dl>
            </div>
            <div className="card">
              <h2 className="card-title">근거 규정</h2>
              <div className="stack" style={{ gap: 6, fontSize: 14.5 }}>
                {a.legalBasis.map((b) => (
                  <div key={b.title + (b.article ?? "")}>
                    {b.url ? <a href={b.url} target="_blank" rel="noreferrer">{b.title}</a> : <b>{b.title}</b>}
                    {b.article && <span className="muted"> · {b.article}</span>}
                  </div>
                ))}
              </div>
            </div>
            <OpenChatButton className="btn btn-primary" question={`${a.name}에 대해 알려줘`}><IconChat size={18} /> 이 수당 AI에게 묻기</OpenChatButton>
            <CopyLinkButton />
            {(relatedGuides.length > 0 || sameCat.length > 0) && (
              <div>
                <p className="small muted" style={{ marginBottom: 8 }}>함께 보면 좋은 것</p>
                <div className="row">
                  {relatedGuides.map((g) => <Link key={g.id} href={`/guides/${g.id}`} className="pill">{g.title}</Link>)}
                  {sameCat.map((x) => <Link key={x.id} href={`/allowances/${x.id}`} className="pill">{x.name}</Link>)}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}

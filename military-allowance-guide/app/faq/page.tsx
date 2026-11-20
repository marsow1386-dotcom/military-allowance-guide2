import Link from "next/link";
import type { Metadata } from "next";
import { faqs } from "@/data/guides";
import { allowanceById } from "@/data/allowances";
import PageHeader from "@/components/PageHeader";
import OpenChatButton from "@/components/OpenChatButton";
import { IconChat } from "@/components/Icons";

export const metadata: Metadata = { title: "자주 묻는 질문" };

export default function FaqPage() {
  return (
    <>
      <PageHeader title="자주 묻는 질문" crumbs={[{ href: "/faq", label: "자주 묻는 질문" }]} description="찾는 답이 없으면 AI 상담에 물어보세요." />
      <div className="container page-body" style={{ maxWidth: 860 }}>
        {faqs.map((f) => (
          <details key={f.id} className="fold">
            <summary>{f.question}</summary>
            <div className="fold-body">
              <p>{f.answer}</p>
              {f.relatedAllowanceIds.length > 0 && (
                <div className="row" style={{ marginTop: 12 }}>
                  {f.relatedAllowanceIds.map((id) => {
                    const a = allowanceById(id);
                    return a ? <Link key={id} href={`/allowances/${id}`} className="pill">{a.name}</Link> : null;
                  })}
                </div>
              )}
            </div>
          </details>
        ))}
        <div className="cta-band" style={{ marginTop: 40 }}>
          <div><h2>원하는 답이 없나요?</h2><p>AI 상담이 관련 수당과 근거를 찾아드립니다.</p></div>
          <OpenChatButton className="btn btn-primary"><IconChat size={18} /> AI 상담 시작하기</OpenChatButton>
        </div>
      </div>
    </>
  );
}

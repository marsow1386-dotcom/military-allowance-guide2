"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { IconChat, IconClose, IconSend } from "@/components/Icons";
import { OPEN_CHAT_EVENT } from "@/components/OpenChatButton";
import { localRespond, type ChatResponse, type ChatSource } from "@/lib/chat";
import { dateKo } from "@/lib/format";
import { checkInput } from "@/lib/safety";
import { TARGET_LABEL, type Target } from "@/lib/types";

interface Msg {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  followUps?: string[];
  askTarget?: boolean;
  logId?: string;
  question?: string;
  rating?: "up" | "down";
  error?: boolean;
}

const STARTERS: Record<Target | "any", string[]> = {
  any: ["결혼하면 받는 수당은?", "병장 월급이랑 적금은?", "주택수당 대상인가요?"],
  officer: ["결혼하면 받는 수당은?", "주택수당 대상인가요?", "격오지 가면 뭐가 더 나와요?"],
  soldier: ["병장 월급이랑 적금 합치면 얼마예요?", "적금 매칭은 언제 받나요?", "당직비도 나오나요?"],
  civilian: ["자녀가 태어나면 가족수당은?", "연가보상비는 어떻게 받나요?", "정근수당은 언제 나와요?"],
};

/** **굵게**만 지원하는 아주 작은 렌더러 */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : <Fragment key={i}>{p}</Fragment>,
      )}
    </>
  );
}

let seq = 0;

/** 정적 미리보기 빌드에서는 서버 API 없이 브라우저에서 답합니다. */
const STATIC_PREVIEW = process.env.NEXT_PUBLIC_STATIC_PREVIEW === "1";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<Target | undefined>();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const pendingQ = useRef<string | null>(null);

  const warn = input ? checkInput(input) : null;

  const send = useCallback(
    async (text: string, who: Target | undefined = target) => {
      const q = text.trim();
      if (!q || busy) return;
      const history = msgs
        .filter((m) => !m.error)
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));
      setMsgs((m) => [...m, { id: ++seq, role: "user", content: checkInput(q).masked }]);
      setInput("");
      setBusy(true);
      try {
        let data: ChatResponse;
        if (STATIC_PREVIEW) {
          await new Promise((r) => setTimeout(r, 350));
          data = localRespond(q, who, history);
        } else {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ question: q, target: who, history }),
          });
          const json = (await res.json()) as ChatResponse & { error?: string };
          if (!res.ok) throw new Error(json.error || "답변을 가져오지 못했습니다.");
          data = json;
        }
        setMsgs((m) => [
          ...m,
          {
            id: ++seq,
            role: "assistant",
            content: data.answer,
            sources: data.sources,
            followUps: data.followUps,
            askTarget: data.askTarget && !who,
            logId: data.logId,
            question: q,
          },
        ]);
      } catch (e) {
        setMsgs((m) => [
          ...m,
          { id: ++seq, role: "assistant", content: e instanceof Error ? e.message : "잠시 후 다시 시도해 주세요.", error: true },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, msgs, target],
  );

  // 다른 화면의 "AI에게 묻기" 버튼
  useEffect(() => {
    const h = (e: Event) => {
      const q = (e as CustomEvent<{ question?: string }>).detail?.question;
      setOpen(true);
      if (q) pendingQ.current = q;
    };
    window.addEventListener(OPEN_CHAT_EVENT, h);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, h);
  }, []);

  useEffect(() => {
    if (open && pendingQ.current && !busy) {
      const q = pendingQ.current;
      pendingQ.current = null;
      void send(q);
    }
  }, [open, busy, send]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const rate = async (msg: Msg, rating: "up" | "down") => {
    setMsgs((m) => m.map((x) => (x.id === msg.id ? { ...x, rating } : x)));
    if (STATIC_PREVIEW) return;
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ logId: msg.logId, rating, question: msg.question }),
      });
    } catch {
      /* 평가 전송 실패는 사용자 흐름을 막지 않음 */
    }
  };

  const chooseTarget = (t: Target) => {
    setTarget(t);
    const lastQ = [...msgs].reverse().find((m) => m.role === "assistant" && m.askTarget)?.question;
    if (lastQ) void send(lastQ, t);
  };

  const lastBot = [...msgs].reverse().find((m) => m.role === "assistant");

  if (!open) {
    return (
      <button ref={fabRef} type="button" className="chat-fab" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <IconChat size={22} /> AI 수당 상담
      </button>
    );
  }

  return (
    <section className="chat-panel" role="dialog" aria-modal="false" aria-labelledby="chat-title">
      <header className="chat-head">
        <span className="dot" aria-hidden="true" />
        <h2 id="chat-title">AI 수당 상담</h2>
        {msgs.length > 0 && (
          <button type="button" onClick={() => setMsgs([])} aria-label="대화 지우기" title="대화 지우기" >
            새 대화
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTimeout(() => fabRef.current?.focus(), 0);
          }}
          aria-label="상담 창 닫기"
        >
          <IconClose size={18} />
        </button>
      </header>
      <div className="chat-disclaimer">참고용 안내입니다. 실제 지급은 소속 부대 인사·급여 담당에게 확인하세요.</div>

      <div className="chat-body" ref={bodyRef} aria-live="polite">
        <div className="bubble bot">
          안녕하세요. 군 수당에 대해 물어보세요.
          {!target && " 신분을 먼저 골라주시면 더 정확하게 답할 수 있어요."}
        </div>
        <div className="chip-row" role="group" aria-label="신분 선택">
          {(["officer", "soldier", "civilian"] as Target[]).map((t) => (
            <button key={t} type="button" className="chip-btn" aria-pressed={target === t} onClick={() => setTarget(t)}>
              {TARGET_LABEL[t]}
            </button>
          ))}
        </div>
        {msgs.length === 0 && (
          <div className="chip-row">
            {STARTERS[target ?? "any"].map((q) => (
              <button key={q} type="button" className="chip-btn" onClick={() => void send(q)}>{q}</button>
            ))}
          </div>
        )}

        {msgs.map((m) => (
          <Fragment key={m.id}>
            <div className={`bubble ${m.role === "user" ? "me" : "bot"}`} style={m.error ? { color: "var(--amber-ink)" } : undefined}>
              <RichText text={m.content} />
            </div>
            {m.sources && m.sources.length > 0 && (
              <div className="src-card">
                <span className="muted">근거</span>
                {m.sources.map((s) => (
                  <span key={s.id}>
                    <Link href={s.href} onClick={() => window.innerWidth < 880 && setOpen(false)}>{s.name}</Link>
                    <span className="muted"> · {s.basis} · 확인 {dateKo(s.verifiedAt)}</span>
                    {s.requiresApplication && <span className="chip chip-apply" style={{ marginLeft: 4 }}>신청 필요</span>}
                    {s.needsVerification && <span className="chip chip-check" style={{ marginLeft: 4 }}>확인 필요</span>}
                  </span>
                ))}
              </div>
            )}
            {m.askTarget && !target && (
              <div className="chip-row" role="group" aria-label="신분을 알려주세요">
                <span className="small muted" style={{ alignSelf: "center" }}>신분을 알려주시면 다시 답할게요:</span>
                {(["officer", "soldier", "civilian"] as Target[]).map((t) => (
                  <button key={t} type="button" className="chip-btn" onClick={() => chooseTarget(t)}>{TARGET_LABEL[t]}</button>
                ))}
              </div>
            )}
            {m.role === "assistant" && !m.error && (
              <div className="fb-row" role="group" aria-label="답변 평가">
                <button type="button" aria-pressed={m.rating === "up"} onClick={() => rate(m, "up")}>도움됨</button>
                <button type="button" aria-pressed={m.rating === "down"} onClick={() => rate(m, "down")}>아쉬움</button>
              </div>
            )}
          </Fragment>
        ))}

        {busy && (
          <div className="bubble bot" aria-label="답변 작성 중">
            <span className="typing"><i /><i /><i /></span>
          </div>
        )}
        {!busy && lastBot?.followUps && lastBot.followUps.length > 0 && (
          <div className="chip-row">
            {lastBot.followUps.map((q) => (
              <button key={q} type="button" className="chip-btn" onClick={() => void send(q)}>{q}</button>
            ))}
          </div>
        )}
      </div>

      <div className="chat-foot">
        <form
          className="chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <label htmlFor="chat-input" className="sr-only">질문 입력</label>
          <textarea
            id="chat-input"
            ref={inputRef}
            rows={1}
            maxLength={500}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder="예: 아이가 태어나면 바뀌는 수당은?"
          />
          <button type="submit" disabled={busy || !input.trim()} aria-label="보내기">
            <IconSend size={20} />
          </button>
        </form>
        {warn && (warn.piiFound.length > 0 || warn.securityFound.length > 0) ? (
          <p className="chat-warn" role="alert">
            {warn.piiFound.length > 0 && `${warn.piiFound.join(", ")}로 보이는 내용이 있어요. 보내면 가려서 처리됩니다. `}
            {warn.securityFound.length > 0 && "보안 관련 내용은 답하지 않습니다."}
          </p>
        ) : (
          <p className="chat-hint">개인정보(주민번호·군번·연락처)와 보안 관련 내용은 입력하지 마세요.</p>
        )}
      </div>
    </section>
  );
}

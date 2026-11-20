"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { openChat } from "@/components/OpenChatButton";

const LINKS = [
  { href: "/finder", label: "내 수당 찾기" },
  { href: "/allowances", label: "전체 수당" },
  { href: "/guides", label: "상황별 가이드" },
  { href: "/faq", label: "자주 묻는 질문" },
];

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="군 수당 가이드 홈">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="currentColor" />
        <path d="M9 11.5 11.5 21l3-7 3 7 2.5-9.5M8.5 16h15" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>군 수당 가이드</span>
    </Link>
  );
}

export default function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <nav className={`site-nav${open ? " is-open" : ""}`} aria-label="주 메뉴" id="site-nav">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={path.startsWith(l.href) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
          <button type="button" className="btn btn-primary btn-sm nav-cta" onClick={() => { setOpen(false); openChat(); }}>
            AI 상담
          </button>
        </nav>
        <button
          type="button"
          className="menu-btn"
          aria-expanded={open}
          aria-controls="site-nav"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          onClick={() => setOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}

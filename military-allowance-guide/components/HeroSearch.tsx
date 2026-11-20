"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconSearch } from "@/components/Icons";

export default function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      className="hero-search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/allowances?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <label htmlFor="hero-q" className="sr-only">수당 검색</label>
      <input id="hero-q" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="수당 이름이나 상황으로 검색 (예: 결혼, 격오지)" />
      <button type="submit" className="btn btn-primary"><IconSearch size={18} /> 검색</button>
    </form>
  );
}

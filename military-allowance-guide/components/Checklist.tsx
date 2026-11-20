"use client";

import { useEffect, useState } from "react";

const key = (id: string) => `checklist:${id}`;

export default function Checklist({ id, items }: { id: string; items: string[] }) {
  const [done, setDone] = useState<boolean[]>(() => items.map(() => false));

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key(id)) ?? "null");
      if (Array.isArray(saved) && saved.length === items.length) setDone(saved.map(Boolean));
    } catch {
      /* 저장소를 쓸 수 없으면 무시 */
    }
  }, [id, items.length]);

  const toggle = (i: number) => {
    setDone((prev) => {
      const next = prev.map((v, j) => (j === i ? !v : v));
      try {
        localStorage.setItem(key(id), JSON.stringify(next));
      } catch {
        /* 무시 */
      }
      return next;
    });
  };

  const count = done.filter(Boolean).length;
  return (
    <div>
      <p className="small muted" style={{ margin: "0 0 4px" }}>{count} / {items.length} 완료</p>
      {items.map((it, i) => (
        <label key={it} className="check" htmlFor={`${id}-c${i}`}>
          <input id={`${id}-c${i}`} type="checkbox" checked={done[i]} onChange={() => toggle(i)} />
          <span>{it}</span>
        </label>
      ))}
    </div>
  );
}

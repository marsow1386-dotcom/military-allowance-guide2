"use client";

import { useState } from "react";

export default function CopyLinkButton({ label = "링크 복사" }: { label?: string }) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  return (
    <button
      type="button"
      className="btn btn-outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setState("done");
        } catch {
          setState("fail");
        }
        setTimeout(() => setState("idle"), 2000);
      }}
    >
      {state === "done" ? "복사했습니다" : state === "fail" ? "주소창의 링크를 복사해 주세요" : label}
    </button>
  );
}

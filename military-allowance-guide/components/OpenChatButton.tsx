"use client";

import type { CSSProperties, ReactNode } from "react";

export const OPEN_CHAT_EVENT = "open-chat";

export function openChat(question?: string) {
  window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT, { detail: { question } }));
}

export default function OpenChatButton({
  children,
  className,
  style,
  question,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  question?: string;
}) {
  return (
    <button type="button" className={className} style={style} onClick={() => openChat(question)}>
      {children}
    </button>
  );
}

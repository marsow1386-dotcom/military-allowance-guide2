import { Suspense } from "react";
import type { Metadata } from "next";
import Finder from "@/components/Finder";

export const metadata: Metadata = { title: "내 수당 찾기" };

export default function FinderPage() {
  return (
    <Suspense fallback={<p className="muted">불러오는 중…</p>}>
      <Finder />
    </Suspense>
  );
}

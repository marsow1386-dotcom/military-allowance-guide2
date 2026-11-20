import Link from "next/link";
import type { ReactNode } from "react";

export default function PageHeader({
  title,
  description,
  crumbs = [],
  children,
}: {
  title: string;
  description?: ReactNode;
  crumbs?: { href: string; label: string }[];
  children?: ReactNode;
}) {
  return (
    <section className="page-header">
      <div className="container">
        <nav className="crumbs" aria-label="현재 위치">
          <Link href="/">홈</Link>
          {crumbs.map((c) => (
            <span key={c.href}>
              <span aria-hidden="true"> / </span>
              <Link href={c.href}>{c.label}</Link>
            </span>
          ))}
        </nav>
        <h1>{title}</h1>
        {description && <p className="page-desc">{description}</p>}
        {children}
      </div>
    </section>
  );
}

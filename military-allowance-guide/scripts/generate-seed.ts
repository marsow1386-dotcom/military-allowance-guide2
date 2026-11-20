/** data/allowances.ts → supabase/seed.sql 생성 (npm run seed:sql) */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { allowances } from "../data/allowances";

const q = (s: string) => `'${s.replaceAll("'", "''")}'`;
const arr = (xs: string[]) => (xs.length ? `array[${xs.map(q).join(", ")}]::text[]` : "'{}'::text[]");
const json = (v: unknown) => (v === undefined ? "null" : `${q(JSON.stringify(v))}::jsonb`);

const rows = allowances.map(
  (a) =>
    `(${[
      q(a.id), q(a.name), arr(a.aliases), q(a.category), arr(a.targets), q(a.summary), q(a.amount),
      json(a.amountTable), String(a.requiresApplication), arr(a.eligibility), arr(a.howToApply),
      arr(a.documents), arr(a.notes), json(a.legalBasis), q(a.verifiedAt), String(a.needsVerification),
    ].join(", ")})`,
);

const sql = `-- 자동 생성 파일: npm run seed:sql (직접 수정하지 마세요)
insert into public.allowances
  (id, name, aliases, category, targets, summary, amount, amount_table, requires_application,
   eligibility, how_to_apply, documents, notes, legal_basis, verified_at, needs_verification)
values
${rows.join(",\n")}
on conflict (id) do update set
  name = excluded.name, aliases = excluded.aliases, category = excluded.category, targets = excluded.targets,
  summary = excluded.summary, amount = excluded.amount, amount_table = excluded.amount_table,
  requires_application = excluded.requires_application, eligibility = excluded.eligibility,
  how_to_apply = excluded.how_to_apply, documents = excluded.documents, notes = excluded.notes,
  legal_basis = excluded.legal_basis, verified_at = excluded.verified_at,
  needs_verification = excluded.needs_verification, updated_at = now();
`;

const out = join(__dirname, "..", "supabase", "seed.sql");
writeFileSync(out, sql);
console.log(`wrote ${allowances.length} rows → supabase/seed.sql`);

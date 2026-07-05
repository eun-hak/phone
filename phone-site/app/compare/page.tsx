import type { Metadata } from "next";
import Link from "next/link";
import {
  BRAND_LABELS,
  CURATED_COMPARES,
  canonicalCompareSlug,
  getAllPhones,
  getPhone,
} from "@/lib/phones";
import { formatPct } from "@/lib/format";
import Badge from "@/components/ui/Badge";
import CompareBuilder from "./CompareBuilder";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "기종 비교 — 지원종료·수리비·잔존가치로 비교하기",
  description:
    "스펙이 아니라 결정 기준(보안지원 기간, 수리비, 잔존가치)으로 두 기종을 비교합니다.",
  alternates: { canonical: "/compare" },
};

export default function CompareIndexPage() {
  const pairs = CURATED_COMPARES.map(([a, b]) => {
    const pa = getPhone(a);
    const pb = getPhone(b);
    if (!pa || !pb) return null;
    return { slug: canonicalCompareSlug(a, b), a: pa, b: pb };
  }).filter(Boolean) as Array<{
    slug: string;
    a: NonNullable<ReturnType<typeof getPhone>>;
    b: NonNullable<ReturnType<typeof getPhone>>;
  }>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        기종 비교
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-7 text-sub">
        폰덱스의 비교는 스펙 나열이 아닙니다. 몇 년 더 쓸 수 있는지, 고장 나면
        얼마가 드는지, 되팔 때 얼마가 남는지 — 돈과 수명으로 비교합니다.
      </p>

      <CompareBuilder
        options={getAllPhones().map((p) => ({
          slug: p.slug,
          name: p.name,
          brandLabel: BRAND_LABELS[p.brand],
        }))}
      />

      <h2 className="mt-10 text-lg font-bold tracking-tight">
        많이 찾는 비교
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {pairs.map(({ slug, a, b }) => (
          <Link
            key={slug}
            href={`/compare/${slug}`}
            className="group rounded-xl border border-hairline bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-accent-strong/40 hover:shadow-pop"
          >
            <p className="text-base font-bold tracking-tight group-hover:text-accent">
              {a.name} <span className="mx-1 text-mut">vs</span> {b.name}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-sub">
              <div className="space-y-1.5">
                <p className="font-medium text-ink">{a.name}</p>
                <Badge tone={a.metrics.verdict.tone} dot>
                  {a.metrics.verdict.label}
                </Badge>
                <p>잔존가치 {formatPct(a.metrics.residualPct, 0)}</p>
              </div>
              <div className="space-y-1.5">
                <p className="font-medium text-ink">{b.name}</p>
                <Badge tone={b.metrics.verdict.tone} dot>
                  {b.metrics.verdict.label}
                </Badge>
                <p>잔존가치 {formatPct(b.metrics.residualPct, 0)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

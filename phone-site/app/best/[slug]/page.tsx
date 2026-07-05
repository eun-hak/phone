import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPhones } from "@/lib/phones";
import { RANKINGS, getRanking } from "@/lib/rankings";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/jsonld";
import JsonLd from "@/components/seo/JsonLd";
import Badge from "@/components/ui/Badge";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return RANKINGS.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ranking = getRanking(slug);
  if (!ranking) return {};
  return {
    title: `${ranking.title} — ${ranking.question}`,
    description: ranking.description,
    alternates: { canonical: `/best/${slug}` },
  };
}

export default async function RankingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ranking = getRanking(slug);
  if (!ranking) notFound();

  const rows = ranking.build(getAllPhones());

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <JsonLd
        data={[
          itemListJsonLd(
            ranking.title,
            rows.map((r) => ({
              name: r.phone.name,
              path: `/phones/${r.phone.slug}`,
            })),
          ),
          breadcrumbJsonLd([
            { name: "결정 랭킹", path: "/best" },
            { name: ranking.shortTitle, path: `/best/${ranking.slug}` },
          ]),
        ]}
      />

      <nav aria-label="브레드크럼" className="text-xs text-mut">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/best" className="hover:text-accent">
              결정 랭킹
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-sub">{ranking.shortTitle}</li>
        </ol>
      </nav>

      {/* 랭킹 전환 탭 */}
      <nav aria-label="다른 랭킹" className="-mx-4 mt-4 overflow-x-auto px-4">
        <ul className="flex items-center gap-1.5 whitespace-nowrap">
          {RANKINGS.map((r) => {
            const active = r.slug === ranking.slug;
            return (
              <li key={r.slug}>
                <Link
                  href={`/best/${r.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={`inline-block rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-accent bg-accent text-white"
                      : "border-hairline bg-card text-sub hover:border-accent-strong/40 hover:text-accent"
                  }`}
                >
                  {r.shortTitle}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <header className="mt-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">
          {ranking.title}
        </h1>
        <p className="mt-2 text-[15px] leading-7 text-sub">
          {ranking.description}
        </p>
      </header>

      <section aria-label="랭킹 표" className="mt-6">
        <div className="overflow-hidden rounded-xl border border-hairline bg-card shadow-card">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">순위</th>
                <th>기종</th>
                <th className="text-right">{ranking.valueLabel}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.phone.slug}>
                  <td className="tnum text-sub">{i + 1}</td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/phones/${row.phone.slug}`}
                        className="font-medium hover:text-accent"
                      >
                        {row.phone.name}
                      </Link>
                      <Badge tone={row.phone.metrics.verdict.tone} dot>
                        {row.phone.metrics.verdict.label}
                      </Badge>
                    </div>
                    {row.subText && (
                      <p className="mt-0.5 text-xs text-mut">{row.subText}</p>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      {row.barPct !== undefined && (
                        <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-accent-soft sm:block">
                          <div
                            className="h-full rounded-full bg-accent-strong"
                            style={{ width: `${row.barPct}%` }}
                          />
                        </div>
                      )}
                      <span className="tnum text-sm font-semibold">
                        {row.valueText}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-sm text-sub">
                    조건에 맞는 기종이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-5 text-mut">
          산정 방식: {ranking.methodology} 순위는 광고·제휴와 무관하게 수록
          데이터로만 계산됩니다.
        </p>
      </section>
    </div>
  );
}

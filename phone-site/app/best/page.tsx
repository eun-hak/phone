import type { Metadata } from "next";
import Link from "next/link";
import { getAllPhones } from "@/lib/phones";
import { RANKINGS } from "@/lib/rankings";
import { itemListJsonLd } from "@/lib/jsonld";
import JsonLd from "@/components/seo/JsonLd";
import Badge from "@/components/ui/Badge";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "결정 랭킹 — 잔존가치·지원기간·수리비·예산별 최강 기종",
  description:
    "잔존가치 방어, 보안지원 잔여, 수리비 부담, 예산별 최강 기종까지 — 폰덱스의 데이터 지표로 줄 세운 결정 랭킹 모음입니다.",
  alternates: { canonical: "/best" },
};

export default function BestIndexPage() {
  const phones = getAllPhones();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd
        data={itemListJsonLd(
          "폰덱스 결정 랭킹",
          RANKINGS.map((r) => ({ name: r.title, path: `/best/${r.slug}` })),
        )}
      />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        결정 랭킹
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-7 text-sub">
        “좋은 폰”이 아니라 <strong className="font-semibold text-ink">기준별로 유리한 폰</strong>을
        보여줍니다. 모든 랭킹은 같은 데이터(지원종료일·수리비·시세·이슈)에서
        계산되며, 산정 방식을 각 페이지에 공개합니다.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RANKINGS.map((r) => {
          const rows = r.build(phones);
          const top = rows.slice(0, 3);
          return (
            <Link
              key={r.slug}
              href={`/best/${r.slug}`}
              className="group flex flex-col rounded-xl border border-hairline bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-accent-strong/40 hover:shadow-pop"
            >
              <p className="text-xs font-medium text-mut">{r.question}</p>
              <h2 className="mt-1 text-base font-bold tracking-tight group-hover:text-accent">
                {r.title}
              </h2>
              <ol className="mt-3 space-y-1.5 border-t border-hairline pt-3">
                {top.map((row, i) => (
                  <li
                    key={row.phone.slug}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      <span className="tnum mr-1.5 font-semibold text-mut">
                        {i + 1}
                      </span>
                      {row.phone.name}
                    </span>
                    <span className="tnum shrink-0 text-xs font-semibold text-sub">
                      {row.valueText}
                    </span>
                  </li>
                ))}
                {top.length === 0 && (
                  <li className="text-xs text-mut">해당 기종 없음</li>
                )}
              </ol>
              <span className="mt-3 text-xs font-medium text-accent">
                전체 {rows.length}위까지 보기 →
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-10 rounded-xl border border-hairline bg-wash p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">산정 원칙</Badge>
          <p className="text-xs leading-5 text-sub">
            랭킹에 광고·제휴가 개입하지 않습니다. 순위는 공개된 산식과 수록
            데이터만으로 계산되며, 데이터 기준일은 각 기종 문서에 표기됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

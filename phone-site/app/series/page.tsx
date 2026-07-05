import type { Metadata } from "next";
import Link from "next/link";
import { SERIES_LIST, phonesOfSeries } from "@/lib/series";
import { formatManwon } from "@/lib/format";
import { itemListJsonLd } from "@/lib/jsonld";
import JsonLd from "@/components/seo/JsonLd";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "시리즈별 보기 — 갤럭시 S·Z·A·노트, 아이폰",
  description:
    "시리즈 단위로 세대별 지원종료·시세·판정을 한눈에 봅니다. 세대를 건너뛸지, 어느 세대에서 합류할지 결정할 때 쓰세요.",
  alternates: { canonical: "/series" },
};

export default function SeriesIndexPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd
        data={itemListJsonLd(
          "시리즈별 보기",
          SERIES_LIST.map((s) => ({ name: s.name, path: `/series/${s.slug}` })),
        )}
      />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        시리즈별 보기
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-7 text-sub">
        같은 시리즈 안에서 세대별 지원 기간·시세를 나란히 보면, “한 세대
        건너뛰어도 되나”가 명확해집니다.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERIES_LIST.map((s) => {
          const phones = phonesOfSeries(s.slug);
          const latest = phones[0];
          return (
            <Link
              key={s.slug}
              href={`/series/${s.slug}`}
              className="group flex flex-col rounded-xl border border-hairline bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-accent-strong/40 hover:shadow-pop"
            >
              <h2 className="text-lg font-bold tracking-tight group-hover:text-accent">
                {s.name}
              </h2>
              <p className="mt-1.5 text-xs leading-5 text-sub">{s.lede}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-hairline pt-3 text-xs text-mut">
                <span>수록 {phones.length}개 기종</span>
                <span>{s.cycleNote}</span>
                {latest && (
                  <span>
                    최신 {latest.name} · {formatManwon(latest.metrics.latestResale)}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

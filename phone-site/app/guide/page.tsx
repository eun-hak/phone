import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES, type Guide } from "@/lib/guides";
import { SITE_NAME } from "@/lib/site";
import { itemListJsonLd } from "@/lib/jsonld";
import JsonLd from "@/components/seo/JsonLd";
import Badge from "@/components/ui/Badge";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: `가이드 · 리포트 — 스마트폰 구매·중고 결정 길잡이`,
  description: `${SITE_NAME}가 직접 쓴 스마트폰 구매·수리·중고거래 가이드와 실측 데이터 리포트. 데이터와 도구로 이어지는 실전 길잡이입니다.`,
  alternates: { canonical: "/guide" },
};

function GuideCard({ g }: { g: Guide }) {
  return (
    <Link
      href={`/guide/${g.slug}`}
      className="group block rounded-2xl border border-hairline bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-accent-strong/40 hover:shadow-pop"
    >
      <div className="flex flex-wrap items-center gap-2">
        {g.tags.slice(0, 2).map((t) => (
          <Badge key={t} tone="neutral">
            {t}
          </Badge>
        ))}
        <span className="text-xs text-mut">{g.readMin}분 읽기</span>
      </div>
      <h2 className="mt-2.5 text-lg font-bold tracking-tight group-hover:text-accent">
        {g.title}
      </h2>
      <p className="mt-1.5 text-sm leading-6 text-sub">{g.description}</p>
    </Link>
  );
}

export default function GuideIndexPage() {
  const reports = GUIDES.filter((g) => g.kind === "report");
  const guides = GUIDES.filter((g) => g.kind !== "report");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <JsonLd
        data={itemListJsonLd(
          "폰덱스 가이드",
          GUIDES.map((g) => ({ name: g.title, path: `/guide/${g.slug}` })),
        )}
      />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        가이드 · 리포트
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-7 text-sub">
        스펙표가 답해주지 않는 실전 질문들 — 중고폰 사기 예방, 지원 끝난 폰,
        수리 vs 교체, 2년 총비용 계산까지. 각 글은 사이트의 데이터·도구로
        이어집니다.
      </p>

      {reports.length > 0 && (
        <section className="mt-9">
          <h2 className="text-xs font-bold uppercase tracking-wide text-mut">
            데이터 리포트
          </h2>
          <p className="mt-1 text-sm text-sub">
            신제품 출시·시세 변동 등 지금 시점의 결정을 실측 데이터로 분석합니다.
          </p>
          <div className="mt-4 space-y-4">
            {reports.map((g) => (
              <GuideCard key={g.slug} g={g} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-wide text-mut">
          가이드
        </h2>
        <div className="mt-4 space-y-4">
          {guides.map((g) => (
            <GuideCard key={g.slug} g={g} />
          ))}
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLiveGuides, getGuide, isGuideLive, type GuideBlock } from "@/lib/guides";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { ogImageMeta } from "@/lib/og";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import JsonLd from "@/components/seo/JsonLd";
import Badge from "@/components/ui/Badge";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return getLiveGuides().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return {};
  const og = ogImageMeta({
    title: g.title,
    kicker: `가이드 · ${g.tags[0] ?? ""}`,
    subtitle: g.description,
  });
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/guide/${slug}` },
    openGraph: {
      type: "article",
      title: g.title,
      description: g.description,
      images: og,
    },
    twitter: { card: "summary_large_image", images: og },
  };
}

function Block({ block }: { block: GuideBlock }) {
  if (block.type === "p") {
    return <p className="text-[15px] leading-7 text-sub">{block.text}</p>;
  }
  if (block.type === "note") {
    return (
      <p className="rounded-xl border border-accent-strong/25 bg-accent-soft/50 p-4 text-sm leading-6 text-ink">
        {block.text}
      </p>
    );
  }
  if (block.type === "ul") {
    return (
      <ul className="space-y-2 text-[15px] leading-7 text-sub">
        {block.items?.map((it) => (
          <li key={it} className="flex gap-2">
            <span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-accent-strong" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === "table") {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-mut">
              {block.headers?.map((h) => (
                <th key={h} className="py-2 pr-4 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows?.map((row, ri) => (
              <tr key={ri} className="border-b border-hairline/60">
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={
                      ci === 0
                        ? "py-2 pr-4 font-medium text-ink"
                        : "tnum py-2 pr-4 text-sub"
                    }
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  // steps
  return (
    <ol className="space-y-2.5 text-[15px] leading-7 text-sub">
      {block.items?.map((it, i) => (
        <li key={it} className="flex gap-3">
          <span className="tnum inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">
            {i + 1}
          </span>
          <span className="pt-0.5">{it}</span>
        </li>
      ))}
    </ol>
  );
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g || !isGuideLive(g)) notFound();

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.title,
    description: g.description,
    datePublished: g.updated,
    dateModified: g.updated,
    author: {
      "@type": "Organization",
      name: `${SITE_NAME} 편집팀`,
      url: `${SITE_URL}/about`,
    },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: `${SITE_URL}/guide/${g.slug}`,
    inLanguage: "ko",
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JsonLd
        data={[
          articleLd,
          faqJsonLd(g.faq),
          breadcrumbJsonLd([
            { name: "가이드", path: "/guide" },
            { name: g.title, path: `/guide/${g.slug}` },
          ]),
        ]}
      />

      <nav aria-label="브레드크럼" className="text-xs text-mut">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/guide" className="hover:text-accent">
              가이드
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-sub">{g.tags[0]}</li>
        </ol>
      </nav>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          {g.tags.map((t) => (
            <Badge key={t} tone="neutral">
              {t}
            </Badge>
          ))}
          <span className="text-xs text-mut">{g.readMin}분 읽기</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold leading-snug tracking-tight sm:text-[30px]">
          {g.title}
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-sub">{g.intro}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-mut">
          <Link
            href="/about"
            className="font-medium text-sub hover:text-accent"
          >
            글 · 폰덱스 편집팀
          </Link>
          <span aria-hidden="true">·</span>
          <span>
            최종 수정 <time className="tnum">{g.updated}</time>
          </span>
        </div>
      </header>

      <div className="mt-8 space-y-10">
        {g.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-lg font-bold tracking-tight">{s.heading}</h2>
            <div className="mt-3 space-y-3">
              {s.blocks.map((b, i) => (
                <Block key={i} block={b} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {g.faq.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold tracking-tight">자주 묻는 질문</h2>
          <dl className="mt-4 space-y-4">
            {g.faq.map((f) => (
              <div
                key={f.q}
                className="rounded-xl border border-hairline bg-card p-4 shadow-card"
              >
                <dt className="text-sm font-semibold">{f.q}</dt>
                <dd className="mt-1.5 text-sm leading-6 text-sub">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="mt-12 rounded-2xl border border-hairline bg-card p-5 shadow-card">
        <p className="text-sm font-bold">폰덱스 편집팀</p>
        <p className="mt-1.5 text-sm leading-6 text-sub">
          폰덱스 편집팀은 제조사·통신사 공식 자료와 중고 거래 시세를 직접
          수집·교차검증해 휴대폰 구매·보유·중고 결정에 필요한 데이터를 정리합니다.
          모든 수치는 출처와 기준일을 함께 표기하고, 추정치는 추정임을 명시합니다.
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium">
          <Link href="/about" className="text-accent hover:underline">
            폰덱스 소개 →
          </Link>
          <Link href="/methodology" className="text-accent hover:underline">
            데이터 방법론 →
          </Link>
        </div>
      </section>

      {g.related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold tracking-tight">함께 보면 좋은</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {g.related.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="group rounded-xl border border-hairline bg-card p-4 shadow-card transition-colors hover:border-accent-strong/40"
              >
                <p className="text-sm font-bold group-hover:text-accent">
                  {r.label} →
                </p>
                <p className="mt-1 text-xs leading-5 text-sub">{r.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 border-t border-hairline pt-6">
        <Link
          href="/guide"
          className="text-sm font-medium text-accent hover:underline"
        >
          ← 다른 가이드 보기
        </Link>
      </div>
    </article>
  );
}

import type { Metadata } from "next";
import { getAllPhones, BRAND_LABELS, EOL_STATUS_META } from "@/lib/phones";
import { formatDday, formatYearMonth } from "@/lib/format";
import { itemListJsonLd } from "@/lib/jsonld";
import JsonLd from "@/components/seo/JsonLd";
import CalendarTable, { type CalendarRow } from "./CalendarTable";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "휴대폰 지원종료 캘린더 — 내 폰 언제까지 쓸 수 있나",
  description:
    "갤럭시·아이폰 기종별 OS/보안 업데이트 종료일을 한눈에. 보안지원이 끝나기 전에 교체 시점을 계획하세요.",
  alternates: { canonical: "/calendar" },
};

export default function CalendarPage() {
  const phones = getAllPhones()
    .filter((p) => p.eol.securityEndDate !== null)
    .sort((a, b) =>
      (a.eol.securityEndDate ?? "").localeCompare(b.eol.securityEndDate ?? ""),
    );

  const rows: CalendarRow[] = phones.map((p) => {
    const meta = p.metrics.eolStatus
      ? EOL_STATUS_META[p.metrics.eolStatus]
      : null;
    return {
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      brandLabel: BRAND_LABELS[p.brand],
      secEndYm: p.eol.securityEndDate
        ? formatYearMonth(p.eol.securityEndDate)
        : "미상",
      osEndYm: p.eol.osEndDate ? formatYearMonth(p.eol.osEndDate) : "미상",
      dday: p.eol.securityEndDate ? formatDday(p.eol.securityEndDate) : "—",
      eolLabel: meta?.label ?? "미상",
      eolTone: meta?.tone ?? "neutral",
      elapsedPct: Math.round(p.metrics.supportElapsedPct ?? 0),
      estimated: p.eol.estimated,
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd
        data={itemListJsonLd(
          "휴대폰 지원종료 캘린더",
          phones.map((p) => ({
            name: p.name,
            path: `/phones/${p.slug}/updates`,
          })),
        )}
      />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        지원종료 캘린더
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-7 text-sub">
        폰의 실질 수명은 <strong className="font-semibold text-ink">보안 업데이트 종료일</strong>이
        결정합니다. 종료일이 가까운 순서로 정렬했습니다. 애플 기종은 공식
        종료일이 없어 역대 지원 기간 기반 추정치이며 <em>추정</em> 표시를
        달았습니다.
      </p>
      <CalendarTable rows={rows} />
    </div>
  );
}

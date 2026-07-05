"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ToolPhone } from "@/lib/clientData";
import { useLocalStorageString } from "@/lib/useLocalStorage";
import Badge from "@/components/ui/Badge";
import PhoneMedia from "@/components/phone/PhoneMedia";

/**
 * 내 폰 대시보드 — localStorage(phondex.my.v1)에 슬러그 목록만 저장.
 * 모든 지표는 서버가 내려준 직렬화 데이터에서 조회한다.
 */

const STORAGE_KEY = "phondex.my.v1";

const fmtMan = (n: number) => {
  const man = Math.round(n / 1000) / 10;
  return `${Number.isInteger(man) ? man : man.toFixed(1)}만원`;
};
const fmtMonths = (m: number) => {
  const y = Math.floor(m / 12);
  const r = m % 12;
  if (y === 0) return `${r}개월`;
  return r === 0 ? `${y}년` : `${y}년 ${r}개월`;
};
function dday(iso: string): string {
  const days = Math.ceil(
    (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (days < 0) return "종료됨";
  if (days === 0) return "D-DAY";
  return `D-${days.toLocaleString("ko-KR")}`;
}

export default function MyDashboard({ phones }: { phones: ToolPhone[] }) {
  const [rawSlugs, setRawSlugs] = useLocalStorageString(STORAGE_KEY, "[]");
  const [query, setQuery] = useState("");

  const slugs = useMemo(() => {
    try {
      const parsed = JSON.parse(rawSlugs);
      return Array.isArray(parsed)
        ? parsed.filter((s): s is string => typeof s === "string")
        : [];
    } catch {
      return [];
    }
  }, [rawSlugs]);

  const save = (next: string[]) => setRawSlugs(JSON.stringify(next));

  const mine = useMemo(
    () =>
      slugs
        .map((s) => phones.find((p) => p.slug === s))
        .filter((p): p is ToolPhone => Boolean(p)),
    [slugs, phones],
  );

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase().replace(/\s+/g, "");
    return phones
      .filter((p) => !slugs.includes(p.slug))
      .filter((p) => {
        const name = p.name.toLowerCase().replace(/\s+/g, "");
        return name.includes(q) || p.slug.replace(/-/g, "").includes(q);
      })
      .slice(0, 6);
  }, [query, phones, slugs]);

  return (
    <div className="mt-8 space-y-8">
      {/* 기기 추가 */}
      <section className="rounded-2xl border border-hairline bg-card p-5 shadow-card sm:p-6">
        <h2 className="text-sm font-bold">기기 등록</h2>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="기종명 검색 — 예: 갤럭시 S23, 아이폰 14"
          className="mt-3 w-full rounded-lg border border-hairline bg-card px-3.5 py-2.5 text-sm"
          aria-label="등록할 기종 검색"
        />
        {matches.length > 0 && (
          <ul className="mt-2 overflow-hidden rounded-xl border border-hairline bg-card shadow-card">
            {matches.map((p) => (
              <li key={p.slug} className="border-b border-hairline last:border-0">
                <button
                  type="button"
                  onClick={() => {
                    save([...slugs, p.slug]);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-wash"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs font-medium text-accent">
                    + 등록
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 대시보드 */}
      {mine.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline bg-card p-10 text-center shadow-card">
          <p className="text-sm font-semibold">등록된 기기가 없습니다</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-sub">
            위 검색창에서 지금 쓰는 폰을 등록해보세요. 남은 보안지원, 시세
            변동, 새 이슈를 이 화면에서 계속 추적할 수 있습니다.
          </p>
        </div>
      ) : (
        <section aria-label="내 기기 목록" className="space-y-5">
          {mine.map((p) => {
            const delta =
              p.prevResale !== null ? p.latestResale - p.prevResale : null;
            return (
              <article
                key={p.slug}
                className="rounded-2xl border border-hairline bg-card p-5 shadow-card sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <PhoneMedia
                      slug={p.slug}
                      name={p.name}
                      className="h-12 w-12 shrink-0"
                    />
                    <Link
                      href={`/phones/${p.slug}`}
                      className="text-lg font-bold tracking-tight hover:text-accent"
                    >
                      {p.name}
                    </Link>
                    <Badge tone={p.eolTone} dot>
                      {p.eolLabel}
                    </Badge>
                    <Badge tone={p.verdictTone}>{p.verdictLabel}</Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => save(slugs.filter((s) => s !== p.slug))}
                    className="text-xs text-mut transition-colors hover:text-crit"
                    aria-label={`${p.name} 등록 해제`}
                  >
                    등록 해제 ×
                  </button>
                </div>

                <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-hairline bg-wash p-4">
                    <dt className="text-xs font-medium text-mut">
                      보안지원 잔여
                    </dt>
                    <dd className="mt-1 text-lg font-semibold tracking-tight">
                      {p.monthsLeft !== null && p.monthsLeft > 0
                        ? fmtMonths(p.monthsLeft)
                        : p.monthsLeft !== null
                          ? "종료"
                          : "미상"}
                    </dd>
                    {p.securityEndDate && (
                      <dd className="tnum mt-0.5 text-xs text-sub">
                        {dday(p.securityEndDate)}
                        {p.eolEstimated && " (추정)"}
                      </dd>
                    )}
                  </div>

                  <div className="rounded-xl border border-hairline bg-wash p-4">
                    <dt className="text-xs font-medium text-mut">
                      지금 팔면 (A급)
                    </dt>
                    <dd className="tnum mt-1 text-lg font-semibold tracking-tight">
                      {fmtMan(p.latestResale)}
                    </dd>
                    <dd className="mt-0.5 text-xs text-sub">
                      {delta !== null ? (
                        <span
                          className={
                            delta < 0
                              ? "text-crit"
                              : delta > 0
                                ? "text-good-deep"
                                : ""
                          }
                        >
                          전기록 대비 {delta > 0 ? "+" : ""}
                          {delta.toLocaleString("ko-KR")}원
                        </span>
                      ) : (
                        `기준일 ${p.latestResaleDate}`
                      )}
                    </dd>
                  </div>

                  <div className="rounded-xl border border-hairline bg-wash p-4">
                    <dt className="text-xs font-medium text-mut">
                      1년 뒤 예상 시세
                    </dt>
                    <dd className="tnum mt-1 text-lg font-semibold tracking-tight">
                      {p.projected12moKRW !== null
                        ? fmtMan(p.projected12moKRW)
                        : "—"}
                    </dd>
                    <dd className="mt-0.5 text-xs text-sub">
                      {p.projected12moKRW !== null
                        ? `1년 더 쓰는 비용 ≈ ${fmtMan(p.latestResale - p.projected12moKRW)} (추정)`
                        : "시세 기록 부족"}
                    </dd>
                  </div>

                  <div className="rounded-xl border border-hairline bg-wash p-4">
                    <dt className="text-xs font-medium text-mut">
                      미해결 이슈
                    </dt>
                    <dd className="mt-1 text-lg font-semibold tracking-tight">
                      {p.liveIssueTitles.length > 0
                        ? `${p.liveIssueTitles.length}건`
                        : "없음"}
                    </dd>
                    {p.liveIssueTitles[0] && (
                      <dd className="mt-0.5 truncate text-xs text-sub">
                        {p.liveIssueTitles[0]}
                      </dd>
                    )}
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/phones/${p.slug}/sell`}
                    className="rounded-full border border-hairline bg-card px-3.5 py-1.5 text-xs font-medium text-sub transition-colors hover:border-accent-strong/40 hover:text-accent"
                  >
                    판매 타이밍 →
                  </Link>
                  <Link
                    href={`/phones/${p.slug}/updates`}
                    className="rounded-full border border-hairline bg-card px-3.5 py-1.5 text-xs font-medium text-sub transition-colors hover:border-accent-strong/40 hover:text-accent"
                  >
                    지원종료 상세 →
                  </Link>
                  <Link
                    href={`/phones/${p.slug}/issues`}
                    className="rounded-full border border-hairline bg-card px-3.5 py-1.5 text-xs font-medium text-sub transition-colors hover:border-accent-strong/40 hover:text-accent"
                  >
                    이슈 문서 →
                  </Link>
                  <Link
                    href={`/phones/${p.slug}/tco`}
                    className="rounded-full border border-hairline bg-card px-3.5 py-1.5 text-xs font-medium text-sub transition-colors hover:border-accent-strong/40 hover:text-accent"
                  >
                    더 쓰기 vs 갈아타기 →
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ToolPhone } from "@/lib/clientData";
import Badge from "@/components/ui/Badge";
import PhoneMedia from "@/components/phone/PhoneMedia";

/**
 * 적정가 판독기 — A급 중앙값 시세에 상태·배터리 보정을 적용한 적정 범위와
 * 입력한 매물가를 비교. "너무 싼" 매물의 위험 신호도 함께 안내.
 */

type Grade = "S" | "A" | "B";

const GRADES: Array<{ key: Grade; label: string; desc: string }> = [
  { key: "S", label: "S급", desc: "미개봉·개봉만 한 새 제품급" },
  { key: "A", label: "A급", desc: "생활기스 없음, 전 기능 정상" },
  { key: "B", label: "B급", desc: "사용감·잔기스 있으나 정상 작동" },
];

const fmt = (n: number) => `${n.toLocaleString("ko-KR")}원`;
const fmtMan = (n: number) => {
  const man = Math.round(n / 1000) / 10;
  return `${Number.isInteger(man) ? man : man.toFixed(1)}만원`;
};

export default function PriceChecker({ phones }: { phones: ToolPhone[] }) {
  const [query, setQuery] = useState("");
  const [slug, setSlug] = useState<string | null>(null);
  const [grade, setGrade] = useState<Grade>("A");
  const [batteryLow, setBatteryLow] = useState(false);
  const [askingText, setAskingText] = useState("");

  const selected = phones.find((p) => p.slug === slug) ?? null;

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase().replace(/\s+/g, "");
    return phones
      .filter((p) => {
        const name = p.name.toLowerCase().replace(/\s+/g, "");
        const s = p.slug.replace(/-/g, "");
        return name.includes(q) || s.includes(q);
      })
      .slice(0, 8);
  }, [query, phones]);

  const verdict = useMemo(() => {
    if (!selected) return null;
    let lo: number, hi: number;
    if (grade === "S") {
      lo = selected.fairS_lo;
      hi = selected.fairS_hi;
    } else if (grade === "A") {
      lo = selected.fairA_lo;
      hi = selected.fairA_hi;
    } else {
      lo = selected.fairB_lo;
      hi = selected.fairB_hi;
    }
    // 배터리 성능 85% 미만 → 교체비만큼 차감 (교체비 미상 시 시세의 12%)
    const penalty = batteryLow
      ? (selected.batteryRepairKRW ?? Math.round(selected.latestResale * 0.12))
      : 0;
    lo = Math.max(0, lo - penalty);
    hi = Math.max(0, hi - penalty);

    const asking = Number(askingText.replaceAll(",", ""));
    let judgement: {
      label: string;
      tone: "good" | "warn" | "serious" | "crit" | "accent";
      note: string;
    } | null = null;

    if (askingText && Number.isFinite(asking) && asking > 0) {
      if (asking < lo * 0.82) {
        judgement = {
          label: "위험할 정도로 쌈",
          tone: "crit",
          note: "적정 하단보다 18% 이상 쌉니다. 파손·침수·할부 미납·활성화 잠금·도난 등 하자 가능성을 의심하고, 반드시 IMEI 조회와 대면 확인 후 거래하세요.",
        };
      } else if (asking < lo) {
        judgement = {
          label: "급처 가격",
          tone: "good",
          note: "적정 범위보다 쌉니다. 상태 확인만 통과하면 좋은 딜입니다 — 체크리스트를 꼭 챙기세요.",
        };
      } else if (asking <= hi) {
        judgement = {
          label: "적정가",
          tone: "accent",
          note: "현 시세 범위 안의 정상 가격입니다.",
        };
      } else if (asking <= hi * 1.12) {
        judgement = {
          label: "다소 비쌈",
          tone: "warn",
          note: "적정 상단을 넘습니다. 풀박스·잔여 보증·애플케어 승계 같은 프리미엄 요인이 없다면 네고 여지가 있습니다.",
        };
      } else {
        judgement = {
          label: "비쌈",
          tone: "serious",
          note: "적정 상단보다 12% 이상 비쌉니다. 같은 조건 매물이 더 싸게 여럿 있을 가능성이 큽니다.",
        };
      }
    }

    return { lo, hi, penalty, judgement };
  }, [selected, grade, batteryLow, askingText]);

  return (
    <div className="mt-8 space-y-6">
      {/* 1. 기종 선택 */}
      <section className="rounded-2xl border border-hairline bg-card p-5 shadow-card sm:p-6">
        <h2 className="text-sm font-bold">1. 기종 선택</h2>
        {selected ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <PhoneMedia
              slug={selected.slug}
              name={selected.name}
              className="h-12 w-12 shrink-0"
            />
            <p className="text-lg font-bold tracking-tight">{selected.name}</p>
            <Badge tone={selected.eolTone} dot>
              {selected.eolLabel}
            </Badge>
            <button
              type="button"
              onClick={() => {
                setSlug(null);
                setQuery("");
              }}
              className="rounded-full border border-hairline bg-card px-3 py-1 text-xs font-medium text-sub transition-colors hover:border-accent-strong/40 hover:text-accent"
            >
              변경 ↺
            </button>
          </div>
        ) : (
          <div className="mt-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="기종명 검색 — 예: S24 울트라, 아이폰 15"
              className="w-full rounded-lg border border-hairline bg-card px-3.5 py-2.5 text-sm"
              aria-label="기종 검색"
            />
            {matches.length > 0 && (
              <ul className="mt-2 overflow-hidden rounded-xl border border-hairline bg-card shadow-card">
                {matches.map((p) => (
                  <li key={p.slug} className="border-b border-hairline last:border-0">
                    <button
                      type="button"
                      onClick={() => setSlug(p.slug)}
                      className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-wash"
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="tnum text-xs text-mut">
                        시세 {fmtMan(p.latestResale)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {query.trim() && matches.length === 0 && (
              <p className="mt-2 text-xs text-mut">
                검색 결과가 없습니다. 수록 기종은 삼성·애플 주요 모델입니다.
              </p>
            )}
          </div>
        )}
      </section>

      {selected && (
        <>
          {/* 2. 상태 입력 */}
          <section className="rounded-2xl border border-hairline bg-card p-5 shadow-card sm:p-6">
            <h2 className="text-sm font-bold">2. 매물 상태</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-3" role="group" aria-label="상태 등급">
              {GRADES.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setGrade(g.key)}
                  aria-pressed={grade === g.key}
                  className={`rounded-xl border p-3.5 text-left transition-colors ${
                    grade === g.key
                      ? "border-accent bg-accent-soft"
                      : "border-hairline bg-card hover:border-accent-strong/40"
                  }`}
                >
                  <p className={`text-sm font-bold ${grade === g.key ? "text-accent" : ""}`}>
                    {g.label}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-sub">{g.desc}</p>
                </button>
              ))}
            </div>
            <label className="mt-4 flex items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={batteryLow}
                onChange={(e) => setBatteryLow(e.target.checked)}
                className="mt-0.5 size-4 accent-[var(--color-accent)]"
              />
              <span>
                배터리 성능 85% 미만 (또는 미확인)
                <span className="block text-xs text-mut">
                  교체비{" "}
                  {selected.batteryRepairKRW != null
                    ? fmtMan(selected.batteryRepairKRW)
                    : "추정치"}
                  만큼 적정가에서 차감합니다
                </span>
              </span>
            </label>
          </section>

          {/* 3. 판독 */}
          <section className="rounded-2xl border border-hairline bg-card p-5 shadow-card sm:p-6">
            <h2 className="text-sm font-bold">3. 매물가 판독</h2>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={askingText}
                onChange={(e) =>
                  setAskingText(e.target.value.replace(/[^\d,]/g, ""))
                }
                placeholder="매물 가격 입력 — 예: 650000"
                className="tnum w-full max-w-60 rounded-lg border border-hairline bg-card px-3.5 py-2.5 text-sm"
                aria-label="매물 가격 (원)"
              />
              <span className="text-sm text-sub">원</span>
            </div>

            {verdict && (
              <div className="mt-5">
                <p className="text-xs text-mut">
                  {selected.name} · {GRADES.find((g) => g.key === grade)?.label}
                  {batteryLow && " · 배터리 차감"} 적정 범위 (기준일{" "}
                  {selected.latestResaleDate})
                </p>
                <p className="tnum mt-1 text-2xl font-bold tracking-tight">
                  {fmt(verdict.lo)} ~ {fmt(verdict.hi)}
                </p>
                {verdict.penalty > 0 && (
                  <p className="mt-1 text-xs text-sub">
                    배터리 보정 −{fmt(verdict.penalty)} 적용됨
                  </p>
                )}

                {verdict.judgement && (
                  <div
                    className={`mt-4 rounded-xl border p-4 ${
                      verdict.judgement.tone === "good"
                        ? "border-good/25 bg-good-soft/50"
                        : verdict.judgement.tone === "accent"
                          ? "border-accent-strong/25 bg-accent-soft/60"
                          : verdict.judgement.tone === "warn"
                            ? "border-warn-strong/30 bg-warn-soft/50"
                            : verdict.judgement.tone === "serious"
                              ? "border-serious-strong/30 bg-serious-soft/50"
                              : "border-crit-strong/30 bg-crit-soft/50"
                    }`}
                  >
                    <Badge tone={verdict.judgement.tone} dot className="text-sm">
                      {verdict.judgement.label}
                    </Badge>
                    <p className="mt-2 text-sm leading-6 text-ink">
                      {verdict.judgement.note}
                    </p>
                  </div>
                )}

                {selected.liveIssueTitles.length > 0 && (
                  <div className="mt-4 rounded-xl border border-warn-strong/30 bg-warn-soft/40 p-4">
                    <p className="text-xs font-bold text-warn">
                      ⚠ 이 기종 구매 전 확인할 알려진 이슈
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {selected.liveIssueTitles.map((t) => (
                        <li key={t} className="text-xs leading-5 text-sub">
                          · {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/phones/${selected.slug}/used-check`}
                    className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-strong"
                  >
                    이 기종 중고 체크리스트 →
                  </Link>
                  <Link
                    href={`/phones/${selected.slug}/resale`}
                    className="rounded-full border border-hairline bg-card px-4 py-2 text-xs font-medium text-sub transition-colors hover:border-accent-strong/40 hover:text-accent"
                  >
                    시세 추이 보기
                  </Link>
                </div>
              </div>
            )}
          </section>

          <p className="text-xs leading-5 text-mut">
            적정 범위는 A급 중앙값 시세에 등급 계수(S +8~20%, A ±8%, B
            −10~25%)와 배터리 보정을 적용한 값입니다. 색상·용량(상위 용량은
            +2~5만원)·풀박스 여부에 따라 실제 체결가는 달라질 수 있습니다.
          </p>
        </>
      )}
    </div>
  );
}

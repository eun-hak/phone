"use client";

import { useMemo, useState } from "react";
import PhoneCard, { type PhoneCardData } from "@/components/phone/PhoneCard";

const BRAND_FILTERS = [
  { key: "all", label: "전체" },
  { key: "samsung", label: "삼성" },
  { key: "apple", label: "애플" },
] as const;

const SORTS = [
  { key: "recent", label: "최신 출시순" },
  { key: "residual", label: "잔존가치 높은 순" },
  { key: "support", label: "지원 오래 남은 순" },
  { key: "price", label: "중고가 낮은 순" },
] as const;

type BrandKey = (typeof BRAND_FILTERS)[number]["key"];
type SortKey = (typeof SORTS)[number]["key"];

export default function PhonesExplorer({
  phones,
}: {
  phones: PhoneCardData[];
}) {
  const [brand, setBrand] = useState<BrandKey>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const visible = useMemo(() => {
    const filtered =
      brand === "all" ? phones : phones.filter((p) => p.brand === brand);
    const sorted = [...filtered];
    switch (sort) {
      case "residual":
        sorted.sort((a, b) => b.residualPct - a.residualPct);
        break;
      case "support":
        sorted.sort((a, b) => (b.monthsLeft ?? -1) - (a.monthsLeft ?? -1));
        break;
      case "price":
        sorted.sort((a, b) => a.latestResale - b.latestResale);
        break;
      default:
        sorted.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
    }
    return sorted;
  }, [phones, brand, sort]);

  return (
    <>
      {/* 필터 행 — 차트/카드 위 한 줄 배치 */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="제조사 필터"
          className="flex items-center gap-1 rounded-full border border-hairline bg-card p-1"
        >
          {BRAND_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setBrand(f.key)}
              aria-pressed={brand === f.key}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                brand === f.key
                  ? "bg-accent text-white"
                  : "text-sub hover:bg-wash"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-sub">
          정렬
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-hairline bg-card px-2.5 py-1.5 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-3 text-xs text-mut" aria-live="polite">
        {visible.length}개 기종
      </p>

      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => (
          <PhoneCard key={p.slug} phone={p} />
        ))}
      </div>
    </>
  );
}

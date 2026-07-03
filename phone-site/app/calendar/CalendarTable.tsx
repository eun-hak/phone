"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Badge, { type BadgeTone } from "@/components/ui/Badge";

export interface CalendarRow {
  slug: string;
  name: string;
  brand: "samsung" | "apple";
  brandLabel: string;
  secEndYm: string;
  osEndYm: string;
  dday: string;
  eolLabel: string;
  eolTone: BadgeTone;
  elapsedPct: number;
  estimated: boolean;
}

const FILTERS = [
  { key: "all", label: "전체" },
  { key: "samsung", label: "삼성" },
  { key: "apple", label: "애플" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default function CalendarTable({ rows }: { rows: CalendarRow[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.brand === filter)),
    [rows, filter],
  );

  return (
    <>
      <div
        role="group"
        aria-label="제조사 필터"
        className="mt-6 inline-flex items-center gap-1 rounded-full border border-hairline bg-card p-1"
      >
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key ? "bg-accent text-white" : "text-sub hover:bg-wash"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-hairline bg-card shadow-card">
        <table className="data-table min-w-[640px]">
          <thead>
            <tr>
              <th>기종</th>
              <th>보안지원 종료</th>
              <th>남은 기간</th>
              <th className="w-[26%]">수명 경과</th>
              <th>OS 업데이트 종료</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.slug}>
                <td>
                  <Link
                    href={`/phones/${r.slug}/updates`}
                    className="font-medium hover:text-accent"
                  >
                    {r.name}
                  </Link>
                  <span className="ml-2 text-xs text-mut">{r.brandLabel}</span>
                </td>
                <td className="tnum">
                  {r.secEndYm}
                  {r.estimated && (
                    <Badge tone="warn" className="ml-1.5">
                      추정
                    </Badge>
                  )}
                </td>
                <td className="tnum text-sub">{r.dday}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div
                      role="img"
                      aria-label={`지원 기간 ${r.elapsedPct}% 경과`}
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-accent-soft"
                    >
                      <div
                        className="h-full rounded-full bg-accent-strong"
                        style={{ width: `${r.elapsedPct}%` }}
                      />
                    </div>
                    <span className="tnum w-9 text-right text-xs text-mut">
                      {r.elapsedPct}%
                    </span>
                  </div>
                </td>
                <td className="tnum text-sub">{r.osEndYm}</td>
                <td>
                  <Badge tone={r.eolTone} dot>
                    {r.eolLabel}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-mut" aria-live="polite">
        {visible.length}개 기종 · 종료일이 가까운 순
      </p>
    </>
  );
}

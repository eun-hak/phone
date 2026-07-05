"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** 임의 두 기종 비교 빌더 — 정규 slug(사전순)로 이동 */
export default function CompareBuilder({
  options,
}: {
  options: Array<{ slug: string; name: string; brandLabel: string }>;
}) {
  const router = useRouter();
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const ready = a && b && a !== b;

  const go = () => {
    if (!ready) return;
    const slug = [a, b].sort().join("-vs-");
    router.push(`/compare/${slug}`);
  };

  const renderSelect = (
    value: string,
    onChange: (v: string) => void,
    label: string,
  ) => (
    <label className="block flex-1">
      <span className="text-xs font-medium text-mut">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-hairline bg-card px-3 py-2.5 text-sm"
      >
        <option value="">기종 선택…</option>
        {["삼성", "애플"].map((brand) => (
          <optgroup key={brand} label={brand}>
            {options
              .filter((o) => o.brandLabel === brand)
              .map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.name}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </label>
  );

  return (
    <div className="mt-6 rounded-2xl border border-hairline bg-card p-5 shadow-card sm:p-6">
      <h2 className="text-sm font-bold">직접 골라서 비교하기</h2>
      <div className="mt-3 flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
        {renderSelect(a, setA, "기종 1")}
        <span
          aria-hidden="true"
          className="hidden pb-2.5 text-sm font-bold text-mut sm:block"
        >
          vs
        </span>
        {renderSelect(b, setB, "기종 2")}
        <button
          type="button"
          onClick={go}
          disabled={!ready}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
        >
          비교하기 →
        </button>
      </div>
      {a && b && a === b && (
        <p className="mt-2 text-xs text-crit">같은 기종은 비교할 수 없습니다.</p>
      )}
    </div>
  );
}

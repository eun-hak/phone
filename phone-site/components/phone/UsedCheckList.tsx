"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CheckPriority,
  UsedCheckSection,
} from "@/lib/usedCheck";
import Badge, { type BadgeTone } from "@/components/ui/Badge";

const PRIORITY: Record<
  CheckPriority,
  { label: string; tone: BadgeTone; show: boolean }
> = {
  critical: { label: "필수", tone: "crit", show: true },
  important: { label: "중요", tone: "warn", show: true },
  normal: { label: "확인", tone: "neutral", show: false },
};

export default function UsedCheckList({
  slug,
  sections,
  total,
}: {
  slug: string;
  sections: UsedCheckSection[];
  total: number;
}) {
  const storageKey = `usedcheck:${slug}`;
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      /* localStorage 접근 불가 시 무시 */
    }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(checked));
    } catch {
      /* 무시 */
    }
  }, [checked, ready, storageKey]);

  const done = useMemo(
    () => Object.values(checked).filter(Boolean).length,
    [checked],
  );

  const toggle = (id: string) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  const reset = () => setChecked({});

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      {/* 진행률 — 스티키 요약 */}
      <div className="sticky top-14 z-10 -mx-4 mb-6 border-b border-hairline bg-page/90 px-4 py-3 backdrop-blur sm:top-0">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">
            <span className="tnum text-accent">{done}</span>
            <span className="text-mut"> / {total} 확인</span>
          </p>
          <button
            type="button"
            onClick={reset}
            className="text-xs font-medium text-mut transition-colors hover:text-accent"
          >
            초기화
          </button>
        </div>
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-accent-soft"
        >
          <div
            className="h-full rounded-full bg-accent-strong transition-[width] duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.key} aria-label={section.title}>
            <h2 className="text-lg font-bold tracking-tight">
              {section.title}
            </h2>
            {section.lede && (
              <p className="mt-1 text-sm text-sub">{section.lede}</p>
            )}
            <ul className="mt-3 space-y-2.5">
              {section.items.map((item) => {
                const meta = PRIORITY[item.priority];
                const isDone = !!checked[item.id];
                return (
                  <li key={item.id}>
                    <label
                      className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 shadow-card transition-colors ${
                        isDone
                          ? "border-hairline bg-wash"
                          : "border-hairline bg-card hover:border-accent-strong/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggle(item.id)}
                        className="mt-0.5 size-4 shrink-0 accent-accent"
                      />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          {meta.show && (
                            <Badge tone={meta.tone} dot>
                              {meta.label}
                            </Badge>
                          )}
                          <span
                            className={`text-sm font-medium ${
                              isDone ? "text-mut line-through" : "text-ink"
                            }`}
                          >
                            {item.text}
                          </span>
                        </span>
                        {item.detail && (
                          <span
                            className={`mt-1 block text-xs leading-5 ${
                              isDone ? "text-mut" : "text-sub"
                            }`}
                          >
                            {item.detail}
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-6 text-xs leading-5 text-mut">
        체크 상태는 이 브라우저에만 저장됩니다. 거래 현장에서 그대로 열어
        확인하세요.
      </p>
    </div>
  );
}

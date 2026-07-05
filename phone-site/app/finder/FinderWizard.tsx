"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ToolPhone } from "@/lib/clientData";
import Badge from "@/components/ui/Badge";
import PhoneMedia from "@/components/phone/PhoneMedia";

/**
 * 추천 마법사 — 하드 필터(예산·브랜드·크기·사용계획) 통과 기종을
 * 종합 결정 점수 + 우선순위 가중치로 정렬해 상위 3개를 근거와 함께 제시.
 */

const QUESTIONS = [
  {
    key: "budget",
    title: "예산은 어느 정도인가요?",
    hint: "중고 A급 시세 기준입니다. 신품만 원하면 다음 문항에서 걸러집니다.",
    options: [
      { key: "30", label: "~30만원" },
      { key: "50", label: "~50만원" },
      { key: "80", label: "~80만원" },
      { key: "120", label: "~120만원" },
      { key: "any", label: "예산 무관" },
    ],
  },
  {
    key: "condition",
    title: "신품과 중고 중 어느 쪽인가요?",
    hint: "신품 선택 시 출시 15개월 이내 기종만 후보에 올립니다.",
    options: [
      { key: "new", label: "신품만" },
      { key: "both", label: "둘 다 고려" },
      { key: "used", label: "중고 위주" },
    ],
  },
  {
    key: "brand",
    title: "선호 브랜드가 있나요?",
    hint: "무관을 고르면 삼성·애플 전부 후보입니다.",
    options: [
      { key: "samsung", label: "삼성 (갤럭시)" },
      { key: "apple", label: "애플 (아이폰)" },
      { key: "any", label: "브랜드 무관" },
    ],
  },
  {
    key: "horizon",
    title: "얼마나 오래 쓸 계획인가요?",
    hint: "보안 업데이트 잔여 기간이 이 기간을 커버하는 기종만 추립니다.",
    options: [
      { key: "24", label: "2년 정도" },
      { key: "48", label: "3~4년" },
      { key: "60", label: "5년 이상" },
    ],
  },
  {
    key: "priority",
    title: "가장 중요한 한 가지는?",
    hint: "이 기준에 가중치를 더해 순위를 정합니다.",
    options: [
      { key: "support", label: "오래 안전하게" },
      { key: "residual", label: "되팔 때 손해 적게" },
      { key: "repair", label: "수리비 부담 적게" },
      { key: "compact", label: "한 손에 잡히는 크기" },
      { key: "balanced", label: "종합 밸런스" },
    ],
  },
] as const;

type Answers = Partial<Record<(typeof QUESTIONS)[number]["key"], string>>;

interface Scored {
  p: ToolPhone;
  score: number;
  reasons: string[];
}

const fmtManwon = (n: number) => {
  const man = Math.round(n / 1000) / 10;
  return `${Number.isInteger(man) ? man : man.toFixed(1)}만원`;
};
const fmtMonths = (m: number) => {
  const y = Math.floor(m / 12);
  const r = m % 12;
  if (y === 0) return `${r}개월`;
  return r === 0 ? `${y}년` : `${y}년 ${r}개월`;
};

function ageMonths(releaseDate: string): number {
  const rel = new Date(releaseDate);
  const now = new Date();
  return (
    (now.getFullYear() - rel.getFullYear()) * 12 +
    (now.getMonth() - rel.getMonth())
  );
}

function recommend(phones: ToolPhone[], a: Answers): Scored[] {
  const budget = a.budget === "any" ? Infinity : Number(a.budget) * 10000;
  const minMonths = Number(a.horizon ?? 24);

  let pool = phones.filter((p) => {
    if (a.brand && a.brand !== "any" && p.brand !== a.brand) return false;
    if (a.condition === "new" && ageMonths(p.releaseDate) > 15) return false;
    const price =
      a.condition === "new" ? p.releasePriceKRW : p.latestResale;
    if (price > budget) return false;
    if (p.monthsLeft === null || p.monthsLeft < minMonths) return false;
    if (p.criticalOpenIssues > 0) return false; // 미해결 중대 이슈 기종은 추천에서 제외
    return true;
  });

  // 결과가 너무 적으면 중대 이슈 제외 조건만 완화
  if (pool.length < 3) {
    pool = phones.filter((p) => {
      if (a.brand && a.brand !== "any" && p.brand !== a.brand) return false;
      if (a.condition === "new" && ageMonths(p.releaseDate) > 15) return false;
      const price =
        a.condition === "new" ? p.releasePriceKRW : p.latestResale;
      if (price > budget) return false;
      if (p.monthsLeft === null || p.monthsLeft < minMonths) return false;
      return true;
    });
  }

  const scored: Scored[] = pool.map((p) => {
    let score = p.score;
    const reasons: string[] = [];

    if (p.monthsLeft !== null) {
      reasons.push(
        `보안지원 ${fmtMonths(Math.max(0, p.monthsLeft))} 남음${p.eolEstimated ? " (추정)" : ""}`,
      );
    }
    reasons.push(
      `현 중고 시세 ${fmtManwon(p.latestResale)} · 잔존가치 ${Math.round(p.residualPct)}%`,
    );

    switch (a.priority) {
      case "support":
        score += ((p.monthsLeft ?? 0) / 84) * 25;
        break;
      case "residual":
        score += (p.residualPct / 100) * 25;
        break;
      case "repair":
        if (p.repairBurdenPct !== null) {
          score += Math.max(0, 1 - p.repairBurdenPct / 100) * 25;
          reasons.push(`수리비 부담률 ${Math.round(p.repairBurdenPct)}%`);
        }
        break;
      case "compact":
        score += Math.max(0, (6.4 - p.displayInch) / 1.7) * 25;
        reasons.push(`화면 ${p.displayInch}″`);
        break;
    }

    if (p.criticalOpenIssues > 0) {
      reasons.push(
        `⚠ 미해결 중대 이슈 ${p.criticalOpenIssues}건 — 이슈 문서 확인 필수`,
      );
    }

    return { p, score: Math.round(score * 10) / 10, reasons };
  });

  return scored.sort((x, y) => y.score - x.score).slice(0, 3);
}

export default function FinderWizard({ phones }: { phones: ToolPhone[] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const done = step >= QUESTIONS.length;

  const results = useMemo(
    () => (done ? recommend(phones, answers) : []),
    [done, phones, answers],
  );

  const restart = () => {
    setStep(0);
    setAnswers({});
  };

  if (done) {
    return (
      <div className="mt-8">
        {/* 선택 요약 */}
        <div className="flex flex-wrap items-center gap-2">
          {QUESTIONS.map((q) => {
            const opt = q.options.find((o) => o.key === answers[q.key]);
            return (
              opt && (
                <Badge key={q.key} tone="neutral">
                  {opt.label}
                </Badge>
              )
            );
          })}
          <button
            type="button"
            onClick={restart}
            className="rounded-full border border-hairline bg-card px-3 py-1 text-xs font-medium text-sub transition-colors hover:border-accent-strong/40 hover:text-accent"
          >
            다시 고르기 ↺
          </button>
        </div>

        {results.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-hairline bg-card p-8 text-center shadow-card">
            <p className="text-sm font-semibold">조건에 맞는 기종이 없습니다</p>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-sub">
              예산을 한 단계 올리거나 사용 계획을 줄여보세요. 특히 5년 이상 +
              낮은 예산 조합은 후보가 급격히 줄어듭니다.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {results.map((r, i) => (
              <Link
                key={r.p.slug}
                href={`/phones/${r.p.slug}`}
                className="group flex flex-col gap-3 rounded-2xl border border-hairline bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-accent-strong/40 hover:shadow-pop sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                      i === 0
                        ? "bg-accent text-white"
                        : "bg-accent-soft text-accent"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <PhoneMedia
                    slug={r.p.slug}
                    name={r.p.name}
                    className="h-16 w-16 shrink-0"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-bold tracking-tight group-hover:text-accent">
                        {r.p.name}
                      </p>
                      <Badge tone={r.p.verdictTone} dot>
                        {r.p.verdictLabel}
                      </Badge>
                    </div>
                    <ul className="mt-1.5 space-y-0.5">
                      {r.reasons.map((reason) => (
                        <li key={reason} className="text-xs leading-5 text-sub">
                          · {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="sm:ml-auto sm:text-right">
                  <p className="text-xs text-mut">적합도</p>
                  <p className="tnum text-xl font-bold text-accent">
                    {r.score}
                  </p>
                </div>
              </Link>
            ))}
            <p className="text-xs leading-5 text-mut">
              적합도 = 종합 결정 점수(보안지원·잔존가치·수리비·이슈) +
              우선순위 가중치. 미해결 중대 이슈가 있는 기종은 원칙적으로
              추천에서 제외합니다.
            </p>
          </div>
        )}
      </div>
    );
  }

  const q = QUESTIONS[step];
  return (
    <div className="mt-8">
      {/* 진행 표시 */}
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {QUESTIONS.map((qq, i) => (
          <span
            key={qq.key}
            className={`h-1.5 flex-1 rounded-full ${
              i < step
                ? "bg-accent"
                : i === step
                  ? "bg-accent-strong/60"
                  : "bg-wash"
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-mut" aria-live="polite">
        {step + 1} / {QUESTIONS.length}
      </p>

      <div className="mt-4 rounded-2xl border border-hairline bg-card p-6 shadow-card">
        <h2 className="text-lg font-bold tracking-tight">{q.title}</h2>
        <p className="mt-1 text-sm text-sub">{q.hint}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {q.options.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => {
                setAnswers((prev) => ({ ...prev, [q.key]: o.key }));
                setStep((s) => s + 1);
              }}
              className="rounded-full border border-hairline bg-card px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
            >
              {o.label}
            </button>
          ))}
        </div>
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="mt-5 text-xs font-medium text-mut hover:text-accent"
          >
            ← 이전 문항
          </button>
        )}
      </div>
    </div>
  );
}

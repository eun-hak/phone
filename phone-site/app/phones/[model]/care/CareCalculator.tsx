"use client";

import { useMemo, useState } from "react";

/**
 * 케어 손익 계산기 — 보험료는 요금제·가입 시점에 따라 달라 데이터로 수록하지
 * 않는다. 사용자가 견적 받은 월 보험료를 입력하면, 수록된 수리비 데이터로
 * 손익분기 파손 확률과 기대 손익을 계산한다.
 */

export interface CarePart {
  label: string;
  officialKRW: number;
  withCareKRW: number | null;
}

const fmt = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

export default function CareCalculator({
  brand,
  parts,
}: {
  brand: "samsung" | "apple";
  parts: CarePart[];
}) {
  const [monthlyFee, setMonthlyFee] = useState(brand === "apple" ? 11500 : 8300);
  const [months, setMonths] = useState(24);
  const [breakProb, setBreakProb] = useState(30);

  const display = parts[0]; // 첫 항목 = 화면 (가장 흔한 파손)

  const calc = useMemo(() => {
    if (!display) return null;
    const selfPay =
      display.withCareKRW ?? Math.round(display.officialKRW * 0.25);
    const selfPayEstimated = display.withCareKRW === null;
    const saving = display.officialKRW - selfPay; // 파손 1회당 절감액
    const totalPremium = monthlyFee * months;
    const breakEvenProb = saving > 0 ? (totalPremium / saving) * 100 : null;
    const expected = (breakProb / 100) * saving - totalPremium;
    return {
      selfPay,
      selfPayEstimated,
      saving,
      totalPremium,
      breakEvenProb,
      expected,
    };
  }, [display, monthlyFee, months, breakProb]);

  if (!display || !calc) {
    return (
      <p className="rounded-xl border border-dashed border-hairline bg-card p-5 text-sm leading-6 text-sub shadow-card">
        이 기종은 수리비 데이터가 없어 계산기를 제공하지 못합니다.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-hairline bg-card p-5 shadow-card sm:p-6">
      <div className="grid gap-5 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-medium text-mut">
            월 보험료 (견적가 입력)
          </span>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={100}
              value={monthlyFee}
              onChange={(e) => setMonthlyFee(Math.max(0, Number(e.target.value)))}
              className="tnum w-full rounded-lg border border-hairline bg-card px-3 py-2 text-sm"
            />
            <span className="shrink-0 text-sm text-sub">원/월</span>
          </div>
          <span className="mt-1 block text-[11px] leading-4 text-mut">
            {brand === "apple"
              ? "AppleCare+ 가격은 기종·결제 방식에 따라 다릅니다"
              : "삼성케어플러스 가격은 기종·플랜에 따라 다릅니다"}
          </span>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-mut">가입 기간</span>
          <div className="mt-1.5 flex items-center gap-1 rounded-full border border-hairline bg-card p-1">
            {[12, 24].map((mo) => (
              <button
                key={mo}
                type="button"
                onClick={() => setMonths(mo)}
                aria-pressed={months === mo}
                className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  months === mo ? "bg-accent text-white" : "text-sub hover:bg-wash"
                }`}
              >
                {mo / 12}년
              </button>
            ))}
          </div>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-mut">
            기간 내 화면 파손 확률 가정:{" "}
            <strong className="tnum text-ink">{breakProb}%</strong>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={breakProb}
            onChange={(e) => setBreakProb(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--color-accent)]"
          />
          <span className="mt-1 block text-[11px] leading-4 text-mut">
            케이스·필름 사용자의 2년 내 파손율은 통상 20~35% 수준으로
            알려져 있습니다 (참고 가정)
          </span>
        </label>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-hairline bg-wash p-4">
          <p className="text-xs text-mut">총 보험료 ({months}개월)</p>
          <p className="tnum mt-1 text-lg font-bold">{fmt(calc.totalPremium)}</p>
        </div>
        <div className="rounded-xl border border-hairline bg-wash p-4">
          <p className="text-xs text-mut">파손 1회당 절감액</p>
          <p className="tnum mt-1 text-lg font-bold">{fmt(calc.saving)}</p>
          <p className="mt-0.5 text-[11px] text-mut">
            무보험 {fmt(display.officialKRW)} → 자기부담 {fmt(calc.selfPay)}
            {calc.selfPayEstimated && " (자기부담 25% 추정)"}
          </p>
        </div>
        <div
          className={`rounded-xl border p-4 ${
            calc.expected >= 0
              ? "border-good/25 bg-good-soft/50"
              : "border-crit-strong/25 bg-crit-soft/50"
          }`}
        >
          <p className="text-xs text-mut">기대 손익 (가정 확률 기준)</p>
          <p
            className={`tnum mt-1 text-lg font-bold ${
              calc.expected >= 0 ? "text-good-deep" : "text-crit"
            }`}
          >
            {calc.expected >= 0 ? "+" : "−"}
            {fmt(Math.abs(calc.expected))}
          </p>
          <p className="mt-0.5 text-[11px] text-mut">
            {calc.expected >= 0 ? "가입이 이득인 구간" : "무보험이 이득인 구간"}
          </p>
        </div>
      </div>

      {calc.breakEvenProb !== null && (
        <p className="mt-5 rounded-lg bg-accent-soft px-4 py-3 text-sm leading-6 text-accent">
          <strong className="font-semibold">손익분기점:</strong> {months}개월 안에
          화면을 깰 확률이{" "}
          <strong className="tnum font-bold">
            {calc.breakEvenProb.toFixed(0)}%
          </strong>{" "}
          이상이라고 생각하면 가입이 이득, 그보다 낮다고 생각하면 무보험이
          이득입니다.
        </p>
      )}

      <p className="mt-3 text-xs leading-5 text-mut">
        화면 파손 1회 기준의 단순 기대값 계산입니다. 배터리 무상 교체·침수·분실
        보장 등 플랜별 부가 혜택은 반영되지 않으므로, 해당 혜택을 쓸 계획이면
        계산 결과보다 가입이 유리해집니다.
      </p>
    </div>
  );
}

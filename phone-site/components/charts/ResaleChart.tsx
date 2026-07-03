import { formatManTick, formatManwon } from "@/lib/format";

/**
 * 중고 시세 시계열 라인 차트 (단일 시리즈 — 범례 불필요)
 * 서버 컴포넌트 SVG + CSS 호버(crosshair/tooltip). JS 불필요.
 */

interface Point {
  date: string;
  priceKRW: number;
}

const W = 640;
const H = 240;
const PAD = { l: 50, r: 24, t: 20, b: 30 };

const INK = "#0b0b0b";
const MUT = "#898781";
const GRID = "#e1e0d9";
const BASE = "#c3c2b7";
const SERIES = "#2a78d6";
const CARD = "#ffffff";

function niceStep(range: number): number {
  for (const c of [10000, 20000, 50000, 100000, 200000, 500000]) {
    if (range / c <= 4.5) return c;
  }
  return 1000000;
}

function shortYm(date: string): string {
  return `${date.slice(2, 4)}.${date.slice(5, 7)}`;
}

export default function ResaleChart({
  points,
  label,
}: {
  points: Point[];
  label: string;
}) {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const values = sorted.map((p) => p.priceKRW);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = niceStep(Math.max(max - min, 10000));
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil((max + step * 0.3) / step) * step;

  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const n = sorted.length;
  const x = (i: number) =>
    PAD.l + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * plotH;

  const gridVals: number[] = [];
  for (let v = lo; v <= hi; v += step) gridVals.push(v);

  const linePath = sorted
    .map(
      (p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.priceKRW).toFixed(1)}`,
    )
    .join(" ");
  const floorY = (PAD.t + plotH).toFixed(1);
  const areaPath = `${linePath} L${x(n - 1).toFixed(1)},${floorY} L${x(0).toFixed(1)},${floorY} Z`;

  const last = sorted[n - 1];
  const tickEvery = Math.max(1, Math.round((n - 1) / 3));
  const bandW = n > 1 ? plotW / (n - 1) : plotW;

  const TIP_W = 118;
  const TIP_H = 44;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`${label} 중고 시세 추이 차트. 최근 시세 ${formatManwon(last.priceKRW)}. 상세 수치는 아래 표 참고.`}
    >
      {/* 그리드 + y축 눈금 */}
      {gridVals.map((v) => (
        <g key={v}>
          <line
            x1={PAD.l}
            x2={W - PAD.r}
            y1={y(v)}
            y2={y(v)}
            stroke={v === lo ? BASE : GRID}
            strokeWidth={1}
          />
          <text
            x={PAD.l - 8}
            y={y(v) + 3.5}
            textAnchor="end"
            fontSize={11}
            fill={MUT}
            className="tnum"
          >
            {formatManTick(v)}
          </text>
        </g>
      ))}

      {/* x축 눈금 */}
      {sorted.map((p, i) =>
        i % tickEvery === 0 || i === n - 1 ? (
          <text
            key={p.date}
            x={x(i)}
            y={H - 8}
            textAnchor={i === n - 1 ? "end" : "middle"}
            fontSize={11}
            fill={MUT}
            className="tnum"
          >
            {shortYm(p.date)}
          </text>
        ) : null,
      )}

      {/* 영역 워시 + 라인 */}
      <path d={areaPath} fill={SERIES} opacity={0.1} />
      <path
        d={linePath}
        fill="none"
        stroke={SERIES}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 끝점 마커 + 직접 라벨 (선택적 라벨 — 끝값만) */}
      <circle
        cx={x(n - 1)}
        cy={y(last.priceKRW)}
        r={4.5}
        fill={SERIES}
        stroke={CARD}
        strokeWidth={2}
      />
      <text
        x={x(n - 1)}
        y={y(last.priceKRW) - 12}
        textAnchor="end"
        fontSize={12.5}
        fontWeight={600}
        fill={INK}
      >
        {formatManwon(last.priceKRW)}
      </text>

      {/* 호버 레이어: 밴드별 crosshair + tooltip */}
      {sorted.map((p, i) => {
        const px = x(i);
        const py = y(p.priceKRW);
        const tipX = Math.min(
          Math.max(px - TIP_W / 2, PAD.l),
          W - PAD.r - TIP_W,
        );
        return (
          <g key={p.date} className="viz-pt" tabIndex={0}>
            <rect
              x={px - bandW / 2}
              y={PAD.t}
              width={bandW}
              height={plotH}
              fill="transparent"
            />
            <g className="viz-tip">
              <line
                x1={px}
                x2={px}
                y1={PAD.t}
                y2={PAD.t + plotH}
                stroke={GRID}
                strokeWidth={1}
              />
              <circle
                cx={px}
                cy={py}
                r={4}
                fill={SERIES}
                stroke={CARD}
                strokeWidth={2}
              />
              <rect
                x={tipX}
                y={PAD.t}
                width={TIP_W}
                height={TIP_H}
                rx={8}
                fill={CARD}
                stroke={GRID}
              />
              <text
                x={tipX + 12}
                y={PAD.t + 17}
                fontSize={10}
                fill={MUT}
                className="tnum"
              >
                {p.date.slice(0, 7).replace("-", ".")}
              </text>
              <text
                x={tipX + 12}
                y={PAD.t + 34}
                fontSize={12.5}
                fontWeight={600}
                fill={INK}
              >
                {formatManwon(p.priceKRW)}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

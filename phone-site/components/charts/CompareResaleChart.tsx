/**
 * 두 기종의 잔존가치(출시가 대비 %) 비교 라인 차트.
 * 2개 시리즈 — 범례 필수 + 끝값 직접 라벨. 식별은 색+범례+라벨 3중.
 * 아쿠아(슬롯2)는 라이트 서피스 대비가 낮으므로 페이지에 표 병행 필수.
 */

interface Series {
  name: string;
  releasePriceKRW: number;
  points: Array<{ date: string; priceKRW: number }>;
}

const W = 640;
const H = 260;
const PAD = { l: 44, r: 52, t: 20, b: 30 };

const INK = "#0b0b0b";
const MUT = "#898781";
const GRID = "#e1e0d9";
const BASE = "#c3c2b7";
const CARD = "#ffffff";
const COLORS = ["#2a78d6", "#1baf7a"]; // 카테고리 슬롯 1·2 (고정 순서)

function shortYm(date: string): string {
  return `${date.slice(2, 4)}.${date.slice(5, 7)}`;
}

export default function CompareResaleChart({
  series,
}: {
  series: [Series, Series];
}) {
  const prepared = series.map((s) => {
    const sorted = [...s.points].sort((a, b) => a.date.localeCompare(b.date));
    return {
      name: s.name,
      values: sorted.map((p) => ({
        date: p.date,
        pct: (p.priceKRW / s.releasePriceKRW) * 100,
      })),
    };
  });

  const allPcts = prepared.flatMap((s) => s.values.map((v) => v.pct));
  const lo = Math.max(0, Math.floor((Math.min(...allPcts) - 4) / 10) * 10);
  const hi = Math.min(100, Math.ceil((Math.max(...allPcts) + 4) / 10) * 10);

  const n = prepared[0].values.length;
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const x = (i: number) =>
    PAD.l + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * plotH;

  const gridVals: number[] = [];
  for (let v = lo; v <= hi; v += 10) gridVals.push(v);

  const paths = prepared.map((s) =>
    s.values
      .map(
        (v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v.pct).toFixed(1)}`,
      )
      .join(" "),
  );

  // 끝값 라벨 충돌 시 위아래로 벌림
  const endYs = prepared.map((s) => y(s.values[n - 1].pct));
  const labelYs = [...endYs];
  if (Math.abs(labelYs[0] - labelYs[1]) < 16) {
    if (labelYs[0] <= labelYs[1]) {
      labelYs[0] -= 8;
      labelYs[1] += 8;
    } else {
      labelYs[0] += 8;
      labelYs[1] -= 8;
    }
  }

  const tickEvery = Math.max(1, Math.round((n - 1) / 3));
  const bandW = n > 1 ? plotW / (n - 1) : plotW;
  const TIP_W = 168;
  const TIP_H = 62;

  return (
    <figure>
      {/* 범례 — 2시리즈 이상 필수 */}
      <figcaption className="mb-2 flex flex-wrap items-center gap-4 text-sm text-sub">
        {prepared.map((s, si) => (
          <span key={s.name} className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-[3px] w-4 rounded-full"
              style={{ background: COLORS[si] }}
            />
            {s.name}
          </span>
        ))}
      </figcaption>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${prepared[0].name}와 ${prepared[1].name}의 잔존가치 추이 비교 차트. 상세 수치는 아래 표 참고.`}
      >
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
              {v}%
            </text>
          </g>
        ))}

        {prepared[0].values.map((v, i) =>
          i % tickEvery === 0 || i === n - 1 ? (
            <text
              key={v.date}
              x={x(i)}
              y={H - 8}
              textAnchor={i === n - 1 ? "end" : "middle"}
              fontSize={11}
              fill={MUT}
              className="tnum"
            >
              {shortYm(v.date)}
            </text>
          ) : null,
        )}

        {paths.map((d, si) => (
          <path
            key={si}
            d={d}
            fill="none"
            stroke={COLORS[si]}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {prepared.map((s, si) => (
          <g key={s.name}>
            <circle
              cx={x(n - 1)}
              cy={endYs[si]}
              r={4.5}
              fill={COLORS[si]}
              stroke={CARD}
              strokeWidth={2}
            />
            {/* 라벨을 벌렸으면 리더 라인으로 연결 */}
            {labelYs[si] !== endYs[si] && (
              <line
                x1={x(n - 1) + 6}
                x2={x(n - 1) + 12}
                y1={endYs[si]}
                y2={labelYs[si]}
                stroke={BASE}
                strokeWidth={1}
              />
            )}
            <text
              x={x(n - 1) + 14}
              y={labelYs[si] + 4}
              fontSize={12.5}
              fontWeight={600}
              fill={INK}
              className="tnum"
            >
              {s.values[n - 1].pct.toFixed(0)}%
            </text>
          </g>
        ))}

        {/* 호버 레이어 */}
        {prepared[0].values.map((v, i) => {
          const px = x(i);
          const tipX = Math.min(
            Math.max(px - TIP_W / 2, PAD.l),
            W - PAD.r - TIP_W,
          );
          return (
            <g key={v.date} className="viz-pt" tabIndex={0}>
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
                {prepared.map((s, si) => (
                  <circle
                    key={si}
                    cx={px}
                    cy={y(s.values[i].pct)}
                    r={4}
                    fill={COLORS[si]}
                    stroke={CARD}
                    strokeWidth={2}
                  />
                ))}
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
                  {v.date.slice(0, 7).replace("-", ".")}
                </text>
                {prepared.map((s, si) => (
                  <g key={si}>
                    <circle
                      cx={tipX + 16}
                      cy={PAD.t + 30 + si * 16}
                      r={3.5}
                      fill={COLORS[si]}
                    />
                    <text
                      x={tipX + 26}
                      y={PAD.t + 34 + si * 16}
                      fontSize={11.5}
                      fill={INK}
                    >
                      {s.name}{" "}
                      <tspan fontWeight={600} className="tnum">
                        {s.values[i].pct.toFixed(1)}%
                      </tspan>
                    </text>
                  </g>
                ))}
              </g>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

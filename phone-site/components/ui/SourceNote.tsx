import type { SourceRef } from "@/lib/phones";

/** 데이터 출처 + 기준일 각주 — 모든 데이터 표 아래에 필수 */
export default function SourceNote({
  sources,
  extra,
}: {
  sources: SourceRef[];
  extra?: string;
}) {
  const unique = sources.filter(
    (s, i, arr) => arr.findIndex((t) => t.label === s.label) === i,
  );
  return (
    <p className="mt-3 text-xs leading-5 text-mut">
      출처:{" "}
      {unique.map((s, i) => (
        <span key={s.label}>
          {i > 0 && " · "}
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="underline decoration-hairline underline-offset-2 hover:text-accent"
          >
            {s.label}
          </a>{" "}
          (기준일 {s.asOf})
        </span>
      ))}
      {extra && <span> — {extra}</span>}
    </p>
  );
}

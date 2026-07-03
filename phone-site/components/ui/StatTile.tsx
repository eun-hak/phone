import type { ReactNode } from "react";

/** 라벨 · 값 · 보조설명으로 구성된 스탯 타일 */
export default function StatTile({
  label,
  value,
  sub,
  badge,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-mut">{label}</p>
        {badge}
      </div>
      <p className="mt-1.5 text-xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs leading-5 text-sub">{sub}</p>}
    </div>
  );
}

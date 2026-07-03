import Link from "next/link";
import Badge, { type BadgeTone } from "@/components/ui/Badge";

/** 클라이언트에서도 쓸 수 있는 직렬화 가능한 카드 데이터 */
export interface PhoneCardData {
  slug: string;
  name: string;
  brandLabel: string;
  brand: "samsung" | "apple";
  releaseYm: string;
  releasePriceShort: string;
  latestResaleShort: string;
  residualPctText: string;
  residualPct: number;
  eolLabel: string;
  eolTone: BadgeTone;
  ddayText: string;
  displayRepairShort: string | null;
  releaseDate: string;
  monthsLeft: number | null;
  latestResale: number;
}

export default function PhoneCard({ phone }: { phone: PhoneCardData }) {
  return (
    <Link
      href={`/phones/${phone.slug}`}
      className="group flex flex-col rounded-xl border border-hairline bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-accent-strong/40 hover:shadow-pop"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge tone="neutral">{phone.brandLabel}</Badge>
        <span className="text-xs text-mut">{phone.releaseYm} 출시</span>
      </div>
      <h3 className="mt-2.5 text-[17px] font-bold tracking-tight group-hover:text-accent">
        {phone.name}
      </h3>
      <p className="mt-0.5 text-xs text-mut">
        출시가 {phone.releasePriceShort}
      </p>

      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-hairline pt-3 text-center">
        <div>
          <dt className="text-[11px] text-mut">현 시세</dt>
          <dd className="mt-0.5 text-sm font-semibold">
            {phone.latestResaleShort}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-mut">잔존가치</dt>
          <dd className="mt-0.5 text-sm font-semibold">
            {phone.residualPctText}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-mut">화면 수리</dt>
          <dd className="mt-0.5 text-sm font-semibold">
            {phone.displayRepairShort ?? "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-between">
        <Badge tone={phone.eolTone} dot>
          {phone.eolLabel}
        </Badge>
        <span className="text-xs text-sub tnum">보안지원 {phone.ddayText}</span>
      </div>
    </Link>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { DOC_TYPES, type DocTypeKey } from "@/lib/site";
import type { PhoneWithMetrics } from "@/lib/phones";

/** 문서 5종 공통 셸: 브레드크럼 + 문서 탭 + 제목 */
export default function DocShell({
  phone,
  docKey,
  title,
  lede,
  asOf,
  children,
}: {
  phone: PhoneWithMetrics;
  docKey: DocTypeKey | "used-check";
  title: string;
  lede?: string;
  asOf?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <nav aria-label="브레드크럼" className="text-xs text-mut">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/phones" className="hover:text-accent">
              기종 목록
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/phones/${phone.slug}`} className="hover:text-accent">
              {phone.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-sub">
            {docKey === "used-check"
              ? "중고 구매 체크리스트"
              : DOC_TYPES.find((d) => d.key === docKey)?.label}
          </li>
        </ol>
      </nav>

      {/* 문서 탭 */}
      <nav
        aria-label={`${phone.name} 문서`}
        className="-mx-4 mt-4 overflow-x-auto px-4"
      >
        <ul className="flex items-center gap-1.5 whitespace-nowrap">
          <li>
            <Link
              href={`/phones/${phone.slug}`}
              className="inline-block rounded-full border border-hairline bg-card px-3 py-1.5 text-xs font-medium text-sub transition-colors hover:border-accent-strong/40 hover:text-accent"
            >
              개요
            </Link>
          </li>
          {DOC_TYPES.map((d) => {
            const active = d.key === docKey;
            return (
              <li key={d.key}>
                <Link
                  href={`/phones/${phone.slug}/${d.key}`}
                  aria-current={active ? "page" : undefined}
                  className={`inline-block rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-accent bg-accent text-white"
                      : "border-hairline bg-card text-sub hover:border-accent-strong/40 hover:text-accent"
                  }`}
                >
                  {d.label}
                </Link>
              </li>
            );
          })}
          <li>
            <Link
              href={`/phones/${phone.slug}/used-check`}
              aria-current={docKey === "used-check" ? "page" : undefined}
              className={`inline-block rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                docKey === "used-check"
                  ? "border-accent bg-accent text-white"
                  : "border-accent-strong/40 bg-accent-soft text-accent hover:border-accent-strong"
              }`}
            >
              중고 체크 ★
            </Link>
          </li>
        </ul>
      </nav>

      <header className="mt-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">
          {title}
        </h1>
        {lede && <p className="mt-2 text-[15px] leading-7 text-sub">{lede}</p>}
        {asOf && (
          <p className="mt-2 text-xs text-mut">
            데이터 기준일 <time className="tnum">{asOf}</time> — 기준일 이후
            변동될 수 있습니다.
          </p>
        )}
      </header>

      <div className="mt-8 space-y-10">{children}</div>
    </div>
  );
}

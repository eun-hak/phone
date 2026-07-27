import type { ReactNode } from "react";

/** 법적·안내 문서 공통 레이아웃 + 타이포 (prose 플러그인 없이 유틸로 구성) */
export function LegalLayout({
  title,
  lede,
  updated,
  children,
}: {
  title: string;
  lede?: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      {lede && <p className="mt-3 text-[15px] leading-7 text-sub">{lede}</p>}
      {updated && (
        <p className="mt-2 text-xs text-mut">
          최종 수정: <time className="tnum">{updated}</time>
        </p>
      )}
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-8 text-lg font-bold tracking-tight text-ink">
      {children}
    </h2>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-7 text-sub">{children}</p>;
}

export function UL({ children }: { children: ReactNode }) {
  return (
    <ul className="space-y-1.5 text-[15px] leading-7 text-sub">{children}</ul>
  );
}

export function LI({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2">
      <span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-mut" />
      <span>{children}</span>
    </li>
  );
}

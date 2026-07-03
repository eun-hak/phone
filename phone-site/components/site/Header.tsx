import Link from "next/link";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import NavLinks from "./NavLinks";

function LogoMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="6"
        y="2.5"
        width="12"
        height="19"
        rx="3"
        className="fill-accent-soft stroke-accent-strong"
        strokeWidth="2"
      />
      <path
        d="M9.5 12.2l2 2 3.5-4"
        className="stroke-accent"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-card/85 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2"
            aria-label={`${SITE_NAME} 홈`}
          >
            <LogoMark />
            <span className="text-[17px] font-bold tracking-tight">
              {SITE_NAME}
            </span>
            <span className="mt-0.5 hidden text-xs text-mut sm:inline">
              {SITE_TAGLINE}
            </span>
          </Link>
          <nav aria-label="주요 메뉴" className="hidden md:block">
            <NavLinks />
          </nav>
        </div>
        <nav
          aria-label="주요 메뉴 (모바일)"
          className="-mx-4 overflow-x-auto px-4 pb-2 md:hidden"
        >
          <NavLinks />
        </nav>
      </div>
    </header>
  );
}

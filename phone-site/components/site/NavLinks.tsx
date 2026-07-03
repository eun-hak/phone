"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/site";

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-1 whitespace-nowrap">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-accent-soft font-semibold text-accent"
                  : "text-sub hover:bg-wash hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

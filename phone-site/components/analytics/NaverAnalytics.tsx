"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { NAVER_WA } from "@/lib/site";

declare global {
  interface Window {
    wcs_add?: Record<string, string>;
    wcs?: unknown;
    wcs_do?: (opts?: unknown) => void;
  }
}

/** 네이버 애널리틱스(wcslog). 앱 라우터라 페이지 이동 시마다 다시 집계해야 한다. */
function track() {
  if (typeof window === "undefined" || !window.wcs || !window.wcs_do) return;
  window.wcs_add = window.wcs_add ?? {};
  window.wcs_add["wa"] = NAVER_WA;
  window.wcs_do();
}

export default function NaverAnalytics() {
  const pathname = usePathname();

  // 최초 1회는 스크립트 onLoad 에서, 이후 클라이언트 이동은 여기서 집계
  useEffect(() => {
    track();
  }, [pathname]);

  return (
    <Script
      src="https://wcs.pstatic.net/wcslog.js"
      strategy="afterInteractive"
      onLoad={track}
    />
  );
}

import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import {
  ADSENSE_CLIENT,
  GA_ID,
  GSC_VERIFICATION,
  NAVER_VERIFICATION,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/site";
import { ogImageMeta } from "@/lib/og";

const defaultOg = ogImageMeta({
  title: "이 폰, 사도 될까요?",
  kicker: "휴대폰 결정 사전",
  subtitle: "지원종료·수리비·잔존가치·총소유비용까지, 데이터로 고르는 휴대폰",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "ko_KR",
    images: defaultOg,
  },
  twitter: {
    card: "summary_large_image",
    images: defaultOg,
  },
  robots: { index: true, follow: true },
  // 검색엔진 소유 확인 (HTML 태그 방식). 환경변수 없으면 미삽입.
  verification: {
    ...(GSC_VERIFICATION ? { google: GSC_VERIFICATION } : {}),
    ...(NAVER_VERIFICATION
      ? { other: { "naver-site-verification": NAVER_VERIFICATION } }
      : {}),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="flex min-h-dvh flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />

        {/* Google Analytics 4 — NEXT_PUBLIC_GA_ID 있을 때만 */}
        {GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        ) : null}

        {/* Google AdSense — NEXT_PUBLIC_ADSENSE_CLIENT 있을 때만 */}
        {ADSENSE_CLIENT ? (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        ) : null}
      </body>
    </html>
  );
}

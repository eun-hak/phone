import type { Metadata } from "next";
import { getAllPhones } from "@/lib/phones";
import { toCardData } from "@/lib/cardData";
import PhonesExplorer from "./PhonesExplorer";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "기종 목록 — 지원종료·수리비·잔존가치 한눈에",
  description:
    "수록된 모든 기종의 보안지원 상태, 현 중고 시세, 화면 수리비를 한눈에 비교하고 필터로 찾아보세요.",
  alternates: { canonical: "/phones" },
};

export default function PhonesPage() {
  const phones = getAllPhones().map(toCardData);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        기종 목록
      </h1>
      <p className="mt-2 text-[15px] text-sub">
        모든 기종은 동일한 다섯 문서(업데이트 종료 · 수리비 · 이슈 · 구매 루트
        · 잔존가치)로 정리되어 있습니다.
      </p>
      <PhonesExplorer phones={phones} />
    </div>
  );
}

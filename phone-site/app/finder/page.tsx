import type { Metadata } from "next";
import { getAllPhones } from "@/lib/phones";
import { toToolPhone } from "@/lib/clientData";
import FinderWizard from "./FinderWizard";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "폰 추천 마법사 — 5문항으로 내게 맞는 기종 찾기",
  description:
    "예산·구매 방식·브랜드·사용 계획·우선순위 5문항에 답하면, 보안지원·잔존가치·수리비 데이터로 지금 사도 되는 기종 3개를 추립니다.",
  alternates: { canonical: "/finder" },
};

export default function FinderPage() {
  const phones = getAllPhones().map(toToolPhone);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        폰 추천 마법사
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-7 text-sub">
        리뷰 감상평이 아니라 데이터로 고릅니다. 5문항에 답하면 수록{" "}
        {phones.length}개 기종 중 조건에 맞는 상위 3개를 근거와 함께
        보여드립니다.
      </p>
      <FinderWizard phones={phones} />
    </div>
  );
}

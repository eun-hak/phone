import type { Metadata } from "next";
import { getAllPhones } from "@/lib/phones";
import { toToolPhone } from "@/lib/clientData";
import PriceChecker from "./PriceChecker";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "중고 적정가 판독기 — 이 매물, 정상가인가 바가지인가",
  description:
    "기종·상태·배터리·매물가를 넣으면 A급 중앙값 시세 기준으로 급처/적정/비쌈을 판독합니다. 너무 싼 매물의 위험 신호도 함께 알려드립니다.",
  alternates: { canonical: "/price-check" },
};

export default function PriceCheckPage() {
  const phones = getAllPhones().map(toToolPhone);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        중고 적정가 판독기
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-7 text-sub">
        중고 매물을 보다가 “이 가격 맞아?” 싶을 때 — 폰덱스가 추적하는 A급
        중앙값 시세를 기준으로 상태·배터리를 보정해 판독합니다.
      </p>
      <PriceChecker phones={phones} />
    </div>
  );
}

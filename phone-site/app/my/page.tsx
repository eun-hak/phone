import type { Metadata } from "next";
import { getAllPhones } from "@/lib/phones";
import { toToolPhone } from "@/lib/clientData";
import MyDashboard from "./MyDashboard";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "내 폰 대시보드 — 남은 수명·현 시세·이슈를 한 화면에",
  description:
    "쓰고 있는 기기를 등록하면 보안지원 D-day, 현 중고 시세와 변동, 미해결 이슈, 지금 팔면 얼마인지를 한 화면에서 추적합니다. 데이터는 이 브라우저에만 저장됩니다.",
  alternates: { canonical: "/my" },
  robots: { index: true, follow: true },
};

export default function MyPage() {
  const phones = getAllPhones().map(toToolPhone);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        내 폰 대시보드
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-7 text-sub">
        쓰고 있는 기기(가족 것까지)를 등록해두면, 방문할 때마다 남은 보안지원 ·
        현 시세 변동 · 새 이슈를 한 화면에서 확인할 수 있습니다.{" "}
        <span className="text-mut">
          등록 정보는 서버로 전송되지 않고 이 브라우저에만 저장됩니다.
        </span>
      </p>
      <MyDashboard phones={phones} />
    </div>
  );
}

import { COUPANG } from "@/lib/site";

/** 콘텐츠 첫 부분에 두는 경제적 이해관계 표시 — 본문과 구별되고 읽기 쉽게 */
export default function CoupangDisclosure() {
  if (!COUPANG.banner) return null;
  return (
    <p className="rounded-lg border border-hairline bg-card px-3.5 py-2.5 text-[13px] font-medium leading-5 text-ink">
      {COUPANG.disclosure}
    </p>
  );
}

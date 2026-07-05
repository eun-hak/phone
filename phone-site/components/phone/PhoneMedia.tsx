import Image from "next/image";
import { getPhoneImage } from "@/lib/phoneImages";
import PhoneVisual from "./PhoneVisual";

/**
 * 기종 비주얼 통합 진입점 — 실사진(Wikimedia Commons)이 있으면 사진,
 * 없으면 SVG 일러스트로 자동 폴백. 서버/클라이언트 양쪽에서 사용 가능.
 */
export default function PhoneMedia({
  slug,
  name,
  className = "h-14 w-14",
  sizePx = 112,
}: {
  slug: string;
  name: string;
  className?: string;
  /** next/image 요청 크기 (표시 크기의 2배 권장) */
  sizePx?: number;
}) {
  const img = getPhoneImage(slug);
  if (!img) {
    return (
      <PhoneVisual slug={slug} title={`${name} 일러스트`} className={className} />
    );
  }
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden rounded-lg bg-white ${className}`}
    >
      <Image
        src={`/phones/${img.file}`}
        alt={`${name} 제품 사진`}
        fill
        sizes={`${sizePx}px`}
        className="object-contain p-0.5"
      />
    </span>
  );
}

import manifest from "@/data/phone-images.json";

/**
 * 기종 실사진 매니페스트 — scripts/fetch-images.mjs 가 생성.
 * Wikimedia Commons 자유 라이선스 이미지이며 출처 표기가 필요하다.
 */

export interface PhoneImageMeta {
  file: string;
  commonsFile: string;
  license: string;
  artist: string;
  sourceUrl: string;
  entity?: string;
}

const IMAGES = manifest as Record<string, PhoneImageMeta>;

export function getPhoneImage(slug: string): PhoneImageMeta | null {
  return IMAGES[slug] ?? null;
}
